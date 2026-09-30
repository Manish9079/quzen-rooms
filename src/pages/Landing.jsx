import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  MessageSquare,
  Mic,
  Video,
  ScreenShare,
  Link2,
  ShieldCheck,
} from 'lucide-react';

import Button from '../components/common/Button';
import Orb from '../components/common/Orb';
import SEO from '../components/common/SEO';
import { roomService } from '../services/roomService';

import './Landing.css';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Live Text Chat',
    desc: 'Send messages and share links with people in your room while you talk or join a video call.',
  },
  {
    icon: Mic,
    title: 'Group Voice Calls',
    desc: 'Talk with friends in your room using voice chat.',
  },
  {
    icon: Video,
    title: 'Group Video Calls',
    desc: 'Connect face to face with friends for online hangouts, study sessions and group conversations.',
  },
  {
    icon: ScreenShare,
    title: 'Screen Sharing',
    desc: 'Share your screen to explain an idea, review study material or show friends what you are working on.',
  },
  {
    icon: Link2,
    title: 'Room Links and Codes',
    desc: 'Invite friends by sharing your room link or code. They can use it to find and join your room.',
  },
  {
    icon: ShieldCheck,
    title: 'Public and Private Rooms',
    desc: 'Choose a public room or use a password-protected room for your group.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Create Your Room',
    desc: 'Give your room a name, choose its access settings and set the participant limit.',
  },
  {
    n: '02',
    title: 'Share Your Room Link or Code',
    desc: 'Send the room link or code to your friends so they can join.',
  },
  {
    n: '03',
    title: 'Chat, Call and Share Your Screen',
    desc: 'Use your room for group conversations, video calls, screen sharing or studying together.',
  },
];

