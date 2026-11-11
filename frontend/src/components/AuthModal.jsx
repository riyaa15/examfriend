import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  User, 
  Mail, 
  Phone, 
  BookOpen, 
  Clock, 
  GraduationCap, 
  Target, 
  Calendar, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  Laptop, 
  Layers,
  ChevronRight,
  Zap,
  Edit3
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'create', currentProfile = null }) {
  // Mode: 'create' (Make Profile), 'sync' (Fetch on Another Device), 'edit' (Edit Profile)
  const [activeTab, setActiveTab] = useState(initialMode === 'edit' ? 'edit' : (initialMode || 'create'));

  // Profile Fields
  const [name, setName] = useState(currentProfile?.username || currentProfile?.name || '');
  const [email, setEmail] = useState(currentProfile?.email || '');
  const [age, setAge] = useState(currentProfile?.age || 20);
  const [studyingIn, setStudyingIn] = useState(currentProfile?.studying_in || 'B.Tech Computer Science - Sem 7');
  const [studyHours, setStudyHours] = useState(currentProfile?.study_hours || 4);
  const [targetExam, setTargetExam] = useState(currentProfile?.target_exam || 'Semester Finals');
  const [phone, setPhone] = useState(currentProfile?.phone || '');

  // Sync Device (Fetch Existing Profile)
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [syncQuery, setSyncQuery] = useState('');
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [syncedSummary, setSyncedSummary] = useState(null);

  // Status & Connection
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Update fields when currentProfile changes
  useEffect(() => {
    if (currentProfile) {
      setName(currentProfile.username || currentProfile.name || '');
      setEmail(currentProfile.email || '');
      setAge(currentProfile.age || 20);
      setStudyingIn(currentProfile.studying_in || 'B.Tech Computer Science - Sem 7');
      setStudyHours(currentProfile.study_hours || 4);
      setTargetExam(currentProfile.target_exam || 'Semester Finals');
      setPhone(currentProfile.phone || '');
    }
  }, [currentProfile]);

  // Load available profiles from server for 1-tap sync
  useEffect(() => {
    if (isOpen) {
      fetch('/api/profile/list')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAvailableProfiles(data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSession = (data) => {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + thirtyDaysMs;
    localStorage.setItem('examfriend_token', data.access_token);
    localStorage.setItem('examfriend_user', JSON.stringify(data.user));
    localStorage.setItem('examfriend_expires_at', String(expiresAt));

    if (onAuthSuccess) onAuthSuccess(data.user);
    if (onClose) onClose();
  };

  // 1. Make / Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full student name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address so you can sync across devices.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          age: parseInt(age, 10) || 20,
          studying_in: studyingIn.trim(),
          study_hours: parseFloat(studyHours) || 4.0,
          target_exam: targetExam.trim(),
          phone: phone.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not save profile');

      setSuccessMsg(`🎉 Welcome, ${data.user.name}! Your profile is ready.`);
      setTimeout(() => {
        handleSaveSession(data);
      }, 700);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2A. Fetch Profile via 6-Digit Sync Code or QR Code
  const handleFetchBySyncCode = async (codeToUse) => {
    const code = (codeToUse || syncCodeInput).trim();
    if (!code) {
      setError('Please enter the 6-digit sync code.');
      return;
    }

    setError('');
    setLoading(true);
    setSyncedSummary(null);

    try {
      const res = await fetch('/api/profile/fetch-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_code: code })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid or expired sync code');

      setSyncedSummary(data.synced_data);
      setSuccessMsg(`🎉 Code Verified! Synced all data for ${data.user.name}.`);

      setTimeout(() => {
        handleSaveSession(data);
      }, 800);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2B. Fetch Profile from Another Device (Email / Name)
  const handleFetchProfile = async (lookupQuery) => {
    const query = (lookupQuery || syncQuery).trim();
    if (!query) {
      setError('Please enter your email to fetch your profile.');
      return;
    }

    setError('');
    setLoading(true);
    setSyncedSummary(null);

    try {
      const res = await fetch('/api/profile/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_phone: query })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Profile not found');

      setSyncedSummary(data.synced_data);
      setSuccessMsg(`✅ Synced! Found ${data.user.name}'s profile.`);

      setTimeout(() => {
        handleSaveSession(data);
      }, 900);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Quick 1-Tap Demo Profile
  const handleQuickDemo = () => {
    setName('Riya Sharma');
    setEmail('riya.sharma@examfriend.edu');
    setAge(21);
    setStudyingIn('B.Tech Computer Science - Sem 7');
    setStudyHours(5);
    setTargetExam('Mumbai University Sem VII Finals');
    setPhone('9876543210');
    setActiveTab('create');
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div 
        className="card auth-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out',
          margin: 'auto'
        }}
      >
        {/* Header Banner */}
        <div style={{
          background: 'var(--grad-hero)',
          padding: '1.5rem 1.75rem 1.25rem',
          color: '#fff',
          position: 'relative'
        }}>
          {onClose && (
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
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.25)',
              padding: '0.4rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GraduationCap size={22} color="#fff" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9 }}>
              EXAMFRIEND Student Portal
            </span>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.35rem', letterSpacing: '-0.02em', color: '#fff' }}>
            {activeTab === 'edit' 
              ? 'Update Your Student Profile'
              : activeTab === 'create'
              ? 'Create Your Student Profile'
              : 'Sync Profile on Another Device'}
          </h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.92, margin: 0, lineHeight: 1.45 }}>
            {activeTab === 'sync'
              ? 'Using the app on your phone, tablet or another laptop? Fetch all your data instantly.'
              : 'Zero passwords or complex signups. Just set up your profile and your entire dashboard unlocks!'}
          </p>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1.1rem',
            background: 'rgba(0, 0, 0, 0.18)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-lg)'
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('create'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: activeTab === 'create' ? '#fff' : 'transparent',
                color: activeTab === 'create' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.85)',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <User size={15} />
              <span>Make Profile</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('sync'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: activeTab === 'sync' ? '#fff' : 'transparent',
                color: activeTab === 'sync' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.85)',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Smartphone size={15} />
              <span>Fetch on Another Device</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 1.75rem', maxHeight: '72vh', overflowY: 'auto' }}>
          
          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--accent-rose)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--accent-emerald)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: MAKE PROFILE / EDIT PROFILE */}
          {activeTab === 'create' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Quick 1-Tap Demo Button */}
              <button
                type="button"
                onClick={handleQuickDemo}
                style={{
                  background: 'var(--grad-subtle)',
                  border: '1.5px dashed var(--primary)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--primary)',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <Zap size={15} />
                <span>⚡ Fill with Demo Student Data (Riya - B.Tech CS)</span>
              </button>

              {/* Row 1: Name & Age */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <User size={14} color="var(--primary)" />
                    <span>Student Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Riya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <Calendar size={14} color="var(--primary)" />
                    <span>Age</span>
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="99"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Email (Cross-Device Sync Key) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <Mail size={14} color="var(--primary)" />
                  <span>Email Address *</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>(Sync key for other devices)</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. riya@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Row 3: Studying In / Course / Branch */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <BookOpen size={14} color="var(--primary)" />
                  <span>Studying In / College / Class *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech Computer Science - Sem 7, Class 12, etc."
                  value={studyingIn}
                  onChange={(e) => setStudyingIn(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />

                {/* Quick Presets for Course */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                  {['B.Tech / Engineering', 'Class 12 Boards', 'B.Sc / BCA', 'Medical / MBBS', 'Commerce / CA'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStudyingIn(preset)}
                      style={{
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.72rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border-light)',
                        background: studyingIn.includes(preset.split(' ')[0]) ? 'var(--primary-light)' : 'var(--bg-surface)',
                        color: studyingIn.includes(preset.split(' ')[0]) ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 4: Daily Study Hours & Target Exam */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <Clock size={14} color="var(--primary)" />
                    <span>Daily Study Target</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[2, 4, 6, 8].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setStudyHours(h)}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.2rem',
                          borderRadius: 'var(--radius-md)',
                          border: Number(studyHours) === h ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                          background: Number(studyHours) === h ? 'var(--primary-light)' : 'var(--bg-subtle)',
                          color: Number(studyHours) === h ? 'var(--primary)' : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <Target size={14} color="var(--primary)" />
                    <span>Target Exam</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Semester Finals"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Row 5: Mobile Phone (Optional) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <Phone size={14} color="var(--primary)" />
                  <span>Mobile Phone Number</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Optional for SMS/WhatsApp study alerts)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 20px var(--primary-glow)',
                  marginTop: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Saving Profile & Entering Dashboard...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Save Profile & Open Dashboard</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                🔒 Zero password hassles. Your profile stays saved on this device for 30 days!
              </div>
            </form>
          )}

          {/* TAB 2: FETCH ON ANOTHER DEVICE (CROSS-DEVICE SYNC) */}
          {activeTab === 'sync' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Informational Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
                border: '1.5px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.85rem 1rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <div style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Smartphone size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Fast QR & Code Sync
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Scan the QR code shown on your other device or enter the 6-digit sync code below.
                  </div>
                </div>
              </div>

              {/* METHOD 1: 6-DIGIT SYNC CODE */}
              <div style={{
                background: 'var(--bg-subtle)',
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Zap size={15} color="var(--accent-amber)" />
                  <span>Option 1: Enter 6-Digit Sync Code</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. 849201"
                    value={syncCodeInput}
                    onChange={(e) => setSyncCodeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleFetchBySyncCode(); }}
                    style={{
                      flex: 1,
                      padding: '0.7rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--primary)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      letterSpacing: '0.15em',
                      textAlign: 'center'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchBySyncCode()}
                    disabled={loading || !syncCodeInput.trim()}
                    className="btn btn-primary"
                    style={{
                      padding: '0.7rem 1.25rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span>Sync Now</span>
                  </button>
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  💡 Click <b>"📲 Sync Device"</b> on your other device's top bar to see its 6-digit code or QR code!
                </div>
              </div>

              {/* METHOD 2: EMAIL / NAME LOOKUP */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={13} />
                  <span>Option 2: Or Fetch by Profile Email</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. riya@gmail.com"
                    value={syncQuery}
                    onChange={(e) => setSyncQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleFetchProfile(); }}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchProfile()}
                    disabled={loading || !syncQuery.trim()}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.65rem 1rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.825rem'
                    }}
                  >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    <span>Fetch Email</span>
                  </button>
                </div>
              </div>

              {/* Sync Summary (When Found) */}
              {syncedSummary && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{syncedSummary.subjects || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Subjects</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{syncedSummary.exams || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Exams</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{syncedSummary.plans || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Study Plans</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{syncedSummary.notes || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Notes</div>
                  </div>
                </div>
              )}

              {/* Available Profiles (1-Click Sync) */}
              {availableProfiles.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                    Or 1-Tap To Load Existing Profile:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {availableProfiles.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleFetchProfile(p.email || p.name)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--grad-accent)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {p.name ? p.name[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              {p.studying_in || 'Student'} • {p.email}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700 }}>
                          <span>Sync</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Don't have a profile yet? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Create New Profile
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
