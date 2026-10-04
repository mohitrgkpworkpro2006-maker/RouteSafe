"""RouteSafe backend.

Pedestrian hazard reports and hazard-aware route selection for the Nalanchira,
Trivandrum proof of concept.

All coordinates are [latitude, longitude] to match Leaflet's native ordering.
Hazards live in a thread-safe in-memory dict and expire 30 minutes after they are
reported; expired entries are filtered out lazily on every read.
"""

from __future__ import annotations

import math
import threading
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

HAZARD_TTL_MINUTES = 30
DETOUR_RADIUS_M = 75.0
EARTH_RADIUS_M = 6_371_000.0
PACK_SIZES = ("1-2", "3-5", "6+")

# The demo seed deliberately outlives HAZARD_TTL_MINUTES so a presentation cannot
# outlive its own hazard. It reports itself as a few minutes old regardless.
DEMO_SEED_TTL_MINUTES = 720
DEMO_SEED_AGE_MINUTES = 3

# Landmarks, [latitude, longitude], geocoded from OpenStreetMap.
DEMO_ORIGIN: list[float] = [8.5493890, 76.9381227]  # Mar Aprem Hostel (behind Mar Baselios)
DEMO_DESTINATION: list[float] = [8.5425158, 76.9416851]  # Nalanchira Main Gate
MAR_BASELIOS_COLLEGE: list[float] = [8.5482880, 76.9384815]
MAR_IVANIOS_COLLEGE: list[float] = [8.5480862, 76.9403379]

# The seeded safety alert: on the road outside the Mar Ivanios College gate.
DEMO_HAZARD_POINT: list[float] = [8.548215, 76.940368]

DEMO_HAZARD = {
    "lat": DEMO_HAZARD_POINT[0],
    "lng": DEMO_HAZARD_POINT[1],
    "reason": "Dog Pack",
    "pack_size": "3-5",
    "reported_by": "demo_seed",
}

# The normal way to Nalanchira Main Gate: the road outside the Mar Ivanios College
# gate. 9 points, 1011 m, real pedestrian geometry (OpenStreetMap, ODbL) fetched from
# routing.openstreetmap.de and simplified with Douglas-Peucker at 7 m. Static data, so
# the demo needs no network at run time.
PATH_PRIMARY_DIRECT: list[list[float]] = [
    [8.549296, 76.938234],
    [8.549532, 76.938547],
    [8.549649, 76.938935],
    [8.549619, 76.939362],
    [8.549344, 76.939655],
    [8.548215, 76.940368],
    [8.547120, 76.940331],
    [8.542734, 76.941985],
    [8.542484, 76.941727],
]

# The alternative: through the Mar Baselios College campus path. 19 points, 1135 m,
# i.e. 124 m longer than the direct road.
PATH_SAFE_DETOUR: list[list[float]] = [
    [8.549296, 76.938234],
    [8.548928, 76.937944],
    [8.548436, 76.938417],
    [8.548336, 76.938401],
    [8.548436, 76.938417],
    [8.548243, 76.938660],
    [8.548455, 76.938693],
    [8.548808, 76.939163],
    [8.548627, 76.939386],
    [8.548406, 76.939467],
    [8.547782, 76.939447],
    [8.547144, 76.939557],
    [8.546990, 76.939703],
    [8.546990, 76.940020],
    [8.547171, 76.940239],
    [8.547120, 76.940331],
    [8.543177, 76.941859],
    [8.542734, 76.941985],
    [8.542484, 76.941727],
]

# Kept for reference: the stretch of road the seeded alert sits on.
PATH_BLOCKED_SEGMENT: list[list[float]] = [
    [8.549344, 76.939655],
    [8.548215, 76.940368],
    [8.547120, 76.940331],
]

