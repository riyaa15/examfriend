import React from 'react';
import { 
  ArrowLeft, 
  Home, 
  Clock, 
  BookOpen, 
  CalendarRange, 
  FileStack, 
  Mic, 
  Presentation, 
  Trash2, 
  FileArchive,
  Folder,
  Zap
} from 'lucide-react';

export default function PageHeader({ 
  currentModule, 
  title, 
  badgeText, 
  badgeClass = 'badge-primary',
  onBack, 
  onNavigate 
}) {
  const navItems = [
    { key: 'countdown', label: '1. Countdown', icon: Clock },
    { key: 'syllabus', label: '2. Syllabus Tracker', icon: BookOpen },
    { key: 'study-plan', label: '3. Study Plan', icon: CalendarRange },
    { key: 'practice-papers', label: '4. Practice Papers', icon: FileStack },
    { key: 'viva', label: '5. AI Viva Tester', icon: Mic },
    { key: 'teacher', label: '6. AI Teacher', icon: Presentation },
    { key: 'question-bank', label: '7. Flashcards', icon: Zap },
    { key: 'notes', label: '8. Notes Drive', icon: Folder },
    { key: 'trash', label: '9. Trash Bin', icon: Trash2 }
  ];

  return (
    <div style={{
      marginBottom: '1.5rem',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      padding: '1rem 1.25rem',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-light)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Top Bar with Back Button and Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border-light)',
        marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Prominent Back Button */}
          <button
            onClick={onBack}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)',
              border: '1.5px solid var(--border-light)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span 
              onClick={onBack}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}
            >
              <Home size={14} /> Dashboard
            </span>
            <span>/</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {title}
            </span>
          </div>
        </div>

        {badgeText && (
          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Quick Jump Bar across the 8 cards */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingTop: '0.25rem'
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginRight: '0.25rem' }}>
          Switch Page:
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                border: isActive ? 'none' : '1px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
