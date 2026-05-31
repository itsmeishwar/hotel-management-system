import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PROPERTY_NAME } from '../config';

function formatToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

export default function Login() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={location.state?.from?.pathname || '/front-desk'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <div className="w-full max-w-md mx-auto flex flex-col justify-center px-6 py-12">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-widest text-ink-faint mb-2">Staff sign-in</p>
          <h1 className="text-3xl font-serif font-semibold text-ink">{PROPERTY_NAME}</h1>
          <p className="text-sm text-ink-muted mt-2">{formatToday()}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@hotel.com"
            required
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="text-sm text-terracotta bg-terracotta-muted/30 border border-terracotta-muted px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full mt-2">
            {submitting ? 'Signing in…' : 'Sign in to shift'}
          </Button>
        </form>

        <p className="text-xs text-ink-faint mt-8">
          Demo: frontdesk@hotel.com / admin123
        </p>
      </div>
    </div>
  );
}
