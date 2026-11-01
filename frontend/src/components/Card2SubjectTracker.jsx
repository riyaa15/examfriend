import React, { useState } from 'react';
import { 
  BookOpen, 
  Upload, 
  Plus, 
  Trash2, 
  Check, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  CheckCircle2, 
  Award,
  ArrowLeft,
  Edit2,
  X,
  Zap,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Card2SubjectTracker({ subjects, onRefresh, token }) {
  const [showForm, setShowForm] = useState(false);
  const [inputMode, setInputMode] = useState('pdf'); // 'pdf' | 'text'
  const [subjectName, setSubjectName] = useState('');
  const [numModules, setNumModules] = useState(5);
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [syllabusText, setSyllabusText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Topic & Module Edit States
  const [addingTopicModId, setAddingTopicModId] = useState(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState('');
  const [addingModuleSubId, setAddingModuleSubId] = useState(null);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [expandingModId, setExpandingModId] = useState(null);
  const [searchTopicQuery, setSearchTopicQuery] = useState('');

  // Expanded modules state
  const [expandedSubjects, setExpandedSubjects] = useState({});

  const toggleExpand = (subId) => {
    setExpandedSubjects(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      setError('Please provide a subject name.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', subjectName.trim());
      formData.append('num_modules', numModules.toString());
      
      if (inputMode === 'pdf' && syllabusFile) {
        formData.append('file', syllabusFile);
      } else if (inputMode === 'text' && syllabusText.trim()) {
        formData.append('syllabus_text', syllabusText.trim());
      }

      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed to create subject');
      }

      setSubjectName('');
      setNumModules(5);
      setSyllabusFile(null);
      setSyllabusText('');
      setShowForm(false);
      setSuccess(`Detailed syllabus for "${subjectName}" created with exhaustive topics!`);
      setTimeout(() => setSuccess(''), 5000);
      onRefresh();
    } catch (err) {
      setError(err.message || 'Error creating subject');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTopic = async (topicId, currentStatus, subjectId) => {
    try {
      const res = await fetch(`/api/topics/${topicId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.completion_percentage === 100 && !currentStatus) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
        onRefresh();
      }
    } catch (err) {
      console.error('Toggle topic error:', err);
    }
  };

  const handleAddTopic = async (moduleId) => {
    if (!newTopicTitle.trim()) return;
    try {
      const res = await fetch(`/api/modules/${moduleId}/topics`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ topic_title: newTopicTitle.trim() })
      });
      if (res.ok) {
        setNewTopicTitle('');
        setAddingTopicModId(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Add topic error:', err);
    }
  };

  const handleSaveEditTopic = async (topicId) => {
    if (!editingTopicTitle.trim()) return;
    try {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ topic_title: editingTopicTitle.trim() })
      });
      if (res.ok) {
        setEditingTopicId(null);
        setEditingTopicTitle('');
        onRefresh();
      }
    } catch (err) {
      console.error('Edit topic error:', err);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Delete this topic from the syllabus?')) return;
    try {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error('Delete topic error:', err);
    }
  };

  const handleAddModule = async (subjectId) => {
    if (!newModuleTitle.trim()) return;
    try {
      const res = await fetch(`/api/subjects/${subjectId}/modules`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ module_title: newModuleTitle.trim() })
      });
      if (res.ok) {
        setNewModuleTitle('');
        setAddingModuleSubId(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Add module error:', err);
    }
  };

  const handleExpandModule = async (moduleId) => {
    setExpandingModId(moduleId);
    try {
      const res = await fetch(`/api/modules/${moduleId}/expand`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setSuccess(d.message || 'Expanded module with detailed topics!');
        setTimeout(() => setSuccess(''), 4000);
        onRefresh();
      }
    } catch (err) {
      console.error('Expand module error:', err);
    } finally {
      setExpandingModId(null);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Move this subject and its syllabus to Card 9 (Trash)? You can restore it anytime.')) return;
    try {
      const res = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Subject moved to Card 9 Trash safely.');
        setTimeout(() => setSuccess(''), 4000);
        onRefresh();
      }
    } catch (err) {
      console.error('Delete subject error:', err);
    }
  };

  return (
    <div className="glass-card" id="card-subject-syllabus-tracker">
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
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
          }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Card 2: Subject & Detailed Syllabus Tracker</h2>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>Exhaustive Topic Extraction</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Extracts each & every individual topic from syllabus PDFs or text. Add, edit, or deep-expand topics on the fly!
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              style={{ padding: '0.5rem 1.15rem', fontSize: '0.85rem', fontWeight: 700 }}
            >
              <Plus size={16} /> Add Subject / Upload Detailed Syllabus
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          color: 'var(--accent-emerald)',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Add Subject Form */}
      {showForm && (
        <form onSubmit={handleCreateSubject} style={{
          background: 'var(--bg-surface)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-light)',
          marginBottom: '1.75rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--primary)" />
              <span>Register Subject & Parse Complete Syllabus</span>
            </h3>
            <span className="badge badge-primary">Deep Topic Decomposition</span>
          </div>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Subject Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Distributed Systems, Machine Learning, Compiler Design"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Expected Number of Units / Modules</label>
              <input
                type="number"
                min={1}
                max={15}
                className="form-input"
                value={numModules}
                onChange={(e) => setNumModules(parseInt(e.target.value) || 1)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Usually 5 modules in university curricula (or auto-detected from PDF/text).
              </span>
            </div>
          </div>

          {/* Syllabus Input Mode Switcher */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>
              How do you want to provide your syllabus?
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setInputMode('pdf')}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: inputMode === 'pdf' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: inputMode === 'pdf' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-subtle)',
                  color: inputMode === 'pdf' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'var(--transition)'
                }}
              >
                <Upload size={16} />
                <span>Upload Syllabus PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('text')}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: inputMode === 'text' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: inputMode === 'text' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-subtle)',
                  color: inputMode === 'text' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'var(--transition)'
                }}
              >
                <FileText size={16} />
                <span>Paste Syllabus Text Directly</span>
              </button>
            </div>
          </div>

          {inputMode === 'pdf' ? (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Upload Syllabus File (PDF, Photo, ZIP, Word, Text)
              </label>
              <input
                type="file"
                accept=".pdf,.zip,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.md,*"
                className="form-input"
                style={{ padding: '0.65rem' }}
                onChange={(e) => setSyllabusFile(e.target.files[0] || null)}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                💡 Supports digital & scanned PDFs, photos of syllabus pages, ZIP archives, Word docs and text files. All concepts are automatically extracted into a granular checklist!
              </p>
            </div>
          ) : (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Paste Raw Syllabus / Curriculum Text
              </label>
              <textarea
                className="form-input"
                rows={6}
                placeholder="Paste your module and topic descriptions here (e.g., Module 1: Introduction, Paging, Segmentation, TLB, Virtual Memory, Inverted Page Tables, Demand Paging...)"
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5 }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                💡 Direct text pasting guarantees 100% accurate topic extraction without any PDF OCR distortion.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
              style={{ fontWeight: 700 }}
            >
              {loading ? (
                <>
                  <Sparkles size={16} className="spin" />
                  <span>Extracting Exhaustive Topics...</span>
                </>
              ) : (
                'Extract Detailed Syllabus'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Search Filter for Topics */}
      {subjects.length > 0 && (
        <div style={{
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'var(--bg-subtle)',
          padding: '0.6rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search across all syllabus topics (e.g. 'Virtual Memory', 'Dijkstra', 'Backpropagation')..."
            value={searchTopicQuery}
            onChange={(e) => setSearchTopicQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.875rem',
              color: 'var(--text-primary)'
            }}
          />
          {searchTopicQuery && (
            <button 
              onClick={() => setSearchTopicQuery('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Subjects List & Hierarchy Tree */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {subjects.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)'
          }}>
            <BookOpen size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>No subjects registered yet</h3>
            <p style={{ fontSize: '0.875rem', marginTop: '0.35rem', maxWidth: '500px', margin: '0.35rem auto 1.25rem' }}>
              Upload your university syllabus PDF or paste your curriculum topics above. Our engine extracts every subtopic into an interactive checklist!
            </p>
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem' }}
            >
              <Plus size={16} /> Add Your First Subject
            </button>
          </div>
        ) : (
          subjects.map((sub) => {
            const isExpanded = !!expandedSubjects[sub.id]; // hidden by default until user clicks "View Modules"
            const pct = sub.completion_percentage || 0;
            
            // Progress Ring calculation
            const radius = 26;
            const circ = 2 * Math.PI * radius;
            const strokeOffset = circ - (pct / 100) * circ;
            const ringColor = pct === 100 ? '#10b981' : pct >= 50 ? '#6366f1' : '#06b6d4';

            return (
              <div 
                key={sub.id}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border-light)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Subject Header Card */}
                <div style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  background: 'var(--bg-subtle)',
                  borderBottom: isExpanded ? '1px solid var(--border-light)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {/* Dynamic Circular Progress Ring */}
                    <div className="progress-ring-container" title={`${pct}% Completed`}>
                      <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="32"
                          cy="32"
                          r={radius}
                          stroke="var(--border-light)"
                          strokeWidth="5"
                          fill="transparent"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r={radius}
                          stroke={ringColor}
                          strokeWidth="5"
                          fill="transparent"
                          strokeDasharray={circ}
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                        />
                      </svg>
                      <div className="progress-ring-text">
                        {pct}%
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{sub.name}</h3>
                        {pct === 100 && (
                          <span className="badge badge-success">
                            <Award size={12} /> 100% Mastered!
                          </span>
                        )}
                        {sub.syllabus_filename && (
                          <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                            <FileText size={10} /> {sub.syllabus_filename}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        <b>{sub.completed_topics}</b> of <b>{sub.total_topics}</b> granular topics mastered across {sub.modules?.length || 0} Modules
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => toggleExpand(sub.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem', fontWeight: 600 }}
                    >
                      {isExpanded ? (
                        <><ChevronUp size={15} /> Hide Modules</>
                      ) : (
                        <><ChevronDown size={15} /> View Modules ({sub.modules?.length} Units)</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(sub.id)}
                      className="btn btn-ghost btn-icon"
                      title="Move Subject to Trash (Card 9)"
                      style={{ color: 'var(--accent-rose)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress bar line */}
                <div style={{ height: '4px', background: 'var(--border-light)', width: '100%' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: ringColor,
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                {/* Expanded Modules and Topics Tree */}
                {isExpanded && (
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {sub.modules && sub.modules.length > 0 ? (
                      sub.modules.map((mod) => {
                        const modCompleted = mod.topics?.filter(t => t.is_completed).length || 0;
                        const modTotal = mod.topics?.length || 0;
                        const modPct = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;

                        // Filter topics by search query if present
                        const displayedTopics = searchTopicQuery.trim()
                          ? (mod.topics || []).filter(t => t.topic_title.toLowerCase().includes(searchTopicQuery.toLowerCase()))
                          : (mod.topics || []);

                        return (
                          <div 
                            key={mod.id}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              padding: '1.25rem',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            {/* Module Header Bar */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                              marginBottom: '0.85rem',
                              borderBottom: '1px dashed var(--border-light)',
                              paddingBottom: '0.65rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span className="badge badge-primary" style={{ fontWeight: 800 }}>
                                  Module {mod.module_number}
                                </span>
                                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                  {mod.module_title}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  ({modTotal} subtopics)
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ 
                                  fontSize: '0.8rem', 
                                  color: modPct === 100 ? 'var(--accent-emerald)' : 'var(--text-muted)', 
                                  fontWeight: 700 
                                }}>
                                  {modCompleted}/{modTotal} Done ({modPct}%)
                                </span>

                                {/* Deep Expand Button with AI */}
                                <button
                                  onClick={() => handleExpandModule(mod.id)}
                                  disabled={expandingModId === mod.id}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                                  title="Deep Expand: Auto-generate 10-15 detailed subtopics for this module"
                                >
                                  <Zap size={13} color="var(--accent-amber)" />
                                  <span>{expandingModId === mod.id ? 'Expanding...' : 'Deep Expand'}</span>
                                </button>

                                {/* Add Topic Button */}
                                <button
                                  onClick={() => {
                                    setAddingTopicModId(addingTopicModId === mod.id ? null : mod.id);
                                    setNewTopicTitle('');
                                  }}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                                >
                                  <Plus size={13} />
                                  <span>Add Topic</span>
                                </button>
                              </div>
                            </div>

                            {/* Add Topic Inline Form */}
                            {addingTopicModId === mod.id && (
                              <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                                padding: '0.5rem',
                                background: 'var(--bg-subtle)',
                                borderRadius: 'var(--radius-sm)'
                              }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Enter topic name (e.g., Dijkstra Shortest Path Algorithm, Derivation of Bounds)..."
                                  value={newTopicTitle}
                                  onChange={(e) => setNewTopicTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddTopic(mod.id);
                                    }
                                  }}
                                  autoFocus
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                                />
                                <button
                                  onClick={() => handleAddTopic(mod.id)}
                                  className="btn btn-primary"
                                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                                >
                                  Save Topic
                                </button>
                                <button
                                  onClick={() => setAddingTopicModId(null)}
                                  className="btn btn-ghost"
                                  style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {/* Detailed Topics List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {displayedTopics.length > 0 ? (
                                displayedTopics.map((topic) => {
                                  const isEditing = editingTopicId === topic.id;

                                  if (isEditing) {
                                    return (
                                      <div 
                                        key={topic.id}
                                        style={{
                                          display: 'flex',
                                          gap: '0.5rem',
                                          alignItems: 'center',
                                          padding: '0.35rem 0.5rem',
                                          background: 'rgba(99, 102, 241, 0.08)',
                                          borderRadius: 'var(--radius-sm)'
                                        }}
                                      >
                                        <input
                                          type="text"
                                          className="form-input"
                                          value={editingTopicTitle}
                                          onChange={(e) => setEditingTopicTitle(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleSaveEditTopic(topic.id);
                                            }
                                          }}
                                          autoFocus
                                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                                        />
                                        <button
                                          onClick={() => handleSaveEditTopic(topic.id)}
                                          className="btn btn-primary"
                                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingTopicId(null)}
                                          className="btn btn-ghost"
                                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={topic.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.45rem 0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: topic.is_completed ? 'rgba(16, 185, 129, 0.07)' : 'transparent',
                                        border: '1px solid transparent',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = topic.is_completed 
                                          ? 'rgba(16, 185, 129, 0.12)' 
                                          : 'var(--bg-subtle)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = topic.is_completed 
                                          ? 'rgba(16, 185, 129, 0.07)' 
                                          : 'transparent';
                                      }}
                                    >
                                      <label 
                                        className="custom-checkbox-wrapper"
                                        style={{ flex: 1, cursor: 'pointer', margin: 0 }}
                                      >
                                        <input
                                          type="checkbox"
                                          className="custom-checkbox"
                                          checked={topic.is_completed}
                                          onChange={() => handleToggleTopic(topic.id, topic.is_completed, sub.id)}
                                        />
                                        <span style={{
                                          fontSize: '0.875rem',
                                          color: topic.is_completed ? 'var(--text-muted)' : 'var(--text-primary)',
                                          textDecoration: topic.is_completed ? 'line-through' : 'none',
                                          fontWeight: topic.is_completed ? 400 : 500,
                                          lineHeight: 1.4
                                        }}>
                                          {topic.topic_title}
                                        </span>
                                      </label>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        {topic.is_completed && (
                                          <span style={{ fontSize: '0.725rem', color: 'var(--accent-emerald)', fontWeight: 700, marginRight: '0.4rem' }}>
                                            Done ✓
                                          </span>
                                        )}
                                        <button
                                          onClick={() => {
                                            setEditingTopicId(topic.id);
                                            setEditingTopicTitle(topic.topic_title);
                                          }}
                                          className="btn btn-ghost btn-icon"
                                          title="Edit topic name"
                                          style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTopic(topic.id)}
                                          className="btn btn-ghost btn-icon"
                                          title="Delete topic"
                                          style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
                                  {searchTopicQuery ? 'No topics matching search.' : 'No topics in this module. Click "+ Add Topic" or "⚡ Deep Expand" above!'}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No modules parsed yet.</p>
                    )}

                    {/* Add Module Row */}
                    <div style={{ marginTop: '0.5rem' }}>
                      {addingModuleSubId === sub.id ? (
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          background: 'var(--bg-subtle)',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)'
                        }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Enter new module title (e.g. Module 6: Cloud Native Technologies)..."
                            value={newModuleTitle}
                            onChange={(e) => setNewModuleTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddModule(sub.id);
                              }
                            }}
                            autoFocus
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                          />
                          <button
                            onClick={() => handleAddModule(sub.id)}
                            className="btn btn-primary"
                            style={{ padding: '0.45rem 0.9rem', fontSize: '0.825rem' }}
                          >
                            Save Module
                          </button>
                          <button
                            onClick={() => setAddingModuleSubId(null)}
                            className="btn btn-ghost"
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.825rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAddingModuleSubId(sub.id);
                            setNewModuleTitle('');
                          }}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.825rem', padding: '0.45rem 1rem', width: '100%', justifyContent: 'center' }}
                        >
                          <Plus size={15} />
                          <span>Add Another Module / Unit to {sub.name}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
