import React from 'react';
import { 
  GraduationCap, 
  Moon, 
  Sun, 
  UserCheck, 
  LogOut, 
  Flame, 
  Calendar, 
  CheckCircle2,
  Menu,
  Trash2
} from 'lucide-react';

export default function Navbar({ 
  user, 
  stats, 
  theme, 
  toggleTheme, 
  onLogout, 
  onOpenAuth,
  onToggleSidebar,
  onNavigate,
  trashCount = 0
}) {
  return (
    <header className="app-navbar" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-light)',
      padding: '0.65rem 1rem',
      transition: 'var(--transition)'
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '0.75rem'
      }}>
        {/* Brand & Sidebar Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Sidebar Toggle ("Menu") */}
          <button
            onClick={onToggleSidebar}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.65rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: '1.5px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: 'var(--radius-md)'
            }}
            title="Open Sidebar Navigation & Profile"
            aria-label="Open sidebar"
          >
            <Menu size={19} color="var(--primary)" />
            <span className="nav-btn-text" style={{ display: 'inline' }}>Menu</span>
          </button>

          <div 
            onClick={() => onNavigate && onNavigate('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--grad-hero)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px var(--primary-glow)',
              flexShrink: 0
            }}>
              <GraduationCap size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  background: 'var(--grad-hero)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  EXAMFRIEND
                </span>
                <span className="badge badge-primary nav-hub-badge" style={{ fontSize: '0.65rem' }}>
                  AI Hub
                </span>
              </div>
              <p className="nav-tagline" style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0 }}>
                Smart Study & Exam Companion
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Pill (when logged in, visible on tablet/desktop) */}
        {user && stats && (
          <div className="nav-quick-stats" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            background: 'var(--bg-subtle)',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-light)',
            fontSize: '0.8rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-amber)' }}>
              <Flame size={15} />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Streak!</span>
            </div>
            <div style={{ width: '1px', height: '14px', background: 'var(--border-light)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)' }}>
              <Calendar size={14} />
              <span>{stats.upcoming_exams || 0} Exams</span>
            </div>
            <div style={{ width: '1px', height: '14px', background: 'var(--border-light)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={14} />
              <span style={{ fontWeight: 700 }}>{stats.overall_progress || 0}% Done</span>
            </div>
          </div>
        )}

        {/* Controls & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Trash Bin Quick Access Button */}
          {user && (
            <button 
              onClick={() => onNavigate && onNavigate('trash')}
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.825rem',
                gap: '0.4rem',
                color: trashCount > 0 ? 'var(--accent-rose)' : 'var(--text-muted)',
                borderColor: trashCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-light)'
              }}
              title="Card 9: Trash & Recovery"
              aria-label="Trash Bin"
            >
              <Trash2 size={16} />
              <span style={{ fontWeight: 700 }}>Trash</span>
              {trashCount > 0 && (
                <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  {trashCount}
                </span>
              )}
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button 
            onClick={toggleTheme}
            className="btn btn-secondary btn-icon"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div 
                onClick={onOpenAuth}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-surface)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                title="Click to view & edit your student profile or sync with another device"
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--grad-accent)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem'
                }}>
                  {user.name ? user.name[0].toUpperCase() : (user.username ? user.username[0].toUpperCase() : 'S')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user.name || user.username}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {user.studying_in ? user.studying_in.split('-')[0].trim() : 'Student Profile'}
                  </span>
                </div>
              </div>

              <button 
                onClick={onLogout}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                title="Switch Profile or Sign Out"
              >
                <LogOut size={14} />
                <span className="nav-btn-text">Switch</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <UserCheck size={16} />
              <span>Make / Select Profile</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
