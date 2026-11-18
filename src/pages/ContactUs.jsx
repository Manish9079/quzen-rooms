import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Field, TextArea, TextInput } from '../components/common/Field';
import Button from '../components/common/Button';
import SEO from '../components/common/SEO';
import './CompanyPages.css';

const SUPPORT_EMAIL = 'mkm165597@gmail.com';

export default function ContactUs() {
  const [status, setStatus] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const subject = String(formData.get('subject') || '').trim();
    const message = String(formData.get('message') || '').trim();

    if (!name || !email || !subject || !message) {
      setStatus({
        type: 'error',
        message: 'Please complete every field before opening your email draft.',
      });
      return;
    }

    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      message,
    ].join('\n');
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setStatus({
      type: 'info',
      message: 'Your email app should open with a draft. The message is not sent until you review it and press Send.',
    });
    window.location.href = mailtoUrl;
  }

  return (
    <div className="qz-company-page qz-contact-page">
      <SEO
        title="Contact Us | Qyzen"
        description="Contact Qyzen with questions or feedback. Our contact form opens a pre-filled draft in your email app."
        canonical="https://qyzen.online/contact"
      />

      <div className="qz-container">
        <header className="qz-company-page__hero">
          <span className="qz-eyebrow"><Mail size={15} aria-hidden="true" /> Contact Qyzen</span>
          <h1>We're here to hear from you.</h1>
          <p>
            Send a question, share feedback, or ask for help with the current
            Qyzen website. We do not have a server-side contact form; submitting
            the form below opens a draft in your email app.
          </p>
        </header>

        <div className="qz-contact-layout">
          <section className="qz-contact-card qz-neu" aria-labelledby="qz-contact-form-title">
            <h2 id="qz-contact-form-title">Send us a message</h2>
            <p className="qz-contact-card__intro">
              Complete the fields and choose "Open email draft." Review the
              message in your email app and press Send to contact us.
            </p>

            <form className="qz-contact-form" onSubmit={handleSubmit}>
              <Field label="Name" required id="contact-name">
                <TextInput
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </Field>

              <Field label="Email" required id="contact-email">
                <TextInput
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </Field>

              <Field label="Subject" required id="contact-subject">
                <TextInput
                  id="contact-subject"
                  name="subject"
                  type="text"
                  maxLength={150}
                  required
                />
              </Field>

              <Field label="Message" required id="contact-message">
                <TextArea
                  id="contact-message"
                  name="message"
                  rows={6}
                  maxLength={5000}
                  required
                />
              </Field>

              {status && (
                <p
                  className={`qz-contact-form__status qz-contact-form__status--${status.type}`}
                  role={status.type === 'error' ? 'alert' : 'status'}
                  aria-live={status.type === 'error' ? 'assertive' : 'polite'}
                >
                  {status.message}
                </p>
              )}

              <Button type="submit" icon={Send}>
                Open email draft
              </Button>
            </form>
          </section>

          <aside className="qz-contact-details qz-neu" aria-labelledby="qz-contact-details-title">
            <div className="qz-company-card__icon" aria-hidden="true"><Mail size={22} /></div>
            <h2 id="qz-contact-details-title">Email support</h2>
            <p>
              If your email app does not open, contact us directly at this
              address:
            </p>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            <p className="qz-contact-details__note">
              Messages are not transmitted by this website. Your email app must
              be configured, and you must send the draft yourself.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
