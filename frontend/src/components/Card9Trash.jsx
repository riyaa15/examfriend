import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  CalendarRange,
  FileStack,
  Mic,
  Presentation,
  ShieldCheck,
  Sparkles,
  FileArchive,
  Folder
} from 'lucide-react';

export default function Card9Trash({ token, onBack, onNavigate, onRefresh }) {
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');

  // Fetch trash items from backend
  const fetchTrash = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/trash', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrashItems(data);
      }
    } catch (err) {
      console.error('Error fetching trash:', err);
      setError('Failed to fetch trash items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [token]);

  // Restore an item
  const handleRestore = async (item) => {
    try {
      const res = await fetch('/api/trash/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          card_type: item.card_type,
          item_id: item.original_id
        })
      });

      if (res.ok) {
        setTrashItems(prev => prev.filter(t => t.id !== item.id));
        setNotification(`Restored "${item.title}" back to ${item.card_name}!`);
        setTimeout(() => setNotification(''), 4000);
        if (onRefresh) onRefresh();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to restore item');
      }
    } catch (err) {
      console.error('Error restoring:', err);
    }
  };

  // Permanently delete an item
  const handlePermanentDelete = async (item) => {
    if (!window.confirm(`Permanently delete "${item.title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/trash/permanent?card_type=${item.card_type}&item_id=${item.original_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setTrashItems(prev => prev.filter(t => t.id !== item.id));
        setNotification(`Permanently removed "${item.title}".`);
        setTimeout(() => setNotification(''), 4000);
        if (onRefresh) onRefresh();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to delete item permanently');
      }
    } catch (err) {
      console.error('Error permanent delete:', err);
    }
  };

  // Empty entire trash
  const handleEmptyTrash = async () => {
    if (trashItems.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ALL ${trashItems.length} items in the trash bin?`)) return;

    try {
      const res = await fetch('/api/trash/empty', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setTrashItems([]);
        setNotification('Trash bin is now completely empty.');
        setTimeout(() => setNotification(''), 4000);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error emptying trash:', err);
    }
  };

  // Filter and search logic
  const filteredItems = trashItems.filter(item => {
    const matchesFilter = filterType === 'all' 
      || item.card_type === filterType
      || (filterType === 'flashcard_deck' && item.card_type === 'question_bank')
      || (filterType === 'notes_drive' && item.card_type === 'handwritten_note');
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.card_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getCardIcon = (cardType) => {
    switch (cardType) {
      case 'exam': return <Clock size={16} color="var(--accent-amber)" />;
      case 'subject': return <BookOpen size={16} color="var(--accent-cyan)" />;
      case 'study_plan': return <CalendarRange size={16} color="var(--accent-emerald)" />;
      case 'practice_paper': return <FileStack size={16} color="var(--accent-purple)" />;
      case 'viva_session': return <Mic size={16} color="var(--accent-rose)" />;
      case 'ai_teacher': return <Presentation size={16} color="#6366f1" />;
      case 'flashcard_deck': return <Zap size={16} color="#f59e0b" />;
      case 'question_bank': return <FileArchive size={16} color="#f59e0b" />;
      case 'notes_drive': return <Folder size={16} color="var(--primary)" />;
      case 'handwritten_note': return <Folder size={16} color="var(--primary)" />;
      default: return <Trash2 size={16} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Top Banner & Controls */}
      <div style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem 2rem',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)'
      }}>
        <div style={{ maxWidth: '720px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            padding: '0.3rem 0.8rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '0.6rem',
            textTransform: 'uppercase'
          }}>
            <ShieldCheck size={14} /> Card 9: Safe Storage & Recycle Bin
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Trash & Data Recovery Center 🗑️
          </h2>
          <p style={{ fontSize: '0.925rem', opacity: 0.92, lineHeight: 1.5, margin: 0 }}>
            Accidentally clicked delete? No worries! Every item deleted from Cards 1 through 8 (Exams, Subjects, Study Plans, Practice Papers, Viva, AI Teacher, Question Banks, and Notes Drive) is safely held right here. Click <b>Restore</b> anytime to put it back in its card, or permanently clear the bin.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {onBack && (
            <button
              onClick={onBack}
              className="btn btn-secondary"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                fontWeight: 700
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}

          {trashItems.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              className="btn"
              style={{
                background: '#ffffff',
                color: '#b91c1c',
                fontWeight: 800,
                border: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            >
              <Trash2 size={16} />
              <span>Empty Trash ({trashItems.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid var(--accent-emerald)',
          color: 'var(--accent-emerald)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        
        {/* Filter and Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-light)'
        }}>
          {/* Card Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'exam', label: '1. Exams' },
              { id: 'subject', label: '2. Subjects' },
              { id: 'study_plan', label: '3. Study Plans' },
              { id: 'practice_paper', label: '4. Practice Papers' },
              { id: 'viva_session', label: '5. Viva' },
              { id: 'ai_teacher', label: '6. AI Teacher' },
              { id: 'flashcard_deck', label: '7. Flashcards' },
              { id: 'notes_drive', label: '8. Notes Drive' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`btn ${filterType === f.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search deleted items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{
                paddingLeft: '2.2rem',
                fontSize: '0.85rem',
                width: '100%',
                borderRadius: 'var(--radius-full)'
              }}
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
            <RotateCcw size={28} className="spin" style={{ marginBottom: '0.75rem' }} />
            <p>Loading items in trash...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px dashed var(--border-light)'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Trash is Empty!
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
              {trashItems.length === 0 
                ? "You haven't deleted any items from Cards 1 through 8. Everything is safe in your active study modules!" 
                : "No deleted items match your search or filter selection."}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Showing {filteredItems.length} soft-deleted {filteredItems.length === 1 ? 'item' : 'items'}
            </div>

            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'var(--transition)'
                }}
              >
                {/* Item Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getCardIcon(item.card_type)}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>
                        {item.card_name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Deleted {new Date(item.deleted_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions: Restore & Permanent Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => handleRestore(item)}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      gap: '0.35rem',
                      color: 'var(--accent-emerald)',
                      borderColor: 'rgba(16, 185, 129, 0.3)'
                    }}
                    title="Restore back to original card"
                  >
                    <RotateCcw size={14} />
                    <span>Restore</span>
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(item)}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.4rem 0.65rem',
                      fontSize: '0.8rem',
                      color: 'var(--accent-rose)',
                      borderColor: 'rgba(239, 68, 68, 0.25)'
                    }}
                    title="Permanently Delete (Cannot be recovered)"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
