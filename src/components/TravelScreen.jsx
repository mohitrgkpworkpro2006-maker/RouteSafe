import { useEffect, useState } from 'react';
import useGeolocation from '../hooks/useGeolocation.js';
import { calculateRoute, USE_MOCK_API, MOCK_START } from '../services/api.js';
import DevMockPanel from './DevMockPanel.jsx';
import { parseCoords, searchPlaces } from '../utils/geo.js';
import { ArrowLeft, LocateFixed, MapPin, Navigation, Search } from 'lucide-react';
import MapView from './MapView.jsx';
import RouteInfoCard from './RouteInfoCard.jsx';
import LocationStatus from './LocationStatus.jsx';
import LoadingState from './LoadingState.jsx';
import ErrorState from './ErrorState.jsx';
import { DEMO_MODE, DEMO_ORIGIN, DEMO_DESTINATION, DEMO_ORIGIN_LABEL, DEMO_DESTINATION_LABEL } from '../utils/constants.js';

export default function TravelScreen({ onBack }) {
  const geo = useGeolocation(!USE_MOCK_API && !DEMO_MODE);
  const [mockOrigin, setMockOrigin] = useState(MOCK_START); // mock mode only
  const origin = USE_MOCK_API ? mockOrigin : DEMO_MODE ? DEMO_ORIGIN : geo.position;
  const located = USE_MOCK_API || DEMO_MODE || geo.status === 'success';
  const [text, setText] = useState(DEMO_MODE ? `${DEMO_DESTINATION[0]}, ${DEMO_DESTINATION[1]}` : '');
  const [dest, setDest] = useState(DEMO_MODE ? DEMO_DESTINATION : null);
  const [results, setResults] = useState([]);
  const [searchMsg, setSearchMsg] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | loading | done | error
  const [route, setRoute] = useState(null);
  const [error, setError] = useState(null);

  const choose = (coords, label) => { setDest(coords); setText(label); setResults([]); setSearchMsg(''); setRoute(null); setPhase('idle'); };

  async function search(e) {
    e.preventDefault();
    const c = parseCoords(text);
    if (c) return choose(c, `${c[0]}, ${c[1]}`);
    if (text.trim().length < 3) return;
    setSearchMsg('Searching...');
    try {
      const r = await searchPlaces(text);
      setResults(r);
      setSearchMsg(r.length ? '' : 'No places found. You can also tap the map to drop a pin.');
    } catch { setSearchMsg('Search isn’t working. Tap the map to choose your destination.'); }
  }

  function pickScenario(sc) { // dev panel only
    setMockOrigin(sc.origin);
    choose(sc.destination, 'Demo destination');
    findRoute(sc.origin, sc.destination);
  }

  async function findRoute(o, d) {
    const from = Array.isArray(o) ? o : origin;
    const to = Array.isArray(d) ? d : dest;
    if (!from || !to) return;
    setPhase('loading');
    try { setRoute(await calculateRoute(from, to)); setPhase('done'); }
    catch (e) { setError(e); setPhase('error'); }
  }

  // Demo mode draws the scenario as soon as the screen opens, so the map and the
  // safety notice are already on screen. eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (DEMO_MODE) findRoute(DEMO_ORIGIN, DEMO_DESTINATION); }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0">
        {origin
          ? <MapView origin={origin} destination={dest} route={route} onPickDestination={DEMO_MODE ? undefined : (c) => choose(c, 'Pin on map')} />
          : <div className="h-full bg-paper" />}
      </div>

      <div className="absolute inset-x-0 top-0 z-[1000] mx-auto max-w-md p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="rounded-xl border border-line bg-white p-2 shadow-sm">
          <div className="flex items-center gap-1">
            <button onClick={onBack} aria-label="Back to home" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-navy active:bg-tint">
              <ArrowLeft size={22} strokeWidth={1.75} aria-hidden />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2 px-1 text-[15px]">
              <LocateFixed size={18} strokeWidth={1.75} className="shrink-0 text-teal" aria-hidden />
              <span className="truncate">{USE_MOCK_API ? 'Demo start point' : DEMO_MODE ? DEMO_ORIGIN_LABEL : geo.status === 'success' ? 'Your location' : 'Locating...'}</span>
            </div>
          </div>
          {DEMO_MODE ? (
            <div className="mt-1 flex items-center gap-2 rounded-lg bg-tint px-3 py-2.5 text-[15px]">
              <Navigation size={18} strokeWidth={1.75} className="shrink-0 text-navy" aria-hidden />
              <span className="truncate font-medium">{DEMO_ORIGIN_LABEL} to {DEMO_DESTINATION_LABEL}</span>
            </div>
          ) : (
            <form onSubmit={search} className="mt-1 flex gap-2">
              <label className="sr-only" htmlFor="dest">Destination</label>
              <input id="dest" value={text} onChange={(e) => setText(e.target.value)} placeholder="Where do you want to go?" className="field min-w-0 flex-1" />
              <button type="submit" aria-label="Search destination" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy text-white active:bg-ink">
                <Search size={20} strokeWidth={1.75} aria-hidden />
              </button>
            </form>
          )}
          {searchMsg && <p className="mt-2 px-1 text-sm text-muted">{searchMsg}</p>}
          {results.length > 0 && (
            <ul className="mt-2 max-h-48 divide-y divide-line overflow-y-auto rounded-xl border border-line">
              {results.map((r) => (
                <li key={r.label}>
                  <button onClick={() => choose(r.coords, r.label.split(',').slice(0, 2).join(','))} className="flex min-h-[48px] w-full items-start gap-2 px-3 py-2.5 text-left text-sm">
                    <MapPin size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-navy" aria-hidden /> {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section aria-live="polite" className="sheet-in absolute inset-x-0 bottom-0 z-[1000] mx-auto max-w-md rounded-t-2xl border border-b-0 border-line bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-sm">
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        {USE_MOCK_API && <DevMockPanel onSelect={pickScenario} />}
        {!located ? <LocationStatus status={geo.status} onRetry={geo.retry} />
          : phase === 'loading' ? <LoadingState message="Finding a safer route..." />
          : phase === 'error' ? <ErrorState title="Unable to find a route" error={error} onRetry={findRoute} />
          : phase === 'done' && route ? <>
              <RouteInfoCard route={route} />
              <button onClick={DEMO_MODE ? () => findRoute() : () => { setRoute(null); setPhase('idle'); }} className="btn-secondary mt-2">
                {DEMO_MODE ? 'Refresh route' : 'Change destination'}
              </button>
            </>
          : <>
              {!dest && <p className="mb-3 text-sm text-muted">Search above, or tap the map to drop a pin.</p>}
              <button onClick={() => findRoute()} disabled={!dest} className="btn-primary">Find safe route</button>
            </>}
        {USE_MOCK_API && <p className="mt-3 text-xs text-muted">Demo data for development. Not real reports.</p>}
      </section>
    </div>
  );
}
