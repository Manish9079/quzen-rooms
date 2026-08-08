import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { Field, TextInput } from '../components/common/Field';
import Button from '../components/common/Button';
import './FormPage.css';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !code.trim()) {
      setError('Enter your email and verification code.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await authService.confirmRegistration(
        email.trim().toLowerCase(),
        code.trim()
      );

      navigate('/login', {
        replace: true,
        state: { verified: true, email: email.trim().toLowerCase() },
      });
    } catch (err) {
      setError(err.message || 'Could not verify your email.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="qz-form-page">
      <div className="qz-form-wrap">
        <div className="qz-form-heading">
          <ShieldCheck size={32} />
          <h1>Verify your email</h1>
          <p>
            We sent a verification code to your email.
          </p>
        </div>

        <form className="qz-form-card qz-neu" onSubmit={handleSubmit}>
          <Field label="Email" required id="email">
            <TextInput
              id="email"
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>

          <Field label="Verification code" required id="code">
            <TextInput
              id="code"
              placeholder="Enter verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
            />
          </Field>

          {error && <p className="qz-form-error">{error}</p>}

          <Button type="submit" size="lg" full disabled={submitting}>
            {submitting ? 'Verifying...' : 'Verify email'}
          </Button>

          <p className="qz-form-switch">
            Already verified? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}