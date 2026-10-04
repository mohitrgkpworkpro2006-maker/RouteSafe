import { Flag, MapPinned, ChevronRight } from 'lucide-react';
import Logo from './Logo.jsx';

function Action({ icon: Icon, title, text, onClick, primary }) {
  return (
    <button onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors ${primary ? 'bg-navy text-white active:bg-ink' : 'border border-navy bg-white text-ink active:bg-tint'}`}>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${primary ? 'bg-teal text-white' : 'bg-warn text-warnink'}`}>
        <Icon size={24} strokeWidth={1.75} aria-hidden />
      </span>
      <span className="flex-1">
        <span className="block text-[17px] font-semibold">{title}</span>
        <span className={`mt-0.5 block text-sm ${primary ? 'text-white/80' : 'text-muted'}`}>{text}</span>
      </span>
      <ChevronRight size={22} strokeWidth={1.75} aria-hidden />
    </button>
  );
}

export default function HomeScreen({ onSelect }) {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2.5 border-b border-line py-3">
        <Logo />
        <span className="text-xl font-semibold text-navy">RouteSafe</span>
      </header>
      <section className="mt-8">
        <h1 className="text-[26px] font-semibold leading-tight">Travel with confidence.</h1>
        <p className="mt-2 text-base text-muted">Travel safer with real-time safety information.</p>
      </section>
      <div className="mt-8 flex flex-col gap-3">
        <Action icon={Flag} title="Report a safety issue" text="Help others avoid hazards on the road" onClick={() => onSelect('report')} />
        <Action primary icon={MapPinned} title="Plan a journey" text="Find a safer route to your destination" onClick={() => onSelect('travel')} />
      </div>
    </main>
  );
}
