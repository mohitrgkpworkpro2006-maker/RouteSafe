export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5 3.5 4.8v6.4c0 5.2 3.6 8.9 8.5 10.8 4.9-1.9 8.5-5.6 8.5-10.8V4.8z" fill="#16324F" />
      <path d="M9 17c0-4.5 6-3.5 6-8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15" cy="8.5" r="2" fill="#E0A11A" />
    </svg>
  );
}
