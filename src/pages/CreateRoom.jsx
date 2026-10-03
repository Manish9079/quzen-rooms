import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Globe2, Sparkles, ArrowRight } from 'lucide-react';
import { Field, TextInput, Select } from '../components/common/Field';
import Toggle from '../components/common/Toggle';
import Button from '../components/common/Button';
import { CATEGORIES } from '../data/categories';
import { useAuth } from '../context/useAuth.js';
import { useUser } from '../context/useUser.js';
import { roomService } from '../services/roomService';
import './CreateRoom.css';

export default function CreateRoom() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addRecentRoom } = useUser();

  const [roomName, setRoomName] = useState('');
  const [category, setCategory] = useState('CHILL');
  const [visibility, setVisibility] = useState('public');
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isPrivate = visibility === 'private';
  const hostName = user?.displayName || user?.username || (user?.email ? user.email.split('@')[0] : 'You');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!roomName.trim()) return setError('Give your room a name.');
    const trimmedPassword = password.trim();
    if (isPrivate && trimmedPassword.length < 4) {
      return setError('Private room passwords must be at least 4 characters.');
    }
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name: roomName.trim(),
        description: '',
        category,
        isPrivate,
        maxParticipants,
        chatEnabled,
        videoEnabled,
        screenShareEnabled,
      };

      if (isPrivate) payload.password = trimmedPassword;

      const { room } = await roomService.createRoom(payload);
      addRecentRoom({ name: room.name, code: room.code, createdAgo: room.createdAt });
      navigate(`/room/${room.code}`);
    } catch (err) {
      setError(err.message || 'Could not create the room. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="qz-create-room-page">
      <div className="qz-container qz-create-room__inner">
        <aside className="qz-create-room__intro">
          <span className="qz-create-room__eyebrow"><Sparkles size={13} /> New room</span>
          <h1 className="qz-create-room__title">
            <span>Your room.</span>
            <span>Your people.</span>
          </h1>
          <p className="qz-create-room__lead">Choose a name, set access and invite your friends.</p>

          <div className="qz-create-room__hosting">
            <span>Hosting as</span>
            <strong>{hostName}</strong>
          </div>

          <div className="qz-create-room__scene" aria-hidden="true">
            <div className="qz-scene__desk" />
            <div className="qz-scene__laptop">
              <div className="qz-scene__screen">
                <div className="qz-scene__avatar-grid">
                  <div className="qz-scene__avatar qz-scene__avatar--one" />
                  <div className="qz-scene__avatar qz-scene__avatar--two" />
                  <div className="qz-scene__avatar qz-scene__avatar--three" />
                  <div className="qz-scene__avatar qz-scene__avatar--four" />
                </div>
              </div>
              <div className="qz-scene__base" />
            </div>
            <div className="qz-scene__plant" />
            <div className="qz-scene__cup" />
            <div className="qz-scene__notebook" />
          </div>
        </aside>

        <form className="qz-create-room__card" onSubmit={handleSubmit}>
          <h2>Create a Room</h2>

          <div className="qz-create-room__field">
            <Field label="Room name" required id="roomName">
              <TextInput id="roomName" placeholder="e.g. Late Night Chai & Chill" value={roomName} onChange={(e) => setRoomName(e.target.value)} maxLength={60} />
            </Field>
          </div>

          <div className="qz-create-room__row">
            <div className="qz-create-room__field">
              <Field label="Category" id="category">
                <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="qz-create-room__field">
              <Field label="Max participants" id="maxParticipants">
                <Select id="maxParticipants" value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))}>
                  {[5, 10, 20, 30, 50, 100].map((n) => <option key={n} value={n}>{n} people</option>)}
                </Select>
              </Field>
            </div>
          </div>

          <div className="qz-create-room__field">
            <Field label="Who can join">
              <div className="qz-create-room__visibility">
                <button
                  type="button"
                  className={`qz-visibility-opt ${visibility === 'public' ? 'qz-visibility-opt--active' : ''}`}
                  onClick={() => setVisibility('public')}
                >
                  <span className="qz-visibility-opt__header"><Globe2 size={17} strokeWidth={2.1} /> Public</span>
                  <span className="qz-visibility-opt__meta">Listed in Explore</span>
                </button>
                <button
                  type="button"
                  className={`qz-visibility-opt ${visibility === 'private' ? 'qz-visibility-opt--active' : ''}`}
                  onClick={() => setVisibility('private')}
                >
                  <span className="qz-visibility-opt__header"><Lock size={17} strokeWidth={2.1} /> Private</span>
                  <span className="qz-visibility-opt__meta">Password protected</span>
                </button>
              </div>
            </Field>
          </div>

          {isPrivate && (
            <div className="qz-create-room__field">
              <Field label="Room password" required id="password" hint="Anyone joining by code will need this.">
                <TextInput id="password" type="password" placeholder="Choose a password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
            </div>
          )}

          <div className="qz-create-room__field">
            <Field label="Room features">
              <div className="qz-feature-toggles">
                <Toggle checked={chatEnabled} onChange={setChatEnabled} label="Text chat" description="Realtime side-panel messaging" />
                <Toggle checked={videoEnabled} onChange={setVideoEnabled} label="Voice & video" description="Camera and microphone in the room" />
                <Toggle checked={screenShareEnabled} onChange={setScreenShareEnabled} label="Screen share" description="Let participants share their screen" />
              </div>
            </Field>
          </div>

          {error && <p className="qz-form-error">{error}</p>}

          <div className="qz-create-room__submit">
            <Button type="submit" size="lg" full icon={ArrowRight} iconPosition="right" disabled={submitting}>
              {submitting ? 'Creating room…' : 'Create Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
