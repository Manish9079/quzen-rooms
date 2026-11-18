import { ArrowRight, Compass, House, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';
import './CompanyPages.css';

export default function AboutUs() {
  return (
    <div className="qz-company-page">
      <SEO
        title="About Us | Qyzen"
        description="Learn about Qyzen's goal of making room discovery easier, and what the Qyzen website supports today."
        canonical="https://qyzen.online/about"
      />

      <div className="qz-container">
        <header className="qz-company-page__hero">
          <span className="qz-eyebrow"><Compass size={15} aria-hidden="true" /> About Qyzen</span>
          <h1>Making room discovery easier is our goal.</h1>
          <p>
            Qyzen is intended to help people discover real room and accommodation
            options and connect with hosts. That accommodation experience is a
            future goal and is not currently available on this website.
          </p>
        </header>

        <section className="qz-company-page__section" aria-labelledby="qz-about-purpose">
          <div className="qz-company-page__section-heading">
            <span className="qz-eyebrow">Our purpose</span>
            <h2 id="qz-about-purpose">A clearer path between people and rooms</h2>
          </div>
          <p>
            We want to make it easier for people looking for accommodation to
            find room options and connect with the people offering them. Our
            mission is to make room discovery feel more straightforward and
            useful for both room seekers and hosts.
          </p>
          <p>
            Physical accommodation listings, host listing tools, booking, and
            payments are not currently offered on Qyzen. We will describe those
            capabilities here only when they are available.
          </p>
        </section>

        <section className="qz-company-page__section" aria-labelledby="qz-about-how">
        <div className="qz-company-page__section-heading">
          <span className="qz-eyebrow">Our intended approach</span>
          <h2 id="qz-about-how">How we aim to make discovery work</h2>
        </div>
        <p>
          When the accommodation experience is available, our intended
          approach is to help people discover room options, review information
          shared by hosts, and connect with a host. This flow is not live yet;
          there are no accommodation listings or booking tools on the site
          today.
        </p>
        </section>

        <section className="qz-company-page__cards" aria-label="Who Qyzen aims to help">
          <article className="qz-company-card qz-neu">
            <div className="qz-company-card__icon" aria-hidden="true"><Compass size={22} /></div>
            <h2>For people looking for a room</h2>
            <p>
              Our aim is to make it easier to discover accommodation options
              and connect with hosts. This discovery service is still a future
              goal, not a feature you can use on the site today.
            </p>
          </article>

          <article className="qz-company-card qz-neu">
            <div className="qz-company-card__icon" aria-hidden="true"><House size={22} /></div>
            <h2>For room owners and hosts</h2>
            <p>
              We hope to offer hosts a simpler way to share room information
              with people searching for accommodation. Host listing tools are
              not currently available.
            </p>
          </article>
        </section>

        <section className="qz-company-page__current" aria-labelledby="qz-about-today">
          <div className="qz-company-page__current-icon" aria-hidden="true"><Users size={22} /></div>
          <div>
            <span className="qz-eyebrow">What is available today</span>
            <h2 id="qz-about-today">Online rooms for conversations and calls</h2>
            <p>
              The current Qyzen website lets signed-in users discover and join
              public virtual rooms, or create public and password-protected
              rooms for text chat, voice, video, and screen sharing.
            </p>
            <div className="qz-company-page__actions">
              <Link className="qz-company-link" to="/explore">
                Explore current rooms <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="qz-company-link" to="/contact">
                Contact Us <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
