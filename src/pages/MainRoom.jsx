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
import { roomService } from '../services/roomService';
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
  

  const chatOpenRef = useRef(chatOpen);
  chatOpenRef.current = chatOpen;
  const mySocketIdRef = useRef(null);
  const socketIdByUserIdRef = useRef({});
  useEffect(() => { socketIdByUserIdRef.current = socketIdByUserId; }, [socketIdByUserId]);

  useEffect(() => {
  let cancelled = false;

  async function loadRoom() {
    try {
      const { room: foundRoom } = await roomService.getRoom(code);

      if (cancelled) return;

      if (!foundRoom) {
        setJoinError('Room not found.');
        return;
      }

      setRoom(foundRoom);

      const { members } = await roomService.getRoomMembers(foundRoom.id);

if (cancelled) return;

setParticipants(
  members.map((member) => ({
    user: {
      id: member.userId,
      displayName: member.displayName,
    },
    role: member.role || 'MEMBER',
  }))
);
const { requests } =
  await roomService.getWaitingRequests(foundRoom.id);

if (cancelled) return;

setWaitingList(
  requests
    .filter((request) => request.status === 'PENDING')
    .map((request) => ({
      id: request.id,
      userId: request.userId,
      displayName: request.displayName,
      status: request.status,
    }))
);

      addRecentRoom({
        name: foundRoom.name,
        code: foundRoom.code,
        createdAgo: foundRoom.createdAt,
      });

      setConnectionStatus('connected');
    } catch (err) {
      if (!cancelled) {
        setJoinError(err.message || 'Could not load this room.');
      }
    }
  }

  loadRoom();

  return () => {
    cancelled = true;
  };
}, [code, user.id, user.displayName, addRecentRoom]);
useEffect(() => {
  if (!room?.id) return undefined;

  const unsubscribe = roomService.subscribeToRoomMembers(
    room.id,

    (member) => {
      setParticipants((prev) => {
        const exists = prev.some(
          (p) => p.user.id === member.userId
        );

        if (exists) return prev;

        return [
          ...prev,
          {
            user: {
              id: member.userId,
              displayName: member.displayName,
            },
            role: member.role || 'MEMBER',
          },
        ];
      });
    },

    (member) => {
  setParticipants((prev) =>
    prev.filter(
      (p) => p.user.id !== member.userId
    )
  );

  if (member.userId === user.id) {
    showToast('You were removed from the room.', 'error');
    navigate('/explore', { replace: true });
  }
}
  );
const unsubscribeWaiting =
  roomService.subscribeToWaitingRequests(
    room.id,

    (request) => {
      if (request.status !== 'PENDING') return;

      setWaitingList((prev) => {
        const exists = prev.some(
          (item) => item.id === request.id
        );

        if (exists) return prev;

        return [
          ...prev,
          {
            id: request.id,
            userId: request.userId,
            displayName: request.displayName,
            status: request.status,
          },
        ];
      });
    },

    (request) => {
      setWaitingList((prev) => {
        if (request.status !== 'PENDING') {
          return prev.filter(
            (item) => item.id !== request.id
          );
        }

        return prev.map((item) =>
          item.id === request.id
            ? {
                id: request.id,
                userId: request.userId,
                displayName: request.displayName,
                status: request.status,
              }
            : item
        );
      });
    }
  );
return () => {
  unsubscribe?.();
  unsubscribeWaiting?.();
};
}, [room?.id, user.id, navigate, showToast]);
  useEffect(() => {
    const cleanupDetectors = [];
    socketService.connect();

    const offConnect = socketService.on('connect', () => {
      setConnectionStatus('connected');
      mySocketIdRef.current = socketService.socket.id;
    });
    const offDisconnect = socketService.on('disconnect', () => setConnectionStatus('reconnecting'));

   

    
   
   

   

   

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

   socketService.emitAck('room:join', {
  code,
  userId: user.id,
  username: user.username,
  displayName: user.displayName,
}).then((ack) => {
  console.log('room:join ack:', ack);

  if (!ack.ok) {
    setJoinError(
      ack.message || 'Could not connect to room media.'
    );
    return;
  }

  console.log('Starting WebRTC signaling...');
  mediaService.startSignaling();
});
  

    return () => {
  [
    offConnect,
    offDisconnect,
    
    offMediaState,
    offPeerJoined,
    offPeerOffer,
    offPeerDisconnected,
  ].forEach((off) => off?.());

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
      const stream = await mediaService.getCamera({
        audio: true,
        video: cameraOn,
      });

      setLocalStream(stream);
      setMicOn(true);

      mediaService.broadcastMediaState({
        micOn: true,
        cameraOn,
        screenSharing: sharingScreen,
      });
    } else {
      const next = !micOn;
      const hasAudioTrack = localStream.getAudioTracks().length > 0;

      if (next && !hasAudioTrack) {
        await mediaService.addMicrophoneTrack(localStream);
      } else {
        mediaService.setTrackEnabled(
          localStream,
          'audio',
          next
        );
      }

      setMicOn(next);

      mediaService.broadcastMediaState({
        micOn: next,
        cameraOn,
        screenSharing: sharingScreen,
      });
    }

    setMediaError('');
  } catch (err) {
    console.error('Microphone error:', err);

    setMediaError(
      "Microphone access was blocked. Allow it in your browser's site settings to talk."
    );
  }
}

  async function handleToggleCamera() {
  try {
    const next = !cameraOn;

    // CAMERA ON
    if (next) {
      // No local stream yet
      if (!localStream) {
        const stream = await mediaService.getCamera({
          audio: micOn,
          video: true,
        });

        setLocalStream(stream);
      } else {
        const videoTrack = localStream.getVideoTracks()[0];

        if (videoTrack && videoTrack.readyState === 'live') {
          videoTrack.enabled = true;
        } else {
          // Get ONLY camera — do not touch microphone
          const cameraStream =
            await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });

          const newVideoTrack =
            cameraStream.getVideoTracks()[0];

          localStream.addTrack(newVideoTrack);

          // Send new camera track to existing peers
          // Screen share chal rahi ho to remote sender ko camera se replace mat karo
if (!sharingScreen) {
  for (const pc of mediaService.peers.values()) {
    const sender = pc
      .getSenders()
      .find((s) => s.track?.kind === 'video');

    if (sender) {
      await sender.replaceTrack(newVideoTrack);
    } else {
      pc.addTrack(newVideoTrack, localStream);
    }
  }
}

          setLocalStream(
            new MediaStream(localStream.getTracks())
          );
        }
      }

      setCameraOn(true);

      mediaService.broadcastMediaState({
        micOn,
        cameraOn: true,
        screenSharing: sharingScreen,
      });
    }

    // CAMERA OFF
    else {
      const videoTrack =
        localStream?.getVideoTracks()?.[0];

      if (videoTrack) {
        videoTrack.enabled = false;
      }

      setCameraOn(false);

      mediaService.broadcastMediaState({
        micOn,
        cameraOn: false,
        screenSharing: sharingScreen,
      });
    }

    setMediaError('');
  } catch (err) {
    console.error('Camera error:', err);

    setMediaError(
      "Camera access was blocked. Allow it in your browser's site settings."
    );
  }
}

  async function handleToggleShare() {
  try {
    // STOP SCREEN SHARE
    if (sharingScreen) {
      await mediaService.stopScreenShare();

      setScreenStream(null);
      setSharingScreen(false);

      mediaService.broadcastMediaState({
        micOn,
        cameraOn,
        screenSharing: false,
      });

      setMediaError('');
      return;
    }

    // START SCREEN SHARE
    const stream = await mediaService.getScreenShare();

    await mediaService.startScreenShare(stream);

    const screenTrack = stream.getVideoTracks()[0];

    screenTrack.addEventListener('ended', async () => {
      await mediaService.stopScreenShare();

      setScreenStream(null);
      setSharingScreen(false);

      mediaService.broadcastMediaState({
        micOn,
        cameraOn,
        screenSharing: false,
      });
    });

    setScreenStream(stream);
    setSharingScreen(true);

    mediaService.broadcastMediaState({
      micOn,
      cameraOn,
      screenSharing: true,
    });

    showToast('Screen sharing started.', 'info');
    setMediaError('');
  } catch (err) {
    console.error('Screen share error:', err);

    setMediaError(
      'Could not share your screen. Please allow screen-sharing permission.'
    );
  }
}
  // ...upar existing code rahega


