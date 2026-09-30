import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  ArrowRight,
  Lock,
} from 'lucide-react';

import { CATEGORIES } from '../data/categories';
import { roomService } from '../services/roomService';

import { TextInput } from '../components/common/Field';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import SEO from '../components/common/SEO';

import './ExploreRooms.css';

const AVATAR_HUES = [
  '#16A374',
  '#34A99B',
  '#3FBE8B',
  '#0E8862',
  '#2FBE8F',
  '#7DD6AC',
];

export default function ExploreRooms() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] =
    useState('ALL');

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setError('');

    const timer = setTimeout(() => {
      roomService
        .getPublicRooms({
          category: activeCategory,
          search: query || undefined,
        })
        .then(async ({ rooms: fetched }) => {
          const roomsWithCounts = await Promise.all(
            fetched.map(async (room) => {
              const { members } =
                await roomService.getRoomMembers(room.code);

              return {
                ...room,
                participantCount: members.length,
              };
            })
          );

          if (alive) {
            setRooms(roomsWithCounts);
          }
        })
        .catch((err) => {
          if (alive) {
            setError(
              err.message || 'Could not load rooms.'
            );
          }
        })
        .finally(() => {
          if (alive) {
            setLoading(false);
          }
        });
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [activeCategory, query]);

  const categoryLabel = useMemo(
    () => (id) =>
      CATEGORIES.find((category) => category.id === id)
        ?.label || id,
    []
  );

  return (
    <>
      <SEO
        title="Public Chat Rooms for Study & Hangouts | Qyzen Rooms"
        description="Browse public rooms on Qyzen Rooms for studying, gaming, music and hangouts. Find a room for your interests and sign in to join."
        canonical="https://qyzen.online/explore"
      />

      <div className="qz-explore">
        <div className="qz-container">
          <div className="qz-explore__head">
            <div>
              <span className="qz-eyebrow">
                Public rooms
              </span>

              <h1>Explore Public Rooms</h1>

              <p>
                Browse public rooms for study sessions, gaming, music and online hangouts.
                Find a room for your interests, then sign in to join the conversation.
              </p>
            </div>

            <TextInput
              icon={Search}
              placeholder="Search rooms…"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              className="qz-explore__search"
            />
          </div>

          <div className="qz-explore__categories">
            {CATEGORIES.map(
              ({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`qz-cat-pill ${
                    activeCategory === id
                      ? 'qz-cat-pill--active'
                      : ''
                  }`}
                  onClick={() =>
                    setActiveCategory(id)
                  }
                >
                  <Icon
                    size={15}
                    strokeWidth={2.2}
                  />

                  {label}
                </button>
              )
            )}
          </div>

          {loading ? (
            <div className="qz-room-grid">
              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="qz-room-card qz-room-card--skeleton qz-neu"
                  />
                )
              )}
            </div>
          ) : error ? (
            <div className="qz-explore__empty qz-neu">
              <h3>Couldn't load rooms</h3>
              <p>{error}</p>
            </div>
          ) : rooms.length === 0 && activeCategory === 'ALL' && !query.trim() ? (
            <div className="qz-explore__empty qz-neu">
              <h3>No public rooms are open right now.</h3>
              <p>You can create a room and invite your friends, or check back later.</p>

              <Button
                onClick={() => navigate('/create')}
                icon={ArrowRight}
                iconPosition="right"
              >
                Create a Room
              </Button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="qz-explore__empty qz-neu">
              <h3>No rooms match that yet</h3>

              <p>
                Try a different category or search
                term - or start your own room instead.
              </p>

              <Button
                onClick={() => navigate('/create')}
                icon={ArrowRight}
                iconPosition="right"
              >
                Create a Room
              </Button>
            </div>
          ) : (
            <div className="qz-room-grid">
              {rooms.map((room, index) => (
                <button
                  key={room.id}
                  type="button"
                  className="qz-room-card qz-neu"
                  onClick={() =>
                    navigate(`/room/${room.code}`)
                  }
                >
                  <div className="qz-room-card__top">
                    <Badge tone="live">
                      ● Live
                    </Badge>

                    <Badge tone="gray">
                      {categoryLabel(room.category)}
                    </Badge>

                    {room.isLocked && (
                      <Badge
                        tone="danger"
                        icon={Lock}
                      >
                        Locked
                      </Badge>
                    )}
                  </div>

                  <h3>{room.name}</h3>

                  {room.description && (
                    <p className="qz-room-card__desc">
                      {room.description}
                    </p>
                  )}

                  <div className="qz-room-card__host">
                    <Avatar
                      name={
                        room.hostDisplayName ||
                        'Host'
                      }
                      color={
                        AVATAR_HUES[
                          index %
                            AVATAR_HUES.length
                        ]
                      }
                      size={26}
                    />

                    <span>
                      Hosted by{' '}
                      {room.hostDisplayName ||
                        'Host'}
                    </span>
                  </div>

                  <div className="qz-room-card__footer">
                    <span>
                      <Users
                        size={15}
                        strokeWidth={2.1}
                      />

                      {room.participantCount || 0}
                      {room.maxParticipants
                        ? ` / ${room.maxParticipants}`
                        : ''}
                    </span>

                    <span className="qz-room-card__join">
                      Join room
                      <ArrowRight
                        size={15}
                        strokeWidth={2.1}
                      />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="qz-section">
          <div className="qz-container">
            <div className="qz-section__head">
              <h2>How to Find and Join a Public Room</h2>
            </div>

            <p>
              Choose a category to narrow the list, select an available room,
              and sign in to join the conversation.
            </p>

            <div className="qz-section__head">
              <h2>Explore Rooms for Your Interests</h2>
            </div>

            <div className="qz-feature-grid">
              <div className="qz-feature-card qz-neu">
                <h3>Study</h3>
                <p>Focus on coursework, review material, and work alongside others.</p>
              </div>

              <div className="qz-feature-card qz-neu">
                <h3>Gaming</h3>
                <p>Talk through games, plan a team session, or share gaming interests.</p>
              </div>

              <div className="qz-feature-card qz-neu">
                <h3>Music</h3>
                <p>Discuss artists, share recommendations, and talk about music.</p>
              </div>

              <div className="qz-feature-card qz-neu">
                <h3>Coding</h3>
                <p>Exchange ideas, collaborate on projects, and work through problems.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
