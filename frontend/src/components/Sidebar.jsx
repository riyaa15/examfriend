import React from 'react';
import {
  X,
  GraduationCap,
  Flame,
  Clock,
  BookOpen,
  CalendarRange,
  FileStack,
  Mic,
  Presentation,
  Trash2,
  Home,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  ChevronRight,
  Folder,
  Zap
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  user,
  stats,
  trashCount = 0,
  theme,
  toggleTheme,
  onLogout
}) {
  const navCards = [
    {
      id: 'dashboard',
      label: 'Dashboard Home',
      tag: 'Overview',
      icon: Home,
      color: 'var(--primary)',
      badge: 'Home'
    },
    {
      id: 'countdown',
      label: 'Card 1: Exam Countdown',
      tag: 'Live Ticker',
      icon: Clock,
      color: 'var(--accent-amber)',
      badge: stats?.upcoming_exams ? `${stats.upcoming_exams} Exams` : 'Active'
    },
    {
      id: 'syllabus',
      label: 'Card 2: Subject Tracker',
      tag: 'Hierarchy & OCR',
      icon: BookOpen,
      color: 'var(--accent-cyan)',
      badge: stats?.total_subjects ? `${stats.total_subjects} Subj` : 'Track'
    },
    {
      id: 'study-plan',
      label: 'Card 3: Study Plan',
      tag: 'Daily Timetable',
      icon: CalendarRange,
      color: 'var(--accent-emerald)',
      badge: 'PDF Ready'
    },
    {
      id: 'practice-papers',
      label: 'Card 4: Practice Papers',
      tag: 'Mock Exams',
      icon: FileStack,
      color: 'var(--accent-purple)',
      badge: 'AI Papers'
    },
    {
      id: 'viva',
      label: 'Card 5: AI Viva Tester',
      tag: 'Voice & Quiz',
      icon: Mic,
      color: 'var(--accent-rose)',
      badge: 'Live Audio'
    },
    {
      id: 'teacher',
      label: 'Card 6: AI Teacher',
      tag: 'Voice & Video Lecture',
      icon: Presentation,
      color: '#6366f1',
      badge: '✨ Video AI',
      highlight: true
    },
    {
      id: 'question-bank',
      label: 'Card 7: AI Flashcards',
      tag: 'PDF Synthesis & 3D Cards',
      icon: Zap,
      color: '#f59e0b',
      badge: '🎴 3D Recall',
      highlight: true
    },
    {
      id: 'notes',
      label: 'Card 8: Notes Drive',
      tag: 'Store & Organize Notes',
      icon: Folder,
      color: '#2563eb',
      badge: '📂 Drive',
      highlight: true
    },
    {
      id: 'trash',
      label: 'Card 9: Trash Bin',
      tag: 'Restore Soft Deleted',
      icon: Trash2,
      color: '#ef4444',
      badge: trashCount > 0 ? `${trashCount} items` : 'Recycle'
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 150,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Sidebar drawer container */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '340px',
          maxWidth: '85vw',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 160,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: 'var(--transition)'
        }}
      >
        {/* Header with Brand & Close */}
        <div style={{
          padding: '1.25rem 1.25rem 1rem',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-glass)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--grad-hero)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'var(--grad-hero)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                EXAMFRIEND
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Student Command Center
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ width: '32px', height: '32px' }}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Student Profile Card (User Information) */}
        <div style={{
          padding: '1.25rem',
          background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
            {/* Avatar */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'var(--grad-hero)',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                fontWeight: 800,
                fontSize: '1.3rem'
              }}>
                {user?.username ? user.username.charAt(0).toUpperCase() : 'S'}
              </div>
            </div>

            {/* Profile text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', truncate: 'true' }}>
                  {user?.username || 'Student'}
                </span>
                <ShieldCheck size={14} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email || 'student@examfriend.edu'}
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.625rem', padding: '0.15rem 0.5rem', marginTop: '0.35rem' }}>
                Semester Pro 🎓
              </span>
            </div>
          </div>

          {/* Quick Stats Bars */}
          {stats && (
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              border: '1px solid var(--border-light)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {stats.upcoming_exams || 0}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Exams
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {stats.overall_progress || 0}%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Syllabus
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                  <Flame size={14} /> 5
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Streak
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Cards Section (Cards 1 to 8) */}
        <div style={{ padding: '1rem 0.75rem', flex: 1 }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            padding: '0.25rem 0.6rem 0.5rem'
          }}>
            Navigation & Modules (Cards 1-8)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navCards.map((card) => {
              const IconComp = card.icon;
              const isActive = currentView === card.id;

              return (
                <button
                  key={card.id}
                  onClick={() => {
                    onNavigate(card.id);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: isActive 
                      ? '1px solid var(--primary)' 
                      : card.highlight 
                      ? '1px solid rgba(99, 102, 241, 0.25)' 
                      : '1px solid transparent',
                    background: isActive
                      ? 'rgba(99, 102, 241, 0.12)'
                      : card.highlight
                      ? 'rgba(99, 102, 241, 0.05)'
                      : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    textAlign: 'left',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = card.highlight ? 'rgba(99, 102, 241, 0.05)' : 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? 'var(--primary)' : 'var(--bg-subtle)',
                      color: isActive ? '#fff' : card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComp size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 700 : 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {card.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {card.tag}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    {card.badge && (
                      <span
                        className={`badge ${
                          card.id === 'trash' && trashCount > 0
                            ? 'badge-danger'
                            : card.highlight
                            ? 'badge-primary'
                            : 'badge-secondary'
                        }`}
                        style={{ fontSize: '0.625rem', padding: '0.15rem 0.45rem' }}
                      >
                        {card.badge}
                      </span>
                    )}
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-light)',
          background: 'var(--bg-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {/* Theme switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.4rem 0.5rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.825rem'
          }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {theme === 'dark' ? <Moon size={15} color="#818cf8" /> : <Sun size={15} color="#f59e0b" />}
              Appearance: <b style={{ color: 'var(--text-primary)' }}>{theme === 'dark' ? 'Dark' : 'Light'}</b>
            </span>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
            >
              Toggle
            </button>
          </div>

          {/* Logout button */}
          {user && (
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="btn btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'var(--accent-rose)',
                borderColor: 'rgba(239, 68, 68, 0.25)',
                fontSize: '0.85rem'
              }}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
