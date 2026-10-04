// All backend access lives here. Contract: JSON, coordinates are [latitude, longitude].
import { mockReportHazard, mockCalculateRoute, NALANCHIRA_CENTER } from './mockApi.js';

const env = import.meta.env;
const USE_MOCK = env.VITE_USE_MOCK_API === 'true';
export const USE_MOCK_API = USE_MOCK;
export const MOCK_START = USE_MOCK ? NALANCHIRA_CENTER : null; // map start point in mock mode only

export class ApiError extends Error {
  constructor(kind, detail) { super(detail || kind); this.kind = kind; } // 'config' | 'network' | 'server'
}

async function post(pathVar, body) {
  const base = (env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const path = env[pathVar];
  if (!base || !path) throw new ApiError('config', `Set VITE_API_BASE_URL and ${pathVar} in .env`);
  let res;
  try {
    res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch { throw new ApiError('network'); }
  if (!res.ok) throw new ApiError('server', `HTTP ${res.status}`);
  try { return await res.json(); } catch { throw new ApiError('server', 'Invalid JSON'); }
}

/** @param {{lat:number,lng:number,reason:string,pack_size?:string}} r */
export async function reportHazard({ lat, lng, reason, pack_size }) {
  if (USE_MOCK) return mockReportHazard();
  const body = { lat, lng, reason, reported_by: env.VITE_REPORTED_BY || 'user_3tap' };
  if (pack_size) body.pack_size = pack_size;
  const data = await post('VITE_REPORT_PATH', body);
  if (data.status !== 'success') throw new ApiError('server', 'Report not accepted');
  return data; // { status, hazard_id, expires_at }
}

/** origin, destination: [lat, lng] */
export async function calculateRoute(origin, destination) {
  if (USE_MOCK) return mockCalculateRoute(origin, destination);
  return post('VITE_ROUTE_PATH', { origin, destination });
  // { route_type, has_hazard, hazard_info, blocked_waypoints, waypoints }
}
