/** Parse "9.0880, 76.8900" -> [lat, lng] or null. */
export function parseCoords(text) {
  const m = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = +m[1], lng = +m[2];
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
}

/** Place search via OpenStreetMap Nominatim (the contract has no geocoding endpoint). */
export async function searchPlaces(query) {
  if (import.meta.env.VITE_ENABLE_GEOCODER === 'false') return [];
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('geocode');
  const rows = await res.json();
  return rows.map((r) => ({ label: r.display_name, coords: [parseFloat(r.lat), parseFloat(r.lon)] })); // [lat, lng]
}

export const routeLabel = (t) => (t === 'safe_detour' ? 'Safer alternative route' : 'Recommended route');
/** Splits waypoints into [before, hazard, after] using blocked_waypoints that lie on the route.
 *  If none of them lie on it (e.g. a detour avoiding the blocked path), hazard is null. */
export function splitRoute(waypoints, blocked) {
  const key = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
  const set = new Set((blocked || []).map(key));
  const idx = waypoints.map((p, i) => (set.has(key(p)) ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return { before: waypoints, hazard: null, after: [] };
  const a = idx[0], b = idx[idx.length - 1];
  return { before: waypoints.slice(0, a + 1), hazard: waypoints.slice(a, b + 1), after: waypoints.slice(b) };
}

export const midpoint = (pts) => pts[Math.floor((pts.length - 1) / 2)];

export function navigationUrl(wp) {
  const f = (p) => p.join(',');
  const mid = wp.slice(1, -1).slice(0, 8).map(f).join('|');
  return `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${f(wp[0])}&destination=${f(wp[wp.length - 1])}` + (mid ? `&waypoints=${encodeURIComponent(mid)}` : '');
}
