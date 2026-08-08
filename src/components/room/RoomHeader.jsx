import { useState } from 'react';
import { Lock, Globe2, Copy, Check, Wifi, WifiOff, Loader2, LockOpen } from 'lucide-react';
import './RoomHeader.css';

const STATUS_META = {
  connecting: { icon: Loader2, label: 'Connecting…', tone: 'qz-conn--connecting' },
  connected: { icon: Wifi, label: 'Connected', tone: 'qz-conn--connected' },
  reconnecting: { icon: WifiOff, label: 'Reconnecting…', tone: 'qz-conn--reconnecting' },
};

export default function RoomHeader({
  room,
  connectionStatus,
  onCopyCode,
  onCopyInvite,
  canModerate = false,
  isLocked = false,
  onToggleLock,
})  {
  const [copiedCode, setCopiedCode] = useState(false);
const [copiedInvite, setCopiedInvite] = useState(false);
  const meta = STATUS_META[connectionStatus] || STATUS_META.connecting;
  const StatusIcon = meta.icon;
function handleCopyCode() {
  onCopyCode();
  setCopiedCode(true);
  setTimeout(() => setCopiedCode(false), 1800);
}

function handleCopyInvite() {
  onCopyInvite();
  setCopiedInvite(true);
  setTimeout(() => setCopiedInvite(false), 1800);
}

  return (
    <header className="qz-room-header">
      <div className="qz-room-header__left">
        <h1>{room.name}</h1>
        <span className={`qz-visibility-pill ${room.isPrivate ? 'qz-visibility-pill--private' : ''}`}>
          {room.isPrivate ? <Lock size={12} strokeWidth={2.5} /> : <Globe2 size={12} strokeWidth={2.5} />}
          {room.isPrivate ? 'Private' : 'Public'}
        </span>
        {isLocked && (
          <span className="qz-visibility-pill qz-visibility-pill--locked">
            <Lock size={12} strokeWidth={2.5} /> Locked
          </span>
        )}
        <span className={`qz-conn ${meta.tone}`}>
          <StatusIcon size={13} strokeWidth={2.5} className={connectionStatus === 'connecting' ? 'qz-spin' : ''} />
          {meta.label}
        </span>
      </div>
      <div className="qz-room-header__right">
        {canModerate && (
          <button className="qz-room-header__lock" onClick={onToggleLock}>
            {isLocked ? <LockOpen size={14} strokeWidth={2.3} /> : <Lock size={14} strokeWidth={2.3} />}
            {isLocked ? 'Unlock room' : 'Lock room'}
          </button>
        )}
       <button className="qz-room-header__invite" onClick={handleCopyCode}>
  {copiedCode ? (
    <Check size={15} strokeWidth={2.5} />
  ) : (
    <Copy size={15} strokeWidth={2.3} />
  )}

  <span className="qz-room-header__code">{room.code}</span>

  {copiedCode ? 'Code Copied' : 'Copy Code'}
</button>

<button className="qz-room-header__invite" onClick={handleCopyInvite}>
  {copiedInvite ? (
    <Check size={15} strokeWidth={2.5} />
  ) : (
    <Copy size={15} strokeWidth={2.3} />
  )}

  {copiedInvite ? 'Invite Copied' : 'Copy Invite Link'}
</button>
      </div>
    </header>
  );
}
