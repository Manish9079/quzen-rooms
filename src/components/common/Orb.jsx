import './Orb.css';

/**
 * The Quzen "Liquid Orb" — signature element. A soft morphing glass
 * sphere used as the hero visual, room avatar backdrop and loading
 * indicator. Purely decorative (aria-hidden) unless given a label.
 */
export default function Orb({ size = 120, animated = true, className = '', label }) {
  return (
    <div
      className={`qz-orb ${animated ? 'qz-orb--animated' : ''} ${className}`}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className="qz-orb__core" />
      <span className="qz-orb__ring" />
      <span className="qz-orb__highlight" />
    </div>
  );
}
