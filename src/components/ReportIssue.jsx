import { useState } from 'react';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import useGeolocation from '../hooks/useGeolocation.js';
import { reportHazard } from '../services/api.js';
import { ISSUE_TYPES, PACK_SIZES, DEMO_MODE, DEMO_ORIGIN, DEMO_ORIGIN_LABEL } from '../utils/constants.js';
import IssueTypeSelector from './IssueTypeSelector.jsx';
import LocationStatus from './LocationStatus.jsx';
import LoadingState from './LoadingState.jsx';
import ErrorState from './ErrorState.jsx';
import BackBar from './BackBar.jsx';

export default function ReportIssue({ onBack }) {
  const geo = useGeolocation();
  const [demoPos, setDemoPos] = useState(null);
  const [type, setType] = useState(null);
  const [pack, setPack] = useState('');
  const [phase, setPhase] = useState('form'); // form | submitting | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  const issue = ISSUE_TYPES.find((t) => t.id === type);
  const needsPack = type === 'dog';
  const missing = !issue ? 'Choose what you noticed.' : needsPack && !pack ? 'Select the pack size.' : null;
  const position = demoPos || geo.position;
  const located = geo.status === 'success' || demoPos !== null;

  async function submit() {
    setTouched(true);
    if (missing || !located) return;
    setPhase('submitting');
    try {
      const [lat, lng] = position;
      setResult(await reportHazard({ lat, lng, reason: issue.reason, pack_size: needsPack ? pack : undefined }));
      setPhase('success');
    } catch (e) { setError(e); setPhase('error'); }
  }

  if (phase === 'success') {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex flex-1 flex-col justify-center" role="status">
          <CircleCheck size={40} strokeWidth={1.75} className="text-teal" aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold">Safety concern reported</h1>
          <p className="mt-1 text-base text-muted">Thank you for helping keep this route safer.</p>
          <dl className="mt-6 divide-y divide-line rounded-xl border border-line bg-white text-[15px]">
            <div className="p-3"><dt className="text-sm text-muted">Report ID</dt><dd className="font-medium">{result.hazard_id}</dd></div>
            <div className="p-3"><dt className="text-sm text-muted">This report expires</dt>
              <dd className="font-medium">{new Date(result.expires_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
          </dl>
        </div>
        <button onClick={onBack} className="btn-primary">Back to home</button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-6 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]">
      <BackBar onBack={onBack} />
      <h1 className="text-2xl font-semibold">Report a safety concern</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Your current location</h2>
        <LocationStatus
          status={demoPos ? 'success' : geo.status}
          position={position}
          onRetry={geo.retry}
          onUseDemo={DEMO_MODE ? () => setDemoPos(DEMO_ORIGIN) : undefined}
        />
        {demoPos && (
          <p className="text-xs text-muted">Using the demo location at {DEMO_ORIGIN_LABEL}.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">What did you notice?</h2>
        <IssueTypeSelector value={type} onChange={(t) => { setType(t); setPack(''); }} />
      </section>

      {needsPack && (
        <section className="flex flex-col gap-2">
          <label htmlFor="pack" className="text-base font-semibold">Pack size</label>
          <select id="pack" value={pack} onChange={(e) => setPack(e.target.value)} className="field">
            <option value="">Select</option>
            {PACK_SIZES.map((p) => <option key={p} value={p}>{p} dogs</option>)}
          </select>
        </section>
      )}

      {touched && (missing || !located) && (
        <p role="alert" className="flex items-center gap-2 text-sm font-medium text-danger">
          <TriangleAlert size={18} strokeWidth={1.75} aria-hidden /> {missing || 'Your location is needed to submit a report.'}
        </p>
      )}

      <div className="mt-auto">
        {phase === 'submitting' && <LoadingState message="Submitting report..." />}
        {phase === 'error' && <ErrorState title="Unable to submit report" error={error} onRetry={submit} />}
        {phase !== 'error' && <button onClick={submit} disabled={phase === 'submitting' || !located} className="btn-primary">Submit report</button>}
      </div>
    </main>
  );
}
