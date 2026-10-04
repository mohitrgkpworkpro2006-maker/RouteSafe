export default function LoadingState({ message }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-3 text-[15px] font-medium text-navy">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-teal motion-reduce:animate-none" />
      {message}
    </div>
  );
}
