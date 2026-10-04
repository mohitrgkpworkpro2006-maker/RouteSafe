# RouteSafe

## Demo scenario: Mar Aprem Hostel to Nalanchira Main Gate

One fixed walking route in Nalanchira, Trivandrum, with a reported dog pack on the road
outside the **Mar Ivanios College** gate.

There are two ways to reach Nalanchira Main Gate from the hostel behind Mar Baselios College:

| Route | Length | Used when |
| --- | --- | --- |
| The road outside the Mar Ivanios College gate | 1011 m | no hazard on that road |
| Through the Mar Baselios College campus path | 1135 m | a hazard is reported on the Ivanios gate road |

RouteSafe sends you **125 m the long way round** through the college to avoid the reported
pack. Both paths are real pedestrian geometry from OpenStreetMap (ODbL), fetched once and
embedded as static data, so the demo needs no network at run time.

### Run it

One command, from the project root:

```bash
./dev
```

That starts the backend and the frontend, waits until both actually answer, opens
<http://localhost:5173> in your browser, and streams both server logs. Press **Ctrl+C** to
stop both. Nothing to install: `node_modules` and the Python packages are already in place.

| Command | Purpose |
| --- | --- |
| `./dev` | Start both, open the browser, stream logs. Ctrl+C stops both. |
| `./dev stop` | Stop both. Use this if the terminal was closed and the servers were orphaned. |
| `./dev restart` | Stop, then start again with a freshly seeded hazard. |

`./dev` reclaims ports 8000 and 5173 first, so running it again after a crash is safe. It
only reclaims them from processes belonging to this project; if something unrelated holds a
port it prints what it is and stops rather than killing it.

Server output is also written to `logs/backend.log` and `logs/frontend.log`, which is where to
look if a server dies.

#### Running the two servers by hand

Equivalent to `./dev`, in two terminals from the project root:

```bash
python3 -m uvicorn backend.main:app --port 8000   # seeds the hazard on startup
npm run dev                                       # http://localhost:5173
```

Use `python3 -m uvicorn`; a bare `uvicorn` is not on the PATH. To stop both, press Ctrl+C in
each terminal, or:

```bash
pkill -f "uvicorn backend.main"; pkill -f "node.*bin/vite"
```

Open **http://localhost:5173** and tap **Travel**. The route draws itself and the safety
notice is already on screen: no GPS permission, no typing, no network dependency.

### The demo, step by step

1. **Travel** shows the amber hazard on the Ivanios gate road and the teal detour through
   the campus, with "A safer route has been found."
2. **Report a safety concern** shows the 3-tap flow. If location is denied, tap
   **Use demo location**.
3. To show the report changing the route live, clear the seeded alert first:
   ```bash
   curl -X POST http://localhost:8000/api/demo/clear    # route goes back to normal, Ivanios road
   ```
   Then report a dog pack from the app, go back to **Travel**, and tap **Refresh route**:
   the route flips to the campus path again.
4. `curl -X POST http://localhost:8000/api/demo/seed` puts the seeded alert back.

### Demo controls

| Endpoint | Effect |
| --- | --- |
| `POST /api/demo/clear` | Removes every hazard, so the report flow can be shown from a clean state. |
| `POST /api/demo/seed` | Re-inserts the Ivanios gate alert and resets it to "reported 3 minutes ago". Idempotent. |

The seed expires after 12 hours rather than the usual 30 minutes, deliberately, so a
presentation cannot outlive its own hazard.

## Development

```bash
npm install
cp .env.example .env
npm run dev              # prints a Local and a Network URL
```

| Env var | Demo value | Purpose |
| --- | --- | --- |
| `VITE_DEMO_MODE` | `true` | Pins the app to the fixed scenario. `false` restores real GPS origin and destination search. |
| `VITE_USE_MOCK_API` | `false` | `true` uses `src/services/mockApi.js` instead of the backend. |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend base URL. |
| `VITE_REPORT_PATH` | `/api/hazard` | Report endpoint. |
| `VITE_ROUTE_PATH` | `/api/route` | Route endpoint. |
| `VITE_ENABLE_GEOCODER` | `true` | Destination search via OpenStreetMap Nominatim. Unused in demo mode. |

Restart `npm run dev` after editing `.env`.

To use the app on a phone, open the **Network** URL on the same Wi-Fi. Browsers only allow
geolocation on HTTPS or localhost, so a phone GPS test needs an HTTPS tunnel
(`npx localtunnel --port 5173` or ngrok). Demo mode does not use GPS, so this only matters
once `VITE_DEMO_MODE=false`.

## Backend (FastAPI)

`backend/main.py` implements the hazard + routing contract over a thread-safe in-memory store.
Hazards expire 30 minutes after they are reported and are pruned lazily on every read.

```bash
pip install -r backend/requirements.txt
python3 -m uvicorn backend.main:app --reload --port 8000    # run from the project root
```

Interactive docs: <http://localhost:8000/docs>

### Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/hazard` | Report a hazard. Returns `{status, hazard_id, expires_at}`. |
| `POST` | `/api/route` | Returns `route_type`, `has_hazard`, `hazard_info`, `blocked_waypoints`, `waypoints`, `detour_available`. |
| `POST` | `/api/demo/seed` | Re-seed the Ivanios gate alert. |
| `POST` | `/api/demo/clear` | Remove every hazard. |
| `GET` | `/api/hazards` | Debug: active hazards, each flagged `affects_route`. |
| `GET` | `/health` | Debug: liveness and active hazard count. |

### Try it

```bash
curl -X POST http://localhost:8000/api/route -H 'Content-Type: application/json' \
  -d '{"origin":[8.5493890,76.9381227],"destination":[8.5425158,76.9416851]}'
```

Add a hazard on the Ivanios gate road and watch the route change:

```bash
curl -X POST http://localhost:8000/api/hazard -H 'Content-Type: application/json' \
  -d '{"lat":8.548215,"lng":76.940368,"reason":"Dog Pack","pack_size":"3-5","reported_by":"user_3tap"}'
```

### Routing rules

Coordinates are always `[latitude, longitude]`.

- **Inside the sandbox:** if both `origin` and `destination` fall within `SANDBOX_BBOX` in
  `backend/main.py`, the embedded pedestrian geometry is used: `PATH_PRIMARY_DIRECT`
  (Ivanios gate road), or `PATH_SAFE_DETOUR` (college campus) when a hazard applies.
- **Everywhere else:** the route is a straight line between `origin` and `destination`, so your
  destination is always respected. `detour_available` is `false`, because no alternate path is
  authored for those requests.
- **Hazards are matched against the path being returned**, within `DETOUR_RADIUS_M` (75 m) of it.
  A hazard near the campus path therefore does not flag the Ivanios road, and vice versa.
- `blocked_waypoints` contains the **coordinates that were actually reported**, so the map draws
  each hazard where it was seen. It is empty when nothing is near the route.
- `detour_available` tells the UI whether a safer alternative actually exists, so the notice can
  say "A safer route has been found" or "No safer alternative is available on this route".
- `hazard_info` describes a single hazard (the most recent one affecting the route). If several
  apply, every dot shares that one label.
- `reason` is accepted as free text: `src/utils/constants.js` and `src/services/mockApi.js` disagree on
  the hazard vocabulary, so a fixed enum would reject reports the UI can actually send.
- `PATH_BLOCKED_SEGMENT` is kept for reference as the stretch of road the seeded alert sits on;
  matching is relative to the returned path rather than that fixed line.
- Storage is in-memory, so hazards reset whenever the server restarts.
