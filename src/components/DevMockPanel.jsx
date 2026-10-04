import { useState } from 'react';
import { MOCK_SCENARIOS, setMockScenario } from '../services/mockApi.js';

// Development-only. Rendered only when VITE_USE_MOCK_API=true. Remove with mockApi.js.
export default function DevMockPanel({ onSelect }) {
  const [active, setActive] = useState(null);
  return (
    <div className="mb-3 rounded-lg border border-dashed border-muted p-2">
      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-muted">Dev only · mock scenario · demo data</p>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {MOCK_SCENARIOS.map((s) => (
          <button key={s.id} onClick={() => { setActive(s.id); setMockScenario(s.id); onSelect(s); }}
            className={`h-9 shrink-0 rounded-lg border px-3 font-mono text-[13px] ${active === s.id ? 'border-navy bg-navy text-white' : 'border-line bg-white text-ink'}`}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
