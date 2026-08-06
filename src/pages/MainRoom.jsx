import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Settings2, MonitorX } from 'lucide-react';
import RoomHeader from '../components/room/RoomHeader';
import VideoTile from '../components/room/VideoTile';
import ControlBar from '../components/room/ControlBar';
import ChatPanel from '../components/room/ChatPanel';
import ParticipantsPanel from '../components/room/ParticipantsPanel';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Orb from '../components/common/Orb';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../components/common/Toast';
import { socketService } from '../services/socketService';
import { chatService } from '../services/chatService';
import { mediaService } from '../services/mediaService';
import { colorFromId } from '../utils/format';
import './MainRoom.css';

export default function MainRoom() {
  const { code } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { user } = useAuth();
  const { addRecentRoom } = useUser();

  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [mediaStateByUserId, setMediaStateByUserId] = useState({});
  const [socketIdByUserId, setSocketIdByUserId] = useState({});
  const [speakingByUserId, setSpeakingByUserId] = useState({});
  const [remoteStreams, setRemoteStreams] = useState(new Map());

  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [joinError, setJoinError] = useState('');
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  const chatOpenRef = useRef(chatOpen);
  chatOpenRef.current = chatOpen;
  const mySocketIdRef = useRef(null);
  const socketIdByUserIdRef = useRef({});
  useEffect(() => { socketIdByUserIdRef.current = socketIdByUserId; }, [socketIdByUserId]);

  useEffect(() => {
    const cleanupDetectors = [];
    socketService.connect();

    const offConnect = socketService.on('connect', () => {
      setConnectionStatus('connected');
      mySocketIdRef.current = socketService.socket.id;
    });
    const offDisconnect = socketService.on('disconnect', () => setConnectionStatus('reconnecting'));

    const offJoined = socketService.on('room:joined', ({ room: r, messages: hist, participants: list }) => {
      setRoom(r);
      setMessages(hist);
      setParticipants(list);
      setWaitingForApproval(false);
      addRecentRoom({ name: r.name, code: r.code, createdAgo: r.createdAt });
      mediaService.startSignaling();
    });

    const offWaiting = socketService.on('room:waiting', () => setWaitingForApproval(true));
    const offRejected = socketService.on('room:joinRejected', ({ reason }) => {
      setJoinError(reason || 'The host declined your request to join.');
    });
    const offRemovedYou = socketService.on('host:removedYou', () => {
      showToast('The host removed you from this room.', 'error');
      navigate('/explore');
    });

    const offUserJoined = socketService.on('presence:userJoined', ({ participant }) => {
      setParticipants((prev) => [...prev.filter((p) => p.user.id !== participant.user.id), participant]);
    });
    const offUserLeft = socketService.on('presence:userLeft', ({ userId }) => {
      setParticipants((prev) => prev.filter((p) => p.user.id !== userId));
    });

    const offMessage = chatService.onMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!chatOpenRef.current && msg.author.id !== user.id) setUnreadChat((n) => n + 1);
    });
    const offTyping = chatService.onTyping(({ userId, username, isTyping }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) next[userId] = username; else delete next[userId];
        return next;
      });
    });
    const offDeleted = chatService.onMessageDeleted(({ id }) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, deleted: true, body: null } : m)));
    });

    const offRoomLocked = socketService.on('host:roomLocked', ({ isLocked }) => {
      setRoom((prev) => (prev ? { ...prev, isLocked } : prev));
    });
    const offWaitingUpdate = socketService.on('host:waitingRoomUpdate', ({ waiting }) => setWaitingList(waiting));
    const offRoleChanged = socketService.on('host:roleChanged', ({ participant }) => {
      setParticipants((prev) => prev.map((p) => (p.user.id === participant.user.id ? participant : p)));
    });

    const offMediaState = socketService.on('media:state', ({ userId, socketId, micOn: m, cameraOn: c, screenSharing: s }) => {
      setMediaStateByUserId((prev) => ({ ...prev, [userId]: { micOn: m, cameraOn: c, screenSharing: s } }));
      setSocketIdByUserId((prev) => ({ ...prev, [userId]: socketId }));
    });
    const offPeerJoined = socketService.on('webrtc:peerJoined', ({ socketId, userId }) => {
      setSocketIdByUserId((prev) => ({ ...prev, [userId]: socketId }));
    });
    const offPeerOffer = socketService.on('webrtc:offer', ({ from, userId }) => {
      if (userId) setSocketIdByUserId((prev) => ({ ...prev, [userId]: from }));
    });
    const offPeerDisconnected = socketService.on('webrtc:peerDisconnected', ({ socketId }) => {
      setRemoteStreams((prev) => { const next = new Map(prev); next.delete(socketId); return next; });
    });

    mediaService.onRemoteStream = (socketId, stream) => {
      setRemoteStreams((prev) => new Map(prev).set(socketId, stream));
      const stop = mediaService.attachSpeakingDetector(stream, (speaking) => {
        const uid = Object.keys(socketIdByUserIdRef.current).find((id) => socketIdByUserIdRef.current[id] === socketId);
        if (uid) setSpeakingByUserId((prev) => ({ ...prev, [uid]: speaking }));
      });
      cleanupDetectors.push(stop);
    };
    mediaService.onPeerLeft = (socketId) => {
      setRemoteStreams((prev) => { const next = new Map(prev); next.delete(socketId); return next; });
    };

    socketService.emitAck('room:join', { code }).then((ack) => {
      if (!ack.ok) setJoinError(ack.message || 'Could not join this room.');
    });

    return () => {
      [offConnect, offDisconnect, offJoined, offWaiting, offRejected, offRemovedYou,
        offUserJoined, offUserLeft, offMessage, offTyping, offDeleted, offRoomLocked, offWaitingUpdate, offRoleChanged,
        offMediaState, offPeerJoined, offPeerOffer, offPeerDisconnected].forEach((off) => off?.());
      cleanupDetectors.forEach((stop) => stop());
      socketService.emitAck('room:leave', {});
      mediaService.stopAll();
      socketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (!localStream) return undefined;
    const stop = mediaService.attachSpeakingDetector(localStream, (speaking) => {
      setSpeakingByUserId((prev) => ({ ...prev, [user.id]: speaking }));
    });
    return stop;
  }, [localStream, user.id]);

  const myParticipant = participants.find((p) => p.user.id === user.id);
  const canModerate = myParticipant?.role === 'HOST' || myParticipant?.role === 'CO_HOST';

  async function handleToggleMic() {
    try {
      if (!localStream) {
        const stream = await mediaService.getCamera({ audio: true, video: cameraOn });
        setLocalStream(stream);
        setMicOn(true);
        mediaService.broadcastMediaState({ micOn: true, cameraOn, screenSharing: sharingScreen });
      } else {
        const next = !micOn;
        mediaService.setTrackEnabled(localStream, 'audio', next);
        setMicOn(next);
        mediaService.broadcastMediaState({ micOn: next, cameraOn, screenSharing: sharingScreen });
      }
      setMediaError('');
    } catch {
      setMediaError("Microphone access was blocked. Allow it in your browser's site settings to talk.");
    }
  }

  async function handleToggleCamera() {
    try {
      if (!localStream) {
        const stream = await mediaService.getCamera({ audio: micOn, video: true });
        setLocalStream(stream);
        setCameraOn(true);
        mediaService.broadcastMediaState({ micOn, cameraOn: true, screenSharing: sharingScreen });
      } else {
        const next = !cameraOn;
        const hasVideoTrack = localStream.getVideoTracks().length > 0;
        if (!hasVideoTrack && next) {
          mediaService.stopStream(localStream);
          const stream = await mediaService.getCamera({ audio: micOn, video: true });
          setLocalStream(stream);
        } else {
          mediaService.setTrackEnabled(localStream, 'video', next);
        }
        setCameraOn(next);
        mediaService.broadcastMediaState({ micOn, cameraOn: next, screenSharing: sharingScreen });
      }
      setMediaError('');
    } catch {
      setMediaError("Camera access was blocked. Allow it in your browser's site settings to show video.");
    }
  }

  async function handleToggleShare() {
    try {
      if (sharingScreen) {
        mediaService.stopStream(screenStream);
        setScreenStream(null);
        setSharingScreen(false);
        mediaService.broadcastMediaState({ micOn, cameraOn, screenSharing: false });
      } else {
        const stream = await mediaService.getScreenShare();
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          setSharingScreen(false);
          setScreenStream(null);
          mediaService.broadcastMediaState({ micOn, cameraOn, screenSharing: false });
        });
        setScreenStream(stream);
        setSharingScreen(true);
        mediaService.broadcastMediaState({ micOn, cameraOn, screenSharing: true });
        showToast('You are sharing your screen', 'info');
      }
      setMediaError('');
    } catch {
      /* user cancelled the screen picker */
    }
  }

  async function handleSendMessage(text) {
    const ack = await chatService.send(text);
    if (!ack?.ok) showToast(ack?.message || 'Could not send message.', 'error');
  }

  function handleCopyInvite() {
    const link = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    showToast('Invite link copied to clipboard');
  }

  function handleLeave() {
    navigate('/explore');
  }

  async function handleToggleLock() {
    const ack = await socketService.emitAck(room?.isLocked ? 'host:unlockRoom' : 'host:lockRoom', {});
    if (!ack.ok) showToast(ack.message || 'Could not update the room lock.', 'error');
  }

  const handleRemoveParticipant = useCallback(async (p) => {
    const ack = await socketService.emitAck('host:removeParticipant', { userId: p.id });
    if (!ack.ok) showToast(ack.message || 'Could not remove that participant.', 'error');
  }, [showToast]);

  const handleToggleCoHost = useCallback(async (p) => {
    const event = p.isCoHost ? 'host:removeCoHost' : 'host:setCoHost';
    const ack = await socketService.emitAck(event, { userId: p.id });
    if (!ack.ok) showToast(ack.message || 'Could not update that role.', 'error');
  }, [showToast]);

  const handleApproveWaiting = useCallback(async (userId) => {
    const ack = await socketService.emitAck('host:approveWaiting', { userId });
    if (!ack.ok) showToast(ack.message || 'Could not approve that user.', 'error');
  }, [showToast]);

  const handleRejectWaiting = useCallback(async (userId) => {
    await socketService.emitAck('host:rejectWaiting', { userId });
  }, []);

  const displayParticipants = useMemo(() => participants.map((p) => {
    const isMe = p.user.id === user.id;
    const media = isMe
      ? { micOn, cameraOn, screenSharing: sharingScreen }
      : mediaStateByUserId[p.user.id] || { micOn: false, cameraOn: false, screenSharing: false };
    const socketId = isMe ? mySocketIdRef.current : socketIdByUserId[p.user.id];
    const stream = isMe ? localStream : (socketId ? remoteStreams.get(socketId) : null);
    return {
      id: p.user.id,
      name: p.user.displayName,
      isMe,
      isHost: p.role === 'HOST',
      isCoHost: p.role === 'CO_HOST',
      muted: !media.micOn,
      cameraOn: media.cameraOn,
      speaking: Boolean(speakingByUserId[p.user.id]),
      connected: true,
      _stream: stream,
    };
  }), [participants, user.id, micOn, cameraOn, sharingScreen, mediaStateByUserId, socketIdByUserId, localStream, remoteStreams, speakingByUserId]);

  const chatMessages = useMemo(() => messages.map((m) => ({
    id: m.id,
    text: m.deleted ? '(message deleted)' : m.body,
    author: m.author.displayName,
    color: colorFromId(m.author.id),
    self: m.author.id === user.id,
  })), [messages, user.id]);

  const typingLabel = useMemo(() => {
    const names = Object.values(typingUsers);
    if (names.length === 0) return '';
    if (names.length === 1) return `${names[0]} is typing…`;
    return `${names.slice(0, 2).join(', ')} are typing…`;
  }, [typingUsers]);

  if (joinError) {
    return (
      <div className="qz-room qz-room--center">
        <Orb size={100} />
        <h1 className="qz-room__error-title">Couldn't join this room</h1>
        <p className="qz-room__error-text">{joinError}</p>
        <Button onClick={() => navigate('/explore')}>Back to Explore</Button>
      </div>
    );
  }

  if (waitingForApproval) {
    return (
      <div className="qz-room qz-room--center">
        <Orb size={100} />
        <h1 className="qz-room__error-title">Waiting for the host</h1>
        <p className="qz-room__error-text">This room is locked. The host has been notified — you'll join automatically once they let you in.</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="qz-room qz-room--center">
        <Orb size={80} animated />
        <p className="qz-room__error-text">Joining room…</p>
      </div>
    );
  }

  return (
    <div className="qz-room">
      <RoomHeader
        room={room} connectionStatus={connectionStatus} onCopyInvite={handleCopyInvite}
        canModerate={canModerate} isLocked={room.isLocked} onToggleLock={handleToggleLock}
      />

      {mediaError && (
        <div className="qz-room__banner">
          <MonitorX size={15} strokeWidth={2.3} /> {mediaError}
        </div>
      )}

      <div className="qz-room__body">
        {sharingScreen && (
          <div className="qz-room__spotlight">
            <ScreenPreview stream={screenStream} />
            <span className="qz-room__spotlight-label">You're presenting your screen</span>
          </div>
        )}
        <div className={`qz-video-grid ${sharingScreen ? 'qz-video-grid--sidebar' : ''}`} data-count={displayParticipants.length}>
          {displayParticipants.map((p) => (
            <VideoTile key={p.id} participant={p} stream={p._stream} color={colorFromId(p.id)} />
          ))}
        </div>
      </div>

      <ControlBar
        micOn={micOn} cameraOn={cameraOn} sharingScreen={sharingScreen}
        onToggleMic={handleToggleMic} onToggleCamera={handleToggleCamera} onToggleShare={handleToggleShare}
        onToggleChat={() => { setChatOpen((o) => !o); setParticipantsOpen(false); setUnreadChat(0); }}
        chatOpen={chatOpen} unreadChat={unreadChat}
        onToggleParticipants={() => { setParticipantsOpen((o) => !o); setChatOpen(false); }}
        participantsOpen={participantsOpen} participantCount={participants.length}
        onLeave={handleLeave}
        onMore={() => setMoreOpen(true)}
      />

      <ChatPanel
        open={chatOpen} onClose={() => setChatOpen(false)} messages={chatMessages} onSend={handleSendMessage}
        myName={user.displayName} onTypingChange={chatService.setTyping} typingLabel={typingLabel}
      />
      <ParticipantsPanel
        open={participantsOpen} onClose={() => setParticipantsOpen(false)}
        participants={displayParticipants} colorFor={(p) => colorFromId(p.id)} onCopyInvite={handleCopyInvite}
        canModerate={canModerate} onRemove={handleRemoveParticipant} onToggleCoHost={handleToggleCoHost}
        waitingList={waitingList} onApprove={handleApproveWaiting} onReject={handleRejectWaiting}
      />

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Room options">
        <p className="qz-room__more-note"><Settings2 size={13} strokeWidth={2.3} /> Personal audio/video preferences live in your account Settings page.</p>
        {room.description && <p className="qz-room__more-desc">{room.description}</p>}
      </Modal>
    </div>
  );
}

function ScreenPreview({ stream }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream; }, [stream]);
  return <video ref={ref} autoPlay playsInline muted className="qz-room__spotlight-video" />;
}
