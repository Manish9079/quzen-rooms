import { Mic, MicOff, Video, VideoOff, ScreenShare, MessageSquare, Users, MoreHorizontal, PhoneOff, Sparkles } from 'lucide-react';
import './ControlBar.css';

export default function ControlBar({
  micOn, cameraOn, sharingScreen,
  onToggleMic, onToggleCamera, onToggleShare,
  onToggleChat, chatOpen, unreadChat,
  onToggleParticipants, participantsOpen, participantCount,
  onLeave, onMore,
}) {
  return (
    <div className="qz-control-bar">
      <div className="qz-control-bar__group qz-control-bar__group--left">
        <span className="qz-control-bar__brand"><Sparkles size={15} /> Quzen Rooms</span>
      </div>

      <div className="qz-control-bar__group qz-control-bar__group--center">
        <button className={`qz-ctrl-btn ${!micOn ? 'qz-ctrl-btn--off' : ''}`} onClick={onToggleMic} aria-pressed={micOn} aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}>
          {micOn ? <Mic size={19} strokeWidth={2.2} /> : <MicOff size={19} strokeWidth={2.2} />}
        </button>
        <button className={`qz-ctrl-btn ${!cameraOn ? 'qz-ctrl-btn--off' : ''}`} onClick={onToggleCamera} aria-pressed={cameraOn} aria-label={cameraOn ? 'Turn off camera' : 'Turn on camera'}>
          {cameraOn ? <Video size={19} strokeWidth={2.2} /> : <VideoOff size={19} strokeWidth={2.2} />}
        </button>
        <button className={`qz-ctrl-btn ${sharingScreen ? 'qz-ctrl-btn--active' : ''}`} onClick={onToggleShare} aria-pressed={sharingScreen} aria-label="Share screen">
          <ScreenShare size={19} strokeWidth={2.2} />
        </button>
        <button className={`qz-ctrl-btn ${chatOpen ? 'qz-ctrl-btn--active' : ''}`} onClick={onToggleChat} aria-pressed={chatOpen} aria-label="Toggle chat">
          <MessageSquare size={19} strokeWidth={2.2} />
          {unreadChat > 0 && !chatOpen && <span className="qz-ctrl-btn__dot">{unreadChat}</span>}
        </button>
        <button className={`qz-ctrl-btn ${participantsOpen ? 'qz-ctrl-btn--active' : ''}`} onClick={onToggleParticipants} aria-pressed={participantsOpen} aria-label="Toggle participants list">
          <Users size={19} strokeWidth={2.2} />
          <span className="qz-ctrl-btn__count">{participantCount}</span>
        </button>
        <button className="qz-ctrl-btn" onClick={onMore} aria-label="More options">
          <MoreHorizontal size={19} strokeWidth={2.2} />
        </button>
      </div>

      <div className="qz-control-bar__group qz-control-bar__group--right">
        <button className="qz-ctrl-leave" onClick={onLeave}>
          <PhoneOff size={17} strokeWidth={2.3} /> <span>Leave</span>
        </button>
      </div>
    </div>
  );
}
