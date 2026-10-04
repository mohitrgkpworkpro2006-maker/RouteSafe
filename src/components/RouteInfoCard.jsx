import { TriangleAlert, CircleCheck, Navigation } from 'lucide-react';
import { navigationUrl, routeLabel } from '../utils/geo.js';

export default function RouteInfoCard({ route }) {
  const info = route.hazard_info;
  const reason = info?.reason === 'Dog Pack' ? 'Dog pack reported nearby' : `${info?.reason || 'Hazard'} reported nearby`;
  const mins = info?.reported_mins_ago;
  return (
    <div className="flex flex-col gap-3">
      {route.has_hazard ? (
        <div className="flex gap-3 rounded-xl border border-amber bg-warn p-3 text-warnink">
          <TriangleAlert size={24} strokeWidth={1.75} className="mt-0.5 shrink-0 text-amber" aria-hidden />
          <div>
            <p className="text-base font-semibold">Safety notice</p>
            <p className="mt-1 text-[15px] font-medium">{reason}</p>
            {mins != null && <p className="text-sm">Reported {mins} min{mins === 1 ? '' : 's'} ago</p>}
            <p className="mt-1 text-sm">{route.detour_available === false ? 'No safer alternative is available on this route.' : 'A safer route has been found.'}</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 rounded-xl border border-line bg-white p-3">
          <CircleCheck size={24} strokeWidth={1.75} className="mt-0.5 shrink-0 text-teal" aria-hidden />
          <div>
            <p className="text-base font-semibold">Route looks clear</p>
            <p className="text-sm text-muted">No reported hazards detected on this route.</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 text-[15px] font-medium text-navy">
        <Navigation size={18} strokeWidth={1.75} className="text-teal" aria-hidden /> {routeLabel(route.route_type)}
      </div>
      {route.has_hazard && (
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted" aria-label="Map key">
          <li className="flex items-center gap-2"><span className="h-1 w-6 rounded bg-teal" /> Route</li>
          <li className="flex items-center gap-2"><span className="h-1 w-6 rounded bg-amber" /> Hazard section</li>
          <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full border-2 border-navy bg-amber" /> Hazard point</li>
        </ul>
      )}
      <a href={navigationUrl(route.waypoints)} target="_blank" rel="noreferrer" className="btn-primary">
        <Navigation size={18} strokeWidth={1.75} aria-hidden /> Start navigation
      </a>
    </div>
  );
}
