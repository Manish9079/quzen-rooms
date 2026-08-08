import { useEffect, useRef } from 'react';
import { MicOff, Crown, Wifi } from 'lucide-react';
import Avatar from '../common/Avatar';
import './VideoTile.css';

export default function VideoTile({ participant, stream, color, large = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const showVideo =
  (participant.cameraOn || participant.screenSharing) && stream;

  return (
    <div className={`qz-tile ${participant.speaking ? 'qz-tile--speaking' : ''} ${large ? 'qz-tile--large' : ''}`}>
     <video
  ref={videoRef}
  autoPlay
  playsInline
  muted={participant.isMe}
  className={`qz-tile__video ${showVideo ? '' : 'qz-tile__video--hidden'}`}
/>

{!showVideo && (
  <Avatar
    name={participant.name}
    color={color}
    size={large ? 92 : 64}
    speaking={participant.speaking}
  />
)}

      <div className="qz-tile__overlay">
        <div className="qz-tile__tags">
          {participant.isHost && <span className="qz-tile__tag qz-tile__tag--host"><Crown size={11} strokeWidth={2.5} /> Host</span>}
        </div>
        <div className="qz-tile__foot">
          <span className="qz-tile__name">{participant.name}{participant.isMe ? ' (You)' : ''}</span>
          {participant.muted && <MicOff size={14} strokeWidth={2.3} className="qz-tile__muted-icon" />}
        </div>
      </div>

      {!participant.connected && !participant.isMe && (
        <span className="qz-tile__connecting"><Wifi size={11} strokeWidth={2.5} /> Connecting…</span>
      )}
    </div>
  );
}
