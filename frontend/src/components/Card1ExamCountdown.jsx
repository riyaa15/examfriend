import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Play, 
  CheckCircle, 
  ChevronRight, 
  Bookmark, 
  Zap,
  ArrowLeft
} from 'lucide-react';

export default function Card1ExamCountdown({ exams, onRefresh, onSelectForStudy, token }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('09:30');
  const [examType, setExamType] = useState('Final Exam');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Real-time ticking state for live countdown
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!name.trim() || !examDate) {
      setError('Please provide an exam name and date');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          exam_date: examDate,
          exam_time: examTime,
          exam_type: examType,
          notes: notes.trim() || null
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed to add exam');
      }

      setName('');
      setExamDate('');
      setNotes('');
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error('Delete exam error:', err);
    }
  };

  // Filter exams into upcoming and past
  const sortedExams = [...exams].sort((a, b) => {
    const dtA = new Date(`${a.exam_date}T${a.exam_time || '00:00'}`);
    const dtB = new Date(`${b.exam_date}T${b.exam_time || '00:00'}`);
    return dtA - dtB;
  });

  const closestExam = sortedExams.find(e => {
    const dt = new Date(`${e.exam_date}T${e.exam_time || '00:00'}`);
    return dt >= now;
  }) || sortedExams[0];

  // Calculate live countdown for closest exam
  const getCountdownParts = (targetExam) => {
    if (!targetExam) return null;
    const target = new Date(`${targetExam.exam_date}T${targetExam.exam_time || '00:00'}`);
    const diff = target - now;

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, isPast: false };
  };

  const countdown = getCountdownParts(closestExam);

  return (
    <div className="glass-card" id="card-exam-countdown">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Card 1: Exam Countdown</h2>
              <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Chronological</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Nearest upcoming exams sorted automatically at the top
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {showForm ? (
            <button 
              onClick={() => setShowForm(false)}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
            >
              <ArrowLeft size={15} /> Back
            </button>
          ) : (
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.825rem' }}
            >
              <Plus size={16} /> Add New Exam
            </button>
          )}
        </div>
      </div>

      {/* Featured Closest Exam Live Countdown Hero */}
      {closestExam && countdown && (
        <div style={{
          background: countdown.isPast 
            ? 'var(--bg-subtle)' 
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(236, 72, 153, 0.12) 100%)',
          border: '1.5px solid var(--primary)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-danger">
                  <Zap size={12} /> Closest Upcoming Exam
                </span>
                <span className="badge badge-primary">{closestExam.exam_type}</span>
              </div>
              <h3 style={{ fontSize: '1.35rem', marginTop: '0.35rem' }}>
                {closestExam.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Target Date: <b>{closestExam.exam_date}</b> at <b>{closestExam.exam_time}</b>
              </p>
            </div>

            {onSelectForStudy && (
              <button 
                onClick={() => onSelectForStudy(closestExam)}
                className="btn btn-primary"
                style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem' }}
              >
                <Play size={14} /> Start Study Prep
              </button>
            )}
          </div>

          {/* Live Countdown Grid */}
          {!countdown.isPast ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              textAlign: 'center',
              marginTop: '0.75rem'
            }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                  {countdown.days}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Days</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--secondary)', fontFamily: 'var(--font-heading)' }}>
                  {countdown.hours.toString().padStart(2, '0')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Hours</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-heading)' }}>
                  {countdown.minutes.toString().padStart(2, '0')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Mins</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>
                  {countdown.seconds.toString().padStart(2, '0')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Secs</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <CheckCircle size={18} color="var(--accent-emerald)" />
              <span>This exam date has passed. Great job completing it!</span>
            </div>
          )}
        </div>
      )}

      {/* Add Exam Form (Collapsible) */}
      {showForm && (
        <form onSubmit={handleAddExam} style={{
          background: 'var(--bg-surface)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Enter Exam Details</h3>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Exam Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Machine Learning Endterm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Exam Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Exam Time</label>
              <input
                type="time"
                className="form-input"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type of Exam</label>
              <select
                className="form-select"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
              >
                <option value="Final Exam">Final / End-Semester Exam</option>
                <option value="Midterm">Midterm / Sessional</option>
                <option value="Lab / Viva">Lab / Practical / Oral Viva</option>
                <option value="Unit Test / Quiz">Unit Test / Quiz</option>
                <option value="Entrance / Competitive">Competitive / Entrance Exam</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes or Target Marks (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Aim for 90%+, 4 modules to cover"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Saving...' : 'Save & Sort Chronologically'}
            </button>
          </div>
        </form>
      )}

      {/* Sorted Chronological List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          All Scheduled Exams ({sortedExams.length})
        </div>

        {sortedExams.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)'
          }}>
            <Calendar size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p>No exams added yet. Click <b>"Add New Exam"</b> to get started!</p>
          </div>
        ) : (
          sortedExams.map((exam, index) => {
            const dt = new Date(`${exam.exam_date}T${exam.exam_time || '00:00'}`);
            const daysLeft = Math.ceil((dt - now) / (1000 * 60 * 60 * 24));
            const isPast = daysLeft < 0;

            let urgencyBadge = 'badge-primary';
            let urgencyText = `In ${daysLeft} days`;
            if (isPast) {
              urgencyBadge = 'badge-secondary';
              urgencyText = 'Completed';
            } else if (daysLeft <= 2) {
              urgencyBadge = 'badge-danger';
              urgencyText = '🚨 Urgent: In ' + (daysLeft === 0 ? 'Today!' : `${daysLeft}d`);
            } else if (daysLeft <= 7) {
              urgencyBadge = 'badge-warning';
              urgencyText = `In ${daysLeft} days`;
            }

            return (
              <div 
                key={exam.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.15rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: index === 0 && !isPast ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                  boxShadow: var_shadow(index === 0 && !isPast),
                  opacity: isPast ? 0.7 : 1,
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: index === 0 && !isPast ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: index === 0 && !isPast ? '#fff' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}>
                    #{index + 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{exam.name}</span>
                      <span className={`badge ${urgencyBadge}`}>{urgencyText}</span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{exam.exam_type}</span>
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      📅 {exam.exam_date} &bull; ⏰ {exam.exam_time}
                      {exam.notes && <span> &bull; 💡 {exam.notes}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleDeleteExam(exam.id)}
                    className="btn btn-ghost btn-icon"
                    title="Delete Exam"
                    style={{ color: 'var(--accent-rose)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function var_shadow(isTop) {
  return isTop ? '0 4px 14px rgba(99, 102, 241, 0.15)' : 'var(--shadow-sm)';
}
