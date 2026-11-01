import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Upload,
  FileArchive,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Check,
  Copy,
  Download,
  Trash2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Layers,
  ChevronDown,
  ChevronUp,
  Award,
  Presentation,
  Mic,
  Calendar,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Card7QuestionBank({ token, onBack, onNavigate, onRefresh }) {
  const [questionBanks, setQuestionBanks] = useState([]);
  const [activeBank, setActiveBank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [subjectName, setSubjectName] = useState('');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetMarks, setTargetMarks] = useState('all');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedMarks, setSelectedMarks] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [expandedSolutions, setExpandedSolutions] = useState({});

  // Fetch all Question Banks
  const fetchQuestionBanks = async () => {
    if (!token) return;
    setFetching(true);
    try {
      const res = await fetch('/api/question-banks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuestionBanks(data);
        if (data.length > 0 && !activeBank) {
          setActiveBank(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching question banks:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchQuestionBanks();
  }, [token]);

  // Form Submission: Upload ZIP & Make Question Bank
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      setError('Please provide a subject name.');
      return;
    }
    if (!selectedFile) {
      setError('Please upload a ZIP file containing past exam papers (or question paper PDF).');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('subject_name', subjectName.trim());
      formData.append('title', title.trim() || `${subjectName.trim()} Master Question Bank`);
      formData.append('file', selectedFile);
      if (targetMarks !== 'all') {
        formData.append('target_marks', targetMarks);
      }

      const res = await fetch('/api/question-banks/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to generate question bank');
      }

      const bankData = await res.json();
      setActiveBank(bankData);
      setSuccess(`Built Question Bank with ${bankData.total_questions} unique questions! Filtered out all duplicates.`);
      setSelectedFile(null);
      setTitle('');
      fetchQuestionBanks();
      if (onRefresh) onRefresh();

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.message || 'Error creating Question Bank');
    } finally {
      setLoading(false);
    }
  };

  // Toggle question solved status
  const handleToggleSolved = async (questionId, currentStatus) => {
    if (!activeBank) return;
    try {
      const newStatus = !currentStatus;
      const res = await fetch(`/api/question-banks/${activeBank.id || activeBank.question_bank_id}/toggle-solved`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question_id: questionId,
          is_solved: newStatus
        })
      });

      if (res.ok) {
        // Update locally
        const updatedQuestions = (activeBank.questions || []).map(q => {
          if (q.id === questionId) {
            return { ...q, is_solved: newStatus };
          }
          return q;
        });

        setActiveBank(prev => ({
          ...prev,
          questions: updatedQuestions,
          solved_count: updatedQuestions.filter(q => q.is_solved).length
        }));

        if (newStatus) {
          confetti({
            particleCount: 30,
            spread: 45,
            origin: { y: 0.7 }
          });
        }
      }
    } catch (err) {
      console.error('Error toggling solved question:', err);
    }
  };

  // Toggle Solution Expand
  const toggleSolution = (id) => {
    setExpandedSolutions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy Question & Solution
  const handleCopyQuestion = (q) => {
    const textToCopy = `Question: ${q.question}\nMarks: ${q.marks} Marks\nModule: ${q.module_name || 'N/A'}\nFrequency: Asked ${q.frequency} times\n\nModel Solution / Key Points:\n${q.model_answer || 'Key conceptual points for exam answer.'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Soft Delete Question Bank (Moves to Card 9 Trash)
  const handleDeleteBank = async (bankId) => {
    if (!window.confirm('Move this Question Bank to Trash (Card 9)? You can restore it anytime.')) return;
    try {
      const res = await fetch(`/api/question-banks/${bankId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setQuestionBanks(prev => prev.filter(b => b.id !== bankId));
        if (activeBank?.id === bankId) {
          setActiveBank(questionBanks.find(b => b.id !== bankId) || null);
        }
        setSuccess('Question Bank moved to Card 9 Trash.');
        setTimeout(() => setSuccess(''), 4000);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error deleting question bank:', err);
    }
  };

  // Filter Questions
  const rawQuestions = activeBank?.questions || [];
  const filteredQuestions = rawQuestions.filter(q => {
    const matchesSearch = !searchQuery.trim() || 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.model_answer && q.model_answer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.module_name && q.module_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesModule = selectedModule === 'all' || 
      String(q.module_number) === String(selectedModule);

    const matchesMarks = selectedMarks === 'all' || 
      (selectedMarks === '2' && q.marks <= 2) ||
      (selectedMarks === '5' && q.marks >= 3 && q.marks <= 7) ||
      (selectedMarks === '10' && q.marks >= 8);

    const matchesPriority = selectedPriority === 'all' || 
      (selectedPriority === 'repeated' && q.frequency > 1) ||
      (selectedPriority === 'solved' && q.is_solved) ||
      (selectedPriority === 'unsolved' && !q.is_solved);

    return matchesSearch && matchesModule && matchesMarks && matchesPriority;
  });

  const totalQuestionsCount = rawQuestions.length;
  const solvedCount = rawQuestions.filter(q => q.is_solved).length;
  const solvedPct = totalQuestionsCount > 0 ? Math.round((solvedCount / totalQuestionsCount) * 100) : 0;
  const repeatedQuestionsCount = rawQuestions.filter(q => q.frequency > 1).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Top Banner & Control Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem 2rem',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        boxShadow: '0 8px 30px rgba(14, 165, 233, 0.35)'
      }}>
        <div style={{ maxWidth: '780px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.22)',
            backdropFilter: 'blur(8px)',
            padding: '0.3rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            <Sparkles size={14} /> Card 7: Make Question Bank (ZIP Deduplication)
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem', lineHeight: 1.25 }}>
            Deduplicated Master Question Bank 📚
          </h2>
          <p style={{ fontSize: '0.95rem', opacity: 0.95, lineHeight: 1.55, margin: 0 }}>
            Upload your question paper <b>ZIP</b> (containing 3 to 10+ past university exam papers). Our AI extracts every question, <b>merges repeated duplicates</b>, tracks recurrence frequency, and provides step-by-step model solutions!
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {onBack && (
            <button
              onClick={onBack}
              className="btn btn-secondary"
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                color: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.35)',
                fontWeight: 700
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          {activeBank?.pdf_url && (
            <a
              href={activeBank.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                background: '#ffffff',
                color: '#0284c7',
                border: 'none',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
              }}
            >
              <Download size={16} /> Download Question Bank PDF
            </a>
          )}

          {activeBank && (
            <button
              onClick={() => handleDeleteBank(activeBank.id || activeBank.question_bank_id)}
              className="btn btn-secondary"
              style={{
                background: 'rgba(239, 68, 68, 0.25)',
                color: '#ffcaca',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                fontWeight: 700
              }}
              title="Soft delete to Card 9 Trash"
            >
              <Trash2 size={16} /> Move to Trash (Card 9)
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          color: 'var(--accent-rose)',
          fontSize: '0.9rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          color: 'var(--accent-emerald)',
          fontSize: '0.9rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Main Grid: Upload & Generator Form + Question Bank Explorer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(330px, 400px) 1fr',
        gap: '1.75rem',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Form & Saved Question Banks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Upload & Generator Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <FileArchive size={20} color="var(--primary)" />
              <span>Make Question Bank</span>
            </h3>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Subject Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Computer Networks, Machine Learning"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Question Bank Title (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 5-Year Solved Endterm Question Bank"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Upload Question Papers ZIP *
                </label>
                <div style={{
                  border: '2px dashed var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem 1rem',
                  textAlign: 'center',
                  background: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}>
                  <input
                    type="file"
                    id="qb-zip-upload"
                    accept=".zip,.pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.md,*"
                    style={{ display: 'none' }}
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  />
                  <label htmlFor="qb-zip-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Upload size={20} />
                    </div>
                    {selectedFile ? (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                          {selectedFile.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB &bull; Ready to Analyze
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          Click to upload past papers (ZIP, PDF, Photo, Word, Text)
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Upload ZIP archives, question PDFs, photos of exam sheets, or notes
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Target Marks Filter (Optional)</label>
                <select
                  className="form-input"
                  value={targetMarks}
                  onChange={(e) => setTargetMarks(e.target.value)}
                >
                  <option value="all">All Questions (2M, 5M, 10M, 15M)</option>
                  <option value="short">Short Answer Only (2-3 Marks)</option>
                  <option value="medium">Medium Conceptual (5-7 Marks)</option>
                  <option value="long">Long / Essay / Numerical (10-15 Marks)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 1.25rem',
                  fontWeight: 800,
                  fontSize: '0.925rem',
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <Sparkles size={18} className="spin" />
                    <span>Extracting & Deduplicating Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate Non-Repeated Question Bank</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Saved Question Banks Drawer */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={16} color="var(--primary)" />
                <span>Your Saved Question Banks</span>
              </h4>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                {questionBanks.length} Total
              </span>
            </div>

            {questionBanks.length === 0 ? (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, padding: '0.5rem 0' }}>
                No question banks built yet. Upload a question paper ZIP above to start!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                {questionBanks.map((b) => {
                  const isActive = activeBank?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setActiveBank(b)}
                      style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: 'var(--radius-md)',
                        background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-subtle)',
                        border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {b.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {b.total_questions} Questions &bull; {b.solved_count || 0} Solved &bull; {b.total_papers_analyzed} Papers
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBank(b.id);
                        }}
                        className="btn btn-ghost btn-icon"
                        title="Delete to Trash"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Question Bank Explorer */}
        <div>
          {activeBank ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Question Bank Metrics & Solved Progress Card */}
              <div className="glass-card" style={{ padding: '1.25rem 1.5rem', border: '1.5px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span className="badge badge-cyan" style={{ fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                      {activeBank.subject_name || 'Academic Subject'}
                    </span>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{activeBank.title}</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.08)',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {activeBank.total_papers_analyzed || 1}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Papers Analyzed
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(6, 182, 212, 0.08)',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      border: '1px solid rgba(6, 182, 212, 0.2)'
                    }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        {totalQuestionsCount}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Unique Questions
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                        {repeatedQuestionsCount}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Repeated & Merged
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {solvedCount}/{totalQuestionsCount}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Mastered
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revision Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <span>Revision Mastery: {solvedCount} of {totalQuestionsCount} Questions Practiced</span>
                    <span style={{ color: solvedPct === 100 ? 'var(--accent-emerald)' : 'var(--primary)' }}>{solvedPct}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border-light)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${solvedPct}%`,
                      background: solvedPct === 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'var(--grad-hero)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                background: 'var(--bg-surface)',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}>
                {/* Search Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 240px' }}>
                  <Search size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search questions or keywords (e.g., 'Dijkstra', 'Paging', 'Handshake')..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select
                    className="form-input"
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: 'auto' }}
                  >
                    <option value="all">All Modules</option>
                    <option value="1">Module 1</option>
                    <option value="2">Module 2</option>
                    <option value="3">Module 3</option>
                    <option value="4">Module 4</option>
                    <option value="5">Module 5</option>
                  </select>

                  <select
                    className="form-input"
                    value={selectedMarks}
                    onChange={(e) => setSelectedMarks(e.target.value)}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: 'auto' }}
                  >
                    <option value="all">All Marks</option>
                    <option value="2">2 Marks (Short)</option>
                    <option value="5">5 Marks (Medium)</option>
                    <option value="10">10+ Marks (Long/Numerical)</option>
                  </select>

                  <select
                    className="form-input"
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: 'auto' }}
                  >
                    <option value="all">All Priority</option>
                    <option value="repeated">⭐ Repeated Questions</option>
                    <option value="unsolved">Unsolved Only</option>
                    <option value="solved">Solved Only</option>
                  </select>
                </div>
              </div>

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredQuestions.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2.5rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)'
                  }}>
                    <HelpCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p style={{ fontWeight: 600 }}>No questions matching your search filters.</p>
                  </div>
                ) : (
                  filteredQuestions.map((q, idx) => {
                    const isExpanded = expandedSolutions[q.id];
                    const isCopied = copiedId === q.id;

                    return (
                      <div
                        key={q.id || idx}
                        style={{
                          background: q.is_solved ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-surface)',
                          border: q.is_solved ? '1.5px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1.25rem',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'var(--transition)'
                        }}
                      >
                        {/* Question Top Row: Checkbox + Badges */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                            <label className="custom-checkbox-wrapper" style={{ marginTop: '0.2rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                className="custom-checkbox"
                                checked={!!q.is_solved}
                                onChange={() => handleToggleSolved(q.id, q.is_solved)}
                              />
                            </label>

                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '1.025rem',
                                fontWeight: 700,
                                color: q.is_solved ? 'var(--text-muted)' : 'var(--text-primary)',
                                textDecoration: q.is_solved ? 'line-through' : 'none',
                                lineHeight: 1.45,
                                marginBottom: '0.5rem'
                              }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 800, marginRight: '0.35rem' }}>
                                  Q{idx + 1}.
                                </span>
                                {q.question}
                              </div>

                              {/* Badges Row */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                  {q.module_name || `Module ${q.module_number || 1}`}
                                </span>

                                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                                  {q.marks} Marks
                                </span>

                                {q.question_type && (
                                  <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                    {q.question_type}
                                  </span>
                                )}

                                {q.frequency > 1 ? (
                                  <span className="badge badge-warning" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                                    ⭐ Repeated {q.frequency}x in Past Papers
                                  </span>
                                ) : (
                                  <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                    Asked Once
                                  </span>
                                )}

                                {q.exam_probability && (
                                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                                    {q.exam_probability}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleCopyQuestion(q)}
                              className="btn btn-ghost btn-icon"
                              title="Copy Question & Model Solution"
                              style={{ color: isCopied ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
                            >
                              {isCopied ? <Check size={16} /> : <Copy size={16} />}
                            </button>

                            <button
                              onClick={() => toggleSolution(q.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.3rem' }}
                            >
                              {isExpanded ? (
                                <><ChevronUp size={13} /> Hide Solution</>
                              ) : (
                                <><ChevronDown size={13} /> View Solution</>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Model Answer & Key Points */}
                        {isExpanded && (
                          <div style={{
                            background: 'var(--bg-subtle)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-light)',
                            marginTop: '0.75rem',
                            fontSize: '0.875rem',
                            lineHeight: 1.6
                          }}>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                              Model Answer & Key Solution Steps:
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                              {q.model_answer || '1. Define the fundamental concept with formal terminology. 2. Illustrate with standard block diagram. 3. Derive governing equations and state asymptotic complexity bounds.'}
                            </p>

                            {/* Jump to AI Teacher or AI Viva */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px dashed var(--border-light)', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Interactive Study Actions:
                              </span>

                              <button
                                onClick={() => {
                                  if (onNavigate) {
                                    window.localStorage.setItem('examfriend_prefill_topic', q.question);
                                    onNavigate('teacher');
                                  }
                                }}
                                className="btn btn-ghost"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: 'var(--primary)', gap: '0.3rem' }}
                              >
                                <Presentation size={13} />
                                <span>Learn in AI Teacher (Voice + Video)</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (onNavigate) {
                                    onNavigate('viva');
                                  }
                                }}
                                className="btn btn-ghost"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: 'var(--accent-rose)', gap: '0.3rem' }}
                              >
                                <Mic size={13} />
                                <span>Oral Viva Test</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px dashed var(--border-light)',
              padding: '4rem 2rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <FileArchive size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No Question Bank Selected
              </h3>
              <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Upload your past year question papers ZIP in the form on the left. Our engine will read every exam paper, eliminate repeated questions, and generate a comprehensive question bank!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
