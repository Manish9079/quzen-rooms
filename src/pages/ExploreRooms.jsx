import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ArrowRight, Lock } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { roomService } from '../services/roomService';
import { TextInput } from '../components/common/Field';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import './ExploreRooms.css';

const AVATAR_HUES = ['#16A374', '#34A99B', '#3FBE8B', '#0E8862', '#2FBE8F', '#7DD6AC'];

export default function ExploreRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const timer = setTimeout(() => {
      roomService.getPublicRooms({ category: activeCategory, search: query || undefined })
        .then(({ rooms: fetched }) => { if (alive) setRooms(fetched); })
        .catch((err) => { if (alive) setError(err.message || 'Could not load rooms.'); })
        .finally(() => { if (alive) setLoading(false); });
    }, 250); // debounce search-as-you-type
    return () => { alive = false; clearTimeout(timer); };
  }, [activeCategory, query]);

  const categoryLabel = useMemo(
    () => (id) => CATEGORIES.find((c) => c.id === id)?.label || id,
    [],
  );

  return (
    <div className="qz-explore">
      <div className="qz-container">
        <div className="qz-explore__head">
          <div>
            <span className="qz-eyebrow">Public rooms</span>
            <h1>Find a room that's already buzzing</h1>
          </div>
          <TextInput icon={Search} placeholder="Search rooms…" value={query} onChange={(e) => setQuery(e.target.value)} className="qz-explore__search" />
        </div>

        <div className="qz-explore__categories">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`qz-cat-pill ${activeCategory === id ? 'qz-cat-pill--active' : ''}`} onClick={() => setActiveCategory(id)}>
              <Icon size={15} strokeWidth={2.2} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="qz-room-grid">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="qz-room-card qz-room-card--skeleton qz-neu" />)}
          </div>
        ) : error ? (
          <div className="qz-explore__empty qz-neu">
            <h3>Couldn't load rooms</h3>
            <p>{error}</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="qz-explore__empty qz-neu">
            <h3>No rooms match that yet</h3>
            <p>Try a different category or search term — or start your own room instead.</p>
            <Button onClick={() => navigate('/create')} icon={ArrowRight} iconPosition="right">Create a Room</Button>
          </div>
        ) : (
          <div className="qz-room-grid">
            {rooms.map((r, idx) => (
              <button key={r.id} className="qz-room-card qz-neu" onClick={() => navigate(`/room/${r.code}`)}>
                <div className="qz-room-card__top">
                  <Badge tone="live">● Live</Badge>
                  <Badge tone="gray">{categoryLabel(r.category)}</Badge>
                  {r.isLocked && <Badge tone="danger" icon={Lock}>Locked</Badge>}
                </div>
                <h3>{r.name}</h3>
                {r.description && <p className="qz-room-card__desc">{r.description}</p>}
                <div className="qz-room-card__host">
                  <Avatar name={r.host.displayName} color={AVATAR_HUES[idx % AVATAR_HUES.length]} size={26} />
                  <span>Hosted by {r.host.displayName}</span>
                </div>
                <div className="qz-room-card__foot">
                  <span><Users size={14} strokeWidth={2.2} /> {r.participantCount}/{r.maxParticipants}</span>
                  <span className="qz-room-card__code">{r.code}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
