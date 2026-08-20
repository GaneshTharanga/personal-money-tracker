'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' }).then((response) => {
      if (response.ok) router.replace('/');
    });
  }, [router]);

  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not sign in.');
      router.replace('/'); router.refresh();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return <div className="login-page"><section className="login-card">
    <p className="eyebrow">Welcome back</p><h1>Money Tracker</h1>
    <p className="login-copy">Sign in to view your personal transactions.</p>
    {error && <div className="error-message">{error}</div>}
    <form className="form-stack" onSubmit={submit}>
      <label><span>Username</span><input autoFocus autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} /></label>
      <label><span>Password</span><input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button className="button positive" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </section></div>;
}
