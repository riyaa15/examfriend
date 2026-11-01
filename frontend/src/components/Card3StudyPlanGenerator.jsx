import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  AlertCircle,
  Printer,
  Palmtree,
  Copy
} from 'lucide-react';

export default function Card3StudyPlanGenerator({ exams = [], subjects = [], plans = [], onRefresh, token }) {
  const [numSubjects, setNumSubjects] = useState(() => (subjects && subjects.length > 0 ? 1 : 0));
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(() => (subjects && subjects.length > 0 ? [String(subjects[0].id)] : []));
  const [planTitle, setPlanTitle] = useState('My Final Exam Revision Plan');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState('');
  const [numHolidays, setNumHolidays] = useState(0);
  const [customHolidayDates, setCustomHolidayDates] = useState([]);
  const [showHolidayCustomizer, setShowHolidayCustomizer] = useState(false);
  const [viewMode, setViewMode] = useState('both'); // 'list', 'table', 'both'
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activePlan, setActivePlan] = useState(null);

  // Helper to extract bullet points from topic string or array
  const getTopicPoints = (item) => {
    if (!item) return [];
    if (Array.isArray(item.topics) && item.topics.length > 0) {
      return item.topics;
    }
    if (typeof item.topic === 'string') {
      if (item.topic.includes(' • ')) {
        return item.topic.split(' • ').map(s => s.trim()).filter(Boolean);
      }
      if (item.topic.includes('\n')) {
        return item.topic.split('\n').map(s => s.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
      }
      if (item.topic.includes(';') && item.topic.length > 50) {
        return item.topic.split(';').map(s => s.trim()).filter(Boolean);
      }
      return [item.topic];
    }
    return ['Study and review assigned module syllabus'];
  };

  // Maximum selectable subjects is strictly equal to the number of subjects added to syllabus in Card 2
  const totalAvailableSubjects = subjects.length;
  const maxSubjectLimit = totalAvailableSubjects;

  // When number of subjects dropdown changes, dynamically render exact number of selection boxes
  // and auto-populate unused subjects where possible
  const handleNumSubjectsChange = (val) => {
    const raw = parseInt(val) || 0;
    if (totalAvailableSubjects === 0) {
      setNumSubjects(0);
      setSelectedSubjectIds([]);
      return;
    }
    const num = Math.max(1, Math.min(raw, totalAvailableSubjects));
    setNumSubjects(num);
    const newSelections = [...selectedSubjectIds];
    while (newSelections.length < num) {
      // Find a subject not yet chosen in previous slots
      const unused = subjects.find(s => !newSelections.includes(String(s.id)));
      newSelections.push(unused ? String(unused.id) : (subjects[0] ? String(subjects[0].id) : ''));
    }
    while (newSelections.length > num) newSelections.pop();
    setSelectedSubjectIds(newSelections);
  };

  // Sync numSubjects and selections whenever subjects list changes in Card 2
  useEffect(() => {
    if (totalAvailableSubjects === 0) {
      setNumSubjects(0);
      setSelectedSubjectIds([]);
    } else {
      if (numSubjects === 0) {
        setNumSubjects(1);
        setSelectedSubjectIds([String(subjects[0].id)]);
      } else if (numSubjects > totalAvailableSubjects) {
        handleNumSubjectsChange(totalAvailableSubjects);
      } else if (selectedSubjectIds.length === 0 || (selectedSubjectIds.length === 1 && selectedSubjectIds[0] === '')) {
        setSelectedSubjectIds([String(subjects[0].id)]);
      }
    }
  }, [subjects]);

  // Quick Action: Select All Available Subjects
  const handleSelectAllSubjects = () => {
    if (totalAvailableSubjects === 0) return;
    setNumSubjects(totalAvailableSubjects);
    setSelectedSubjectIds(subjects.map(s => String(s.id)));
    setSuccessMessage(`Selected all ${totalAvailableSubjects} subjects from syllabus!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSelectSubjectChange = (index, subjectId) => {
    const updated = [...selectedSubjectIds];
    updated[index] = subjectId;
    setSelectedSubjectIds(updated);
  };

  const handleCopySchedule = (scheduleData, title) => {
    const list = scheduleData || planSchedule;
    if (!list || list.length === 0) return;
    const planName = title || (activePlan && activePlan.title) || planTitle;
    const lines = [
      `=== STUDY PLAN: ${planName} ===`,
      `Start Date: ${(activePlan && activePlan.start_date) || startDate} | Total Days: ${list.length}`,
      ''
    ];
    list.forEach((item) => {
      if (item.is_holiday) {
        lines.push(`${item.day} (${item.date}): 🌴 Holiday / Rest Day (No Study Scheduled)`);
      } else {
        lines.push(`${item.day} (${item.date}): Topic: ${item.topic} [${item.subject}]`);
      }
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    const validIds = selectedSubjectIds.filter(id => id !== '').map(id => parseInt(id));
    if (validIds.length === 0) {
      setError('Please select at least one subject from the dropdowns.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/study-plans/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: planTitle.trim() || 'Daily Study Plan',
          subject_ids: validIds,
          start_date: startDate || null,
          target_date: targetDate || null,
          holidays: parseInt(numHolidays) || 0,
          holiday_dates: customHolidayDates.length > 0 ? customHolidayDates : null
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed to generate study plan');
      }

      const data = await res.json();
      setActivePlan(data);
      setSuccessMessage('Study plan generated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Move this saved study plan to Trash (Card 9)? You can restore it anytime.')) return;
    try {
      const res = await fetch(`/api/study-plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (activePlan && (activePlan.id === planId || activePlan.plan_id === planId)) {
          setActivePlan(null);
        }
        setSuccessMessage('Study plan moved to Trash (Card 9).');
        setTimeout(() => setSuccessMessage(''), 4000);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Delete plan error:', err);
    }
  };

  // Safe schedule extraction for both freshly generated response and saved DB plan
  const planSchedule = activePlan ? (activePlan.plan || activePlan.plan_data || []) : [];

  return (
    <div className="glass-card" id="card-study-plan-generator">
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
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
          }}>
            <CalendarRange size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Card 3: Study Plan Generator</h2>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                Synced with Card 1 & Card 2
              </span>
              {totalAvailableSubjects > 0 && (
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  {totalAvailableSubjects} Subjects Connected
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Generates an intelligent Day-by-Day revision schedule (Day 1 &rarr; Date &rarr; Subject &rarr; Topic) with official PDF export.
            </p>
          </div>
        </div>

        {activePlan && (
          <button
            onClick={() => setActivePlan(null)}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={15} /> Back to Plan Generator
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1rem',
          color: '#10b981',
          fontSize: '0.85rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      {/* Generator Form */}
      {!activePlan && (
        <form onSubmit={handleGeneratePlan} style={{
          background: 'var(--bg-surface)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Sparkles size={16} color="var(--primary)" />
              Configure Study Plan Parameters
            </h3>

            {totalAvailableSubjects > 0 && (
              <button
                type="button"
                onClick={handleSelectAllSubjects}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.775rem',
                  padding: '0.35rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                  fontWeight: 600
                }}
                title={`Quickly select all ${totalAvailableSubjects} subjects from Card 2`}
              >
                <Sparkles size={13} /> Select All {totalAvailableSubjects} Subjects
              </button>
            )}
          </div>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1rem',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Plan Title</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Endterm Intensive Prep"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
              />
            </div>

            {/* Dynamic Dropdown: max subjects strictly equals subjects added to syllabus */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                <span>Select Number of Subjects</span>
                <span style={{ fontSize: '0.75rem', color: totalAvailableSubjects === 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                  {totalAvailableSubjects === 0
                    ? '0 added to syllabus'
                    : `Max: ${totalAvailableSubjects} (${totalAvailableSubjects} in syllabus)`}
                </span>
              </label>
              <select
                className="form-select"
                value={numSubjects}
                disabled={totalAvailableSubjects === 0}
                onChange={(e) => handleNumSubjectsChange(e.target.value)}
              >
                {totalAvailableSubjects === 0 ? (
                  <option value="0">0 Subjects (Add syllabus in Card 2 first)</option>
                ) : (
                  Array.from({ length: totalAvailableSubjects }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Subject' : 'Subjects'}
                      {n === totalAvailableSubjects ? ` (Max / All ${totalAvailableSubjects} in Syllabus)` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                <CalendarRange size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', color: 'var(--primary)' }} />
                Plan Start Date *
              </label>
              <input
                type="date"
                required
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Day 1 starts on this date (defaults to today)
              </p>
            </div>

            {/* Target Exam Date */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', color: 'var(--accent-amber)' }} />
                Target Exam Date (Optional)
              </label>
              <input
                type="date"
                className="form-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Defaults to the nearest upcoming exam from Card 1
              </p>
            </div>

            {/* No. of Holidays */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                <Palmtree size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', color: '#10b981' }} />
                No. of Holidays (Days Off)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                className="form-input"
                placeholder="0"
                value={numHolidays}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setNumHolidays(val);
                }}
              />
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {numHolidays > 0
                  ? `${numHolidays} rest day${numHolidays > 1 ? 's' : ''} scheduled without study topics`
                  : 'Add holidays / study breaks (auto-places on Sundays/spaced days)'}
              </p>
            </div>
          </div>

          {/* Optional specific holiday dates toggle */}
          {numHolidays > 0 && (
            <div style={{
              marginTop: '0.85rem',
              padding: '0.75rem 1rem',
              background: 'rgba(16, 185, 129, 0.06)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Palmtree size={14} />
                  Holiday Schedule: {customHolidayDates.length > 0 ? `${customHolidayDates.length} Custom Date(s)` : 'Automatic (Sundays & Spaced Rest Days)'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowHolidayCustomizer(!showHolidayCustomizer)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#059669',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    textDecoration: 'underline'
                  }}
                >
                  {showHolidayCustomizer ? 'Close Customizer' : 'Pick Specific Holiday Dates (Optional)'}
                </button>
              </div>

              {showHolidayCustomizer && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.25rem' }}>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !customHolidayDates.includes(val) && customHolidayDates.length < numHolidays) {
                        setCustomHolidayDates([...customHolidayDates, val].sort());
                      }
                      e.target.value = '';
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Add date (up to {numHolidays}):
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {customHolidayDates.map((d) => (
                      <span
                        key={d}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.15rem 0.5rem',
                          background: '#ffffff',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          color: '#059669',
                          fontWeight: 600
                        }}
                      >
                        🌴 {d}
                        <button
                          type="button"
                          onClick={() => setCustomHolidayDates(customHolidayDates.filter(x => x !== d))}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-rose)',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1,
                            fontSize: '0.85rem'
                          }}
                          title="Remove this holiday date"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dynamically Rendered Subject Selection Boxes linked to saved subjects */}
          <div style={{
            marginTop: '1.25rem',
            padding: '1.15rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-light)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.85rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Linked Subject Slots ({numSubjects} {numSubjects === 1 ? 'Subject' : 'Subjects'} to distribute in daily schedule):
              </div>
              {numSubjects > 1 && totalAvailableSubjects > 1 && (
                <button
                  type="button"
                  onClick={() => handleNumSubjectsChange(1)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Reset to 1 Subject
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
              {Array.from({ length: numSubjects }).map((_, index) => (
                <div key={index} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Subject #{index + 1} Slot:
                  </label>
                  <select
                    required
                    className="form-select"
                    value={selectedSubjectIds[index] || ''}
                    onChange={(e) => handleSelectSubjectChange(index, e.target.value)}
                  >
                    <option value="">-- Choose Subject from Card 2 --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.total_topics} topics &bull; {s.completion_percentage}% done)
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {totalAvailableSubjects === 0 && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-amber)',
                fontSize: '0.825rem'
              }}>
                💡 <b>No subjects found in Card 2</b>: Add your subjects and syllabus in <b>Card 2 (Subject & Topic Tracker)</b> so they appear in these dropdowns.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="submit"
              disabled={loading || totalAvailableSubjects === 0}
              className="btn btn-primary"
              style={{
                padding: '0.65rem 1.6rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <Sparkles size={16} />
              {loading ? 'Generating Structured Day Plan...' : 'Create Study Plan'}
            </button>
          </div>
        </form>
      )}

      {/* Generated Study Plan Interactive View */}
      {activePlan && (
        <div style={{
          background: 'var(--bg-surface)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Active Plan Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
            paddingBottom: '0.85rem',
            borderBottom: '1px solid var(--border-light)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-success">Plan Ready</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {activePlan.title || planTitle}
                </h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  {planSchedule.length} Days Planned
                </span>
                {(activePlan.start_date || startDate) && (
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    📅 Start: {activePlan.start_date || startDate}
                  </span>
                )}
                {(activePlan.target_date || targetDate) && (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                    🏁 Target Exam: {activePlan.target_date || targetDate}
                  </span>
                )}
                {(activePlan.holidays > 0 || planSchedule.some(d => d.is_holiday)) && (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Palmtree size={12} />
                    {activePlan.holidays || planSchedule.filter(d => d.is_holiday).length} Holidays / Rest Days
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Structured study schedule according to date: Day 1 &rarr; Topic, Day 2 &rarr; Topic with assigned rest days.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Copy Schedule */}
              <button
                type="button"
                onClick={() => handleCopySchedule(planSchedule, activePlan.title)}
                className="btn btn-secondary"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderColor: copiedNotice ? '#10b981' : undefined,
                  color: copiedNotice ? '#10b981' : undefined,
                  fontWeight: 600
                }}
                title="Copy clean Day-by-Day schedule to clipboard"
              >
                {copiedNotice ? <Check size={15} /> : <Copy size={15} />}
                {copiedNotice ? 'Copied Schedule! ✓' : 'Copy Schedule'}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                title="Print this study plan"
              >
                <Printer size={15} /> Print
              </button>

              {activePlan.pdf_url && (
                <a
                  href={activePlan.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="btn btn-success"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.95rem' }}
                >
                  <Download size={16} /> Download Study Plan (PDF)
                </a>
              )}
            </div>
          </div>

          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1.15rem',
            padding: '0.55rem 0.85rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Schedule View Format:
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: viewMode === 'list' ? 'var(--primary)' : 'var(--border-light)',
                  background: viewMode === 'list' ? 'var(--primary)' : 'var(--bg-surface)',
                  color: viewMode === 'list' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Day-by-Day (Day 1: Topic)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: viewMode === 'table' ? 'var(--primary)' : 'var(--border-light)',
                  background: viewMode === 'table' ? 'var(--primary)' : 'var(--bg-surface)',
                  color: viewMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Table View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('both')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: viewMode === 'both' ? 'var(--primary)' : 'var(--border-light)',
                  background: viewMode === 'both' ? 'var(--primary)' : 'var(--bg-surface)',
                  color: viewMode === 'both' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Show Both Views
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: DAY-BY-DAY LIST (DAY 1: TOPIC, DAY 2: TOPIC...) */}
          {(viewMode === 'list' || viewMode === 'both') && (
            <div style={{ marginBottom: viewMode === 'both' ? '1.5rem' : '0.5rem' }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Sparkles size={15} color="var(--primary)" />
                Day-by-Day Timeline (According to Date):
              </div>

              {planSchedule.length === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No schedule days available.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {planSchedule.map((item, idx) => {
                    if (item.is_holiday) {
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            padding: '0.8rem 1.1rem',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: '4px solid #10b981'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.2rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              background: '#10b981',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.8rem'
                            }}>
                              {item.day}
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', minWidth: '135px' }}>
                              📅 {item.date}
                            </span>
                            <span style={{
                              color: '#059669',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}>
                              🌴 <b>Holiday / Rest Day</b> &bull; No study scheduled (Rest, recharge & review)
                            </span>
                          </div>
                          <span className="badge badge-success" style={{ fontSize: '0.725rem' }}>
                            Rest Day
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          padding: '0.8rem 1.1rem',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: '4px solid var(--primary)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.2rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--primary)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.8rem'
                          }}>
                            {item.day}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', minWidth: '135px' }}>
                            📅 {item.date}
                          </span>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(99, 102, 241, 0.12)',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            {item.subject}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              <b style={{ color: 'var(--primary)' }}>Topic 1:</b> {item.topic_1 || (getTopicPoints(item)[0] || item.topic)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <b style={{ color: 'var(--accent-cyan, #06b6d4)' }}>Topic 2:</b> {item.topic_2 || (getTopicPoints(item)[1] || 'Practice & Active Recall')}
                            </div>
                          </div>
                        </div>
                        <span className="badge badge-primary" style={{ fontSize: '0.725rem' }}>
                          Scheduled
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: DETAILED TABLE */}
          {(viewMode === 'table' || viewMode === 'both') && (
            <div>
              {viewMode === 'both' && (
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <BookOpen size={15} color="var(--primary)" />
                  Structured Table View:
                </div>
              )}
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '2px solid var(--border-light)' }}>
                      <th style={{ padding: '0.85rem 1rem', width: '85px' }}>Day</th>
                      <th style={{ padding: '0.85rem 1rem', width: '140px' }}>Date</th>
                      <th style={{ padding: '0.85rem 1rem', width: '160px' }}>Subject Name</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Topic 1 (Core Focus)</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Topic 2 (Practice & Depth)</th>
                      <th style={{ padding: '0.85rem 1rem', width: '100px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planSchedule.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No days generated for this plan.
                        </td>
                      </tr>
                    ) : (
                      planSchedule.map((item, idx) => {
                        const isHol = item.is_holiday;
                        const points = getTopicPoints(item);
                        const t1 = item.topic_1 || points[0] || item.topic;
                        const t2 = item.topic_2 || points[1] || (points.length > 1 ? points[1] : 'Practice Questions & Active Recall');

                        return (
                          <tr 
                            key={idx}
                            style={{
                              borderBottom: '1px solid var(--border-light)',
                              background: isHol
                                ? 'rgba(16, 185, 129, 0.08)'
                                : (idx % 2 === 0 ? 'transparent' : 'var(--bg-subtle)')
                            }}
                          >
                            <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: isHol ? '#10b981' : 'var(--primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: isHol ? '#10b981' : 'var(--primary)',
                                  color: '#fff',
                                  fontSize: '0.725rem',
                                  fontWeight: 800
                                }}>
                                  {item.day}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                              {item.date}
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                background: isHol ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                                color: isHol ? '#059669' : 'var(--primary)',
                                fontWeight: 700,
                                fontSize: '0.8rem'
                              }}>
                                {item.subject}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)' }}>
                              {isHol ? (
                                <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  🌴 Rest & Recharge
                                </span>
                              ) : (
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {t1}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                              {isHol ? (
                                <span style={{ color: '#047857', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                  No study scheduled
                                </span>
                              ) : (
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {t2}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              {isHol ? (
                                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                                  Rest Day
                                </span>
                              ) : (
                                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                  Scheduled
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previously Saved Study Plans List */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.75rem'
        }}>
          Saved Study Plans ({plans.length})
        </div>

        {plans.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '1.75rem',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: '0.875rem'
          }}>
            No study plans created yet. Choose your subjects above and click <b>"Create Study Plan"</b>!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {plans.map((p) => {
              const pDays = p.plan_data || [];
              const pHolidays = p.holidays || (Array.isArray(pDays) ? pDays.filter(d => d.is_holiday).length : 0);
              return (
                <div 
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    padding: '0.85rem 1.15rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.title}</span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                        {pDays.length || 0} Days
                      </span>
                      {p.start_date && (
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                          Start: {p.start_date}
                        </span>
                      )}
                      {pHolidays > 0 && (
                        <span className="badge badge-success" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Palmtree size={11} /> {pHolidays} Holidays
                        </span>
                      )}
                      {p.created_at && (
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          Created {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Subjects: {Array.isArray(p.selected_subjects) ? p.selected_subjects.join(', ') : 'All Selected'}
                      {p.target_date && ` • Target: ${p.target_date}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => setActivePlan(p)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      View Plan
                    </button>

                    {p.pdf_url && (
                      <a
                        href={p.pdf_url}
                        target="_blank"
                      rel="noreferrer"
                      download
                      className="btn btn-success"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      title="Download PDF"
                    >
                      <Download size={14} /> PDF
                    </a>
                  )}

                  <button
                    onClick={() => handleDeletePlan(p.id)}
                    className="btn btn-ghost btn-icon"
                    title="Move to Trash (Card 9)"
                    style={{ color: 'var(--accent-rose)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
