import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Laptop,
  ArrowRight
} from 'lucide-react';

export default function SyncDeviceModal({ isOpen, onClose, user, token }) {
  const [syncCode, setSyncCode] = useState('');
  const [syncUrl, setSyncUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [expiresIn, setExpiresIn] = useState(30);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateCode = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/profile/generate-sync-code', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: user?.email, user_id: user?.id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not generate sync code');

      // Always use current window origin so QR code works on any live domain, tunnel or local network
      const currentOrigin = window.location.origin;
      const effectiveLink = (currentOrigin && !currentOrigin.includes('localhost')) 
        ? `${currentOrigin}/?sync=${data.sync_code}`
        : (data.sync_link || `${currentOrigin}/?sync=${data.sync_code}`);

      setSyncCode(data.sync_code);
      setSyncUrl(effectiveLink);
      setExpiresIn(data.expires_in_minutes || 30);

      // Render crisp QR Code data URL
      try {
        const qrUrl = await QRCode.toDataURL(effectiveLink, {
          width: 240,
          margin: 2,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff'
          }
        });
        setQrDataUrl(qrUrl);
      } catch (qrErr) {
        // Fallback to online QR API if canvas fails
        setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(effectiveLink)}`);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateCode();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!syncCode) return;
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!syncUrl) return;
    navigator.clipboard.writeText(syncUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out',
          margin: 'auto'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'var(--grad-hero)',
          padding: '1.25rem 1.5rem',
          color: '#fff',
          position: 'relative'
        }}>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Close"
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.25)',
              padding: '0.35rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <QrCode size={20} color="#fff" />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Cross-Device Profile Sync
            </span>
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#fff' }}>
            Sync Profile to Phone or Tablet
          </h3>
          <p style={{ fontSize: '0.825rem', opacity: 0.9, margin: 0 }}>
            Scan the QR code or enter the 6-digit sync code on your other device to instantly fetch all your data.
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', textAlign: 'center' }}>
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--accent-rose)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.825rem',
              width: '100%'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* QR Code Container */}
          <div style={{
            background: '#ffffff',
            padding: '1rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: '2px solid var(--border-light)'
          }}>
            {loading ? (
              <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={28} className="animate-spin" color="var(--primary)" />
              </div>
            ) : qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="Profile Sync QR Code" 
                style={{ width: '210px', height: '210px', display: 'block' }}
              />
            ) : (
              <div style={{ width: '210px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                Generating QR...
              </div>
            )}

            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Smartphone size={14} color="#6366f1" />
              <span>Point your phone camera to open & sync</span>
            </div>
          </div>

          {/* 6-Digit Code Section */}
          <div style={{
            width: '100%',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Or Enter 6-Digit Sync Code on Other Device:
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              {syncCode ? (
                syncCode.split('').map((digit, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '42px',
                      height: '50px',
                      background: 'var(--bg-card)',
                      border: '2px solid var(--primary)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.45rem',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {digit}
                  </div>
                ))
              ) : (
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Loading code...</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleCopyCode}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {copiedLink ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Direct Link'}</span>
              </button>

              <button
                type="button"
                onClick={generateCode}
                disabled={loading}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                title="Refresh code"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
              ⏳ Code expires in <b>{expiresIn} minutes</b> • Syncs all {user?.name || user?.username}'s exams & subjects
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}
          >
            Done
          </button>

        </div>
      </div>
    </div>
  );
}

