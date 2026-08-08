import { useEffect, useState } from 'react';
import { User, Clock, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Field, TextInput, TextArea } from '../components/common/Field';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { authService } from '../services/authService';
import { roomService } from '../services/roomService';
import { useToast } from '../components/common/Toast';
import { timeAgo } from '../utils/format';
import './Profile.css';


export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { recentRooms } = useUser();
  const showToast = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [myRooms, setMyRooms] = useState([]);
const [loadingRooms, setLoadingRooms] = useState(true);

useEffect(() => {
  let alive = true;

  roomService.getMyRooms(user.id)
    .then(({ rooms }) => {
      if (alive) setMyRooms(rooms);
    })
    .catch((err) => {
      console.error('Could not load my rooms:', err);
    })
    .finally(() => {
      if (alive) setLoadingRooms(false);
    });

  return () => {
    alive = false;
  };
}, [user.id]);
  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim() || user.displayName, bio: bio.trim() || null });
      showToast('Profile updated');
    } catch (err) {
      showToast(err.message || 'Could not update your profile.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword.length < 8) return setPasswordError('New password must be at least 8 characters.');
    setPasswordError('');
    setChangingPassword(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      showToast('Password changed');
      setCurrentPassword(''); setNewPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Could not change your password.');
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="qz-profile">
      <div className="qz-container qz-profile__inner">
        <div className="qz-profile__card qz-neu">
          <div className="qz-profile__head">
            <Avatar name={user.displayName} color="#16A374" size={84} />
            <div>
              <span className="qz-eyebrow"><User size={13} /> @{user.username}</span>
              <h1>{user.displayName}</h1>
              <p>{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="qz-profile__form">
            <Field label="Display name" id="name" hint="Shown to others in every room you join.">
              <TextInput id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={48} />
            </Field>
            <Field label="Bio" id="bio">
              <TextArea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} placeholder="Tell people a bit about yourself…" />
            </Field>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </form>

          <form onSubmit={handleChangePassword} className="qz-profile__form qz-profile__password-form">
            <h2><Lock size={16} strokeWidth={2.2} /> Change password</h2>
            <Field label="Current password" id="currentPassword">
              <TextInput id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="New password" id="newPassword" hint="At least 8 characters.">
              <TextInput id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            </Field>
            {passwordError && <p className="qz-form-error">{passwordError}</p>}
            <Button type="submit" variant="secondary" disabled={changingPassword}>
              {changingPassword ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </div>
<div className="qz-profile__card qz-neu">
  <h2>My Rooms</h2>

  {loadingRooms ? (
    <p className="qz-profile__empty">Loading your rooms...</p>
  ) : myRooms.length === 0 ? (
    <p className="qz-profile__empty">
      You haven't created any rooms yet.
    </p>
  ) : (
    <ul className="qz-profile__rooms">
      {myRooms.map((room) => (
        <li key={room.id}>
          <div>
            <span className="qz-profile__room-name">
              {room.name}
              {room.isPrivate ? ' 🔒' : ' 🌐'}
            </span>

            <span className="qz-profile__room-meta">
              {room.code} · {room.isPrivate ? 'Private' : 'Public'}
            </span>
          </div>

          <Button
            size="sm"
            variant="secondary"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => navigate(`/room/${room.code}`)}
          >
            Rejoin
          </Button>
          <Button
  size="sm"
  variant="secondary"
  onClick={() => {
    navigator.clipboard
      ?.writeText(room.code)
      .then(() => showToast('Room code copied'))
      .catch(() => {});
  }}
>
  Copy Code
</Button>
          <Button
  size="sm"
  variant="secondary"
  onClick={async () => {
    const ok = window.confirm(`Delete "${room.name}"?`);

    if (!ok) return;

    try {
      await roomService.deleteRoom(room.id);

      setMyRooms((prev) =>
        prev.filter((r) => r.id !== room.id)
      );

      showToast('Room deleted successfully.');
    } catch (err) {
      showToast(
        err.message || 'Could not delete room.',
        'error'
      );
    }
  }}
>
  Delete
</Button>
        </li>
      ))}
    </ul>
  )}
</div>
        <div className="qz-profile__card qz-neu">
          <h2><Clock size={17} strokeWidth={2.2} /> Recent rooms</h2>
          {recentRooms.length === 0 ? (
            <p className="qz-profile__empty">Rooms you create or join will show up here.</p>
          ) : (
            <ul className="qz-profile__rooms">
              {recentRooms.map((r) => (
                <li key={r.code}>
                  <div>
                    <span className="qz-profile__room-name">{r.name}</span>
                    <span className="qz-profile__room-meta">{r.code} · {timeAgo(r.createdAgo)}</span>
                  </div>
                  <Button size="sm" variant="secondary" icon={ArrowRight} iconPosition="right" onClick={() => navigate(`/room/${r.code}`)}>
                    Rejoin
                  </Button>
                  
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
