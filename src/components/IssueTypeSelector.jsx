import { Dog, Lightbulb, TriangleAlert, CircleCheck, Circle } from 'lucide-react';
import { ISSUE_TYPES } from '../utils/constants.js';

const ICONS = { dog: Dog, light: Lightbulb, other: TriangleAlert };

export default function IssueTypeSelector({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="What did you notice?" className="flex flex-col gap-2">
      {ISSUE_TYPES.map((t) => {
        const on = value === t.id;
        const Icon = ICONS[t.id];
        return (
          <button key={t.id} role="radio" aria-checked={on} onClick={() => onChange(t.id)}
            className={`flex min-h-[60px] items-center gap-3 rounded-xl border px-3 text-left transition-colors ${on ? 'border-navy bg-tint' : 'border-line bg-white'}`}>
            <Icon size={24} strokeWidth={1.75} className="shrink-0 text-navy" aria-hidden />
            <span className="flex-1 text-base font-medium">{t.label}</span>
            {on ? <CircleCheck size={22} strokeWidth={1.75} className="text-navy" aria-hidden /> : <Circle size={22} strokeWidth={1.75} className="text-line" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
