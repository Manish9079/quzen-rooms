import './Logo.css';

export default function Logo({ size = 34, withText = true }) {
  return (
    <div className="qz-logo">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="qzLogoGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3FE3A8" />
            <stop offset="0.55" stopColor="#0E8862" />
            <stop offset="1" stopColor="#0A6B4E" />
          </linearGradient>
        </defs>
        <path d="M20 3C10.6 3 3 10.6 3 20c0 9.4 7.6 17 17 17 3 0 5.8-.8 8.3-2.1l5.2 1.6-1.5-5.4C34.4 27.9 37 24.2 37 20 37 10.6 29.4 3 20 3Z" fill="url(#qzLogoGrad)" />
        <circle cx="14.5" cy="20" r="2.6" fill="#EAFBF3" />
        <circle cx="20.5" cy="20" r="2.6" fill="#EAFBF3" opacity="0.85" />
        <circle cx="26.5" cy="20" r="2.6" fill="#EAFBF3" opacity="0.65" />
      </svg>
      {withText && <span className="qz-logo__text">Quzen<span>Rooms</span></span>}
    </div>
  );
}
