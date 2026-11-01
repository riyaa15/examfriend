import React, { useState, useEffect, useRef } from 'react';
import {
  Presentation,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  FileText,
  Upload,
  CheckCircle2,
  HelpCircle,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
  Headphones,
  Sliders,
  ArrowLeft,
  Video,
  Download,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
  MonitorPlay,
  Code,
  Languages,
  Globe
} from 'lucide-react';

export const SUPPORTED_LANGUAGES = [
  { code: 'English', label: 'English (Academic Masterclass)', flag: '🇬🇧', voiceLang: 'en-US' },
  { code: 'Hinglish', label: 'Hinglish (Hindi + English College Blend)', flag: '🇮🇳', voiceLang: 'hi-IN' },
  { code: 'Hindi', label: 'हिन्दी (Hindi)', flag: '🇮🇳', voiceLang: 'hi-IN' },
  { code: 'Spanish', label: 'Español (Spanish)', flag: '🇪🇸', voiceLang: 'es-ES' },
  { code: 'French', label: 'Français (French)', flag: '🇫🇷', voiceLang: 'fr-FR' },
  { code: 'German', label: 'Deutsch (German)', flag: '🇩🇪', voiceLang: 'de-DE' },
  { code: 'Bengali', label: 'বাংলা (Bengali)', flag: '🇧🇩', voiceLang: 'bn-IN' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)', flag: '🇮🇳', voiceLang: 'te-IN' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳', voiceLang: 'ta-IN' },
  { code: 'Marathi', label: 'मराठी (Marathi)', flag: '🇮🇳', voiceLang: 'mr-IN' },
  { code: 'Gujarati', label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳', voiceLang: 'gu-IN' },
  { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳', voiceLang: 'kn-IN' },
  { code: 'Malayalam', label: 'മലയാളം (Malayalam)', flag: '🇮🇳', voiceLang: 'ml-IN' },
  { code: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳', voiceLang: 'pa-IN' },
  { code: 'Arabic', label: 'العربية (Arabic)', flag: '🇸🇦', voiceLang: 'ar-SA' },
  { code: 'Russian', label: 'Русский (Russian)', flag: '🇷🇺', voiceLang: 'ru-RU' },
  { code: 'Portuguese', label: 'Português (Portuguese)', flag: '🇵🇹', voiceLang: 'pt-BR' },
  { code: 'Chinese', label: '中文 (Simplified Chinese)', flag: '🇨🇳', voiceLang: 'zh-CN' },
  { code: 'Japanese', label: '日本語 (Japanese)', flag: '🇯🇵', voiceLang: 'ja-JP' },
];

export default function Card6AITeacher({ token, onBack, onNavigate, onRefresh }) {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('comprehensive');
  const [language, setLanguage] = useState('English');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active Lesson State
  const [activeLesson, setActiveLesson] = useState(null);
  const [savedLessons, setSavedLessons] = useState([]);
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [copiedSolution, setCopiedSolution] = useState(false);

  // Voice Teacher Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [revealedQuiz, setRevealedQuiz] = useState({});

  // Video Blackboard Player State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  const synthRef = useRef(window.speechSynthesis || null);
  const utteranceRef = useRef(null);
  const blackboardRef = useRef(null);
  const videoIntervalRef = useRef(null);

  // Check for prefilled topic from Card 7 (Question Bank)
  useEffect(() => {
    const prefill = localStorage.getItem('examfriend_teacher_topic');
    if (prefill) {
      setTopic(prefill);
      localStorage.removeItem('examfriend_teacher_topic');
    }
  }, []);

  // Fetch past lessons
  const fetchLessons = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/teacher/lessons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedLessons(data);
        if (data.length > 0 && !activeLesson) {
          setActiveLesson(data[0]);
          setCurrentSlideIndex(0);
        }
      }
    } catch (err) {
      console.error('Error fetching lessons:', err);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [token]);

  // Clean up speech and video on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }
    };
  }, []);

  // Synchronize slide changes
  useEffect(() => {
    setCurrentSlideIndex(0);
    setIsPlayingVideo(false);
    stopVoice();
  }, [activeLesson?.id]);

  // Handle Form Submission
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a topic to explain.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    stopVoice();
    setIsPlayingVideo(false);

    try {
      const formData = new FormData();
      formData.append('topic', topic.trim());
      formData.append('style', style);
      formData.append('language', language);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/teacher/explain', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to generate explanation');
      }

      const lessonData = await res.json();
      setActiveLesson(lessonData);
      setCurrentSlideIndex(0);
      setSuccess(`Prof. Alex prepared your masterclass lecture & video slides in ${lessonData.language || language} on "${topic}"!`);
      setSelectedFile(null);
      fetchLessons();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || 'Error communicating with AI Teacher');
    } finally {
      setLoading(false);
    }
  };

  // Re-explain Active Lesson in Another Language
  const handleReexplainInLanguage = async (targetLang) => {
    if (!activeLesson?.topic || loading) return;
    setLanguage(targetLang);
    setLoading(true);
    setError('');
    setSuccess('');
    stopVoice();
    setIsPlayingVideo(false);

    try {
      const formData = new FormData();
      formData.append('topic', activeLesson.topic);
      formData.append('style', activeLesson.style || style);
      formData.append('language', targetLang);

      const res = await fetch('/api/teacher/explain', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to re-explain topic in selected language');
      }

      const lessonData = await res.json();
      setActiveLesson(lessonData);
      setCurrentSlideIndex(0);
      setSuccess(`Prof. Alex formulated a new masterclass explanation in ${targetLang} for "${activeLesson.topic}"!`);
      fetchLessons();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || 'Error communicating with AI Teacher');
    } finally {
      setLoading(false);
    }
  };

  // Delete Lesson (Soft Delete)
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Move this lesson to Trash? You can restore it anytime from Card 9 (Trash).')) return;
    try {
      stopVoice();
      setIsPlayingVideo(false);
      const res = await fetch(`/api/teacher/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSavedLessons(prev => prev.filter(l => l.id !== lessonId));
        if (activeLesson?.id === lessonId) {
          const nextLesson = savedLessons.find(l => l.id !== lessonId) || null;
          setActiveLesson(nextLesson);
          setCurrentSlideIndex(0);
        }
        setSuccess('Lesson moved to Trash. You can restore it from Card 9.');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error deleting lesson:', err);
    }
  };

  // Voice Playback Controls
  const startVoice = (customText = null, onEndCallback = null) => {
    if (!synthRef.current) {
      alert('Your browser does not support Web Speech synthesis.');
      return;
    }

    if (isPaused && !customText) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    synthRef.current.cancel();

    const scriptToSpeak = customText || activeLesson?.voice_script || activeLesson?.written_explanation?.slice(0, 1000) || '';
    if (!scriptToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(scriptToSpeak);
    utterance.rate = speechRate;
    utterance.pitch = 1.05;

    // Pick voice matching the lesson's language
    const currentLang = activeLesson?.language || language || 'English';
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === currentLang);
    const targetVoiceLang = langConfig?.voiceLang || 'en-US';
    const langCodePrefix = targetVoiceLang.split('-')[0].toLowerCase();

    utterance.lang = targetVoiceLang;

    const voices = synthRef.current.getVoices();
    let matchedVoice = null;

    if (langCodePrefix !== 'en') {
      matchedVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langCodePrefix));
    }
    if (!matchedVoice && (currentLang === 'Hinglish' || langCodePrefix === 'hi')) {
      matchedVoice = voices.find(v => v.lang && (v.lang.toLowerCase().includes('in') || v.lang.toLowerCase().startsWith('hi')));
    }
    if (!matchedVoice) {
      matchedVoice = voices.find(v => (v.lang.startsWith('en') || !langCodePrefix) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Samantha') || v.name.includes('David')));
    }
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const pauseVoice = () => {
    if (synthRef.current && isSpeaking && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  };

  const stopVoice = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // Video Blackboard Slide Controller
  const slides = activeLesson?.video_slides || [];

  const handleNextSlide = () => {
    if (slides.length === 0) return;
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      setIsPlayingVideo(false);
      stopVoice();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  // Synchronized Video Lecture Play
  const togglePlayVideo = () => {
    if (slides.length === 0) return;

    if (isPlayingVideo) {
      setIsPlayingVideo(false);
      stopVoice();
    } else {
      setIsPlayingVideo(true);
      playSlideWithNarration(currentSlideIndex);
    }
  };

  const playSlideWithNarration = (slideIdx) => {
    if (!slides || slideIdx >= slides.length) {
      setIsPlayingVideo(false);
      stopVoice();
      return;
    }

    const currentSlide = slides[slideIdx];
    const narrationText = currentSlide.narration || currentSlide.narration_cue || `${currentSlide.title}. ${(currentSlide.content || currentSlide.bullet_points || []).join('. ')}`;

    startVoice(narrationText, () => {
      // When narration finishes, advance to next slide after a 1.2s breather
      setTimeout(() => {
        if (slideIdx < slides.length - 1) {
          setCurrentSlideIndex(slideIdx + 1);
          playSlideWithNarration(slideIdx + 1);
        } else {
          setIsPlayingVideo(false);
        }
      }, 1200);
    });
  };

  // Video Generation and Download (.webm canvas recorder)
  const handleDownloadVideo = async () => {
    if (!slides || slides.length === 0) {
      alert('No slides available to compile into video.');
      return;
    }

    setIsRecordingVideo(true);
    setRecordProgress(0);

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(30);
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    } catch (e) {
      recorder = new MediaRecorder(stream);
    }

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTopic = (activeLesson.topic || 'Lesson').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'Lesson';
      const cleanLang = (activeLesson.language || 'English').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
      a.download = `${cleanTopic}_${cleanLang}_Masterclass_Video.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsRecordingVideo(false);
      setRecordProgress(0);
    };

    recorder.start();

    // Render each slide onto canvas for 3.2 seconds each
    const slideDurationMs = 3200;
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      setRecordProgress(Math.round(((i + 1) / slides.length) * 100));

      // Draw blackboard background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1280, 720);

      // Chalkboard border
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(16, 16, 1248, 688);

      // Header Banner with Language Tag
      const currentLessonLang = (activeLesson.language || 'ENGLISH').toUpperCase();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`EXAMFRIEND AI CLASSROOM • ${currentLessonLang} • SLIDE ${i + 1}/${slides.length}`, 60, 80);

      // Slide Title
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(s.title || activeLesson.topic, 60, 150);

      // Content bullet points
      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      let textY = 220;
      const bullets = s.content || s.bullet_points || [];
      if (Array.isArray(bullets)) {
        bullets.slice(0, 4).forEach((bullet) => {
          ctx.fillText(`• ${bullet}`, 80, textY);
          textY += 45;
        });
      }

      // Chalkboard formula or diagram box
      const diagramContent = s.board_diagram || s.diagram_ascii || s.chalkboard_formula;
      if (diagramContent) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(60, 420, 1160, 180);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.strokeRect(60, 420, 1160, 180);

        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('💡 Blackboard Concept Formula / Flow:', 80, 460);

        ctx.font = '20px monospace';
        ctx.fillStyle = '#fbbf24';
        const diagLines = String(diagramContent).split('\n').slice(0, 4);
        let diagY = 500;
        diagLines.forEach(line => {
          ctx.fillText(line, 80, diagY);
          diagY += 30;
        });
      }

      // Narration watermark
      const slideNarration = s.narration || s.narration_cue || s.title || '';
      ctx.font = 'italic 18px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Prof. Alex: "${slideNarration.slice(0, 110)}..."`, 60, 660);

      await new Promise(resolve => setTimeout(resolve, slideDurationMs));
    }

    recorder.stop();
  };

  const handleCopyNotes = () => {
    if (activeLesson?.written_explanation) {
      navigator.clipboard.writeText(activeLesson.written_explanation);
      setCopiedNotes(true);
      setTimeout(() => setCopiedNotes(false), 2200);
    }
  };

  const handleCopySolution = () => {
    const sol = activeLesson?.step_by_step_solution || activeLesson?.written_explanation || '';
    if (sol) {
      navigator.clipboard.writeText(sol);
      setCopiedSolution(true);
      setTimeout(() => setCopiedSolution(false), 2200);
    }
  };

  const toggleQuizAnswer = (idx) => {
    setRevealedQuiz(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const currentSlide = slides[currentSlideIndex] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Top Banner & Control Bar */}
      <div style={{
        background: 'var(--grad-hero)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem 2rem',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.25)'
      }}>
        <div style={{ maxWidth: '750px' }}>
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
            <Sparkles size={14} /> Card 6: AI Teacher, Voice & Video Explainer
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Meet Prof. Alex — Your Personal AI Professor 👨‍🏫
          </h2>
          <p style={{ fontSize: '0.925rem', opacity: 0.92, lineHeight: 1.5, margin: 0 }}>
            Enter any topic or upload your lecture notes/slides PDF. Prof. Alex formulates an exhaustive masterclass written breakdown, copies model exam solutions, speaks aloud with voice teaching, and provides an interactive chalkboard video lecture.
          </p>
        </div>

        {/* Global Standard Intuitive Controls */}
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
              <ArrowLeft size={16} /> Back
            </button>
          )}

          {activeLesson && (
            <button
              onClick={() => handleDeleteLesson(activeLesson.id || activeLesson.lesson_id)}
              className="btn btn-secondary"
              style={{
                background: 'rgba(239, 68, 68, 0.25)',
                color: '#ffcaca',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                fontWeight: 700
              }}
              title="Soft-delete lesson (moves to Card 9 Trash)"
            >
              <Trash2 size={16} /> Delete to Trash (Card 9)
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Input Form + Lesson Display */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 380px) 1fr',
        gap: '1.75rem',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Form & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Input Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Presentation size={20} color="var(--primary)" />
              <span>Ask AI Teacher</span>
            </h3>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-rose)',
                color: 'var(--accent-rose)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--accent-emerald)',
                color: 'var(--accent-emerald)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Topic Input */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Topic or Exam Question <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Page Replacement LRU vs FIFO, Backprop in Neural Nets, Normalization 1NF to BCNF"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Teaching Style */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Teaching Style
                </label>
                <select
                  className="form-control"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  disabled={loading}
                >
                  <option value="comprehensive">🎓 Comprehensive Academic Masterclass</option>
                  <option value="simplified">💡 Simplified ELI5 (Real-World Analogies)</option>
                  <option value="exam_cram">⚡ Exam Cram (Scoring Pointers & Traps)</option>
                  <option value="step_by_step">🔢 Step-by-Step Mathematical Walkthrough</option>
                </select>
              </div>

              {/* Explanation Language */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Languages size={16} color="var(--primary)" />
                    <span>Explanation Language</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {SUPPORTED_LANGUAGES.find(l => l.code === language)?.flag || '🌐'} {language}
                  </span>
                </label>
                <select
                  className="form-control"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={loading}
                  style={{ fontWeight: 600 }}
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Prof. Alex delivers written notes, exam solutions, chalkboard slides & voice speech in this language.
                </div>
              </div>

              {/* Optional Topic PDF Upload */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Reference Notes / Slides PDF</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <div style={{
                  border: '2px dashed var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  textAlign: 'center',
                  background: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    disabled={loading}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                  <Upload size={22} color="var(--primary)" style={{ margin: '0 auto 0.4rem' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {selectedFile ? selectedFile.name : 'Upload Topic PDF / Scanned Notes'}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'RapidOCR automatically parses handwritten & textbook pages'}
                  </div>
                </div>
              </div>

              {/* Standard Control: Start Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  marginTop: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: '16px', height: '16px' }} />
                    Prof. Alex is Generating Lecture & Video...
                  </>
                ) : (
                  <>
                    <Play size={16} /> Start Lecture & Video Lesson
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Saved Lessons Archive */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Lesson History ({savedLessons.length})</span>
              <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Soft-deletable</span>
            </h4>

            {savedLessons.length === 0 ? (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                No lessons generated yet. Type a topic above to begin!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {savedLessons.map(l => (
                  <div
                    key={l.id}
                    onClick={() => {
                      stopVoice();
                      setIsPlayingVideo(false);
                      setActiveLesson(l);
                      setCurrentSlideIndex(0);
                    }}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: activeLesson?.id === l.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-subtle)',
                      border: activeLesson?.id === l.id ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.topic}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                        <span>Style: {l.style}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                          🌐 {l.language || 'English'}
                        </span>
                        {l.pdf_filename && <span>• 📎 Has PDF</span>}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLesson(l.id);
                      }}
                      className="btn btn-secondary btn-icon"
                      style={{ width: '28px', height: '28px', color: 'var(--accent-rose)' }}
                      title="Delete to Trash"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Masterclass Lesson Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {activeLesson ? (
            <>
              {/* Active Lesson Context & Language Switcher Ribbon */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    <Languages size={14} />
                    <span>Language: <b>{activeLesson.language || 'English'}</b></span>
                  </span>
                  <span className="badge badge-secondary" style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}>
                    Style: <b>{activeLesson.style}</b>
                  </span>
                  {activeLesson.pdf_filename && (
                    <span className="badge badge-secondary" style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem' }}>
                      📎 {activeLesson.pdf_filename}
                    </span>
                  )}
                </div>

                {/* Quick 1-Click Re-Explain In Another Language */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Globe size={14} color="var(--primary)" />
                    Re-explain in:
                  </span>
                  <select
                    value={activeLesson.language || 'English'}
                    onChange={(e) => handleReexplainInLanguage(e.target.value)}
                    disabled={loading}
                    className="form-control"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      width: 'auto',
                      minWidth: '170px',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-full)'
                    }}
                    title="Re-explain this lesson topic into another language"
                  >
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* VIDEO CLASSROOM & BLACKBOARD PLAYER */}
              <div
                ref={blackboardRef}
                style={{
                  background: '#0d172a',
                  border: '3px solid #1e293b',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  color: '#f8fafc',
                  boxShadow: '0 12px 35px rgba(13, 23, 42, 0.6)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Blackboard Header with Controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #334155',
                  paddingBottom: '0.85rem',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      background: 'rgba(56, 189, 248, 0.2)',
                      padding: '0.35rem',
                      borderRadius: 'var(--radius-md)',
                      color: '#38bdf8'
                    }}>
                      <MonitorPlay size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                        🎥 AI Blackboard Video Classroom
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Synchronized blackboard visualizer & voice professor narration
                      </div>
                    </div>
                  </div>

                  {/* Video Actions: Play / Export Video */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={togglePlayVideo}
                      className="btn"
                      style={{
                        background: isPlayingVideo ? '#f43f5e' : 'var(--primary)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        padding: '0.45rem 0.85rem',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      {isPlayingVideo ? <Pause size={14} /> : <Play size={14} />}
                      <span>{isPlayingVideo ? 'Pause Video' : 'Play Video Lecture'}</span>
                    </button>

                    <button
                      onClick={handleDownloadVideo}
                      disabled={isRecordingVideo}
                      className="btn"
                      style={{
                        background: '#334155',
                        color: '#38bdf8',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        padding: '0.45rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid #475569'
                      }}
                      title="Export high-resolution WebM video to your computer"
                    >
                      <Download size={14} />
                      <span>{isRecordingVideo ? `Recording ${recordProgress}%` : 'Download Video'}</span>
                    </button>
                  </div>
                </div>

                {/* Chalkboard Stage */}
                {currentSlide ? (
                  <div style={{
                    minHeight: '260px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: 'rgba(15, 23, 42, 0.75)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed #334155'
                  }}>
                    {/* Slide Top Badge & Title */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: '#38bdf8',
                          letterSpacing: '1px'
                        }}>
                          Slide {currentSlideIndex + 1} of {slides.length} &bull; 🌐 {activeLesson.language || 'English'}
                        </span>
                        {isPlayingVideo && (
                          <span style={{
                            fontSize: '0.7rem',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                            Live Narration
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.75rem 0' }}>
                        {currentSlide.title}
                      </h3>

                      {/* Content Bullets */}
                      {(currentSlide.content || currentSlide.bullet_points) && (
                        <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          {(currentSlide.content || currentSlide.bullet_points).map((b, i) => (
                            <li key={i} style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Chalkboard formula or code diagram */}
                      {(currentSlide.board_diagram || currentSlide.diagram_ascii || currentSlide.chalkboard_formula) && (
                        <div style={{
                          background: '#090d16',
                          border: '1.5px solid #0284c7',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem 1rem',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          color: '#fbbf24',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.5,
                          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)'
                        }}>
                          <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                            [Chalkboard Formula & Visual Schema]
                          </div>
                          {currentSlide.board_diagram || currentSlide.diagram_ascii || currentSlide.chalkboard_formula}
                        </div>
                      )}
                    </div>

                    {/* Teacher Narration Caption Line */}
                    <div style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '4px solid #38bdf8',
                      fontSize: '0.825rem',
                      color: '#94a3b8',
                      fontStyle: 'italic'
                    }}>
                      <b style={{ color: '#38bdf8', fontStyle: 'normal' }}>Prof. Alex ({activeLesson.language || 'English'}):</b> "{currentSlide.narration || currentSlide.narration_cue || currentSlide.title}"
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No video slides available for this lesson.
                  </div>
                )}

                {/* Slide Scrubber and Navigation Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '1rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid #334155',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  {/* Prev / Next Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      onClick={handlePrevSlide}
                      disabled={currentSlideIndex === 0}
                      className="btn"
                      style={{
                        background: '#1e293b',
                        color: '#f8fafc',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                        border: '1px solid #334155'
                      }}
                    >
                      <SkipBack size={13} /> Prev
                    </button>

                    <button
                      onClick={handleNextSlide}
                      disabled={currentSlideIndex >= slides.length - 1}
                      className="btn"
                      style={{
                        background: '#1e293b',
                        color: '#f8fafc',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                        border: '1px solid #334155'
                      }}
                    >
                      Next <SkipForward size={13} />
                    </button>
                  </div>

                  {/* Slide Indicators */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {slides.map((_, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setCurrentSlideIndex(idx);
                          if (isPlayingVideo) playSlideWithNarration(idx);
                        }}
                        style={{
                          width: currentSlideIndex === idx ? '24px' : '8px',
                          height: '8px',
                          borderRadius: 'var(--radius-full)',
                          background: currentSlideIndex === idx ? '#38bdf8' : '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title={`Jump to Slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Status Indicator */}
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {slides.length} Interactive Video Slides
                  </span>
                </div>
              </div>

              {/* MODEL STEP-BY-STEP EXAM SOLUTION & COPY SECTION */}
              <div className="card" style={{
                padding: '1.75rem',
                border: '1.5px solid rgba(16, 185, 129, 0.3)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '0.85rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--accent-emerald)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        📋 Model Step-by-Step Solution (Exam Copy Ready)
                      </h4>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        Structured format optimized to score full marks in your answer sheet
                      </div>
                    </div>
                  </div>

                  {/* PROMINENT COPY SOLUTION BUTTON */}
                  <button
                    onClick={handleCopySolution}
                    className="btn btn-primary"
                    style={{
                      background: copiedSolution ? 'var(--accent-emerald)' : 'var(--grad-hero)',
                      padding: '0.55rem 1.1rem',
                      fontSize: '0.875rem',
                      fontWeight: 800,
                      gap: '0.5rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {copiedSolution ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedSolution ? 'Solution Copied!' : 'Copy Model Solution'}</span>
                  </button>
                </div>

                {/* Formatted Solution Text */}
                <div style={{
                  fontSize: '0.925rem',
                  lineHeight: 1.7,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  background: 'var(--bg-subtle)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)'
                }}>
                  {activeLesson.step_by_step_solution || activeLesson.written_explanation}
                </div>
              </div>

              {/* Voice Teacher Audio Control Deck */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.5rem',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: isSpeaking ? 'var(--grad-hero)' : 'var(--bg-subtle)',
                    color: isSpeaking ? '#ffffff' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSpeaking ? '0 0 16px var(--primary-glow)' : 'none',
                    animation: isSpeaking ? 'pulse 1.8s infinite' : 'none'
                  }}>
                    <Headphones size={24} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        Voice Teacher
                      </span>
                      {isSpeaking && (
                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                          Speaking Now 🎙️
                        </span>
                      )}
                      {isPaused && (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                          Paused ⏸️
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      Prof. Alex audio narration of key concepts and intuitive analogies
                    </div>
                  </div>
                </div>

                {/* Voice Standard Controls: Start / Pause / Stop / Speed */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {!isSpeaking || isPaused ? (
                    <button
                      onClick={() => startVoice()}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      <Play size={15} /> {isPaused ? 'Resume Voice' : 'Start Voice Lecture'}
                    </button>
                  ) : (
                    <button
                      onClick={pauseVoice}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      <Pause size={15} /> Pause
                    </button>
                  )}

                  {/* Standard Control: Stop */}
                  <button
                    onClick={stopVoice}
                    className="btn btn-secondary"
                    disabled={!isSpeaking && !isPaused}
                    style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', fontWeight: 700 }}
                    title="Stop speaking"
                  >
                    <VolumeX size={15} /> Stop Voice
                  </button>

                  {/* Speech Speed Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-subtle)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <Sliders size={13} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Speed:</span>
                    <select
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="0.75">0.75x</option>
                      <option value="1.0">1.0x Normal</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Conversational Voice Script Box */}
              {activeLesson.voice_script && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  fontSize: '0.925rem',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>
                    <Volume2 size={16} /> Spoken Teacher Script (What Prof. Alex Says):
                  </div>
                  <p style={{ fontStyle: 'italic', margin: 0, opacity: 0.95 }}>
                    "{activeLesson.voice_script}"
                  </p>
                </div>
              )}

              {/* Key Exam Takeaways Checklist */}
              {activeLesson.key_takeaways && activeLesson.key_takeaways.length > 0 && (
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-emerald)' }}>
                    <CheckCircle2 size={18} />
                    <span>High-Yield Exam Takeaways</span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.65rem' }}>
                    {activeLesson.key_takeaways.map((point, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          background: 'var(--bg-subtle)',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.85rem',
                          border: '1px solid var(--border-light)'
                        }}
                      >
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>•</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Written Explanation (Markdown Reader) */}
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span>📖 Written Lecture: {activeLesson.topic}</span>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                        🌐 {activeLesson.language || 'English'}
                      </span>
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Structured academic breakdown taught in {activeLesson.language || 'English'} with diagrams, real-world analogies, and formulas
                    </div>
                  </div>

                  <button
                    onClick={handleCopyNotes}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem', gap: '0.4rem' }}
                  >
                    {copiedNotes ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                    <span>{copiedNotes ? 'Copied to Clipboard!' : 'Copy Written Notes'}</span>
                  </button>
                </div>

                {/* Markdown text formatted presentation */}
                <div style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.75,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {activeLesson.written_explanation}
                </div>
              </div>

              {/* Quick Self-Check Active Recall Quiz */}
              {activeLesson.quick_quiz && activeLesson.quick_quiz.length > 0 && (
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                    <HelpCircle size={18} />
                    <span>Active Recall Flash Questions</span>
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {activeLesson.quick_quiz.map((q, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-subtle)',
                          padding: '1rem',
                          transition: 'var(--transition)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            Q{idx + 1}: {q.question}
                          </div>
                          <button
                            onClick={() => toggleQuizAnswer(idx)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            {revealedQuiz[idx] ? 'Hide Answer' : 'Reveal Answer'}
                          </button>
                        </div>

                        {revealedQuiz[idx] && (
                          <div style={{
                            marginTop: '0.75rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px dashed var(--border-light)',
                            fontSize: '0.875rem',
                            color: 'var(--accent-emerald)',
                            fontWeight: 600,
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center'
                          }}>
                            <CheckCircle2 size={16} />
                            <span>{q.answer}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="card" style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Presentation size={36} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                No Lecture Selected
              </h3>
              <p style={{ maxWidth: '440px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Type a topic on the left form and press <b>Start Lecture & Video Lesson</b>. Prof. Alex will formulate your personalized written lesson, copyable model exam solution, voice speech, and animated chalkboard video slides!
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