useEffect(() => {
  if (!room?.id) return undefined;

  let cancelled = false;

  async function loadChat() {
    try {
      const { messages: history } = await chatService.getHistory(room.id);

      if (!cancelled) {
        setMessages(history);
      }
    } catch (err) {
      console.error('Could not load chat history:', err);
    }
  }

  loadChat();

  const unsubscribe = chatService.subscribeToMessages(
    room.id,
    (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }

        return [...prev, message];
      });

      if (!chatOpenRef.current && message.userId !== user.id) {
        setUnreadChat((n) => n + 1);
      }
    }
  );

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}, [room?.id, user.id]);

async function handleSendMessage(text) {
  if (!room?.id || !user) return;

  try {
    await chatService.send(
      room.id,
      user,
      text
    );
  } catch (err) {
    showToast(
      err.message || 'Could not send message.',
      'error'
    );
  }
}

 function handleCopyCode() {
  navigator.clipboard?.writeText(room?.code || code).catch(() => {});
  showToast('Room code copied to clipboard');
}

function handleCopyInvite() {
  const link = `${window.location.origin}/join?code=${room?.code || code}`;
  navigator.clipboard?.writeText(link).catch(() => {});
  showToast('Invite link copied to clipboard');
}

  async function handleLeave() {
  try {
    if (room?.id && user?.id) {
      await roomService.leaveRoom(room.id, user.id);
    }

    navigate('/explore');
  } catch (err) {
    showToast(err.message || 'Could not leave room.', 'error');
  }
}
  async function handleDeleteRoom() {
  if (!room?.id) return;

  const confirmed = window.confirm(
    'Are you sure you want to delete this room?'
  );

  if (!confirmed) return;

  try {
    await roomService.deleteRoom(room.id);

    showToast('Room deleted successfully.');
    navigate('/explore', { replace: true });
  } catch (err) {
    showToast(err.message || 'Could not delete room.', 'error');
  }
}
  async function handleToggleLock() {
  if (!room?.id) return;

  try {
    const nextLocked = !room.isLocked;

    const { room: updatedRoom } =
      await roomService.setRoomLock(room.id, nextLocked);

    setRoom(updatedRoom);

    showToast(
      nextLocked ? 'Room locked.' : 'Room unlocked.'
    );
  } catch (err) {
    showToast(
      err.message || 'Could not update the room lock.',
      'error'
    );
  }
}

  const handleRemoveParticipant = useCallback(async (p) => {
  if (!room?.id) return;

  try {
    await roomService.removeMember(room.id, p.id);

    showToast('Participant removed.');
  } catch (err) {
    showToast(
      err.message || 'Could not remove that participant.',
      'error'
    );
  }
}, [room?.id, showToast]);
const handleToggleCoHost = useCallback(async (p) => {
  if (!room?.id) return;

  try {
    const nextRole = p.isCoHost ? 'MEMBER' : 'CO_HOST';

    await roomService.setMemberRole(
      room.id,
      p.id,
      nextRole
    );

    setParticipants((prev) =>
      prev.map((participant) =>
        participant.user.id === p.id
          ? { ...participant, role: nextRole }
          : participant
      )
    );

    showToast(
      nextRole === 'CO_HOST'
        ? 'Participant is now a co-host.'
        : 'Co-host removed.'
    );
  } catch (err) {
    showToast(
      err.message || 'Could not update that role.',
      'error'
    );
  }
}, [room?.id, showToast]);

 const handleApproveWaiting = useCallback(async (userId) => {
  if (!room?.id) return;

  const request = waitingList.find(
    (item) => item.userId === userId
  );

  if (!request) return;

  try {
    await roomService.approveWaitingRequest(
      request.id,
      room.id,
      request.userId,
      request.displayName
    );

    showToast('User approved.');
  } catch (err) {
    showToast(
      err.message || 'Could not approve that user.',
      'error'
    );
  }
}, [room?.id, waitingList, showToast]);

