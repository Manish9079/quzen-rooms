import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, ArrowRight, Clock, Lock, Camera, CameraOff, Mic, MicOff, Play } from 'lucide-react';
import { Field, TextInput } from '../components/common/Field';
import Button from '../components/common/Button';
import Orb from '../components/common/Orb';
import { useUser } from '../context/UserContext';
import { roomService } from '../services/roomService';
import { isValidRoomCode, normalizeRoomCode } from '../utils/roomCode';
import './FormPage.css';
import './JoinRoom.css';
import { useAuth } from '../context/AuthContext';

export default function JoinRoom() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { recentRooms, addRecentRoom } = useUser();
  const { user } = useAuth();

  const [code, setCode] = useState(params.get('code') || '');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewStream, setPreviewStream] = useState(null);
  const [previewCameraOn, setPreviewCameraOn] = useState(false);
  const [previewMicOn, setPreviewMicOn] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const previewVideoRef = useRef(null);

  useEffect(() => {
    if (previewVideoRef.current) previewVideoRef.current.srcObject = previewStream;
    return () => previewStream?.getTracks().forEach((track) => track.stop());
  }, [previewStream]);

  async function startPreview() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPreviewStream(stream);
      setPreviewCameraOn(true);
      setPreviewMicOn(true);
      setPreviewError('');
    } catch {
      setPreviewError('Camera or microphone permission is unavailable. You can still join without a preview.');
    }
  }

  function togglePreviewTrack(kind, enabled, setEnabled) {
    previewStream?.getTracks()
      .filter((track) => track.kind === kind)
      .forEach((track) => { track.enabled = !enabled; });
    setEnabled(!enabled);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError("That doesn't look like a Qyzen room code (e.g. QZN-A7K92).");
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const result = await roomService.joinRoom(normalized, user, needsPassword ? password : undefined);
      const { room, waiting } = result;

      if (waiting) {
        navigate(`/room/${room.code}`, { replace: true, state: { waiting: true } });
        return;
      }

      addRecentRoom({ name: room.name, code: room.code, createdAgo: room.createdAt });
      navigate(`/room/${room.code}`);
    } catch (err) {
      if (err.status === 401 && err.message.toLowerCase().includes('password')) {
        setNeedsPassword(true);
        setError('This room needs a password.');
      } else {
        setError(err.message || 'Could not join that room.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="qz-form-page">
      <div className="qz-container qz-form-page__inner">
        <div className="qz-form-page__intro">
          <span className="qz-eyebrow"><KeyRound size={13} /> Join a room</span>
          <h1>Join by link or code.</h1>
          <p>Paste a room link or enter the code someone shared with you - codes look like QZN-A7K92.</p>
          <Orb size={140} className="qz-form-page__orb" />
        </div>

        <div>
          <form className="qz-form-card qz-neu" onSubmit={handleSubmit}>
            <div className="qz-join-preview">
              <div className="qz-join-preview__head">
                <div>
                  <span className="qz-join-preview__eyebrow">Before you join</span>
                  <h2>Check your setup</h2>
                </div>
                <span className="qz-join-preview__name">{user?.displayName || 'Your name'}</span>
              </div>
              <div className={`qz-join-preview__stage ${previewStream ? '' : 'qz-join-preview__stage--empty'}`}>
                {previewStream ? (
                  <video ref={previewVideoRef} autoPlay muted playsInline />
                ) : (
                  <div className="qz-join-preview__empty">
                    <Camera size={20} />
                    <span>Preview your camera, mic, and name</span>
                  </div>
                )}
              </div>
              <div className="qz-join-preview__controls">
                {!previewStream ? (
                  <Button type="button" size="sm" icon={Play} onClick={startPreview}>Start preview</Button>
                ) : (
                  <>
                    <button type="button" className={`qz-preview-toggle ${previewCameraOn ? '' : 'qz-preview-toggle--off'}`} onClick={() => togglePreviewTrack('video', previewCameraOn, setPreviewCameraOn)}>
                      {previewCameraOn ? <Camera size={15} /> : <CameraOff size={15} />} Camera
                    </button>
                    <button type="button" className={`qz-preview-toggle ${previewMicOn ? '' : 'qz-preview-toggle--off'}`} onClick={() => togglePreviewTrack('audio', previewMicOn, setPreviewMicOn)}>
                      {previewMicOn ? <Mic size={15} /> : <MicOff size={15} />} Mic
                    </button>
                  </>
                )}
              </div>
              {previewError && <p className="qz-join-preview__error">{previewError}</p>}
            </div>

            <Field label="Room code" required id="code" hint="Not case-sensitive.">
              <TextInput id="code" icon={KeyRound} placeholder="QZN-A7K92" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="qz-code-input" maxLength={12} />
            </Field>
            {needsPassword && (
              <Field label="Room password" required id="password">
                <TextInput id="password" icon={Lock} type="password" placeholder="Enter the room password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
            )}
            {error && <p className="qz-form-error">{error}</p>}
            <Button type="submit" size="lg" full icon={ArrowRight} iconPosition="right" disabled={submitting}>
              {submitting ? 'Joining…' : 'Join Room'}
            </Button>
          </form>

          {recentRooms.length > 0 && (
            <div className="qz-recent-rooms qz-neu">
              <h3><Clock size={15} strokeWidth={2.2} /> Recent rooms</h3>
              <ul>
                {recentRooms.slice(0, 4).map((r) => (
                  <li key={r.code}>
                    <button type="button" onClick={() => setCode(r.code)} className="qz-recent-room-btn">
                      <span className="qz-recent-room-btn__name">{r.name}</span>
                      <span className="qz-recent-room-btn__code">{r.code}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