# Both endpoints inside this box get the pedestrian geometry above. Everything else is
# routed as a straight line between the requested points.
SANDBOX_BBOX = {
    "min_lat": 8.5419,
    "max_lat": 8.5502,
    "min_lng": 76.9374,
    "max_lng": 76.9425,
}

_lock = threading.Lock()
_hazards: dict[str, dict] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _normalise_pair(value: list[float], field: str) -> list[float]:
    if len(value) != 2:
        raise ValueError(f"{field} must be [latitude, longitude]")
    lat, lng = float(value[0]), float(value[1])
    if not -90.0 <= lat <= 90.0:
        raise ValueError(f"{field} latitude must be between -90 and 90")
    if not -180.0 <= lng <= 180.0:
        raise ValueError(f"{field} longitude must be between -180 and 180")
    return [lat, lng]


class HazardReportIn(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude of the hazard.")
    lng: float = Field(..., ge=-180, le=180, description="Longitude of the hazard.")
    reason: str = Field(
        ...,
        min_length=1,
        max_length=80,
        description="Short hazard label, e.g. 'Dog Pack'. Free text by design: the "
        "frontend and the bundled mock disagree on the exact vocabulary.",
    )
    pack_size: Optional[str] = Field(
        default=None, description="Dog pack size, one of 1-2, 3-5, 6+."
    )
    reported_by: str = Field(
        default="user_3tap", min_length=1, max_length=64, description="Reporter id."
    )

    @field_validator("reason", "reported_by")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be blank")
        return stripped

    @field_validator("pack_size")
    @classmethod
    def _known_pack_size(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        if stripped not in PACK_SIZES:
            raise ValueError(f"pack_size must be one of {', '.join(PACK_SIZES)}")
        return stripped


class RouteRequest(BaseModel):
    origin: list[float] = Field(..., description="Start point as [latitude, longitude].")
    destination: list[float] = Field(
        ..., description="End point as [latitude, longitude]."
    )

    @field_validator("origin")
    @classmethod
    def _check_origin(cls, value: list[float]) -> list[float]:
        return _normalise_pair(value, "origin")

    @field_validator("destination")
    @classmethod
    def _check_destination(cls, value: list[float]) -> list[float]:
        return _normalise_pair(value, "destination")


class HazardAccepted(BaseModel):
    status: str
    hazard_id: str
    expires_at: datetime


class HazardInfo(BaseModel):
    reason: str
    reported_mins_ago: int


class RouteResponse(BaseModel):
    route_type: str
    has_hazard: bool
    hazard_info: Optional[HazardInfo] = None
    blocked_waypoints: list[list[float]]
    waypoints: list[list[float]]
    detour_available: bool = Field(
        ...,
        description="True when a safer alternative path exists for this request. "
        "False outside the sandbox, where no alternate path is authored.",
    )


class HazardSnapshot(BaseModel):
    hazard_id: str
    lat: float
    lng: float
    reason: str
    pack_size: Optional[str] = None
    reported_by: str
    reported_at: datetime
    expires_at: datetime
    mins_ago: int
    affects_route: bool


class HazardListResponse(BaseModel):
    active_count: int
    ttl_minutes: int
    detour_radius_m: float
    hazards: list[HazardSnapshot]


class DemoClearedResponse(BaseModel):
    status: str
    cleared_count: int
    active_hazard_count: int
    demo_hazard_seeded: bool


class HealthResponse(BaseModel):
    status: str
    active_hazard_count: int
    server_time_utc: datetime


def _copy_path(path: list[list[float]]) -> list[list[float]]:
    return [[lat, lng] for lat, lng in path]


def _in_sandbox(point: list[float]) -> bool:
    return (
        SANDBOX_BBOX["min_lat"] <= point[0] <= SANDBOX_BBOX["max_lat"]
        and SANDBOX_BBOX["min_lng"] <= point[1] <= SANDBOX_BBOX["max_lng"]
    )


def _distance_to_segment_m(point: list[float], start: list[float], end: list[float]) -> float:
    kx = EARTH_RADIUS_M * math.cos(math.radians(point[0])) * math.radians(1.0)
    ky = EARTH_RADIUS_M * math.radians(1.0)
    ax, ay = (start[1] - point[1]) * kx, (start[0] - point[0]) * ky
    bx, by = (end[1] - point[1]) * kx, (end[0] - point[0]) * ky
    dx, dy = bx - ax, by - ay
    if dx == 0.0 and dy == 0.0:
        return math.hypot(ax, ay)
    t = max(0.0, min(1.0, -(ax * dx + ay * dy) / (dx * dx + dy * dy)))
    return math.hypot(ax + t * dx, ay + t * dy)


def _distance_to_path_m(point: list[float], path: list[list[float]]) -> float:
    return min(
        _distance_to_segment_m(point, path[i], path[i + 1])
        for i in range(len(path) - 1)
    )


def _affects_path(hazard: dict, path: list[list[float]]) -> bool:
    return (
        _distance_to_path_m([hazard["lat"], hazard["lng"]], path) <= DETOUR_RADIUS_M
    )


def _prune_locked(now: datetime) -> list[dict]:
    for key in [k for k, v in _hazards.items() if v["expires_at"] <= now]:
        del _hazards[key]
    return list(_hazards.values())


def _active_hazards(now: datetime) -> list[dict]:
    with _lock:
        return _prune_locked(now)


def _mins_ago(reported_at: datetime, now: datetime) -> int:
    return max(0, int((now - reported_at).total_seconds() // 60))


DEMO_HAZARD_ID = "haz_demo_seed"


def _seed_demo_hazard() -> HazardAccepted:
    """Insert or refresh the Mar Ivanios College gate alert. Idempotent by id."""
    now = _now()
    record = {
        "hazard_id": DEMO_HAZARD_ID,
        "lat": DEMO_HAZARD["lat"],
        "lng": DEMO_HAZARD["lng"],
        "reason": DEMO_HAZARD["reason"],
        "pack_size": DEMO_HAZARD["pack_size"],
        "reported_by": DEMO_HAZARD["reported_by"],
        "reported_at": now - timedelta(minutes=DEMO_SEED_AGE_MINUTES),
        "expires_at": now + timedelta(minutes=DEMO_SEED_TTL_MINUTES),
    }
    with _lock:
        _hazards[DEMO_HAZARD_ID] = record
    return HazardAccepted(
        status="success", hazard_id=DEMO_HAZARD_ID, expires_at=record["expires_at"]
    )


def _clear_hazards() -> int:
    with _lock:
        count = len(_hazards)
        _hazards.clear()
    return count


def _build_route(
    now: datetime, origin: list[float], destination: list[float]
) -> RouteResponse:
    in_sandbox = _in_sandbox(origin) and _in_sandbox(destination)
    direct = _copy_path(PATH_PRIMARY_DIRECT) if in_sandbox else [[origin[0], origin[1]], [destination[0], destination[1]]]
    detour = _copy_path(PATH_SAFE_DETOUR) if in_sandbox else None

    triggering = [h for h in _active_hazards(now) if _affects_path(h, direct)]
    blocked = [[h["lat"], h["lng"]] for h in triggering]

    if not triggering:
        return RouteResponse(
            route_type="normal",
            has_hazard=False,
            hazard_info=None,
            blocked_waypoints=[],
            waypoints=direct,
            detour_available=detour is not None,
        )

    hazard = max(triggering, key=lambda h: h["reported_at"])
    info = HazardInfo(
        reason=hazard["reason"], reported_mins_ago=_mins_ago(hazard["reported_at"], now)
    )
    if detour is None:
        return RouteResponse(
            route_type="normal",
            has_hazard=True,
            hazard_info=info,
            blocked_waypoints=blocked,
            waypoints=direct,
            detour_available=False,
        )
    return RouteResponse(
        route_type="safe_detour",
        has_hazard=True,
        hazard_info=info,
        blocked_waypoints=blocked,
        waypoints=detour,
        detour_available=True,
    )


@asynccontextmanager
async def lifespan(_: FastAPI):
    _seed_demo_hazard()
    yield


app = FastAPI(
    title="RouteSafe API",
    version="1.0.0",
    description=(
        "3-tap pedestrian hazard reports and hazard-aware routing for the "
        "Nalanchira, Trivandrum proof of concept. Coordinates are "
        "[latitude, longitude]. Hazards expire after "
        f"{HAZARD_TTL_MINUTES} minutes. A demo alert on the road outside the "
        "Mar Ivanios College gate is seeded at startup."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["debug"])
def health() -> HealthResponse:
    now = _now()
    return HealthResponse(
        status="ok",
        active_hazard_count=len(_active_hazards(now)),
        server_time_utc=now,
    )


@app.post(
    "/api/hazard",
    response_model=HazardAccepted,
    status_code=201,
    tags=["hazards"],
    summary="Report a hazard (3-tap).",
)
def report_hazard(payload: HazardReportIn) -> HazardAccepted:
    now = _now()
    hazard_id = f"haz_{uuid.uuid4().hex[:12]}"
    record = {
        "hazard_id": hazard_id,
        "lat": payload.lat,
        "lng": payload.lng,
        "reason": payload.reason,
        "pack_size": payload.pack_size,
        "reported_by": payload.reported_by,
        "reported_at": now,
        "expires_at": now + timedelta(minutes=HAZARD_TTL_MINUTES),
    }
    with _lock:
        _hazards[hazard_id] = record
    return HazardAccepted(
        status="success", hazard_id=hazard_id, expires_at=record["expires_at"]
    )


@app.get(
    "/api/hazards",
    response_model=HazardListResponse,
    tags=["debug"],
    summary="List currently active hazards. Expired entries are pruned on read.",
)
def list_hazards() -> HazardListResponse:
    now = _now()
    hazards = _active_hazards(now)
    return HazardListResponse(
        active_count=len(hazards),
        ttl_minutes=HAZARD_TTL_MINUTES,
        detour_radius_m=DETOUR_RADIUS_M,
        hazards=[
            HazardSnapshot(
                hazard_id=h["hazard_id"],
                lat=h["lat"],
                lng=h["lng"],
                reason=h["reason"],
                pack_size=h["pack_size"],
                reported_by=h["reported_by"],
                reported_at=h["reported_at"],
                expires_at=h["expires_at"],
                mins_ago=_mins_ago(h["reported_at"], now),
                affects_route=_affects_path(h, PATH_PRIMARY_DIRECT),
            )
            for h in sorted(hazards, key=lambda h: h["reported_at"], reverse=True)
        ],
    )


@app.post(
    "/api/route",
    response_model=RouteResponse,
    tags=["routing"],
    summary="Return the requested route, diverting only around hazards near that path.",
)
def calculate_route(payload: RouteRequest) -> RouteResponse:
    return _build_route(_now(), payload.origin, payload.destination)


@app.post(
    "/api/demo/seed",
    response_model=HazardAccepted,
    status_code=201,
    tags=["demo"],
    summary="Re-seed the Mar Ivanios College gate alert and reset its reported age.",
)
def seed_demo() -> HazardAccepted:
    return _seed_demo_hazard()


@app.post(
    "/api/demo/clear",
    response_model=DemoClearedResponse,
    tags=["demo"],
    summary="Remove every hazard, so the 3-tap report can be shown from a clean state.",
)
def clear_demo() -> DemoClearedResponse:
    cleared = _clear_hazards()
    return DemoClearedResponse(
        status="cleared",
        cleared_count=cleared,
        active_hazard_count=len(_active_hazards(_now())),
        demo_hazard_seeded=DEMO_HAZARD_ID in _hazards,
    )