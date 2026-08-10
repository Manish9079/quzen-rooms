import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight, Mail, Lock, User, AtSign } from 'lucide-react';
import { Field, TextInput } from '../components/common/Field';
import Button from '../components/common/Button';
import Orb from '../components/common/Orb';
import { useAuth } from '../context/AuthContext';
import './FormPage.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.displayName.trim() || !form.email.trim() || !form.password) {
      return setError('Fill in every field to create your account.');
    }
    const strongPassword =
  /[A-Z]/.test(form.password) &&
  /[a-z]/.test(form.password) &&
  /[0-9]/.test(form.password) &&
  /[^A-Za-z0-9]/.test(form.password);

if (form.password.length < 8 || !strongPassword) {
  return setError(
    'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.'
  );
}
    setError('');
    setSubmitting(true);
    try {
      await register({
        username: form.username.trim().toLowerCase(),
        displayName: form.displayName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate('/verify-email', {
      replace: true,
      state: {
      email: form.email.trim().toLowerCase(),
        },
     });
    } catch (err) {
      setError(err.message || 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="qz-form-page">
      <div className="qz-container qz-form-page__inner">
        <div className="qz-form-page__intro">
          <span className="qz-eyebrow"><UserPlus size={13} /> Join Qyzen Rooms</span>
          <h1>Create your account</h1>
          <p>One account gets you into every room - as a host, a co-host, or just a friendly face in the chat.</p>
          <Orb size={140} className="qz-form-page__orb" />
        </div>

        <form className="qz-form-card qz-neu" onSubmit={handleSubmit}>
          <Field label="Display name" required id="displayName" hint="Shown to others in every room you join.">
            <TextInput id="displayName" icon={User} placeholder="e.g. Priya Sharma" value={form.displayName} onChange={(e) => update('displayName', e.target.value)} maxLength={48} />
          </Field>
          <div className="qz-form-row">
            <Field label="Username" required id="username" hint="Letters, numbers, dots, underscores.">
              <TextInput id="username" icon={AtSign} placeholder="priya" value={form.username} onChange={(e) => update('username', e.target.value.toLowerCase())} maxLength={24} autoComplete="username" />
            </Field>
            <Field label="Email" required id="email">
              <TextInput id="email" icon={Mail} type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" />
            </Field>
          </div>
          <Field label="Password" required id="password" hint="At least 8 characters.">
            <TextInput id="password" icon={Lock} type="password" placeholder="••••••••" value={form.password} onChange={(e) => update('password', e.target.value)} autoComplete="new-password" />
          </Field>

          {error && <p className="qz-form-error">{error}</p>}

          <Button type="submit" size="lg" full icon={ArrowRight} iconPosition="right" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>

          <p className="qz-form-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

