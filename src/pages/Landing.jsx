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

import './Landing.css';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Text chat',
    desc: 'A realtime side panel for every room - quips, links and reactions without leaving the call.',
  },
  {
    icon: Mic,
    title: 'Voice call',
    desc: 'Talk over crystal-clear audio the moment someone joins, with live speaking indicators.',
  },
  {
    icon: Video,
    title: 'Video call',
    desc: 'A responsive grid that reflows from one face to fifty, on any screen.',
  },
  {
    icon: ScreenShare,
    title: 'Screen share',
    desc: 'Hand the floor to anyone in one tap - coding, gaming or watching together.',
  },
  {
    icon: Link2,
    title: 'Invite links',
    desc: 'Share a room code or link. Whoever has it, walks straight in.',
  },
  {
    icon: ShieldCheck,
    title: 'Public or private',
    desc: 'Open the door to everyone, or lock it with a password just for your circle.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Create your room',
    desc: 'Name it, pick who can enter, set a max headcount. Takes fifteen seconds.',
  },
  {
    n: '02',
    title: 'Share the code',
    desc: 'Send your QZN- room code or a direct link - friends tap in from anywhere.',
  },
  {
    n: '03',
    title: 'Hang out, live',
    desc: 'Chat, talk, show your screen. The room stays open as long as you do.',
  },
];

export default function Landing() {
  return (
    <>
      <SEO
        title="Qyzen Rooms | Create, Join & Chat in Virtual Rooms"
        description="Create or join virtual rooms on Qyzen Rooms. Chat with friends, make video calls, share your screen, study, game and hang out online."
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
                Your Space.
                <br />
                Your People.
                <br />
                <span className="qz-hero__title-accent">
                  Your Room.
                </span>
              </h1>

              <p className="qz-hero__sub">
                Qyzen Rooms is a virtual hangout for the people you
                actually want to be around - drop into a room, talk,
                chat, share your screen, and stay as long as it feels
                good.
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
                  to="/explore"
                  size="lg"
                  variant="secondary"
                  icon={Compass}
                >
                  Explore Rooms
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
                  Rooms are open right now across Study, Gaming,
                  Music & more
                </span>
              </div>
            </div>

           <div className="qz-hero__visual">
  <div className="qz-hero-orb-wrap">
    <div className="qz-hero-orb-ring qz-hero-orb-ring--outer" />
    <div className="qz-hero-orb-ring qz-hero-orb-ring--inner" />

    <div className="qz-hero-orb">
      <Orb />
    </div>

    <div className="qz-hero-orb__actions">
  <Button
    as={Link}
    to="/join"
    variant="secondary"
  >
    Join Room
  </Button>

  <Button
    as={Link}
    to="/create"
    variant="primary"
  >
    Create Room
  </Button>
</div>
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
                Everything a hangout needs, in one room
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

              <h2>Open a room in three steps</h2>
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
            <div className="qz-cta-band qz-glass">
              <Orb
                size={70}
                className="qz-cta-band__orb"
              />

              <div>
                <h2>
                  Your people are one code away.
                </h2>

                <p>
                  Spin up a room and drop the link in the
                  group chat - that's the whole invite.
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
