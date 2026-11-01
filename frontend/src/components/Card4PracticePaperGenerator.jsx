import React, { useState } from 'react';
import { 
  FileStack, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  HelpCircle, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function Card4PracticePaperGenerator({ subjects, papers, onRefresh, token }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [numPapers, setNumPapers] = useState(1);
  const [zipFile, setZipFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePaper, setActivePaper] = useState(null);
  const [revealedSolutions, setRevealedSolutions] = useState({});

  const toggleSolution = (qKey) => {
    setRevealedSolutions(prev => ({ ...prev, [qKey]: !prev[qKey] }));
  };

  const handleGeneratePaper = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      setError('Please select a subject to link with the syllabus.');
      return;
    }
    if (!zipFile) {
      setError('Please upload a ZIP file containing past year question papers.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('subject_id', selectedSubjectId);
      formData.append('num_papers', numPapers.toString());
      formData.append('file', zipFile);

      const res = await fetch('/api/practice-papers/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed to generate practice papers');
      }

      const data = await res.json();
      setZipFile(null);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaper = async (paperId) => {
    if (!window.confirm('Move this generated practice paper to Trash (Card 9)? You can restore it anytime.')) return;
    try {
      const res = await fetch(`/api/practice-papers/${paperId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (activePaper && activePaper.id === paperId) setActivePaper(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Delete paper error:', err);
    }
  };

  return (
    <div className="glass-card" id="card-practice-paper-generator">
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
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
          }}>
            <FileStack size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Card 4: Practice Paper Generator</h2>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>ZIP Format Matcher</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Upload past year papers ZIP &rarr; Generates new matching mock papers with answer keys & PDF
            </p>
          </div>
        </div>

        {activePaper && (
          <button
            onClick={() => setActivePaper(null)}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
          >
            <ArrowLeft size={15} /> Back to Paper Generator
          </button>
        )}
      </div>

      {/* Generator Form */}
      {!activePaper && (
        <form onSubmit={handleGeneratePaper} style={{
          background: 'var(--bg-surface)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="var(--accent-emerald)" />
            Configure Practice Paper Generation
          </h3>

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Select Target Subject</label>
              <select
                required
                className="form-select"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.total_topics} Topics known)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Practice Papers Needed</label>
              <input
                type="number"
                min={1}
                max={5}
                className="form-input"
                value={numPapers}
                onChange={(e) => setNumPapers(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label className="form-label">
              <Upload size={15} /> Upload Past Year Question Papers (ZIP File) *
            </label>
            <input
              type="file"
              required
              accept=".zip"
              className="form-input"
              style={{ padding: '0.5rem' }}
              onChange={(e) => setZipFile(e.target.files[0] || null)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Supports ZIP archives containing past examination PDFs, Word docs, or TXT files. AI extracts marking format and style!
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem' }}
            >
              {loading ? 'Analyzing Past Papers & Generating Mock Papers...' : 'Create Practice Papers'}
            </button>
          </div>
        </form>
      )}

      {/* Active Mock Paper Interactive Reader */}
      {activePaper && (
        <div style={{
          background: 'var(--bg-surface)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--border-light)',
          marginBottom: '1.5rem'
        }}>
          {/* Paper Header */}
          <div style={{
            textAlign: 'center',
            borderBottom: '2px solid var(--border-light)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem'
          }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
              EXAMFRIEND &bull; MOCK PRACTICE PAPER #{activePaper.paper_number || 1}
            </span>
            <h3 style={{ fontSize: '1.4rem', marginTop: '0.25rem' }}>{activePaper.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Subject: <b>{activePaper.subject_name}</b> &bull; Time: <b>{activePaper.duration_mins || 180} Mins</b> &bull; Max Marks: <b>{activePaper.total_marks || 100}</b>
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.85rem' }}>
              {activePaper.pdf_url && (
                <a
                  href={activePaper.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="btn btn-success"
                  style={{ textDecoration: 'none', padding: '0.45rem 1rem' }}
                >
                  <Download size={16} /> Download Paper as Printable PDF
                </a>
              )}
            </div>
          </div>

          {/* General Instructions */}
          {activePaper.paper_data?.instructions && (
            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}>
              <b>General Instructions:</b>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                {activePaper.paper_data.instructions.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sections Breakdown */}
          {(activePaper.paper_data?.sections || []).map((sec, secIdx) => (
            <div key={secIdx} style={{ marginBottom: '1.5rem' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.85rem'
              }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>
                  {sec.section_name} &bull; {sec.description}
                </span>
                <span className="badge badge-primary">{sec.marks_per_question} Marks Each</span>
              </div>

              {/* Questions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {(sec.questions || []).map((q, qIdx) => {
                  const qKey = `${secIdx}-${qIdx}`;
                  const isRevealed = revealedSolutions[qKey];

                  return (
                    <div 
                      key={qIdx}
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700, marginRight: '0.5rem', color: 'var(--primary)' }}>
                            Q.{q.q_no || `${qIdx + 1}`}
                          </span>
                          <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {q.question}
                          </span>
                        </div>
                        <span className="badge badge-cyan" style={{ flexShrink: 0 }}>
                          [{q.marks} Marks]
                        </span>
                      </div>

                      {/* Solution / Hint Toggle */}
                      {q.answer_hint && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => toggleSolution(qKey)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem' }}
                          >
                            {isRevealed ? <><ChevronUp size={13} /> Hide Solution Hint</> : <><HelpCircle size={13} /> View Model Solution Hint</>}
                          </button>

                          {isRevealed && (
                            <div style={{
                              marginTop: '0.5rem',
                              padding: '0.75rem',
                              background: 'rgba(16, 185, 129, 0.08)',
                              borderLeft: '3px solid var(--accent-emerald)',
                              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)'
                            }}>
                              <b style={{ color: 'var(--accent-emerald)' }}>Model Answer Key: </b>
                              {q.answer_hint}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generated Practice Papers List */}
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Available Practice Mock Papers ({papers.length})
        </div>

        {papers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '1.5rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: '0.875rem'
          }}>
            No practice papers generated yet. Select a subject, upload past papers ZIP, and click <b>"Create Practice Papers"</b>!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {papers.map((paper) => (
              <div 
                key={paper.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '0.85rem 1.15rem',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700 }}>{paper.title}</span>
                    <span className="badge badge-success">
                      {paper.total_marks || 100} Marks
                    </span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Subject: <b>{paper.subject_name}</b> &bull; Duration: {paper.duration_mins} Mins
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setActivePaper(paper)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    <Eye size={14} /> Open Paper
                  </button>

                  {paper.pdf_url && (
                    <a
                      href={paper.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="btn btn-success"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}
                      title="Download PDF"
                    >
                      <Download size={14} /> PDF
                    </a>
                  )}

                  <button
                    onClick={() => handleDeletePaper(paper.id)}
                    className="btn btn-ghost btn-icon"
                    title="Move to Trash (Card 9)"
                    style={{ color: 'var(--accent-rose)' }}
                  >
                    <Trash2 size={16} />
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
