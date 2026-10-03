import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MessageSquare,
  Mic,
  MoreHorizontal,
  PhoneOff,
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
                Video Chat
                <br />
                with Friends.
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
                  variant="secondary"
                  icon={Link2}
                >
                  Join by Link / Code
                </Button>
              </div>
            </div>

            <div className="qz-hero__collage" aria-label="Friends studying together with video chat and screen sharing previews">
              <span className="qz-collage__strokes qz-collage__strokes--top" aria-hidden="true" />
              <span className="qz-collage__strokes qz-collage__strokes--side" aria-hidden="true" />

              <figure className="qz-collage__main">
                <img
                  src="/images/home-study.webp"
                  alt="Friends gathered around laptops and studying together"
                  width="1200"
                  height="900"
                  fetchPriority="high"
                />
              </figure>

              <div className="qz-collage__call" aria-label="Illustrative video-call preview">
                <img
                  src="/images/home-call.webp"
                  alt="A small group collaborating around a laptop"
                  width="800"
                  height="600"
                />
                <div className="qz-call__toolbar" aria-hidden="true">
                  <span><Mic size={15} /></span>
                  <span><Video size={16} /></span>
                  <span><ScreenShare size={15} /></span>
                  <span className="qz-call__more"><MoreHorizontal size={17} /></span>
                  <span className="qz-call__hangup"><PhoneOff size={15} /></span>
                </div>
              </div>

              <div className="qz-collage__share" aria-label="Illustrative screen-sharing preview">
                <div className="qz-share__chrome" aria-hidden="true">
                  <i /><i /><i />
                  <span>Screen sharing</span>
                </div>
                <img
                  src="/images/home-sharing.webp"
                  alt="Friends reviewing study material together in a library"
                  width="800"
                  height="600"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="qz-feature-strip" aria-label="Room features">
          <div className="qz-container qz-feature-strip__inner">
            <div className="qz-feature-strip__item">
              <span className="qz-feature-strip__icon"><Video size={23} strokeWidth={2.2} /></span>
              <span><strong>Group Video Calls</strong><small>Hang out, study together, or talk about anything.</small></span>
            </div>
            <div className="qz-feature-strip__item">
              <span className="qz-feature-strip__icon"><ScreenShare size={23} strokeWidth={2.2} /></span>
              <span><strong>Screen Sharing</strong><small>Share your screen to collaborate, present, or watch together.</small></span>
            </div>
            <div className="qz-feature-strip__item">
              <span className="qz-feature-strip__icon"><MessageSquare size={23} strokeWidth={2.2} /></span>
              <span><strong>Live Chat</strong><small>Keep the conversation going with built-in chat.</small></span>
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
