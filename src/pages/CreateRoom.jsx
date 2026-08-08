import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Globe2, Sparkles, ArrowRight } from 'lucide-react';
import { Field, TextInput, Select } from '../components/common/Field';
import Toggle from '../components/common/Toggle';
import Button from '../components/common/Button';
import Orb from '../components/common/Orb';
import { CATEGORIES } from '../data/categories';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { roomService } from '../services/roomService';
import './FormPage.css';

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!roomName.trim()) return setError('Give your room a name.');
    if (isPrivate && !password.trim()) return setError('Private rooms need a password.');
    setError('');
    setSubmitting(true);

    try {
const { room } = await roomService.createRoom(
  {
    name: roomName.trim(),
    category,
    isPrivate,
    maxParticipants,
    hostDisplayName: user.displayName,
  },
  user.id
);
      addRecentRoom({ name: room.name, code: room.code, createdAgo: room.createdAt });
      navigate(`/room/${room.code}`);
    } catch (err) {
      setError(err.message || 'Could not create the room. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="qz-form-page">
      <div className="qz-container qz-form-page__inner">
        <div className="qz-form-page__intro">
          <span className="qz-eyebrow"><Sparkles size={13} /> New room</span>
          <h1>Set the room up your way</h1>
          <p>Pick a name, decide who can walk in, and choose what's switched on. You can always change it later.</p>

          <div className="qz-code-preview qz-neu">
            <span className="qz-code-preview__label">Hosting as</span>
            <span className="qz-code-preview__code">{user.displayName}</span>
          </div>

          <Orb size={140} className="qz-form-page__orb" />
        </div>

        <form className="qz-form-card qz-neu" onSubmit={handleSubmit}>
          <Field label="Room name" required id="roomName">
            <TextInput id="roomName" placeholder="e.g. Late Night Chai & Chill" value={roomName} onChange={(e) => setRoomName(e.target.value)} maxLength={60} />
          </Field>

          <div className="qz-form-row">
            <Field label="Category" id="category">
              <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Max participants" id="maxParticipants">
              <Select id="maxParticipants" value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))}>
                {[5, 10, 20, 30, 50, 100].map((n) => <option key={n} value={n}>{n} people</option>)}
              </Select>
            </Field>
          </div>

          <Field label="Who can join">
            <div className="qz-visibility-toggle">
              <button type="button" className={`qz-visibility-opt ${visibility === 'public' ? 'qz-visibility-opt--active' : ''}`} onClick={() => setVisibility('public')}>
                <Globe2 size={17} strokeWidth={2.1} /> Public <span>Listed in Explore</span>
              </button>
              <button type="button" className={`qz-visibility-opt ${visibility === 'private' ? 'qz-visibility-opt--active' : ''}`} onClick={() => setVisibility('private')}>
                <Lock size={17} strokeWidth={2.1} /> Private <span>Invite-only</span>
              </button>
            </div>
          </Field>

          {isPrivate && (
            <Field label="Room password" required id="password" hint="Anyone joining by code will need this.">
              <TextInput id="password" type="password" placeholder="Choose a password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          )}

          <Field label="Room features">
            <div className="qz-feature-toggles">
              <Toggle checked={chatEnabled} onChange={setChatEnabled} label="Text chat" description="Realtime side-panel messaging" />
              <Toggle checked={videoEnabled} onChange={setVideoEnabled} label="Voice & video" description="Camera and microphone in the room" />
              <Toggle checked={screenShareEnabled} onChange={setScreenShareEnabled} label="Screen share" description="Let participants share their screen" />
            </div>
          </Field>

          {error && <p className="qz-form-error">{error}</p>}

          <Button type="submit" size="lg" full icon={ArrowRight} iconPosition="right" disabled={submitting}>
            {submitting ? 'Creating room…' : 'Create Room'}
          </Button>
        </form>
      </div>
    </div>
  );
}
