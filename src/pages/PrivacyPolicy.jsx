import SEO from '../components/common/SEO';
import './LegalPages.css';

export default function PrivacyPolicy() {
  return (
    <div className="qz-legal-page">
      <SEO
        title="Privacy Policy | Qyzen Rooms"
        description="Learn how Qyzen Rooms handles account, room, messaging, device, and advertising information."
        canonical="https://qyzen.online/privacy"
      />
      <article className="qz-container qz-legal-page__content">
        <header className="qz-legal-page__header">
          <span className="qz-eyebrow">Qyzen Rooms</span>
          <h1>Privacy Policy</h1>
          <p>Last updated: November 17, 2026</p>
        </header>

        <p>
          This policy explains what information is handled when you use Qyzen
          Rooms to create or join rooms, communicate with other users, and manage
          your account. It describes the service as currently provided; features
          such as bookings and payments are not offered.
        </p>

        <section>
          <h2>1. Information we collect</h2>
          <ul>
            <li>
              <strong>Account and profile information:</strong> when you register
              or update your profile, Qyzen receives your username, display name,
              email address, password, and any profile details you choose to
              provide, such as a bio or avatar.
            </li>
            <li>
              <strong>Rooms and communications:</strong> room names, settings,
              access details, membership and presence information, messages,
              friend requests, and direct messages are handled to provide room,
              chat, and social features.
            </li>
            <li>
              <strong>Session and technical information:</strong> authentication
              uses login-session cookies. The service may also process request
              and device information, such as browser user-agent data, for session
              handling, security, diagnostics, and abuse prevention.
            </li>
            <li>
              <strong>Device preferences:</strong> Qyzen stores selected
              preferences and convenience data, such as audio/video settings and
              recently visited rooms, in your browser's local storage.
            </li>
            <li>
              <strong>Media:</strong> voice, camera, and screen sharing use
              browser permissions and are transmitted between room participants.
              Do not enable a device or share a screen unless you intend to do
              so.
            </li>
          </ul>
        </section>

        <section>
          <h2>2. How information is used</h2>
          <p>
            Information is used to create and secure accounts, authenticate
            sessions, display profiles and public rooms, control room access,
            connect participants, deliver chat and social features, remember
            local preferences, maintain and protect the service, and troubleshoot
            errors. Qyzen does not need your password in readable form to provide
            these features.
          </p>
        </section>

        <section>
          <h2>3. Cookies and local storage</h2>
          <p>
            Qyzen uses essential first-party cookies to maintain authenticated
            sessions. Authentication tokens are set as HTTP-only cookies, which
            helps prevent client-side scripts from reading them. The service
            also uses browser local storage for non-sensitive preferences and
            recent-room convenience data; this is separate from cookies. You can
            control or clear cookies and local storage through your browser, but
            doing so may sign you out or reset saved preferences.
          </p>
        </section>

        <section>
          <h2>4. Google AdSense advertising</h2>
          <p>
            Qyzen may display advertisements served by Google AdSense. If
            AdSense ads are shown, Google and its advertising partners may use
            cookies or similar identifiers to serve, measure, and personalize
            advertising, including based on visits to this or other websites, as
            permitted by your settings and applicable requirements. Google
            processes information under its own privacy terms. You can manage
            advertising personalization in Google's ad settings and manage or
            block cookies using your browser controls. Blocking advertising
            cookies may affect ad personalization but does not disable Qyzen's
            essential sign-in cookies.
          </p>
        </section>

        <section>
          <h2>5. Third-party services</h2>
          <p>
            Qyzen relies on third-party infrastructure and services to operate,
            including AWS services for application data and hosting, and Google
            AdSense when advertising is served. The browser's own media and
            networking capabilities are used for voice, video, and screen
            sharing. These providers process information as needed to provide
            their services and under their applicable terms and privacy
            practices. Qyzen does not control third-party services or their
            independent privacy practices.
          </p>
        </section>

        <section>
          <h2>6. Sharing and visibility</h2>
          <p>
            Information is shared when necessary to provide a feature you use:
            for example, public room details may be visible to people browsing
            Explore, profile display names are shown to other participants, and
            messages are delivered to their intended room or conversation.
            Information may also be processed by the service providers described
            above. Qyzen does not offer a booking or payment service.
          </p>
        </section>

        <section>
          <h2>7. Security and retention</h2>
          <p>
            Qyzen uses measures such as protected session cookies, password
            hashing, access controls, and encrypted connections where supported
            to help protect information. No online service or transmission can
            be guaranteed completely secure. Information is kept as needed to
            provide the service, maintain its security, and meet applicable
            obligations; retention can vary by information type and operational
            requirements.
          </p>
        </section>

        <section>
          <h2>8. Your choices</h2>
          <p>
            You can manage profile details and account settings through the
            available account features, adjust browser permissions for camera,
            microphone, and screen sharing, and clear locally stored preferences
            through your browser. You may also control cookies and advertising
            personalization as described above. Some service features may not
            work if required cookies or permissions are disabled.
          </p>
        </section>

        <section>
          <h2>9. Changes to this policy</h2>
          <p>
            This policy may be updated when the service or its data practices
            change. The updated version and its revision date will be posted on
            this page.
          </p>
        </section>
      </article>
    </div>
  );
}
