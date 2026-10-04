import { useEffect } from 'react';
import { CircleAlert } from 'lucide-react';

// Developer details go to the console only, never the UI.
export default function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  useEffect(() => { if (error) console.error('[RouteSafe]', error); }, [error]);
  return (
    <div role="alert" className="rounded-xl border border-[#E8C9C4] bg-dangertint p-4">
      <div className="flex items-start gap-3">
        <CircleAlert size={22} strokeWidth={1.75} className="mt-0.5 shrink-0 text-danger" aria-hidden />
        <div>
          <p className="text-base font-semibold">{title}</p>
          <p className="mt-0.5 text-sm text-muted">We couldn't complete your request. Check your connection and try again.</p>
        </div>
      </div>
      <button onClick={onRetry} className="btn-secondary mt-3">Try again</button>
    </div>
  );
}
