import './Avatar.css';
import { initialsFromName } from '../../utils/format';

export default function Avatar({ name, color = '#16A374', size = 44, speaking = false, cameraOff = false, className = '' }) {
  return (
    <div
      className={`qz-avatar ${speaking ? 'qz-avatar--speaking' : ''} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(150deg, ${color}, ${color}CC)` }}
      title={name}
    >
      {initialsFromName(name)}
      {cameraOff && <span className="qz-avatar__badge" aria-hidden="true" />}
    </div>
  );
}
