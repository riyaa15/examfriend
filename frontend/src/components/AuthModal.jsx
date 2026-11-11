import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  KeyRound, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  // Primary mode: 'phone' (Phone + OTP) or 'email' (Legacy Email + Password)
  const [authMethod, setAuthMethod] = useState('phone');
  // 'login' or 'signup'
  const [isSignup, setIsSignup] = useState(false);

  // Phone + OTP State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Legacy Email + Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status & Connection State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem('examfriend_api_url') || 'https://ericsson-kings-united-regarded.trycloudflare.com');

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  if (!isOpen) return null;

  const handleSaveServerUrl = () => {
    const cleanUrl = serverUrl.trim().replace(/\/+$/, "");
    if (cleanUrl) {
      localStorage.setItem('examfriend_api_url', cleanUrl);
    } else {
      localStorage.removeItem('examfriend_api_url');
    }
    window.location.reload();
  };

  const handleSuccessLogin = (data) => {
    // 14 Days (2 Weeks) persistent session marker
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + twoWeeksMs;
    localStorage.setItem('examfriend_token', data.access_token);
    localStorage.setItem('examfriend_user', JSON.stringify(data.user));
    localStorage.setItem('examfriend_expires_at', String(expiresAt));

    if (onAuthSuccess) onAuthSuccess(data.user);
    if (onClose) onClose();
  };

  // 1. Send OTP (For both Sign Up and Login)
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (isSignup && !name.trim()) {
      setError('Please enter your full student name.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          purpose: isSignup ? 'signup' : 'login'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP code');

      setOtpSent(true);
      setReceivedOtp(data.otp || '');
      setResendCountdown(30);
      setSuccessMsg(`OTP sent to +91 ${cleanPhone}!`);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('fetch') || msg.includes('Network') || msg.includes('Failed')) {
        setError('⚠️ Cannot connect to server. Check server URL below under ⚙️ Server Settings.');
        setShowServerSettings(true);
      } else {
        setError(msg || 'Unable to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP & Authenticate (Phone Signup or Phone Login)
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const endpoint = isSignup ? '/api/auth/phone-signup' : '/api/auth/phone-login';
      const payload = isSignup 
        ? { name: name.trim(), phone: cleanPhone, otp: cleanOtp }
        : { phone: cleanPhone, otp: cleanOtp };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'OTP verification failed');

      handleSuccessLogin(data);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('fetch') || msg.includes('Network') || msg.includes('Failed')) {
        setError('⚠️ Connection error. Check server URL below under ⚙️ Server Settings.');
        setShowServerSettings(true);
      } else {
        setError(msg || 'Verification failed. Please check the OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Auto-fill received OTP
  const handleAutoFillOtp = () => {
    if (receivedOtp) {
      setOtp(receivedOtp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  // 4. Quick Demo Phone Login (1-Click Instant Access)
  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9876543210', otp: '123456' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Demo login failed');
      handleSuccessLogin(data);
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Legacy Email & Password Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
    const payload = isSignup 
      ? { username: name.trim() || email.split('@')[0], email: email.trim(), password }
      : { email: email.trim(), password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      handleSuccessLogin(data);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 250,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '1.75rem'
      }}>
        {/* Close Button (only if user already logged in) */}
        {localStorage.getItem('examfriend_token') && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={20} />
          </button>
        )}

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '0.75rem',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)'
          }}>
            {isSignup ? <UserPlus size={26} /> : <Phone size={26} />}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {isSignup ? 'Student Sign Up' : 'Welcome to EXAMFRIEND'}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
            {isSignup 
              ? 'Enter your name & phone number to create your account' 
              : 'Log in with your phone number and OTP'}
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '0.4rem',
            padding: '0.15rem 0.55rem',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#059669',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            <ShieldCheck size={13} />
            Stay signed in for 2 weeks automatically
          </div>
        </div>

        {/* Auth Method Tabs: Phone (Default) vs Email */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.4rem',
          background: 'var(--bg-subtle, rgba(0,0,0,0.04))',
          padding: '0.3rem',
          borderRadius: 'var(--radius-sm, 8px)',
          marginBottom: '1.25rem'
        }}>
          <button
            type="button"
            onClick={() => { setAuthMethod('phone'); setError(''); setOtpSent(false); }}
            style={{
              padding: '0.45rem',
              borderRadius: '6px',
              border: 'none',
              background: authMethod === 'phone' ? 'var(--bg-surface, #fff)' : 'transparent',
              color: authMethod === 'phone' ? 'var(--primary, #6366f1)' : 'var(--text-muted)',
              fontWeight: authMethod === 'phone' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              boxShadow: authMethod === 'phone' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Phone size={14} /> Phone + OTP
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setError(''); }}
            style={{
              padding: '0.45rem',
              borderRadius: '6px',
              border: 'none',
              background: authMethod === 'email' ? 'var(--bg-surface, #fff)' : 'transparent',
              color: authMethod === 'email' ? 'var(--primary, #6366f1)' : 'var(--text-muted)',
              fontWeight: authMethod === 'email' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              boxShadow: authMethod === 'email' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Mail size={14} /> Email & Password
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#dc2626',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        {/* Success Notice */}
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#059669',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {/* -------------------- METHOD 1: PHONE + OTP FORM -------------------- */}
        {authMethod === 'phone' && (
          <div>
            {!otpSent ? (
              // STEP 1: Enter Phone Number (and Name if Signup)
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {isSignup && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      Full Name:
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        required
                        className="form-input"
                        style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
                        placeholder="e.g. Riya Gupta"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Mobile Phone Number:
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-subtle, rgba(0,0,0,0.05))',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      borderRadius: 'var(--radius-sm, 6px)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)'
                    }}>
                      🇮🇳 +91
                    </div>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Phone size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        className="form-input"
                        style={{ paddingLeft: '2.4rem', fontSize: '0.875rem', letterSpacing: '0.05rem', fontWeight: 600 }}
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length < 10 || (isSignup && !name.trim())}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    marginTop: '0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <KeyRound size={17} />
                  {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              // STEP 2: Enter 6-Digit OTP
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  background: 'var(--bg-subtle, rgba(0,0,0,0.03))',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mobile Number</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>+91 {phone}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Change Number
                  </button>
                </div>

                {/* Instant OTP Display Banner (Zero SMS Friction) */}
                {receivedOtp && (
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(236, 72, 153, 0.12))',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Your Verification Code:</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.2rem' }}>
                        {receivedOtp}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoFillOtp}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid var(--primary)',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      {copiedOtp ? <Check size={13} /> : <Copy size={13} />}
                      {copiedOtp ? 'Filled!' : '1-Tap Auto Fill'}
                    </button>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'center', display: 'block' }}>
                    Enter 6-Digit Verification Code:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    className="form-input"
                    style={{
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      letterSpacing: '0.45rem',
                      fontWeight: 800,
                      padding: '0.65rem',
                      color: 'var(--primary)'
                    }}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Didn't receive code?
                  </span>
                  {resendCountdown > 0 ? (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                      Resend in {resendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <RefreshCw size={12} /> Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <ArrowRight size={17} />
                  {loading ? 'Verifying...' : (isSignup ? 'Complete Sign Up' : 'Log In to Dashboard')}
                </button>
              </form>
            )}
          </div>
        )}

        {/* -------------------- METHOD 2: LEGACY EMAIL & PASSWORD -------------------- */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {isSignup && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Full Name:</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
                    placeholder="e.g. Riya Gupta"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Email Address:</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Password:</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.4rem' }}
            >
              {loading ? 'Authenticating...' : (isSignup ? 'Create Account' : 'Sign In')}
            </button>
          </form>
        )}

        {/* Quick Demo Access (1-Click Instant Login) */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.6rem',
              fontSize: '0.825rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.08))',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: 'var(--primary)'
            }}
          >
            <Sparkles size={16} />
            ⚡ 1-Tap Demo Student Login (No typing needed)
          </button>
        </div>

        {/* Toggle between Login and Signup */}
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
          {isSignup ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsSignup(false); setError(''); setOtpSent(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Log In Here
              </button>
            </span>
          ) : (
            <span>
              New student to EXAMFRIEND?{' '}
              <button
                type="button"
                onClick={() => { setIsSignup(true); setError(''); setOtpSent(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Create Account (Sign Up)
              </button>
            </span>
          )}
        </div>

        {/* Server Connection URL Drawer for Mobile APK */}
        <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowServerSettings(!showServerSettings)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ⚙️ {showServerSettings ? 'Hide Server Settings' : 'App Server Settings (Cloudflare / Render URL)'}
          </button>
          {showServerSettings && (
            <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--bg-subtle, rgba(0,0,0,0.03))', borderRadius: 'var(--radius-sm, 6px)', textAlign: 'left' }}>
              <label style={{ fontSize: '0.725rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                Active Backend Server URL:
              </label>
              <input
                type="url"
                className="form-input"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', marginBottom: '0.5rem' }}
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://your-service.onrender.com"
              />
              <button
                type="button"
                onClick={handleSaveServerUrl}
                className="btn btn-primary"
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.65rem' }}
              >
                Save & Connect
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