export default function Landing() {
  const [roomActivity, setRoomActivity] = useState({ status: 'loading', count: 0, name: '' });

  useEffect(() => {
    let active = true;

    roomService.getPublicRooms({ page: 1, limit: 1 })
      .then((result) => {
        if (!active) return;
        setRoomActivity({
          status: 'ready',
          count: result.pagination?.total || 0,
          name: result.rooms?.[0]?.name || '',
        });
      })
      .catch(() => {
        if (active) setRoomActivity({ status: 'empty', count: 0, name: '' });
      });

    return () => {
      active = false;
    };
  }, []);

  const activityLabel = roomActivity.status === 'loading'
    ? 'Checking public rooms'
    : roomActivity.count > 0
      ? `${roomActivity.count} public room${roomActivity.count === 1 ? '' : 's'} open`
      : 'No public rooms open yet';

  const activityRoom = roomActivity.name || 'Public room activity';
  const activityCount = roomActivity.status === 'ready' ? roomActivity.count : '—';

  return (
    <>
      <SEO
        title="Video Chat with Friends & Screen Sharing | Qyzen Rooms"
        description="Create a room on Qyzen Rooms for group video calls, live chat and screen sharing. Invite friends to study together or hang out online."
        canonical="https://qyzen.online/"
      />

      <div className="qz-landing">
        <section className="qz-hero">
          <div className="qz-container qz-hero__inner">
            <div className="qz-hero__copy">
              <span className="qz-eyebrow">
                <span className="qz-eyebrow__dot" />
                qyzen.online
              </span>

              <h1 className="qz-hero__title">
                Video Chat with Friends.
                <br />
                <span className="qz-hero__title-accent">
                  Share Your Screen.
                </span>
              </h1>

              <p className="qz-hero__sub">
                Create a room, invite your friends, and enjoy group video calls,
                live chat, and screen sharing. Study together or hang out in one place.
              </p>

              <div className="qz-hero__cta">
                <Button
                  as={Link}
                  to="/create"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Create a Room
                </Button>

                <Button
                  as={Link}
                  to="/join"
                  size="lg"
                  variant="primary"
                  icon={Compass}
                >
                  Join by Link / Code
                </Button>
              </div>

              <div className="qz-hero__meta">
                <div className="qz-hero__avatars">
                  {[
                    '#16A374',
                    '#34A99B',
                    '#3FBE8B',
                    '#0E8862',
                  ].map((color) => (
                    <span
                      key={color}
                      style={{ background: color }}
                    />
                  ))}
                </div>

                <span>
                  Rooms are open across Study, Gaming, Music, and more.
                </span>
              </div>
            </div>

            <div className="qz-hero__signal" aria-label="Live room activity">
              <div className="qz-hero__signal-orbit qz-hero__signal-orbit--one" />
              <div className="qz-hero__signal-orbit qz-hero__signal-orbit--two" />
              <div className="qz-hero__signal-core">
                <span className="qz-hero__signal-live"><i /> Live data</span>
                <strong>{activityCount}</strong>
                <span>public rooms</span>
              </div>
              <div className="qz-hero__signal-card qz-hero__signal-card--top">
                <span className="qz-hero__signal-avatar">+</span>
                <span>{activityRoom}</span>
              </div>
              <div className="qz-hero__signal-card qz-hero__signal-card--bottom">
                <span className="qz-hero__signal-bars"><i /><i /><i /><i /></span>
                <span>{activityLabel}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="qz-section">
          <div className="qz-container">
            <div className="qz-section__head">
              <span className="qz-eyebrow">
                What's inside
              </span>

              <h2>
                Video Calls, Live Chat and Screen Sharing in One Room
              </h2>
            </div>

            <div className="qz-feature-grid">
              {FEATURES.map(
                ({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="qz-feature-card qz-neu"
                  >
                    <div className="qz-feature-card__icon">
                      <Icon
                        size={20}
                        strokeWidth={2.1}
                      />
                    </div>

                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section className="qz-section qz-section--steps">
          <div className="qz-container">
            <div className="qz-section__head">
              <span className="qz-eyebrow">
                How it works
              </span>

              <h2>How to Create a Room and Invite Friends</h2>
            </div>

            <div className="qz-steps">
              {STEPS.map(({ n, title, desc }) => (
                <div key={n} className="qz-step">
                  <span className="qz-step__n">
                    {n}
                  </span>

                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="qz-section">
          <div className="qz-container">
            <div className="qz-section__head">
              <h2>Frequently Asked Questions</h2>
            </div>

            <div className="qz-feature-grid">
              <div className="qz-feature-card qz-neu">
                <h3>What is Qyzen Rooms?</h3>
                <p>
                  Qyzen Rooms lets you create and join online rooms for text chat,
                  voice calls, video calls and screen sharing with your group.
                </p>
              </div>

              <div className="qz-feature-card qz-neu">
                <h3>Do I need an account to create or join a room?</h3>
                <p>
                  Yes. You need to sign in before creating or joining a room.
                </p>
              </div>

              <div className="qz-feature-card qz-neu">
                <h3>How do I invite friends to my room?</h3>
                <p>
                  Share your room link or code. Friends need to sign in and use
                  the join page to enter your room.
                </p>
              </div>

              <div className="qz-feature-card qz-neu">
                <h3>Can I create a private room?</h3>
                <p>
                  Yes. You can create a password-protected private room. People
                  joining need the room code or link and the correct password.
                </p>
              </div>

              <div className="qz-feature-card qz-neu">
                <h3>Can I share my screen?</h3>
                <p>
                  Screen sharing is available when your browser supports it.
                  You must grant permission when prompted. Availability can
                  vary by browser and device.
                </p>
              </div>

              <div className="qz-feature-card qz-neu">
                <h3>Can I use Qyzen Rooms to study with friends?</h3>
                <p>
                  Yes. Create a room, invite your study group, and use chat,
                  calls and supported screen sharing to discuss study material.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="qz-section">
          <div className="qz-container">
            <div className="qz-cta-band qz-glass">
              <Orb
                size={70}
                className="qz-cta-band__orb"
              />

              <div>
                <h2>
                  Start a Video Chat with Friends
                </h2>

                <p>
                  Create a room and share the link with your group to start chatting, calling and spending time together online.
                </p>
              </div>

              <Button
                as={Link}
                to="/create"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
              >
                Create a Room
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
