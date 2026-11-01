import React from 'react';
import { 
  Clock, 
  BookOpen, 
  CalendarRange, 
  FileStack, 
  Mic, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Award,
  Layers,
  HelpCircle,
  TrendingUp,
  FileText,
  Presentation,
  Trash2,
  ShieldCheck,
  Volume2,
  FileArchive,
  Folder
} from 'lucide-react';

export default function DashboardHome({ 
  exams = [], 
  subjects = [], 
  plans = [], 
  papers = [], 
  sessions = [], 
  stats, 
  onNavigate 
}) {
  // Find closest upcoming exam for live card preview
  const now = new Date();
  const sortedExams = [...exams].sort((a, b) => {
    const dtA = new Date(`${a.exam_date}T${a.exam_time || '00:00'}`);
    const dtB = new Date(`${b.exam_date}T${b.exam_time || '00:00'}`);
    return dtA - dtB;
  });

  const closestExam = sortedExams.find(e => {
    const dt = new Date(`${e.exam_date}T${e.exam_time || '00:00'}`);
    return dt >= now;
  }) || sortedExams[0];

  let closestDays = null;
  if (closestExam) {
    const dt = new Date(`${closestExam.exam_date}T${closestExam.exam_time || '00:00'}`);
    closestDays = Math.ceil((dt - now) / (1000 * 60 * 60 * 24));
  }

  // Calculate overall syllabus stats
  const totalTopics = subjects.reduce((acc, s) => acc + (s.total_topics || 0), 0);
  const completedTopics = subjects.reduce((acc, s) => acc + (s.completed_topics || 0), 0);
  const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div>
      {/* Dashboard Introduction Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800 }}>
              Study Modules & Feature Hub
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Click on any module card to enter its <b>dedicated fresh page</b> with full-screen focus.
            </p>
          </div>
          <span className="badge badge-primary" style={{ padding: '0.4rem 0.85rem' }}>
            9 Standalone Study Pages & Modules
          </span>
        </div>
      </div>

      {/* Distinct Cards Grid */}
      <div className="dashboard-modules-grid">
        
        {/* ================= CARD 1 ================= */}
        <div 
          onClick={() => onNavigate('countdown')}
          className="glass-card"
          style={{
            cursor: 'pointer',
            border: '1.5px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.25s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'var(--accent-amber)';
            e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(245, 158, 11, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
              }}>
                <Clock size={24} />
              </div>
              <span className="badge badge-warning">Card 1</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>
              Exam Countdown
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
              Enter your exam schedule. Automatically sorts all tests chronologically with the closest upcoming exam on top and real-time live ticker.
            </p>

            {/* Mini Snapshot Preview */}
            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1rem'
            }}>
              {closestExam ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Next Up:
                    </span>
                    <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                      {closestDays <= 0 ? 'Today / Past' : `In ${closestDays} Days`}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                    {closestExam.name}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                    📅 {closestExam.exam_date} &bull; ⏰ {closestExam.exam_time}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No exams entered yet. Click to add your first exam countdown!
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {exams.length} Exams Tracked
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--accent-amber)'
            }}>
              <span>Open Countdown Page</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* ================= CARD 2 ================= */}
        <div 
          onClick={() => onNavigate('syllabus')}
          className="glass-card"
          style={{
            cursor: 'pointer',
            border: '1.5px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.25s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'var(--accent-cyan)';
            e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(6, 182, 212, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
              }}>
                <BookOpen size={24} />
              </div>
              <span className="badge badge-cyan">Card 2</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>
              Subject & Syllabus Tracker
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
              Upload syllabus PDF or paste text. Extracts exhaustive module & topic checklists without truncation, with ⚡ Deep Topic AI expansion, manual additions, and interactive tickboxes.
            </p>

            {/* Mini Progress Ring Preview */}
            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `conic-gradient(var(--accent-cyan) ${overallPct * 3.6}deg, var(--border-light) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)'
                }}>
                  {overallPct}%
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {subjects.length} Subjects Registered
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  {completedTopics} of {totalTopics} topics mastered
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Deep Subtopic Extraction &bull; Searchable
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--accent-cyan)'
            }}>
              <span>Open Syllabus Page</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* ================= CARD 3 ================= */}
        <div 
          onClick={() => onNavigate('study-plan')}
          className="glass-card"
          style={{
            cursor: 'pointer',
            border: '1.5px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.25s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(99, 102, 241, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
              }}>
                <CalendarRange size={24} />
              </div>
              <span className="badge badge-primary">Card 3</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>
              Study Plan Generator
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
              Select number of subjects to render linked subject selectors connected to Card 1 exams. Generates day-by-day study roadmap with PDF download.
            </p>

            {/* Mini Roadmap Preview */}
            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CalendarRange size={15} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {plans.length > 0 ? plans[0].title : 'Automated Daily Timetable'}
                  </span>
                </div>
                {plans.length > 0 && plans[0].plan_data && plans[0].plan_data[0] && (
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                    Day 1: {plans[0].plan_data[0].date}
                  </span>
                )}
              </div>
              {plans.length > 0 && plans[0].plan_data && plans[0].plan_data[0] ? (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                    Day 1 Topics ({plans[0].plan_data[0].subject}):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {(Array.isArray(plans[0].plan_data[0].topics)
                      ? plans[0].plan_data[0].topics
                      : (plans[0].plan_data[0].topic || '').split(' • ')
                    ).slice(0, 3).map((pt, pIdx) => (
                      <li key={pIdx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  Day 1 [Start Date] &rarr; Subject &rarr; Topic distribution in bullet points
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {plans.length} Plans &bull; PDF Ready
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--primary)'
            }}>
              <span>Open Planner Page</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* ================= CARD 4 ================= */}
        <div 
          onClick={() => onNavigate('practice-papers')}
          className="glass-card"
          style={{
            cursor: 'pointer',
            border: '1.5px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.25s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'var(--accent-emerald)';
            e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(16, 185, 129, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}>
                <FileStack size={24} />
              </div>
              <span className="badge badge-success">Card 4</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>
              Practice Paper Generator
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
              Upload a ZIP file of past year papers. Specify number of mock papers needed to generate replica practice exams with marking schemes & printable PDFs.
            </p>

            {/* Mini Paper Preview */}
            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <FileText size={15} color="var(--accent-emerald)" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Section A (2M) &bull; Section B (6M) &bull; Section C (10M)
                </span>
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                Integrated with known syllabus topics + revealable answer keys
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {papers.length} Mock Papers Available
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--accent-emerald)'
            }}>
              <span>Open Mock Papers Page</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* ================= CARD 5 ================= */}
        <div 
          onClick={() => onNavigate('viva')}
          className="glass-card"
          style={{
            cursor: 'pointer',
            border: '1.5px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.25s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'var(--secondary)';
            e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(236, 72, 153, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.3)'
              }}>
                <Mic size={24} />
              </div>
              <span className="badge badge-primary">Card 5</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>
              AI Viva & Notes Tester
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
              Upload notes PDF for interactive oral viva examination: Mode A (Long Answer viva with caring professor hints & rating) and Mode B (MCQ quiz).
            </p>

            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                <Mic size={14} /> Voice Professor Narration & Feedback
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Offers intelligent coaching if you get stuck mid-answer
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Live Voice Examiner
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--secondary)'
            }}>
              <span>Open Viva Room</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* ================= CARD 6: AI TEACHER ================= */}
        <div 
          className="glass-card"
          onClick={() => onNavigate('teacher')}
          style={{
            cursor: 'pointer',
            border: '1.5px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.25s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(99, 102, 241, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--grad-hero)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px var(--primary-glow)'
              }}>
                <Presentation size={24} />
              </div>
              <span className="badge badge-primary">Card 6</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>
              AI Teacher, Voice & Video
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
              Prof. Alex explains any topic with natural voice narration, copyable model exam solutions, and an interactive chalkboard video classroom with downloadable WebM video!
            </p>

            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                <Volume2 size={14} /> Voice Lecture &bull; 🌐 Multilingual (Hindi, Hinglish & more) &bull; 📋 Copy Solution &bull; 🎥 Video
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Includes synchronized slides, chalkboard diagrams, and active recall flashcards
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              AI Video & Voice Lecture
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--primary)'
            }}>
              <span>Launch Classroom</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* ================= CARD 7: AI FLASHCARDS GENERATOR ================= */}
        <div 
          className="glass-card"
          onClick={() => onNavigate('question-bank')}
          style={{
            cursor: 'pointer',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.25s ease',
            position: 'relative',
            background: 'linear-gradient(180deg, var(--bg-surface) 0%, rgba(245, 158, 11, 0.06) 100%)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#f59e0b';
            e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(245, 158, 11, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
              }}>
                <Zap size={24} />
              </div>
              <span className="badge badge-warning" style={{ background: '#f59e0b', color: '#fff' }}>Card 7 &bull; 3D Active Recall</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>
              AI Flashcards Generator 🎴⚡
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
              Upload any PDF lecture or textbook. Synthesizes aesthetic <b>3D interactive flip flashcards</b> with Leitner active recall, formulas, examiner traps, and printable pocket study cards!
            </p>

            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f59e0b' }}>
                  ⚡ PDF-to-Flashcards Synthesis
                </span>
                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>3D Flip & Leitner</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                4 Focus Modes &bull; Spaced Repetition Grading &bull; Printable Pocket PDF
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              PDF Synthesis &bull; Active Recall
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#f59e0b'
            }}>
              <span>Open Flashcards</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* ================= CARD 8: STUDENT NOTES DRIVE ================= */}
        <div 
          onClick={() => onNavigate('notes')}
          className="glass-card"
          style={{
            cursor: 'pointer',
            border: '1.5px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.25s ease',
            position: 'relative',
            background: 'linear-gradient(180deg, var(--bg-surface) 0%, rgba(59, 130, 246, 0.04) 100%)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#2563eb';
            e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(37, 99, 235, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(29, 78, 216, 0.35)'
              }}>
                <Folder size={24} />
              </div>
              <span className="badge badge-primary" style={{ background: '#2563eb', color: '#fff' }}>Card 8 &bull; Drive</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>
              Student Notes Drive 📂
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
              Centralized personal drive to <b>store, organize, write, and revise</b> all your lecture notes, PDFs, whiteboard photos, formula sheets, and cheatsheets with instant search & AI study tools.
            </p>

            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb' }}>
                  📁 Cloud Storage & Rich Notes
                </span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>AI Flashcards</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                PDF & Photo Storage &bull; In-Drive Reader &bull; Instant Search &bull; Subject Tagging
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Personal Notes Vault
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#2563eb'
            }}>
              <span>Open Notes Drive</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* ================= CARD 9: TRASH & RECYCLE BIN ================= */}
        <div 
          className="glass-card"
          onClick={() => onNavigate('trash')}
          style={{
            cursor: 'pointer',
            border: '1.5px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.25s ease',
            position: 'relative',
            background: 'linear-gradient(180deg, var(--bg-surface) 0%, rgba(239, 68, 68, 0.04) 100%)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'var(--accent-rose)';
            e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(239, 68, 68, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
              }}>
                <Trash2 size={24} />
              </div>
              <span className="badge badge-danger">Card 9</span>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>
              Trash & Safe Data Recovery 🗑️
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
              Safety vault for Cards 1 through 8. Accidental deletes from Exams, Subjects, Study Plans, Practice Papers, Viva, AI Teacher, Question Banks, or Notes Drive are safely recoverable anytime.
            </p>

            <div style={{
              background: 'var(--bg-subtle)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                <ShieldCheck size={14} /> Soft Delete Architecture
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Instant 1-click restore back to original card with intact associations
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Cards 1 to 8 Covered
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--accent-rose)'
            }}>
              <span>Open Trash Bin</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
