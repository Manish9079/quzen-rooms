import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, ArrowRight, Mail, Lock } from 'lucide-react';
import { Field, TextInput } from '../components/common/Field';
import Button from '../components/common/Button';
import Orb from '../components/common/Orb';
import { useAuth } from '../context/AuthContext';
import './FormPage.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!identifier.trim() || !password) return setError('Enter your email and password.');
    setError('');
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      const redirectTo = location.state?.from?.pathname || '/explore';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="qz-form-page">
      <div className="qz-container qz-form-page__inner">
        <div className="qz-form-page__intro">
          <span className="qz-eyebrow"><LogIn size={13} /> Welcome back</span>
          <h1>Good to see you again</h1>
          <p>Log in to create rooms, join by code, and pick up where you left off.</p>
          <Orb size={140} className="qz-form-page__orb" />
        </div>

        <form className="qz-form-card qz-neu" onSubmit={handleSubmit}>
          <Field label="Email" required id="identifier">
            <TextInput id="identifier" icon={Mail} placeholder="you@example.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" />
          </Field>
          <Field label="Password" required id="password">
            <TextInput id="password" icon={Lock} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>

          {error && <p className="qz-form-error">{error}</p>}

          <Button type="submit" size="lg" full icon={ArrowRight} iconPosition="right" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>

          <p className="qz-form-switch">
            New to Qyzen Rooms? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

