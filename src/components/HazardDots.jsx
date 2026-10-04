import { CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { ShieldAlert } from 'lucide-react';

const canHover = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches;

// Text comes only from the API response (hazard_info).
function Info({ info }) {
  const m = info?.reported_mins_ago;
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warnink">
        <ShieldAlert size={14} strokeWidth={1.75} aria-hidden /> Safety hazard
      </p>
      <p className="mt-1 text-[15px] font-semibold">{info?.reason || 'Hazard reported'}</p>
      {m != null && <p className="text-sm text-muted">Reported {m} minute{m === 1 ? '' : 's'} ago</p>}
    </div>
  );
}

// One small dot per blocked_waypoints coordinate. A larger invisible circle gives a comfortable tap target.
export default function HazardDots({ points, info }) {
  return points.map((p, i) => (
    <span key={`${p[0]}-${p[1]}-${i}`}>
      <CircleMarker center={p} radius={16} pathOptions={{ stroke: false, fillColor: '#E0A11A', fillOpacity: 0.01 }}>
        {canHover && <Tooltip direction="top" offset={[0, -8]}><Info info={info} /></Tooltip>}
        <Popup closeButton={false} offset={[0, -4]}><Info info={info} /></Popup>
      </CircleMarker>
      <CircleMarker center={p} radius={6} interactive={false} pathOptions={{ color: '#16324F', weight: 2, fillColor: '#E0A11A', fillOpacity: 1 }} />
    </span>
  ));
}
