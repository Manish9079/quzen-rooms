import './Badge.css';

export default function Badge({ children, tone = 'mint', icon: Icon, className = '' }) {
  return (
    <span className={`qz-badge qz-badge--${tone} ${className}`}>
      {Icon && <Icon size={12.5} strokeWidth={2.5} />}
      {children}
    </span>
  );
}
