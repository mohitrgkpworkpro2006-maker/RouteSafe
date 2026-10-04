// TEMPORARY, DEVELOPMENT-ONLY mock backend (enabled with VITE_USE_MOCK_API=true).
// All data below is DUMMY demo data around Nalanchira, Thiruvananthapuram.
// These are NOT real hazards. Delete this file + DevMockPanel.jsx when the real API is ready.
// Coordinates are always [latitude, longitude].

export const NALANCHIRA_CENTER = [8.5533, 76.9367];

// Builds an object with exactly the shape of the real route response.
const scenario = (id, label, reason, mins, waypoints, blocked) => ({
  id, label,
  origin: waypoints[0],
  destination: waypoints[waypoints.length - 1],
  response: {
    route_type: reason ? 'safe_detour' : 'normal',
    has_hazard: Boolean(reason),
    hazard_info: reason ? { reason, reported_mins_ago: mins } : null,
    blocked_waypoints: blocked,
    waypoints
  }
});

export const MOCK_SCENARIOS = [
  scenario('dog', 'Dog Pack', 'Dog Pack', 4,
    [[8.5485, 76.9345], [8.5500, 76.9352], [8.5515, 76.9360], [8.5530, 76.9372], [8.5540, 76.9380], [8.5560, 76.9400], [8.5580, 76.9415]],
    [[8.5515, 76.9360], [8.5530, 76.9372], [8.5540, 76.9380]]),
  scenario('light', 'Poor Lighting', 'Poor Lighting', 11,
    [[8.5455, 76.9295], [8.5470, 76.9302], [8.5490, 76.9310], [8.5505, 76.9320], [8.5525, 76.9330], [8.5565, 76.9345]],
    [[8.5490, 76.9310], [8.5505, 76.9320]]),
  scenario('obstruction', 'Road Obstruction', 'Road Obstruction', 7,
    [[8.5550, 76.9300], [8.5560, 76.9310], [8.5570, 76.9320], [8.5585, 76.9335], [8.5595, 76.9345], [8.5610, 76.9380]],
    [[8.5570, 76.9320], [8.5585, 76.9335], [8.5595, 76.9345]]),
  scenario('flood', 'Flooded Road', 'Flooded Road', 18,
    [[8.5490, 76.9400], [8.5510, 76.9410], [8.5520, 76.9420], [8.5535, 76.9430], [8.5555, 76.9445], [8.5580, 76.9460]],
    [[8.5520, 76.9420], [8.5535, 76.9430]]),
  scenario('clear', 'Clear Route', null, null,
    [[8.5425, 76.9340], [8.5450, 76.9360], [8.5480, 76.9390], [8.5505, 76.9420]], [])
];

let activeId = MOCK_SCENARIOS[0].id;
export const setMockScenario = (id) => { activeId = id; };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];

// Same signature and response shape as the real calculateRoute(origin, destination).
// Picks the scenario matching origin+destination, otherwise the one chosen in the dev panel.
export async function mockCalculateRoute(origin, destination) {
  await wait(600);
  const s = MOCK_SCENARIOS.find((x) => same(x.origin, origin) && same(x.destination, destination))
    || MOCK_SCENARIOS.find((x) => x.id === activeId);
  return JSON.parse(JSON.stringify(s.response));
}

export async function mockReportHazard() {
  await wait(600);
  return { status: 'success', hazard_id: 'haz_mock', expires_at: new Date(Date.now() + 2 * 3600e3).toISOString() };
}
