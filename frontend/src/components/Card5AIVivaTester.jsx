import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Upload, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Award, 
  RefreshCw, 
  ChevronRight, 
  Square, 
  Play, 
  ArrowLeft, 
  Trash2,
  GraduationCap
} from 'lucide-react';

export default function Card5AIVivaTester({ sessions, onRefresh, token }) {
  // Setup & Upload state
  const [notesFile, setNotesFile] = useState(null);
  const [selectedMode, setSelectedMode] = useState('long'); // "long", "mcq"
  const [mcqSubOption, setMcqSubOption] = useState('with_opt'); // "with_opt", "without_opt"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Active Session state
  const [activeSession, setActiveSession] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Viva Interactive Controls
  const [isAnswering, setIsAnswering] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Teacher AI Guidance
  const [teacherHint, setTeacherHint] = useState('');
  const [hintCount, setHintCount] = useState(0);
  const [hintLoading, setHintLoading] = useState(false);

  // MCQ With Option state
  const [selectedOption, setSelectedOption] = useState('');
  const [mcqResult, setMcqResult] = useState(null);

  // Evaluation state
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  // Speech Recognition Ref
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setSpokenTranscript(transcript);
      };

      recognizer.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
      };

      recognitionRef.current = recognizer;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer effect when answering
  useEffect(() => {
    if (isAnswering) {
      setTimerSeconds(0);
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAnswering]);

  // Read aloud helper (TTS)
  const speakText = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Upload notes and generate questions
  const handleStartVivaSession = async (e) => {
    e.preventDefault();
    if (!notesFile) {
      setError('Please upload your study notes PDF.');
      return;
    }

    setError('');
    setLoading(true);

    const effectiveMode = selectedMode === 'long' 
      ? 'long' 
      : (mcqSubOption === 'with_opt' ? 'mcq_with_opt' : 'mcq_without_opt');

    try {
      const formData = new FormData();
      formData.append('mode', effectiveMode);
      formData.append('file', notesFile);

      const res = await fetch('/api/viva/upload-notes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed to process notes');
      }

      const sessionData = await res.json();
      setActiveSession(sessionData);
      setCurrentQIndex(0);
      resetQuestionState();

      // Read out first question
      if (sessionData.questions && sessionData.questions.length > 0) {
        speakText(sessionData.questions[0].question);
      }
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetQuestionState = () => {
    setIsAnswering(false);
    setSpokenTranscript('');
    setManualText('');
    setTeacherHint('');
    setHintCount(0);
    setSelectedOption('');
    setMcqResult(null);
    setEvaluation(null);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }
  };

  const currentQuestion = activeSession?.questions?.[currentQIndex];

  // Start Answering Verbally (Microphone)
  const handleStartAnswer = () => {
    setIsAnswering(true);
    setSpokenTranscript('');
    setTeacherHint('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  };

  // Stop Answering & Submit for Evaluation
  const handleStopAnswer = async () => {
    setIsAnswering(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }

    const finalAnswer = (spokenTranscript.trim() + ' ' + manualText.trim()).trim();
    if (!finalAnswer) {
      setError('No speech or text was detected. Try speaking or typing your answer.');
      return;
    }

    setEvaluating(true);
    try {
      const res = await fetch('/api/viva/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          question_text: currentQuestion.question,
          concept: currentQuestion.concept || 'Viva Topic',
          student_answer: finalAnswer,
          model_answer: currentQuestion.model_answer || '',
          evaluation_criteria: currentQuestion.evaluation_criteria || []
        })
      });

      if (res.ok) {
        const evalData = await res.json();
        setEvaluation(evalData);
        speakText(`You scored ${evalData.score} out of 10. ${evalData.verdict}.`);
      }
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  // Request Teacher Hint when struggling/paused
  const handleGetTeacherHint = async () => {
    setHintLoading(true);
    const currentDraft = (spokenTranscript.trim() + ' ' + manualText.trim()).trim();

    try {
      const res = await fetch('/api/viva/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question_text: currentQuestion.question,
          current_answer: currentDraft,
          hint_index: hintCount
        })
      });

      if (res.ok) {
        const hData = await res.json();
        setTeacherHint(hData.hint);
        setHintCount(c => c + 1);
        speakText(hData.hint);
      }
    } catch (err) {
      console.error('Hint error:', err);
    } finally {
      setHintLoading(false);
    }
  };

  // MCQ With Option Check
  const handleCheckMcq = async () => {
    if (!selectedOption) return;
    try {
      const res = await fetch('/api/viva/check-mcq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          selected_option: selectedOption,
          correct_option: currentQuestion.correct_option,
          explanation: currentQuestion.explanation || ''
        })
      });

      if (res.ok) {
        const resData = await res.json();
        setMcqResult(resData);
        if (resData.is_correct) {
          speakText("Correct answer! Great job!");
        } else {
          speakText(`Option ${resData.selected_option} is incorrect. The correct answer is ${resData.correct_option}.`);
        }
      }
    } catch (err) {
      console.error('Check MCQ error:', err);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < (activeSession.questions.length - 1)) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      resetQuestionState();
      speakText(activeSession.questions[nextIdx].question);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this viva session record?')) return;
    try {
      const res = await fetch(`/api/viva/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (activeSession && activeSession.session_id === sessionId) setActiveSession(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Delete session error:', err);
    }
  };

  return (
    <div className="glass-card" id="card-ai-viva-tester">
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
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)'
          }}>
            <Mic size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Card 5: AI Viva & Notes Tester</h2>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Interactive Voice & Teacher AI</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Oral Viva with supportive teacher hints, speech evaluation, and MCQ modes
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* TTS voice toggle */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="btn btn-secondary btn-icon"
            title={ttsEnabled ? "Examiner Voice On" : "Examiner Voice Muted"}
          >
            {ttsEnabled ? <Volume2 size={16} color="var(--primary)" /> : <VolumeX size={16} />}
          </button>

          {activeSession && (
            <button
              onClick={() => { setActiveSession(null); resetQuestionState(); }}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
            >
              <ArrowLeft size={15} /> Back to Setup
            </button>
          )}
        </div>
      </div>

      {/* Setup Form: Upload Notes & Choose Mode */}
      {!activeSession && (
        <form onSubmit={handleStartVivaSession} style={{
          background: 'var(--bg-surface)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={18} color="var(--primary)" />
            Configure AI Viva Examination
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

          {/* Upload Notes File */}
          <div className="form-group">
            <label className="form-label">
              <Upload size={15} /> Upload Your Study Notes (PDF, Photo, ZIP, Word, Text) *
            </label>
            <input
              type="file"
              required
              accept=".pdf,.zip,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.md,*"
              className="form-input"
              style={{ padding: '0.5rem' }}
              onChange={(e) => setNotesFile(e.target.files[0] || null)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Supports PDFs, photos of notebook pages, ZIP archives, Word docs, and text files. The AI professor reads your material and tests you!
            </p>
          </div>

          {/* Mode Selection */}
          <div style={{ marginTop: '1rem' }}>
            <label className="form-label">Select Testing Mode:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
              {/* Mode A */}
              <div 
                onClick={() => setSelectedMode('long')}
                style={{
                  border: selectedMode === 'long' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: selectedMode === 'long' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="badge badge-primary">Mode A</span>
                  <span style={{ fontWeight: 700 }}>Long Answer (Oral Viva)</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Speak verbally. If you pause or struggle, AI teacher provides hints/suggestions. Rates response & delivery afterwards.
                </p>
              </div>

              {/* Mode B */}
              <div 
                onClick={() => setSelectedMode('mcq')}
                style={{
                  border: selectedMode === 'mcq' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: selectedMode === 'mcq' ? 'rgba(236, 72, 153, 0.08)' : 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="badge badge-danger">Mode B</span>
                  <span style={{ fontWeight: 700 }}>MCQ Type Test</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Multiple choice questions with two sub-options: With Option or Without Option.
                </p>
              </div>
            </div>
          </div>

          {/* Mode B Sub-options */}
          {selectedMode === 'mcq' && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-light)'
            }}>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                Select MCQ Sub-Option:
              </label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="mcqSubOpt"
                    value="with_opt"
                    checked={mcqSubOption === 'with_opt'}
                    onChange={() => setMcqSubOption('with_opt')}
                  />
                  <span><b>With Option:</b> Displays question + choices &rarr; Select & Check Answer</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="mcqSubOpt"
                    value="without_opt"
                    checked={mcqSubOption === 'without_opt'}
                    onChange={() => setMcqSubOption('without_opt')}
                  />
                  <span><b>Without Option:</b> Question only &rarr; Answer verbally with teacher hints</span>
                </label>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.75rem' }}
            >
              {loading ? 'Analyzing Notes & Preparing Viva Room...' : 'Start Viva Session'}
            </button>
          </div>
        </form>
      )}

      {/* Active Viva Examination Room */}
      {activeSession && currentQuestion && (
        <div style={{
          background: 'var(--bg-surface)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--border-light)',
          marginBottom: '1.5rem'
        }}>
          {/* Top Session Progress Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingBottom: '0.85rem',
            borderBottom: '1px solid var(--border-light)',
            marginBottom: '1.25rem'
          }}>
            <div>
              <span className="badge badge-primary">
                Question {currentQIndex + 1} of {activeSession.questions.length}
              </span>
              <span className="badge badge-cyan" style={{ marginLeft: '0.5rem' }}>
                Mode: {activeSession.mode === 'long' ? 'Long Answer Viva' : (activeSession.mode === 'mcq_with_opt' ? 'MCQ With Option' : 'MCQ Without Option')}
              </span>
            </div>

            <button
              onClick={() => speakText(currentQuestion.question)}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              <Volume2 size={15} /> Repeat Question
            </button>
          </div>

          {/* Question Display */}
          <div style={{
            background: 'var(--bg-subtle)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--primary)',
            marginBottom: '1.25rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
              {currentQuestion.question}
            </h3>
            {currentQuestion.concept && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'inline-block' }}>
                Core Concept: <b>{currentQuestion.concept}</b>
              </span>
            )}
          </div>

          {/* SUB-FLOW 1: MCQ WITH OPTION */}
          {activeSession.mode === 'mcq_with_opt' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {(currentQuestion.options || []).map((opt, i) => {
                  const optLetter = opt.trim().substring(0, 1).toUpperCase();
                  const isSelected = selectedOption === optLetter;

                  return (
                    <div
                      key={i}
                      onClick={() => !mcqResult && setSelectedOption(optLetter)}
                      style={{
                        padding: '0.85rem 1.15rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-surface)',
                        cursor: mcqResult ? 'default' : 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{opt}</span>
                    </div>
                  );
                })}
              </div>

              {!mcqResult ? (
                <button
                  onClick={handleCheckMcq}
                  disabled={!selectedOption}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  <CheckCircle2 size={16} /> Check Answer
                </button>
              ) : (
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: mcqResult.is_correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                  border: `1.5px solid ${mcqResult.is_correct ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {mcqResult.is_correct ? (
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '1.1rem' }}>
                        ✓ Correct! Excellent Answer!
                      </span>
                    ) : (
                      <span style={{ color: 'var(--accent-rose)', fontWeight: 800, fontSize: '1.1rem' }}>
                        ✗ Incorrect. The correct option is: {mcqResult.correct_option}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <b>Explanation:</b> {mcqResult.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SUB-FLOW 2: ORAL VIVA (Mode A Long Answer OR Mode B Without Option) */}
          {activeSession.mode !== 'mcq_with_opt' && (
            <div>
              {/* Viva Voice Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                marginBottom: '1rem'
              }}>
                {!isAnswering ? (
                  <button
                    onClick={handleStartAnswer}
                    className="btn btn-primary"
                    style={{ padding: '0.65rem 1.4rem' }}
                  >
                    <Play size={16} /> Start Answer (Mic On)
                  </button>
                ) : (
                  <button
                    onClick={handleStopAnswer}
                    className="btn btn-danger recording-pulse"
                    style={{ padding: '0.65rem 1.4rem' }}
                  >
                    <Square size={16} /> Stop Answer & Evaluate
                  </button>
                )}

                {/* Teacher Hint Button when stuck */}
                <button
                  type="button"
                  onClick={handleGetTeacherHint}
                  disabled={hintLoading}
                  className="btn btn-secondary"
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderColor: 'var(--accent-amber)',
                    color: 'var(--accent-amber)'
                  }}
                >
                  <HelpCircle size={16} />
                  <span>{hintLoading ? 'Asking Teacher...' : "I'm Stuck / Need Hint"}</span>
                </button>

                {/* Live Answering Timer & Waveform */}
                {isAnswering && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
                      <div className="wave-bar" />
                      <div className="wave-bar" />
                      <div className="wave-bar" />
                      <div className="wave-bar" />
                      <div className="wave-bar" />
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
                      Listening... {timerSeconds}s
                    </span>
                  </div>
                )}
              </div>

              {/* Teacher Hint Card (Real-time guidance) */}
              {teacherHint && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.09)',
                  border: '1.5px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="badge badge-warning">Teacher's Guiding Hint</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hint #{hintCount}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                    "{teacherHint}"
                  </p>
                </div>
              )}

              {/* Spoken Answer Live Transcript Box */}
              <div className="form-group">
                <label className="form-label">
                  <Mic size={14} /> Spoken Verbal Answer Transcript
                </label>
                <div style={{
                  minHeight: '80px',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.925rem',
                  color: spokenTranscript ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontStyle: spokenTranscript ? 'normal' : 'italic'
                }}>
                  {spokenTranscript || '(Click "Start Answer" and speak into your microphone, or type your answer below...)'}
                </div>
              </div>

              {/* Optional Text typing fallback */}
              <div className="form-group">
                <label className="form-label">
                  Text Input (Fallback / Supplement)
                </label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  placeholder="You can also type your answer directly here if you prefer..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                />
              </div>

              {evaluating && (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--primary)', fontWeight: 600 }}>
                  Analyzing your oral viva response & delivery...
                </div>
              )}
            </div>
          )}

          {/* Oral Viva Evaluation Card */}
          {evaluation && (
            <div style={{
              background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1.5px solid var(--accent-emerald)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginTop: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '0.75rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={20} color="var(--accent-amber)" />
                    <h4 style={{ fontSize: '1.15rem' }}>Viva Examiner Rating & Feedback</h4>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Assessment Verdict: <b>{evaluation.verdict}</b>
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--accent-emerald)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    {evaluation.score} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 10</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Score
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {/* Strengths */}
                <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <b style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>✓ Key Strengths:</b>
                  <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {(evaluation.strengths || []).map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Mistakes */}
                <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <b style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>✗ Mistakes & Missed Points:</b>
                  <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {(evaluation.mistakes_pointed_out || []).map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Delivery Advice */}
              {evaluation.delivery_improvements && evaluation.delivery_improvements.length > 0 && (
                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  marginBottom: '1rem'
                }}>
                  <b style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>🎙️ How to Improve Your Verbal Delivery:</b>
                  <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {evaluation.delivery_improvements.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Model Answer */}
              {evaluation.model_answer && (
                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)'
                }}>
                  <b style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>💡 Ideal Model Spoken Answer:</b>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.45 }}>
                    "{evaluation.model_answer}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls: Next Question / Finish */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)'
          }}>
            <button
              onClick={() => { setActiveSession(null); resetQuestionState(); }}
              className="btn btn-ghost"
            >
              Exit Viva
            </button>

            {currentQIndex < (activeSession.questions.length - 1) ? (
              <button
                onClick={handleNextQuestion}
                className="btn btn-primary"
              >
                <span>Next Question</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => {
                  alert('Congratulations! You completed the full Viva examination session!');
                  setActiveSession(null);
                  resetQuestionState();
                }}
                className="btn btn-success"
              >
                <CheckCircle2 size={16} /> Finish Viva Session
              </button>
            )}
          </div>
        </div>
      )}

      {/* Past Viva Sessions History */}
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Past Viva & Notes Tests ({sessions.length})
        </div>

        {sessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '1.5rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: '0.875rem'
          }}>
            No viva sessions taken yet. Upload your PDF notes above to test yourself!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sessions.map((sess) => (
              <div 
                key={sess.id}
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
                    <span style={{ fontWeight: 700 }}>{sess.title}</span>
                    <span className="badge badge-primary">
                      {sess.mode === 'long' ? 'Oral Viva' : 'MCQ'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Notes File: {sess.notes_filename} &bull; {sess.questions_count} Questions
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleDeleteSession(sess.id)}
                    className="btn btn-ghost btn-icon"
                    title="Delete Session"
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
