import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { destinationIcon, youIcon } from './HazardMarker.jsx';
import HazardDots from './HazardDots.jsx';
import { splitRoute } from '../utils/geo.js';

function Fit({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { paddingTopLeft: [30, 150], paddingBottomRight: [30, 280] });
    else if (points.length === 1) map.setView(points[0], 16);
  }, [map, JSON.stringify(points)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
function Picker({ onPick }) {
  useMapEvents({ click: (e) => onPick?.([e.latlng.lat, e.latlng.lng]) });
  return null;
}

// Teal = normal route. Amber = hazardous section (blocked_waypoints). Dots sit exactly on blocked_waypoints.
export default function MapView({ origin, destination, route, onPickDestination }) {
  const blocked = route?.blocked_waypoints || [];
  const showHazard = route?.has_hazard && blocked.length > 0;
  const { before, hazard, after } = route ? splitRoute(route.waypoints, showHazard ? blocked : []) : {};
  const teal = { color: '#177E89', weight: 6, opacity: 1, lineCap: 'round' };
  const fit = route ? [...route.waypoints, ...blocked] : [origin, destination].filter(Boolean);
  return (
    <MapContainer center={origin || [8.5533, 76.9367]} zoom={16} zoomControl={false} className="h-full w-full">
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Picker onPick={onPickDestination} />
      <Fit points={fit} />
      {route && <Polyline positions={before} pathOptions={teal}><Tooltip sticky>{route.route_type === 'safe_detour' ? 'Safer alternative route' : 'Route'}</Tooltip></Polyline>}
      {route && after.length > 1 && <Polyline positions={after} pathOptions={teal} />}
      {showHazard && hazard && <Polyline positions={hazard} pathOptions={{ color: '#E0A11A', weight: 8, lineCap: 'round' }} />}
      {showHazard && !hazard && <Polyline positions={blocked} pathOptions={{ color: '#E0A11A', weight: 6, dashArray: '2 10', lineCap: 'round' }} />}
      {showHazard && <HazardDots points={blocked} info={route.hazard_info} />}
      {origin && <Marker position={origin} icon={youIcon} />}
      {destination && <Marker position={destination} icon={destinationIcon} />}
    </MapContainer>
  );
}
