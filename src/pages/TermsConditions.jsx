import SEO from '../components/common/SEO';
import './LegalPages.css';

export default function TermsConditions() {
  return (
    <div className="qz-legal-page">
      <SEO
        title="Terms & Conditions | Qyzen Rooms"
        description="Read the terms for creating accounts, rooms, and communicating on Qyzen Rooms."
        canonical="https://qyzen.online/terms"
      />
      <article className="qz-container qz-legal-page__content">
        <header className="qz-legal-page__header">
          <span className="qz-eyebrow">Qyzen Rooms</span>
          <h1>Terms &amp; Conditions</h1>
          <p>Last updated: November 17, 2026</p>
        </header>

        <p>
          These terms apply when you access or use Qyzen Rooms, including its
          accounts, rooms, messaging, and social features. By using the service,
          you agree to follow these terms and the rules below.
        </p>

        <section>
          <h2>1. The service</h2>
          <p>
            Qyzen Rooms lets account holders create and join public or
            password-protected rooms for text chat, voice and video, and screen
            sharing where enabled. Public rooms may appear in Explore. Room
            features and availability can vary according to the host's settings
            and the service's current capabilities.
          </p>
        </section>

        <section>
          <h2>2. Accounts and your responsibilities</h2>
          <ul>
            <li>
              Provide accurate registration information and keep your profile
              information appropriate and up to date.
            </li>
            <li>
              Keep your sign-in credentials private. You are responsible for
              activity carried out through your account and should promptly stop
              using the service if you believe your account is compromised.
            </li>
            <li>
              Use only accounts you are authorized to access, and do not
              impersonate another person or misrepresent your identity.
            </li>
            <li>
              You must be legally able to agree to these terms in your location.
              If you are not, use the service only with the involvement and
              permission of a parent or legal guardian.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Room listings, access, and bookings</h2>
          <p>
            Hosts are responsible for the names, settings, access choices, and
            conduct in rooms they create. Public rooms can be listed for others
            to discover; private rooms require the configured room password.
            Share private-room codes and passwords only with people you intend to
            invite, and do not publish another person's private access details
            without permission.
          </p>
          <p>
            Qyzen currently provides rooms rather than reservations: it does not
            offer room bookings, paid reservations, or a booking cancellation
            process. You can leave a room, and a host can manage or delete their
            room using the available controls.
          </p>
        </section>

        <section>
          <h2>4. Payments and cancellations</h2>
          <p>
            Qyzen does not currently provide payments, paid subscriptions,
            purchases, or bookings. No payment, refund, or booking cancellation
            terms apply to the room and communication features described here.
            Do not send payment details to another user on the assumption that
            Qyzen will process or protect a transaction.
          </p>
        </section>

        <section>
          <h2>5. Your content and communications</h2>
          <p>
            You remain responsible for content you submit, including profile
            details, room information, and messages. Share only information you
            have the right to share, and use care when communicating with other
            people. By submitting content, you allow Qyzen to store, display,
            and transmit it as needed to operate the features you choose. Do not
            post private or sensitive information unless you are comfortable
            sharing it with the relevant room members or recipients.
          </p>
        </section>

        <section>
          <h2>6. Prohibited activities</h2>
          <p>You must not use Qyzen Rooms to:</p>
          <ul>
            <li>
              Harass, threaten, exploit, defraud, or unlawfully discriminate
              against another person, or share unlawful or harmful content.
            </li>
            <li>
              Violate another person's privacy, share intimate or identifying
              information without permission, or record or redistribute
              communications without the necessary consent.
            </li>
            <li>
              Upload or transmit content that infringes intellectual-property
              rights or other legal rights.
            </li>
            <li>
              Disrupt, overload, probe, or attempt unauthorized access to the
              service, its accounts, rooms, or infrastructure.
            </li>
            <li>
              Circumvent room passwords, access controls, or participant limits,
              or interfere with another person's use of a room.
            </li>
            <li>
              Use the service to distribute spam, malware, scams, or unsolicited
              commercial messages.
            </li>
          </ul>
        </section>

        <section>
          <h2>7. Platform and room rules</h2>
          <p>
            Respect the room host's settings and other participants. Use
            microphone, camera, and screen-sharing permissions responsibly, and
            share content only when you have the right to do so. Hosts may use
            available room controls, such as managing access or removing a
            participant, to maintain their room. Do not use another person's
            room or account without authorization.
          </p>
        </section>

        <section>
          <h2>8. Availability and enforcement</h2>
          <p>
            Online features can be interrupted, changed, or unavailable, and
            connections between participants depend in part on their devices and
            networks. Qyzen may take reasonable steps to protect the service and
            its users when these terms or applicable rules are violated,
            including limiting access to affected features or accounts.
          </p>
        </section>

        <section>
          <h2>9. Changes to these terms</h2>
          <p>
            These terms may be updated as Qyzen Rooms changes. The current
            version and its revision date will be posted on this page. Continued
            use after an update means you accept the revised terms.
          </p>
        </section>
      </article>
    </div>
  );
}
