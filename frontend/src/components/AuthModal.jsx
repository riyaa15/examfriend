import React, { useState } from 'react';
import { X, Sparkles, LogIn, UserPlus, Lock, Mail, User } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
    const payload = isSignup 
      ? { username: username.trim(), email: email.trim(), password }
      : { email: email.trim(), password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }
      localStorage.setItem('examfriend_token', data.access_token);
      localStorage.setItem('examfriend_user', JSON.stringify(data.user));
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // First try logging into demo user
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@examfriend.edu', password: 'password123' })
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        localStorage.setItem('examfriend_token', data.access_token);
        localStorage.setItem('examfriend_user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
        onClose();
        return;
      }

      // If demo user does not exist, auto-create it
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Riya (Topper)',
          email: 'student@examfriend.edu',
          password: 'password123'
        })
      });
      const sData = await signupRes.json();
      if (!signupRes.ok) throw new Error(sData.detail || 'Demo login failed');

      localStorage.setItem('examfriend_token', sData.access_token);
      localStorage.setItem('examfriend_user', JSON.stringify(sData.user));
      onAuthSuccess(sData.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo access failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="btn btn-ghost btn-icon"
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--grad-hero)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '0.75rem',
            boxShadow: '0 4px 16px var(--primary-glow)'
          }}>
            {isSignup ? <UserPlus size={24} /> : <LogIn size={24} />}
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            {isSignup ? 'Create Student Account' : 'Welcome to EXAMFRIEND'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {isSignup ? 'Organize your syllabus and crush your exams' : 'Log in to track your syllabus, countdowns & AI viva'}
          </p>
        </div>

        {/* Demo Fast Login Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="btn btn-secondary"
          style={{
            width: '100%',
            marginBottom: '1.25rem',
            border: '1.5px dashed var(--primary)',
            color: 'var(--primary)',
            background: 'rgba(99, 102, 241, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Sparkles size={16} />
          <span>Quick 1-Click Demo Login</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          color: 'var(--text-muted)',
          fontSize: '0.8rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
          <span>OR CONTINUE WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: 'var(--accent-rose)',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="form-group">
              <label className="form-label">
                <User size={15} /> Your Full Name / Nickname
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Riya Sharma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <Mail size={15} /> Student Email
            </label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="e.g. student@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={15} /> Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              placeholder="Enter your secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {loading ? 'Please wait...' : (isSignup ? 'Create Free Account' : 'Sign In to Dashboard')}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.25rem',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          {isSignup ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignup(false); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New student to EXAMFRIEND?{' '}
              <button
                type="button"
                onClick={() => { setIsSignup(true); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Sign Up Here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
