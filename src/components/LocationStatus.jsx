import { LocateFixed, MapPinOff } from 'lucide-react';
import LoadingState from './LoadingState.jsx';

const TEXT = {
  denied: ['Location access is off', 'RouteSafe needs your location. Allow location access in your browser settings, then try again.'],
  unavailable: ['Location not available', 'Make sure location is turned on and you have a signal, then try again.'],
  error: ['Location timed out', 'We couldn’t get your location in time. Please try again.'],
  unsupported: ['Location not supported', 'This browser can’t share your location. Try a different browser.']
};

export default function LocationStatus({ status, position, onRetry, onUseDemo }) {
  if (status === 'loading') return <LoadingState message="Finding your location..." />;
  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
        <LocateFixed size={22} strokeWidth={1.75} className="shrink-0 text-teal" aria-hidden />
        <div>
          <p className="text-[15px] font-medium">Location detected</p>
          {position && <p className="text-sm text-muted">{position[0].toFixed(4)}, {position[1].toFixed(4)}</p>}
        </div>
      </div>
    );
  }
  const [title, body] = TEXT[status] || TEXT.error;
  return (
    <div role="alert" className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-start gap-3">
        <MapPinOff size={22} strokeWidth={1.75} className="mt-0.5 shrink-0 text-navy" aria-hidden />
        <div><p className="text-base font-semibold">{title}</p><p className="mt-0.5 text-sm text-muted">{body}</p></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {onUseDemo && (
          <button onClick={onUseDemo} className="btn-primary">Use demo location</button>
        )}
        <button onClick={onRetry} className="btn-secondary">Try again</button>
      </div>
    </div>
  );
}
