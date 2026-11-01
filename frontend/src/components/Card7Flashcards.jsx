import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Volume2,
  Star,
  Download,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Award,
  Layers,
  LayoutGrid,
  Zap,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  BookOpen,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Card7Flashcards({ token, onBack, onNavigate, onRefresh }) {
  // Decks & Active Deck State
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);
  const [stats, setStats] = useState({ total_decks: 0, total_cards: 0, total_mastered: 0, average_mastery: 0 });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generation Modal / Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [topic, setTopic] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const [focusMode, setFocusMode] = useState('All Core Concepts');
  const [rawText, setRawText] = useState('');

  // Interactive Study State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel', 'grid', 'speed'
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDecksDrawer, setShowDecksDrawer] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Speed Recall Quiz State
  const [quizTimer, setQuizTimer] = useState(30);
  const [quizActive, setQuizActive] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const fileInputRef = useRef(null);

  // Focus Modes options
  const focusModes = [
    { id: 'All Core Concepts', label: 'All Core Concepts', desc: 'Balanced fundamentals, mechanisms & exam essentials', icon: '🎯' },
    { id: 'Formulas & Definitions', label: 'Formulas & Definitions', desc: 'Governing equations, laws, and precise terminology', icon: '📐' },
    { id: 'High-Yield Exam Hotspots', label: 'High-Yield Hotspots', desc: 'Questions repeatedly tested in university finals', icon: '🔥' },
    { id: 'Differentiations & Comparisons', label: 'Comparisons & Tables', desc: 'Contrasting components, protocols, and trade-offs', icon: '⚖️' },
  ];

  // 1. Fetch All Flashcard Decks
  const fetchDecks = async (selectDeckId = null) => {
    if (!token) return;
    setFetching(true);
    try {
      const res = await fetch('/api/flashcards/decks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDecks(data.decks || []);
        setStats(data.stats || { total_decks: 0, total_cards: 0, total_mastered: 0, average_mastery: 0 });

        if (data.decks && data.decks.length > 0) {
          const target = selectDeckId
            ? data.decks.find(d => d.id === selectDeckId) || data.decks[0]
            : (activeDeck ? data.decks.find(d => d.id === activeDeck.id) || data.decks[0] : data.decks[0]);
          loadSingleDeck(target.id);
        } else {
          setActiveDeck(null);
        }
      }
    } catch (err) {
      console.error('Error fetching decks:', err);
    } finally {
      setFetching(false);
    }
  };

  // 2. Load Single Deck with Cards
  const loadSingleDeck = async (deckId) => {
    if (!token || !deckId) return;
    try {
      const res = await fetch(`/api/flashcards/decks/${deckId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveDeck(data);
        setCurrentIndex(0);
        setIsFlipped(false);
        setShowHint(false);
      }
    } catch (err) {
      console.error('Error loading deck:', err);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, [token]);

  // Keyboard Shortcuts (Space to flip, arrows to navigate, 1/2/3 for grading)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1' && isFlipped) {
        e.preventDefault();
        handleGradeCard('hard');
      } else if (e.key === '2' && isFlipped) {
        e.preventDefault();
        handleGradeCard('good');
      } else if (e.key === '3' && isFlipped) {
        e.preventDefault();
        handleGradeCard('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, activeDeck]);

  // Filtered Cards for study
  const cards = activeDeck?.cards || [];
  const filteredCards = cards.filter(card => {
    if (filterStarredOnly && !card.is_starred) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const inQ = card.question?.toLowerCase().includes(query);
      const inA = card.answer?.toLowerCase().includes(query);
      const inTip = card.exam_tip?.toLowerCase().includes(query);
      const inCat = card.category?.toLowerCase().includes(query);
      return inQ || inA || inTip || inCat;
    }
    return true;
  });

  const currentCard = filteredCards[currentIndex] || null;

  // Navigation handlers
  const handleNext = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of deck reached
      triggerConfetti();
      setShowCompletionModal(true);
    }
  };

  const handlePrev = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : filteredCards.length - 1));
  };

  const handleShuffle = () => {
    if (!activeDeck || !activeDeck.cards) return;
    const shuffled = [...activeDeck.cards].sort(() => Math.random() - 0.5);
    setActiveDeck({ ...activeDeck, cards: shuffled });
    setCurrentIndex(0);
    setIsFlipped(false);
    setSuccess('Deck shuffled randomly! 🔀');
    setTimeout(() => setSuccess(''), 2500);
  };

  // Self-grading Active Recall
  const handleGradeCard = async (rating) => {
    if (!currentCard || !activeDeck) return;

    // Update in local state
    const updatedCards = activeDeck.cards.map(c => {
      if (c.id === currentCard.id) {
        return { ...c, mastery: rating };
      }
      return c;
    });

    const easyCount = updatedCards.filter(c => c.mastery === 'easy').length;
    const goodCount = updatedCards.filter(c => c.mastery === 'good').length;
    const newMasteryScore = Math.round(((easyCount * 100) + (goodCount * 50)) / updatedCards.length);

    setActiveDeck({
      ...activeDeck,
      cards: updatedCards,
      mastery_score: newMasteryScore,
      stats: {
        ...activeDeck.stats,
        easy: easyCount,
        good: goodCount,
        hard: updatedCards.filter(c => c.mastery === 'hard').length
      }
    });

    if (rating === 'easy') {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });
    }

    // Persist to backend
    try {
      await fetch(`/api/flashcards/decks/${activeDeck.id}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: f`Bearer ${token}` ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          cards: [{ id: currentCard.id, mastery: rating }]
        })
      });
    } catch (err) {
      console.error('Error updating progress:', err);
    }

    // Advance to next card smoothly
    setTimeout(() => {
      handleNext();
    }, 280);
  };

  // Toggle Star / Favorite
  const handleToggleStar = async (cardId, e) => {
    if (e) e.stopPropagation();
    if (!activeDeck) return;

    const targetCard = activeDeck.cards.find(c => c.id === cardId);
    if (!targetCard) return;

    const nextStarred = !targetCard.is_starred;
    const updatedCards = activeDeck.cards.map(c => c.id === cardId ? { ...c, is_starred: nextStarred } : c);

    setActiveDeck({ ...activeDeck, cards: updatedCards });

    try {
      await fetch(`/api/flashcards/decks/${activeDeck.id}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cards: [{ id: cardId, is_starred: nextStarred }]
        })
      });
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  // Text-to-Speech Web API
  const handleSpeak = (text, e) => {
    if (e) e.stopPropagation();
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/•/g, '').replace(/\*/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.6 }
    });
  };

  // Form Submission: Upload PDF & Generate Deck
  const handleGenerateDeck = async (e) => {
    e.preventDefault();
    if (!selectedFile && !rawText.trim() && !topic.trim()) {
      setError('Please either upload a PDF/file, provide text, or type a topic.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      if (selectedFile) formData.append('file', selectedFile);
      if (title.trim()) formData.append('title', title.trim());
      if (subjectName.trim()) formData.append('subject_name', subjectName.trim());
      if (topic.trim()) formData.append('topic', topic.trim());
      formData.append('card_count', cardCount);
      formData.append('focus_mode', focusMode);
      if (rawText.trim()) formData.append('raw_text', rawText.trim());

      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to generate flashcards');
      }

      const data = await res.json();
      setSuccess(`Generated "${data.deck.title}" with ${data.deck.cards_count} interactive flashcards! ⚡`);
      setShowUploadModal(false);
      setSelectedFile(null);
      setRawText('');
      setTitle('');
      setTopic('');

      triggerConfetti();
      fetchDecks(data.deck_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Seed Demo Deck
  const handleSeedDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/flashcards/seed-demo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess('Demo Flashcard Deck on Neural Networks & Deep Learning loaded! ⚡');
        triggerConfetti();
        fetchDecks(data.deck_id);
      }
    } catch (err) {
      setError('Could not load demo deck.');
    } finally {
      setLoading(false);
    }
  };

  // Soft Delete Deck
  const handleDeleteDeck = async (deckId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Move this flashcard deck to Card 9 Trash?')) return;

    try {
      const res = await fetch(`/api/flashcards/decks/${deckId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess('Flashcard deck moved to Card 9 Trash successfully.');
        setTimeout(() => setSuccess(''), 3000);
        fetchDecks();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setError('Failed to delete deck');
    }
  };

  // Reset mastery progress
  const handleResetProgress = async () => {
    if (!activeDeck) return;
    if (!window.confirm('Reset study progress for this deck? All cards will be marked unrated.')) return;

    const resetCards = activeDeck.cards.map(c => ({ id: c.id, mastery: 'unrated' }));
    try {
      await fetch(`/api/flashcards/decks/${activeDeck.id}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cards: resetCards })
      });
      loadSingleDeck(activeDeck.id);
      setSuccess('Progress reset! You can now study the deck fresh.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('Error resetting progress:', err);
    }
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* ---------------- TOP HERO & METRICS ---------------- */}
      <div style={{
        background: 'var(--grad-hero)',
        borderRadius: 24,
        padding: '2rem 2.25rem',
        color: '#ffffff',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient glow spots */}
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 660 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(8px)',
              borderRadius: 9999,
              fontSize: '0.825rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '0.85rem'
            }}>
              <Zap size={14} color="#fde047" /> Card 7 &bull; AI Flashcards & Active Recall
            </div>

            <h1 style={{
              fontSize: '2.15rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              marginBottom: '0.65rem'
            }}>
              PDF-to-Flashcard Synthesis 🎴⚡
            </h1>

            <p style={{
              fontSize: '1rem',
              opacity: 0.92,
              lineHeight: 1.5,
              fontWeight: 400
            }}>
              Transform lecture notes, textbook chapters, and past questions into interactive 3D study decks. Grade yourself with Leitner active recall, track conceptual mastery, and export printable pocket cards.
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minWidth: 200 }}>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                padding: '0.8rem 1.35rem',
                background: '#ffffff',
                color: '#4f46e5',
                border: 'none',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: '0.925rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Upload size={18} /> Upload PDF to Flashcards
            </button>

            <button
              onClick={handleSeedDemo}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                padding: '0.75rem 1.2rem',
                background: 'rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 14,
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)'}
            >
              <Sparkles size={16} /> Try Deep Learning Demo
            </button>

            {decks.length > 0 && (
              <button
                onClick={() => setShowDecksDrawer(!showDecksDrawer)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  padding: '0.65rem 1.1rem',
                  background: 'rgba(0, 0, 0, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 14,
                  fontSize: '0.825rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <Layers size={15} /> Switch Decks ({decks.length})
              </button>
            )}
          </div>
        </div>

        {/* Global Stats Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>Saved Decks</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>{stats.total_decks}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>Total Flashcards</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>{stats.total_cards}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>Overall Mastery</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fef08a' }}>{stats.average_mastery}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>Active Study Mode</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.4rem' }}>
              {activeDeck ? activeDeck.focus_mode : 'Ready to Learn'}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- ALERTS ---------------- */}
      {error && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 14,
          color: '#b91c1c',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 14,
          color: '#15803d',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* ---------------- NO DECKS STATE ---------------- */}
      {decks.length === 0 && !fetching && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 22,
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--primary)'
          }}>
            <Layers size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            No Flashcard Decks Yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 1.75rem', fontSize: '0.95rem' }}>
            Upload any course PDF, textbook chapter, or past paper to generate an interactive 3D flashcard study deck in seconds!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Upload size={18} /> Upload Study PDF
            </button>
            <button
              onClick={handleSeedDemo}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.75rem 1.4rem',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Sparkles size={18} color="var(--primary)" /> Load Neural Networks Demo
            </button>
          </div>
        </div>
      )}

      {/* ---------------- ACTIVE DECK STUDY INTERFACE ---------------- */}
      {activeDeck && (
        <div>
          {/* Deck Header Bar */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 18,
            padding: '1.15rem 1.5rem',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{
                  padding: '0.2rem 0.65rem',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--primary)',
                  borderRadius: 6,
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {activeDeck.subject_name || 'Exam'}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  &bull; {activeDeck.cards_count} Cards &bull; Mode: {activeDeck.focus_mode}
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-heading)' }}>
                {activeDeck.title}
              </h2>
            </div>

            {/* View Mode & Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Starred filter button */}
              <button
                onClick={() => setFilterStarredOnly(!filterStarredOnly)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 10,
                  border: '1px solid var(--border-light)',
                  background: filterStarredOnly ? '#fef3c7' : 'var(--bg-subtle)',
                  color: filterStarredOnly ? '#b45309' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer'
                }}
                title="Filter bookmarked cards"
              >
                <Star size={15} fill={filterStarredOnly ? '#f59e0b' : 'none'} color={filterStarredOnly ? '#f59e0b' : 'currentColor'} />
                Starred Only
              </button>

              {/* View toggle pills */}
              <div style={{
                display: 'flex',
                background: 'var(--bg-subtle)',
                padding: 3,
                borderRadius: 10,
                border: '1px solid var(--border-light)'
              }}>
                <button
                  onClick={() => setViewMode('carousel')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 8,
                    border: 'none',
                    background: viewMode === 'carousel' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'carousel' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Layers size={14} /> 3D Deck
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 8,
                    border: 'none',
                    background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'grid' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <LayoutGrid size={14} /> Grid
                </button>
              </div>

              {/* Printable PDF download */}
              {activeDeck.pdf_url && (
                <a
                  href={activeDeck.pdf_url}
                  download
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.85rem',
                    borderRadius: 10,
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    textDecoration: 'none'
                  }}
                >
                  <Download size={14} /> Printable PDF
                </a>
              )}

              {/* Delete Deck button */}
              <button
                onClick={(e) => handleDeleteDeck(activeDeck.id, e)}
                style={{
                  padding: '0.5rem 0.65rem',
                  borderRadius: 10,
                  border: '1px solid #fee2e2',
                  background: '#fff5f5',
                  color: '#ef4444',
                  cursor: 'pointer'
                }}
                title="Move Deck to Trash"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* ---------------- 3D CAROUSEL STUDY MODE ---------------- */}
          {viewMode === 'carousel' && (
            <div style={{ maxWidth: 840, margin: '0 auto' }}>
              {/* Progress & Card Index Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Card {filteredCards.length > 0 ? currentIndex + 1 : 0} of {filteredCards.length}
                </div>

                {/* Progress bar */}
                <div style={{
                  flex: 1,
                  maxWidth: 320,
                  margin: '0 1.25rem',
                  height: 8,
                  backgroundColor: 'var(--border-light)',
                  borderRadius: 9999,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${filteredCards.length > 0 ? ((currentIndex + 1) / filteredCards.length) * 100 : 0}%`,
                    height: '100%',
                    background: 'var(--grad-hero)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>
                    Mastery: {activeDeck.mastery_score || 0}%
                  </span>
                  <button
                    onClick={handleShuffle}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.825rem'
                    }}
                    title="Shuffle cards"
                  >
                    <Shuffle size={14} /> Shuffle
                  </button>
                  <button
                    onClick={handleResetProgress}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.825rem'
                    }}
                    title="Reset progress"
                  >
                    <RotateCw size={14} /> Reset
                  </button>
                </div>
              </div>

              {/* THE 3D FLIP CARD */}
              {currentCard ? (
                <div className="flashcard-perspective" style={{ width: '100%', marginBottom: '1.5rem' }}>
                  <div
                    className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                    style={{ cursor: 'pointer', minHeight: 440 }}
                  >
                    {/* ===== FRONT FACE (QUESTION) ===== */}
                    <div
                      className="flashcard-face flashcard-face-front flashcard-hero-glow"
                      style={{
                        background: 'var(--bg-surface)',
                        border: '2px solid rgba(99, 102, 241, 0.35)',
                        padding: '2.25rem 2.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      {/* Top Badges */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              background: 'rgba(99, 102, 241, 0.12)',
                              color: 'var(--primary)',
                              borderRadius: 9999,
                              fontSize: '0.775rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}>
                              {currentCard.category || 'Core Concept'}
                            </span>

                            <span style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: 9999,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: currentCard.difficulty === 'Easy' ? '#dcfce7' : (currentCard.difficulty === 'Medium' ? '#fef3c7' : '#fee2e2'),
                              color: currentCard.difficulty === 'Easy' ? '#15803d' : (currentCard.difficulty === 'Medium' ? '#b45309' : '#b91c1c')
                            }}>
                              {currentCard.difficulty || 'Medium'}
                            </span>

                            {currentCard.mastery && currentCard.mastery !== 'unrated' && (
                              <span style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: 6,
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                background: currentCard.mastery === 'easy' ? '#10b981' : (currentCard.mastery === 'good' ? '#f59e0b' : '#ef4444'),
                                color: '#ffffff'
                              }}>
                                {currentCard.mastery.toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={(e) => handleSpeak(currentCard.question, e)}
                              style={{
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '50%',
                                width: 34,
                                height: 34,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                              }}
                              title="Listen aloud"
                            >
                              <Volume2 size={16} />
                            </button>

                            <button
                              onClick={(e) => handleToggleStar(currentCard.id, e)}
                              style={{
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '50%',
                                width: 34,
                                height: 34,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: currentCard.is_starred ? '#f59e0b' : 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                              title="Star card"
                            >
                              <Star size={16} fill={currentCard.is_starred ? '#f59e0b' : 'none'} />
                            </button>
                          </div>
                        </div>

                        {/* Question Prompt */}
                        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: '0.5rem'
                          }}>
                            Question & Concept
                          </div>
                          <h3 style={{
                            fontSize: '1.55rem',
                            fontWeight: 700,
                            lineHeight: 1.35,
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-heading)'
                          }}>
                            {currentCard.question}
                          </h3>
                        </div>
                      </div>

                      {/* Hint & Flip CTA */}
                      <div>
                        {currentCard.exam_tip && (
                          <div style={{ marginBottom: '1rem' }} onClick={(e) => e.stopPropagation()}>
                            {showHint ? (
                              <div style={{
                                padding: '0.65rem 0.95rem',
                                background: '#fefce8',
                                border: '1px solid #fef08a',
                                borderRadius: 10,
                                fontSize: '0.85rem',
                                color: '#854d0e',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <HelpCircle size={16} />
                                <span>{currentCard.exam_tip}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowHint(true)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.825rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                              >
                                💡 Need a hint / memory clue?
                              </button>
                            )}
                          </div>
                        )}

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '1rem',
                          borderTop: '1px dashed var(--border-light)',
                          color: 'var(--text-muted)',
                          fontSize: '0.825rem'
                        }}>
                          <span>Press <b>SPACE</b> or Click to reveal answer</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontWeight: 600 }}>
                            Flip to Answer ↷
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ===== BACK FACE (ANSWER & RECALL SELF-GRADING) ===== */}
                    <div
                      className="flashcard-face flashcard-face-back flashcard-hero-glow"
                      style={{
                        background: 'var(--bg-surface)',
                        border: '2px solid rgba(16, 185, 129, 0.4)',
                        padding: '2.25rem 2.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      {/* Top Bar on Answer Side */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            background: '#dcfce7',
                            color: '#15803d',
                            borderRadius: 9999,
                            fontSize: '0.775rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em'
                          }}>
                            ✓ MODEL ANSWER & INSIGHTS
                          </span>

                          <button
                            onClick={(e) => handleSpeak(currentCard.answer, e)}
                            style={{
                              background: 'var(--bg-subtle)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '50%',
                              width: 34,
                              height: 34,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                            title="Read answer aloud"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>

                        {/* Model Answer Content */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <div style={{
                            fontSize: '0.95rem',
                            lineHeight: 1.6,
                            color: 'var(--text-primary)',
                            whiteSpace: 'pre-line'
                          }}>
                            {currentCard.answer}
                          </div>
                        </div>

                        {/* Examiner Golden Tip */}
                        {currentCard.exam_tip && (
                          <div style={{
                            padding: '0.75rem 1rem',
                            background: '#fefce8',
                            border: '1px solid #fde047',
                            borderRadius: 12,
                            marginBottom: '1.5rem',
                            fontSize: '0.85rem',
                            color: '#713f12',
                            lineHeight: 1.45
                          }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Sparkles size={14} color="#eab308" /> Examiner Secret & Memory Tip
                            </div>
                            <div>{currentCard.exam_tip}</div>
                          </div>
                        )}
                      </div>

                      {/* Active Recall Self-Grading Buttons */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <div style={{
                          fontSize: '0.775rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                          marginBottom: '0.65rem',
                          textAlign: 'center'
                        }}>
                          Rate Your Active Recall (Keys: 1, 2, 3)
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '0.75rem'
                        }}>
                          <button
                            onClick={() => handleGradeCard('hard')}
                            style={{
                              padding: '0.75rem',
                              borderRadius: 12,
                              border: '1px solid #fca5a5',
                              background: '#fff1f2',
                              color: '#b91c1c',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.2rem',
                              transition: 'var(--transition)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <span>🔴 Hard</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>Review Again [1]</span>
                          </button>

                          <button
                            onClick={() => handleGradeCard('good')}
                            style={{
                              padding: '0.75rem',
                              borderRadius: 12,
                              border: '1px solid #fde68a',
                              background: '#fffbeb',
                              color: '#b45309',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.2rem',
                              transition: 'var(--transition)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <span>🟡 Good</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>Review Soon [2]</span>
                          </button>

                          <button
                            onClick={() => handleGradeCard('easy')}
                            style={{
                              padding: '0.75rem',
                              borderRadius: 12,
                              border: '1px solid #86efac',
                              background: '#f0fdf4',
                              color: '#15803d',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.2rem',
                              transition: 'var(--transition)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <span>🟢 Easy!</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 500 }}>Mastered [3]</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  background: 'var(--bg-card)',
                  borderRadius: 20,
                  border: '1px solid var(--border-light)'
                }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No cards match your filter.</p>
                  <button
                    onClick={() => { setFilterStarredOnly(false); setSearchQuery(''); }}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 1rem',
                      borderRadius: 10,
                      background: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* Navigation Arrows & Flip Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <button
                  onClick={handlePrev}
                  disabled={filteredCards.length <= 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: 14,
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: filteredCards.length <= 1 ? 'not-allowed' : 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <ChevronLeft size={18} /> Previous Card
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.6rem',
                    borderRadius: 14,
                    border: 'none',
                    background: 'var(--grad-hero)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <RotateCw size={17} /> {isFlipped ? 'Flip to Question' : 'Flip to Answer'}
                </button>

                <button
                  onClick={handleNext}
                  disabled={filteredCards.length <= 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: 14,
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: filteredCards.length <= 1 ? 'not-allowed' : 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  Next Card <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- GRID STUDY MODE ---------------- */}
          {viewMode === 'grid' && (
            <div>
              {/* Search Bar */}
              <div style={{
                position: 'relative',
                marginBottom: '1.5rem',
                maxWidth: 420
              }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search cards in this deck..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem 0.65rem 2.6rem',
                    borderRadius: 12,
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem'
              }}>
                {filteredCards.map((card, idx) => (
                  <div
                    key={card.id || idx}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 16,
                      border: '1px solid var(--border-light)',
                      padding: '1.35rem',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{
                          padding: '0.15rem 0.55rem',
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: 'var(--primary)',
                          borderRadius: 6,
                          fontSize: '0.725rem',
                          fontWeight: 700
                        }}>
                          #{idx + 1} &bull; {card.category || 'Concept'}
                        </span>

                        <button
                          onClick={() => handleToggleStar(card.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: card.is_starred ? '#f59e0b' : 'var(--text-muted)' }}
                        >
                          <Star size={16} fill={card.is_starred ? '#f59e0b' : 'none'} />
                        </button>
                      </div>

                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.4 }}>
                        {card.question}
                      </h4>

                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                        {card.answer}
                      </p>

                      {card.exam_tip && (
                        <div style={{
                          padding: '0.45rem 0.65rem',
                          background: '#fefce8',
                          borderRadius: 8,
                          fontSize: '0.775rem',
                          color: '#854d0e',
                          marginBottom: '0.75rem'
                        }}>
                          💡 {card.exam_tip}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid var(--border-light)' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: card.mastery === 'easy' ? '#10b981' : (card.mastery === 'good' ? '#f59e0b' : (card.mastery === 'hard' ? '#ef4444' : 'var(--text-muted)'))
                      }}>
                        Status: {card.mastery ? card.mastery.toUpperCase() : 'UNRATED'}
                      </span>

                      <button
                        onClick={() => {
                          setCurrentIndex(idx);
                          setViewMode('carousel');
                          setIsFlipped(false);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        Study 3D <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- DECK COMPLETION MODAL ---------------- */}
      {showCompletionModal && activeDeck && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 24,
            padding: '2.5rem',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
            }}>
              <Award size={36} />
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
              Deck Completed! 🎉
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Awesome active recall review! You've gone through all {activeDeck.cards_count} flashcards in <b>{activeDeck.title}</b>.
            </p>

            <div style={{
              background: 'var(--bg-subtle)',
              borderRadius: 16,
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Easy (Mastered)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{activeDeck.stats?.easy || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Good (Learning)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{activeDeck.stats?.good || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hard (Tricky)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{activeDeck.stats?.hard || 0}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setShowCompletionModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: 12,
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Review Again 🔄
              </button>
              <button
                onClick={() => setShowCompletionModal(false)}
                style={{
                  padding: '0.8rem 1.25rem',
                  borderRadius: 12,
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SAVED DECKS DRAWER ---------------- */}
      {showDecksDrawer && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 380,
          maxWidth: '90vw',
          background: 'var(--bg-surface)',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
          zIndex: 1050,
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'auto'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                Your Flashcard Decks ({decks.length})
              </h3>
              <button
                onClick={() => setShowDecksDrawer(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {decks.map(deck => (
                <div
                  key={deck.id}
                  onClick={() => {
                    loadSingleDeck(deck.id);
                    setShowDecksDrawer(false);
                  }}
                  style={{
                    padding: '1rem',
                    borderRadius: 14,
                    border: `1.5px solid ${activeDeck?.id === deck.id ? 'var(--primary)' : 'var(--border-light)'}`,
                    background: activeDeck?.id === deck.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {deck.title}
                    </div>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: 6,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: '#dcfce7',
                      color: '#15803d'
                    }}>
                      {deck.mastery_score || 0}%
                    </span>
                  </div>

                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                    <span>{deck.subject_name || 'General'}</span>
                    <span>&bull;</span>
                    <span>{deck.cards_count} Cards</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setShowDecksDrawer(false);
              setShowUploadModal(true);
            }}
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.8rem',
              borderRadius: 12,
              border: 'none',
              background: 'var(--primary)',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> New Flashcard Deck
          </button>
        </div>
      )}

      {/* ---------------- UPLOAD PDF / GENERATE DECK MODAL ---------------- */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 24,
            padding: '2.25rem',
            maxWidth: 620,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  Synthesize Flashcards from PDF 🎴⚡
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  AI reads your document and extracts core concepts, formulas, and examiner tips.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateDeck}>
              {/* PDF Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-focus)',
                  borderRadius: 16,
                  padding: '1.75rem 1.5rem',
                  textAlign: 'center',
                  background: 'rgba(99, 102, 241, 0.04)',
                  cursor: 'pointer',
                  marginBottom: '1.25rem',
                  transition: 'var(--transition)'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.zip,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt,.md,*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (!title) {
                        const name = e.target.files[0].name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
                        setTitle(name);
                      }
                    }
                  }}
                />

                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem'
                }}>
                  {selectedFile ? <FileText size={26} /> : <Upload size={26} />}
                </div>

                {selectedFile ? (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to change file
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Click to choose or drag & drop course PDF
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      PDF, Scanned OCR, TXT, Word notes supported (Up to 50 MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Subject & Topic */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Subject Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Machine Learning, OS"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 10,
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Topic / Unit (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 3 - Neural Networks"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 10,
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Deck Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Deck Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deep Learning Exam Essentials Deck"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 10,
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Focus Mode Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.45rem' }}>
                  Pedagogical Focus Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
                  {focusModes.map(mode => (
                    <div
                      key={mode.id}
                      onClick={() => setFocusMode(mode.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 12,
                        border: `1.5px solid ${focusMode === mode.id ? 'var(--primary)' : 'var(--border-light)'}`,
                        background: focusMode === mode.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.85rem' }}>
                        <span>{mode.icon}</span>
                        <span>{mode.label}</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.3 }}>
                        {mode.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Count Slider */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>
                    Target Cards Count: <span style={{ color: 'var(--primary)' }}>{cardCount} cards</span>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>5 to 25 cards</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="1"
                  value={cardCount}
                  onChange={(e) => setCardCount(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Raw notes fallback text area */}
              <div style={{ marginBottom: '1.5rem' }}>
                <details style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Or paste raw study notes / syllabus text</summary>
                  <textarea
                    rows={4}
                    placeholder="Paste paragraphs or topic outline here..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      padding: '0.65rem',
                      borderRadius: 10,
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </details>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: 12,
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.6rem',
                    borderRadius: 12,
                    border: 'none',
                    background: 'var(--grad-hero)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Synthesizing Deck...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Generate Flashcards ⚡
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
