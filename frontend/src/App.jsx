import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import PageHeader from './components/PageHeader';
import DashboardHome from './components/DashboardHome';
import Card1ExamCountdown from './components/Card1ExamCountdown';
import Card2SubjectTracker from './components/Card2SubjectTracker';
import Card3StudyPlanGenerator from './components/Card3StudyPlanGenerator';
import Card4PracticePaperGenerator from './components/Card4PracticePaperGenerator';
import Card5AIVivaTester from './components/Card5AIVivaTester';
import Card6AITeacher from './components/Card6AITeacher';
import Card7Flashcards from './components/Card7Flashcards';
import Card8NotesDrive from './components/Card8NotesDrive';
import Card9Trash from './components/Card9Trash';
import MobileBottomNav from './components/MobileBottomNav';
import { 
  Sparkles, 
  GraduationCap,
  Menu
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('examfriend_theme') || 'light');
  
  // 2-Week Session Expiry Validator (If within 2 weeks -> Open Dashboard directly. If > 2 weeks -> Prompt login)
  const getValidSession = () => {
    const savedToken = localStorage.getItem('examfriend_token');
    const expiresAt = localStorage.getItem('examfriend_expires_at');
    if (!savedToken) return { token: '', user: null };
    if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
      // 2 Weeks Expired! Clear session
      localStorage.removeItem('examfriend_token');
      localStorage.removeItem('examfriend_user');
      localStorage.removeItem('examfriend_expires_at');
      return { token: '', user: null };
    }
    const savedUser = localStorage.getItem('examfriend_user');
    return { token: savedToken, user: savedUser ? JSON.parse(savedUser) : null };
  };

  const initialSession = getValidSession();
  const [user, setUser] = useState(initialSession.user);
  const [token, setToken] = useState(initialSession.token);
  const [authModalOpen, setAuthModalOpen] = useState(() => !initialSession.token);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trashCount, setTrashCount] = useState(0);

  // Core Data
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [plans, setPlans] = useState([]);
  const [papers, setPapers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedExamForSyllabus, setSelectedExamForSyllabus] = useState(null);

  // Routing State ('dashboard', 'countdown', 'syllabus', 'study-plan', 'practice-papers', 'viva', 'teacher', 'question-bank', 'notes', 'trash')
  const validViews = ['dashboard', 'countdown', 'syllabus', 'study-plan', 'practice-papers', 'viva', 'teacher', 'question-bank', 'notes', 'trash'];

  const getInitialView = () => {
    const hash = window.location.hash.replace('#', '');
    return validViews.includes(hash) ? hash : 'dashboard';
  };

  const [currentView, setCurrentView] = useState(getInitialView);

  // Sync with browser hash and history
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentView(validViews.includes(hash) ? hash : 'dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (viewName) => {
    window.location.hash = viewName;
    setCurrentView(viewName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('examfriend_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Fetch all user data
  const refreshAllData = async () => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Me & stats
      const meRes = await fetch('/api/auth/me', { headers });
      if (meRes.ok) {
        const meData = await meRes.json();
        setStats(meData.stats);
      } else if (meRes.status === 401) {
        handleLogout();
        return;
      }

      // Exams
      const examsRes = await fetch('/api/exams', { headers });
      if (examsRes.ok) setExams(await examsRes.json());

      // Subjects
      const subjRes = await fetch('/api/subjects', { headers });
      if (subjRes.ok) setSubjects(await subjRes.json());

      // Study Plans
      const plansRes = await fetch('/api/study-plans', { headers });
      if (plansRes.ok) setPlans(await plansRes.json());

      // Practice Papers
      const papersRes = await fetch('/api/practice-papers', { headers });
      if (papersRes.ok) setPapers(await papersRes.json());

      // Viva Sessions
      const sessRes = await fetch('/api/viva/sessions', { headers });
      if (sessRes.ok) setSessions(await sessRes.json());

      // Trash items count
      const trashRes = await fetch('/api/trash', { headers });
      if (trashRes.ok) {
        const trashData = await trashRes.json();
        setTrashCount(trashData.length);
      }

    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  useEffect(() => {
    if (token) {
      refreshAllData();
    } else {
      setAuthModalOpen(true);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('examfriend_token');
    localStorage.removeItem('examfriend_user');
    localStorage.removeItem('examfriend_expires_at');
    setUser(null);
    setToken('');
    setStats(null);
    setExams([]);
    setSubjects([]);
    setPlans([]);
    setPapers([]);
    setSessions([]);
    setTrashCount(0);
    setSidebarOpen(false);
    navigateTo('dashboard');
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    const curToken = localStorage.getItem('examfriend_token') || '';
    setToken(curToken);
    // Ensure 14 days expiration marker is set
    if (!localStorage.getItem('examfriend_expires_at')) {
      localStorage.setItem('examfriend_expires_at', String(Date.now() + 14 * 24 * 60 * 60 * 1000));
    }
    setAuthModalOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Interactive Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onNavigate={navigateTo}
        user={user}
        stats={stats}
        trashCount={trashCount}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      {/* Navbar */}
      <Navbar
        user={user}
        stats={stats}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onNavigate={navigateTo}
        trashCount={trashCount}
      />

      {/* Main Container */}
      <main className="app-main-content">
        
        {/* ================= VIEW 1: MAIN DASHBOARD HOME ================= */}
        {currentView === 'dashboard' && (
          <div className="dashboard-container">
            {/* The Purple Hero Intelligence Centerpiece */}
            <div className="hero-intelligence-banner">
              {/* Decorative background glows */}
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '260px',
                height: '260px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(30px)',
                pointerEvents: 'none'
              }} />

              {/* Top Row: Welcome & Metrics */}
              <div className="hero-top-row">
                <div style={{ maxWidth: '640px', flex: 1 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255, 255, 255, 0.22)',
                    backdropFilter: 'blur(10px)',
                    padding: '0.35rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    <Sparkles size={14} /> Student Exam Intelligence Hub
                  </div>

                  <h1 className="hero-title">
                    Welcome back, {user ? user.username : 'Student'}! 🎓
                  </h1>
                  <p className="hero-subtitle">
                    Your clean, distraction-free study space. Track exams, generate date-based study plans, test via AI viva, study with AI teacher, and practice question banks.
                  </p>
                </div>

                {/* Quick Metrics Widget */}
                {stats && (
                  <div className="hero-metrics-widget">
                    <div className="hero-metric-tile">
                      <div className="hero-metric-num">{stats.upcoming_exams}</div>
                      <div className="hero-metric-lbl">Upcoming Exams</div>
                    </div>
                    <div className="hero-metric-tile">
                      <div className="hero-metric-num">{stats.overall_progress}%</div>
                      <div className="hero-metric-lbl">Syllabus Done</div>
                    </div>
                    <div className="hero-metric-tile">
                      <div className="hero-metric-num">{stats.total_subjects}</div>
                      <div className="hero-metric-lbl">Subjects</div>
                    </div>
                    <div className="hero-metric-tile">
                      <div className="hero-metric-num">{stats.completed_topics}/{stats.total_topics}</div>
                      <div className="hero-metric-lbl">Topics Ticked</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar inside Purple Card: Open Menu Button + Quick Launch Cards */}
              <div className="hero-action-bar">
                {/* Big Open Menu Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="hero-menu-btn"
                  title="Open Full Sidebar Menu"
                >
                  <Menu size={18} />
                  <span>Open Menu & Cards</span>
                </button>

                {/* Quick Switch Pills across Cards 1 to 8 */}
                <div className="quick-launch-scroll-container">
                  <span className="quick-launch-label">
                    Quick Launch:
                  </span>
                  {[
                    { id: 'countdown', label: '1. Countdown' },
                    { id: 'syllabus', label: '2. Syllabus' },
                    { id: 'study-plan', label: '3. Plan' },
                    { id: 'practice-papers', label: '4. Papers' },
                    { id: 'viva', label: '5. Viva' },
                    { id: 'teacher', label: '6. AI Teacher' },
                    { id: 'question-bank', label: '7. Question Bank' },
                    { id: 'trash', label: '8. Trash' }
                  ].map(pill => (
                    <button
                      key={pill.id}
                      onClick={() => navigateTo(pill.id)}
                      className="quick-launch-pill"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dashboard 8-Card Interactive Grid */}
            <DashboardHome
              exams={exams}
              subjects={subjects}
              plans={plans}
              papers={papers}
              sessions={sessions}
              stats={stats}
              onNavigate={navigateTo}
            />
          </div>
        )}

        {/* ================= VIEW 2: DEDICATED FRESH PAGE FOR CARD 1 ================= */}
        {currentView === 'countdown' && (
          <div>
            <PageHeader
              currentModule="countdown"
              title="Card 1: Exam Countdown"
              badgeText="Live Chronological Ticker"
              badgeClass="badge-warning"
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
            />
            <Card1ExamCountdown
              exams={exams}
              subjects={subjects}
              onRefresh={refreshAllData}
              token={token}
              onSelectForStudy={(exam) => {
                navigateTo('study-plan');
              }}
              onOpenSyllabusForExam={(exam) => {
                setSelectedExamForSyllabus(exam);
                navigateTo('syllabus');
              }}
              onNavigate={navigateTo}
            />
          </div>
        )}

        {/* ================= VIEW 3: DEDICATED FRESH PAGE FOR CARD 2 ================= */}
        {currentView === 'syllabus' && (
          <div>
            <PageHeader
              currentModule="syllabus"
              title="Card 2: Subject & Syllabus Tracker"
              badgeText="Module & Topic Hierarchy"
              badgeClass="badge-cyan"
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
            />
            <Card2SubjectTracker
              subjects={subjects}
              exams={exams}
              initialSubjectName={selectedExamForSyllabus ? selectedExamForSyllabus.name : ''}
              onClearInitialExam={() => setSelectedExamForSyllabus(null)}
              onRefresh={refreshAllData}
              token={token}
              onNavigate={navigateTo}
            />
          </div>
        )}

        {/* ================= VIEW 4: DEDICATED FRESH PAGE FOR CARD 3 ================= */}
        {currentView === 'study-plan' && (
          <div>
            <PageHeader
              currentModule="study-plan"
              title="Card 3: Study Plan Generator"
              badgeText="Daily Roadmap & PDF Export"
              badgeClass="badge-primary"
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
            />
            <Card3StudyPlanGenerator
              exams={exams}
              subjects={subjects}
              plans={plans}
              onRefresh={refreshAllData}
              token={token}
            />
          </div>
        )}

        {/* ================= VIEW 5: DEDICATED FRESH PAGE FOR CARD 4 ================= */}
        {currentView === 'practice-papers' && (
          <div>
            <PageHeader
              currentModule="practice-papers"
              title="Card 4: Practice Paper Generator"
              badgeText="ZIP Pattern Matcher & Printable PDF"
              badgeClass="badge-success"
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
            />
            <Card4PracticePaperGenerator
              subjects={subjects}
              papers={papers}
              onRefresh={refreshAllData}
              token={token}
            />
          </div>
        )}

        {/* ================= VIEW 6: DEDICATED FRESH PAGE FOR CARD 5 ================= */}
        {currentView === 'viva' && (
          <div>
            <PageHeader
              currentModule="viva"
              title="Card 5: AI Viva & Notes Tester"
              badgeText="Live Voice & Teacher AI"
              badgeClass="badge-danger"
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
            />
            <Card5AIVivaTester
              sessions={sessions}
              onRefresh={refreshAllData}
              token={token}
            />
          </div>
        )}

        {/* ================= VIEW 7: DEDICATED FRESH PAGE FOR CARD 6 ================= */}
        {currentView === 'teacher' && (
          <div>
            <PageHeader
              currentModule="teacher"
              title="Card 6: AI Teacher, Voice & Video"
              badgeText="Voice & Video Classroom"
              badgeClass="badge-primary"
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
            />
            <Card6AITeacher
              token={token}
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
              onRefresh={refreshAllData}
            />
          </div>
        )}

        {/* ================= VIEW 8: DEDICATED FRESH PAGE FOR CARD 7 ================= */}
        {(currentView === 'question-bank' || currentView === 'flashcards') && (
          <div>
            <PageHeader
              currentModule="question-bank"
              title="Card 7: AI Flashcards & Active Recall"
              badgeText="PDF Synthesis & 3D Interactive Flip"
              badgeClass="badge-warning"
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
            />
            <Card7Flashcards
              token={token}
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
              onRefresh={refreshAllData}
            />
          </div>
        )}

        {/* ================= VIEW 9: DEDICATED FRESH PAGE FOR CARD 8 ================= */}
        {currentView === 'notes' && (
          <div>
            <PageHeader
              currentModule="notes"
              title="Card 8: Student Notes Drive"
              badgeText="Store, Organize & Revise Notes"
              badgeClass="badge-primary"
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
            />
            <Card8NotesDrive
              token={token}
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
              onRefresh={refreshAllData}
            />
          </div>
        )}

        {/* ================= VIEW 10: DEDICATED FRESH PAGE FOR CARD 9 ================= */}
        {currentView === 'trash' && (
          <div>
            <PageHeader
              currentModule="trash"
              title="Card 9: Trash & Safe Data Recovery"
              badgeText="Recycle Bin for Cards 1-8"
              badgeClass="badge-danger"
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
            />
            <Card9Trash
              token={token}
              onBack={() => navigateTo('dashboard')}
              onNavigate={navigateTo}
              onRefresh={refreshAllData}
            />
          </div>
        )}

      </main>

      {/* Student Friendly Footer */}
      <footer style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-light)',
        padding: '1.5rem',
        textAlign: 'center',
        marginTop: '3rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <GraduationCap size={18} color="var(--primary)" />
          <b style={{ color: 'var(--text-primary)' }}>EXAMFRIEND</b> &bull; Built with FastAPI, PostgreSQL & React
        </div>
        <p>Empowering Students Worldwide to Plan, Practice, and Ace Every Exam 🚀</p>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Floating Bottom Navigation Bar on Mobile */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenMenu={() => setSidebarOpen(true)}
      />
    </div>
  );
}
