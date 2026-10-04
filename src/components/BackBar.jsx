import { ArrowLeft } from 'lucide-react';

export default function BackBar({ onBack }) {
  return (
    <button onClick={onBack} className="-ml-2 flex h-11 items-center gap-1.5 rounded-lg px-2 text-[15px] font-medium text-navy">
      <ArrowLeft size={20} strokeWidth={1.75} aria-hidden /> Back
    </button>
  );
}