const handleRejectWaiting = useCallback(async (userId) => {
  const request = waitingList.find(
    (item) => item.userId === userId
  );

  if (!request) return;

  try {
    await roomService.rejectWaitingRequest(request.id);
    showToast('Join request rejected.');
  } catch (err) {
    showToast(
      err.message || 'Could not reject that user.',
      'error'
    );
  }
}, [waitingList, showToast]);

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
      screenSharing: media.screenSharing,
      speaking: Boolean(speakingByUserId[p.user.id]),
      connected: true,
      _stream: stream,
    };
  }), [participants, user.id, micOn, cameraOn, sharingScreen, mediaStateByUserId, socketIdByUserId, localStream, remoteStreams, speakingByUserId]);

 const chatMessages = useMemo(() => messages.map((m) => ({
  id: m.id,
  text: m.body,
  author: m.displayName,
  color: colorFromId(m.userId),
  self: m.userId === user.id,
})), [messages, user.id]);

 

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
        room={room} connectionStatus={connectionStatus} onCopyCode={handleCopyCode} onCopyInvite={handleCopyInvite}
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
  open={chatOpen}
  onClose={() => setChatOpen(false)}
  messages={chatMessages}
  onSend={handleSendMessage}
  myName={user.displayName}
/>
      <ParticipantsPanel
        open={participantsOpen} onClose={() => setParticipantsOpen(false)}
        participants={displayParticipants} colorFor={(p) => colorFromId(p.id)} onCopyInvite={handleCopyInvite}
        canModerate={canModerate} onRemove={handleRemoveParticipant} onToggleCoHost={handleToggleCoHost}
        waitingList={waitingList} onApprove={handleApproveWaiting} onReject={handleRejectWaiting}
      />
<Modal
  open={moreOpen}
  onClose={() => setMoreOpen(false)}
  title="Room options"
>
  <p className="qz-room__more-note">
    <Settings2 size={13} strokeWidth={2.3} />
    Personal audio/video preferences live in your account Settings page.
  </p>

  {room.description && (
    <p className="qz-room__more-desc">
      {room.description}
    </p>
  )}

  {room.ownerId === user.id && (
    <Button onClick={handleDeleteRoom}>
      Delete Room
    </Button>
  )}
</Modal>

</div>
);
}

function ScreenPreview({ stream }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className="qz-room__spotlight-video"
    />
  );
}