import { X, Mic, MicOff, Video, VideoOff, Crown, Copy, ShieldPlus, ShieldMinus, UserX, Check } from 'lucide-react';
import Avatar from '../common/Avatar';
import './SidePanel.css';

export default function ParticipantsPanel({
  open, onClose, participants, colorFor, onCopyInvite,
  canModerate = false, onRemove, onToggleCoHost,
  waitingList = [], onApprove, onReject,
}) {
  return (
    <aside className={`qz-side-panel ${open ? 'qz-side-panel--open' : ''}`} aria-hidden={!open}>
      <div className="qz-side-panel__head">
        <h3>Participants ({participants.length})</h3>
        <button onClick={onClose} aria-label="Close participants list"><X size={18} /></button>
      </div>

      <div className="qz-participants__invite">
        <span>Invite people to this room</span>
        <button onClick={onCopyInvite}><Copy size={14} strokeWidth={2.4} /> Copy link</button>
      </div>

      {canModerate && waitingList.length > 0 && (
        <div className="qz-waiting-room">
          <span className="qz-waiting-room__label">Waiting to join ({waitingList.length})</span>
          <ul>
            {waitingList.map((w) => (
              <li key={w.userId} className="qz-waiting-room__row">
                <Avatar name={w.displayName || w.username} color={colorFor({ id: w.userId })} size={32} />
                <span className="qz-waiting-room__name">{w.displayName || w.username}</span>
                <button className="qz-waiting-room__approve" onClick={() => onApprove(w.userId)} aria-label="Approve"><Check size={14} strokeWidth={2.6} /></button>
                <button className="qz-waiting-room__reject" onClick={() => onReject(w.userId)} aria-label="Reject"><X size={14} strokeWidth={2.6} /></button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="qz-participants__list">
        {participants.map((p) => (
          <li key={p.id} className="qz-participant-row">
            <Avatar name={p.name} color={colorFor(p)} size={38} speaking={p.speaking} />
            <div className="qz-participant-row__info">
              <span className="qz-participant-row__name">{p.name}{p.isMe ? ' (You)' : ''}</span>
              {p.isHost && <span className="qz-participant-row__host"><Crown size={11} strokeWidth={2.5} /> Host</span>}
              {p.isCoHost && <span className="qz-participant-row__host qz-participant-row__host--co"><ShieldPlus size={11} strokeWidth={2.5} /> Co-host</span>}
            </div>
            <div className="qz-participant-row__status">
              {p.cameraOn ? <Video size={15} strokeWidth={2.2} /> : <VideoOff size={15} strokeWidth={2.2} className="qz-participant-row__off" />}
              {!p.muted ? <Mic size={15} strokeWidth={2.2} /> : <MicOff size={15} strokeWidth={2.2} className="qz-participant-row__off" />}
            </div>
            {canModerate && !p.isMe && !p.isHost && (
              <div className="qz-participant-row__actions">
                <button title={p.isCoHost ? 'Remove co-host' : 'Make co-host'} onClick={() => onToggleCoHost(p)}>
                  {p.isCoHost ? <ShieldMinus size={14} strokeWidth={2.3} /> : <ShieldPlus size={14} strokeWidth={2.3} />}
                </button>
                <button title="Remove from room" className="qz-participant-row__remove" onClick={() => onRemove(p)}>
                  <UserX size={14} strokeWidth={2.3} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
