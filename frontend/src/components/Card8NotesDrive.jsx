import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  HardDrive,
  FileText,
  Upload,
  Plus,
  Search,
  Filter,
  Star,
  Trash2,
  Edit3,
  Download,
  Eye,
  Sparkles,
  BookOpen,
  Clock,
  Tag,
  Check,
  Copy,
  Printer,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  File,
  Image as ImageIcon,
  FileCode,
  CheckCircle2,
  Bookmark,
  Layers,
  LayoutGrid,
  List,
  Share2,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  Zap,
  FolderPlus,
  Compass,
  FileSpreadsheet,
  FolderTree,
  CheckSquare,
  FileCheck
} from 'lucide-react';

export default function Card8NotesDrive({ token, onBack, onNavigate, onRefresh }) {
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState({
    total_notes: 0,
    total_storage_bytes: 0,
    total_storage_formatted: '0 KB',
    pinned_count: 0,
    subjects: [],
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'title', 'size'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [notification, setNotification] = useState('');

  // Primary Tab View: 'breakdown' (Subject & Module Breakdown) vs 'all' (All Drive Files)
  const [activeTab, setActiveTab] = useState('breakdown');

  // Subject & Module Breakdown data from /api/notes-drive/by-subjects
  const [breakdownData, setBreakdownData] = useState({
    subjects: [],
    total_subjects: 0,
    total_module_pdfs: 0,
    unassigned_notes: [],
    total_all_notes: 0
  });
  const [selectedBreakdownSubjectId, setSelectedBreakdownSubjectId] = useState(null);
  const [collapsedModules, setCollapsedModules] = useState({});

  // Module-specific PDF Upload Modal
  const [moduleUploadModal, setModuleUploadModal] = useState(null); // { subject_id, subject_name, module_id, module_name, module_number }
  const [modUploadFile, setModUploadFile] = useState(null);
  const [modUploadTitle, setModUploadTitle] = useState('');
  const [modUploadCategory, setModUploadCategory] = useState('Lecture Notes');
  const [modUploadTags, setModUploadTags] = useState('');
  const [modUploadColor, setModUploadColor] = useState('#3b82f6');
  const [modUploadPinned, setModUploadPinned] = useState(false);
  const [modUploading, setModUploading] = useState(false);
  const modFileInputRef = useRef(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewNoteModal, setViewNoteModal] = useState(null);
  const [editingNote, setEditingNote] = useState(null);

  // Form states for Create/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formModuleId, setFormModuleId] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formCategory, setFormCategory] = useState('Lecture Notes');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formColor, setFormColor] = useState('#3b82f6');
  const [formPinned, setFormPinned] = useState(false);
  const [editorTab, setEditorTab] = useState('write'); // 'write' | 'preview'
  const [savingNote, setSavingNote] = useState(false);

  // Upload Form states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubjectId, setUploadSubjectId] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadModuleId, setUploadModuleId] = useState('');
  const [uploadTopic, setUploadTopic] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Lecture Notes');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadColor, setUploadColor] = useState('#3b82f6');
  const [uploadPinned, setUploadPinned] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // AI Assistant in Reader Modal
  const [activeReaderTab, setActiveReaderTab] = useState('content'); // 'content' | 'ai_kit'
  const [aiGenerating, setAiGenerating] = useState(false);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  const CATEGORY_OPTIONS = [
    'Lecture Notes',
    'Revision Cheatsheet',
    'Formula Sheet',
    'Lab & Practical',
    'Assignment',
    'Past Q&A',
    'Other'
  ];

  const COLOR_PALETTE = [
    { name: 'Royal Blue', hex: '#3b82f6' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Indigo', hex: '#6366f1' }
  ];

  // Fetch all notes and subject & module breakdown
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const [resNotes, resBreakdown] = await Promise.all([
        fetch('/api/notes-drive', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch('/api/notes-drive/by-subjects', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      ]);

      if (resNotes.ok) {
        const data = await resNotes.json();
        setNotes(data.notes || []);
        setStats(data.stats || {
          total_notes: 0,
          total_storage_bytes: 0,
          total_storage_formatted: '0 KB',
          pinned_count: 0,
          subjects: [],
          categories: []
        });
      }

      if (resBreakdown.ok) {
        const bData = await resBreakdown.json();
        setBreakdownData(bData);
        if (bData.subjects && bData.subjects.length > 0) {
          setSelectedBreakdownSubjectId(prev => (prev && bData.subjects.some(s => s.id === prev) ? prev : bData.subjects[0].id));
        }
      }
    } catch (err) {
      console.error('Notes Drive fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  // Toast notification helper
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Toggle Pin Status
  const handleTogglePin = async (e, noteId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notes-drive/${noteId}/pin`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(prev =>
          prev.map(n => (n.id === noteId ? { ...n, is_pinned: data.is_pinned } : n))
        );
        showToast(data.is_pinned ? '⭐ Pinned to top of Drive' : 'Unpinned note');
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  // Move note to Trash (Card 9)
  const handleDeleteNote = async (e, noteId, noteTitle) => {
    e.stopPropagation();
    if (!window.confirm(`Move "${noteTitle}" to Card 9: Trash? You can restore it anytime.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/notes-drive/${noteId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (viewNoteModal && viewNoteModal.id === noteId) {
          setViewNoteModal(null);
        }
        showToast(`🗑️ Moved "${noteTitle}" to Card 9: Trash.`);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  // Seed sample notes
  const handleSeedSamples = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notes-drive/seed-samples', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      showToast(data.message || 'Sample notes created in your drive!');
      await fetchNotes();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error seeding notes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Add PDF to Module Modal
  const openAddPdfToModule = (subject, module) => {
    setModuleUploadModal({
      subject_id: subject.id,
      subject_name: subject.name,
      module_id: module.id,
      module_name: module.module_title,
      module_number: module.module_number
    });
    setModUploadFile(null);
    setModUploadTitle('');
    setModUploadCategory('Lecture Notes');
    setModUploadTags(`Module ${module.module_number}, ${subject.name}`);
    setModUploadColor('#3b82f6');
    setModUploadPinned(false);
  };

  // Handle Module File Selection
  const handleModuleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setModUploadFile(file);
      if (!modUploadTitle) {
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setModUploadTitle(cleanName.replace(/[_-]/g, ' '));
      }
    }
  };

  // Handle Module Upload Submit
  const handleModuleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!modUploadFile || !moduleUploadModal) {
      alert('Please select a PDF file to upload.');
      return;
    }

    try {
      setModUploading(true);
      const formData = new FormData();
      formData.append('file', modUploadFile);
      formData.append('title', modUploadTitle || modUploadFile.name);
      formData.append('subject_id', moduleUploadModal.subject_id);
      formData.append('subject_name', moduleUploadModal.subject_name);
      formData.append('module_id', moduleUploadModal.module_id);
      formData.append('module_name', moduleUploadModal.module_name);
      formData.append('module_number', moduleUploadModal.module_number);
      formData.append('category', modUploadCategory || 'Lecture Notes');
      formData.append('tags', modUploadTags || '');
      formData.append('color', modUploadColor || '#3b82f6');
      formData.append('is_pinned', modUploadPinned);

      const res = await fetch('/api/notes-drive/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) throw new Error('Module upload failed');
      const data = await res.json();
      showToast(`📄 Attached "${modUploadFile.name}" to Module ${moduleUploadModal.module_number}!`);
      setModuleUploadModal(null);
      await fetchNotes();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Module upload error:', err);
      alert('Error uploading PDF to module. Please try again.');
    } finally {
      setModUploading(false);
    }
  };

  // Toggle Module Collapse
  const toggleModuleCollapse = (moduleId) => {
    setCollapsedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Open Create Note Modal
  const openCreateModal = (defaultSubjId = '', defaultModId = '') => {
    setEditingNote(null);
    setFormTitle('');
    const targetSubj = breakdownData.subjects.find(s => String(s.id) === String(defaultSubjId)) || breakdownData.subjects[0];
    setFormSubjectId(targetSubj ? String(targetSubj.id) : '');
    setFormSubject(targetSubj?.name || stats.subjects[0] || 'General');
    setFormModuleId(defaultModId || '');
    setFormTopic('');
    setFormCategory('Lecture Notes');
    setFormContent('');
    setFormTags('');
    setFormColor('#3b82f6');
    setFormPinned(false);
    setEditorTab('write');
    setCreateModalOpen(true);
  };

  // Open Edit Note Modal
  const openEditModal = (e, note) => {
    e.stopPropagation();
    setEditingNote(note);
    setFormTitle(note.title);
    setFormSubjectId(note.subject_id ? String(note.subject_id) : '');
    setFormSubject(note.subject_name || 'General');
    setFormModuleId(note.module_id ? String(note.module_id) : '');
    setFormTopic(note.topic || '');
    setFormCategory(note.category || 'Lecture Notes');
    setFormContent(note.content || '');
    setFormTags((note.tags || []).join(', '));
    setFormColor(note.color || '#3b82f6');
    setFormPinned(note.is_pinned || false);
    setEditorTab('write');
    setCreateModalOpen(true);
  };

  // Save (Create or Update) Written Note
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please provide a title for your note.');
      return;
    }

    try {
      setSavingNote(true);
      const payload = {
        title: formTitle,
        subject_name: formSubject,
        topic: formTopic,
        category: formCategory,
        content: formContent,
        tags: formTags,
        color: formColor,
        is_pinned: formPinned
      };

      if (formSubjectId) {
        payload.subject_id = parseInt(formSubjectId, 10);
        const subjObj = breakdownData.subjects.find(s => String(s.id) === String(formSubjectId));
        if (subjObj) {
          payload.subject_name = subjObj.name;
          if (formModuleId) {
            const modObj = subjObj.modules.find(m => String(m.id) === String(formModuleId));
            if (modObj) {
              payload.module_id = modObj.id;
              payload.module_name = modObj.module_title;
              payload.module_number = modObj.module_number;
            }
          }
        }
      }

      if (editingNote) {
        // Update existing note
        const res = await fetch(`/api/notes-drive/${editingNote.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update note');
        showToast(`✅ Updated "${formTitle}" successfully!`);
      } else {
        // Create new written note
        const res = await fetch('/api/notes-drive/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create note');
        showToast(`🎉 Stored new note "${formTitle}" in Drive!`);
      }

      setCreateModalOpen(false);
      await fetchNotes();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Save note error:', err);
      alert('Failed to save note. Please check backend connection.');
    } finally {
      setSavingNote(false);
    }
  };

  // Open Upload Modal
  const openUploadModal = (defaultSubjId = '', defaultModId = '') => {
    setUploadFile(null);
    setUploadTitle('');
    const targetSubj = breakdownData.subjects.find(s => String(s.id) === String(defaultSubjId)) || breakdownData.subjects[0];
    setUploadSubjectId(targetSubj ? String(targetSubj.id) : '');
    setUploadSubject(targetSubj?.name || stats.subjects[0] || 'General');
    setUploadModuleId(defaultModId || '');
    setUploadTopic('');
    setUploadCategory('Lecture Notes');
    setUploadTags('');
    setUploadColor('#3b82f6');
    setUploadPinned(false);
    setUploadModalOpen(true);
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) {
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setUploadTitle(cleanName.replace(/[_-]/g, ' '));
      }
    }
  };

  // Handle File Upload Submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a file to upload to your drive.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name);
      formData.append('subject_name', uploadSubject || 'General');
      formData.append('topic', uploadTopic || '');
      formData.append('category', uploadCategory || 'Lecture Notes');
      formData.append('tags', uploadTags || '');
      formData.append('color', uploadColor || '#3b82f6');
      formData.append('is_pinned', uploadPinned);

      if (uploadSubjectId) {
        formData.append('subject_id', uploadSubjectId);
        const subjObj = breakdownData.subjects.find(s => String(s.id) === String(uploadSubjectId));
        if (subjObj) {
          formData.append('subject_name', subjObj.name);
          if (uploadModuleId) {
            const modObj = subjObj.modules.find(m => String(m.id) === String(uploadModuleId));
            if (modObj) {
              formData.append('module_id', modObj.id);
              formData.append('module_name', modObj.module_title);
              formData.append('module_number', modObj.module_number);
            }
          }
        }
      }

      const res = await fetch('/api/notes-drive/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      showToast(`📁 Uploaded "${uploadFile.name}" to Notes Drive!`);
      setUploadModalOpen(false);
      await fetchNotes();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('File upload error:', err);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Generate AI Summary & Flashcards for Note
  const handleGenerateAI = async (noteId) => {
    try {
      setAiGenerating(true);
      const res = await fetch(`/api/notes-drive/${noteId}/ai-summarize`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();
      
      // Update in local state
      setNotes(prev =>
        prev.map(n => (n.id === noteId ? { ...n, ai_summary: data.ai_summary } : n))
      );
      if (viewNoteModal && viewNoteModal.id === noteId) {
        setViewNoteModal(prev => ({ ...prev, ai_summary: data.ai_summary }));
      }
      setActiveReaderTab('ai_kit');
      setCurrentFlashcard(0);
      setIsFlipped(false);
      showToast('✨ AI Study Kit & Flashcards generated!');
    } catch (err) {
      console.error('AI summary error:', err);
      alert('Failed to generate AI insights. Check Groq API configuration.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Copy Note Text
  const handleCopyNote = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  // Format Helper for Editor Toolbar
  const insertFormat = (prefix, suffix = '') => {
    const textarea = document.getElementById('note-content-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formContent;
    const selection = text.substring(start, end);
    const replacement = prefix + (selection || 'text') + suffix;

    setFormContent(text.substring(0, start) + replacement + text.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selection.length || 4));
    }, 50);
  };

  // Filter and Sort Notes
  const filteredNotes = notes.filter(n => {
    // Search query
    const matchesSearch =
      !searchQuery.trim() ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.subject_name && n.subject_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.topic && n.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    // Category filter
    let matchesCategory = true;
    if (activeCategory === 'pinned') matchesCategory = n.is_pinned;
    else if (activeCategory !== 'all') matchesCategory = n.category === activeCategory;

    // Subject filter
    const matchesSubject = selectedSubject === 'all' || n.subject_name === selectedSubject;

    // Type filter
    let matchesType = true;
    if (selectedType === 'written') matchesType = n.note_type === 'written';
    else if (selectedType === 'pdf') matchesType = n.note_type === 'pdf';
    else if (selectedType === 'image') matchesType = n.note_type === 'image';
    else if (selectedType === 'doc') matchesType = ['doc', 'text', 'other'].includes(n.note_type);

    return matchesSearch && matchesCategory && matchesSubject && matchesType;
  }).sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;

    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'size') return (b.file_size_bytes || 0) - (a.file_size_bytes || 0);
    return 0;
  });

  // Helper: File Type Icon and Color
  const getNoteTypeInfo = (type, ext) => {
    switch (type) {
      case 'pdf':
        return { icon: FileText, color: '#ef4444', label: 'PDF Document', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'image':
        return { icon: ImageIcon, color: '#8b5cf6', label: 'Board Photo / Image', bg: 'rgba(139, 92, 246, 0.1)' };
      case 'text':
        return { icon: FileCode, color: '#f59e0b', label: 'Code / Text', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'doc':
        return { icon: File, color: '#3b82f6', label: 'Document', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'written':
      default:
        return { icon: BookOpen, color: '#10b981', label: 'Typed Note', bg: 'rgba(16, 185, 129, 0.1)' };
    }
  };

  // Format bytes to readable string
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const currentSubject = breakdownData.subjects.find(s => s.id === selectedBreakdownSubjectId) || breakdownData.subjects[0];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          padding: '0.85rem 1.4rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          border: '1.5px solid var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          animation: 'slideInRight 0.25s ease'
        }}>
          <CheckCircle2 size={18} color="var(--primary)" />
          <span>{notification}</span>
        </div>
      )}

      {/* ================= HERO DRIVE HEADER ================= */}
      <div className="glass-card" style={{
        marginBottom: '1.5rem',
        padding: '1.75rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 50%, var(--bg-surface) 100%)',
        border: '1.5px solid rgba(59, 130, 246, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient Top Glow */}
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: '180px',
          height: '180px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Title & Description */}
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
              }}>
                <Folder size={22} />
              </div>
              <div>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', marginBottom: '0.2rem' }}>
                  Card 8 &bull; Student Cloud Workspace
                </span>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Notes Drive 📂✨
                </h1>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.5, margin: 0 }}>
              Your centralized personal drive to store, organize, write, and revise lecture notes, textbook PDFs, whiteboard photos, and formula cheatsheets with instant search & AI study tools.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={openCreateModal}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
              }}
            >
              <Plus size={18} />
              <span>New Written Note</span>
            </button>

            <button
              onClick={openUploadModal}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                fontSize: '0.9rem',
                fontWeight: 700
              }}
            >
              <Upload size={18} />
              <span>Upload Notes File</span>
            </button>

            {notes.length === 0 && (
              <button
                onClick={handleSeedSamples}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  color: 'var(--primary)',
                  fontWeight: 600
                }}
              >
                <Sparkles size={16} />
                <span>Seed Samples</span>
              </button>
            )}
          </div>
        </div>

        {/* Storage & Quick Stat Metrics Bar */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-light)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {/* Stat 1: Total Notes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.total_notes}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Notes Stored</div>
            </div>
          </div>

          {/* Stat 2: Drive Storage Used */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HardDrive size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.total_storage_formatted}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Drive Storage Used</div>
            </div>
          </div>

          {/* Stat 3: Pinned / Starred */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Star size={18} fill="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.pinned_count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pinned / Priority Notes</div>
            </div>
          </div>

          {/* Stat 4: Active Subjects */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stats.subjects.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Subjects</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= VIEW SWITCHER BAR ================= */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '0.65rem 0.85rem',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`btn ${activeTab === 'breakdown' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.6rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.925rem',
              boxShadow: activeTab === 'breakdown' ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none'
            }}
          >
            <FolderTree size={18} />
            <span>Subject & Module Breakdown</span>
            <span style={{
              background: activeTab === 'breakdown' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-subtle)',
              color: activeTab === 'breakdown' ? '#fff' : 'var(--text-secondary)',
              padding: '0.15rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {breakdownData.total_module_pdfs || 0} PDFs
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.6rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.925rem',
              boxShadow: activeTab === 'all' ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none'
            }}
          >
            <HardDrive size={18} />
            <span>All Drive Files</span>
            <span style={{
              background: activeTab === 'all' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-subtle)',
              color: activeTab === 'all' ? '#fff' : 'var(--text-secondary)',
              padding: '0.15rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {notes.length} Files
            </span>
          </button>
        </div>

        {/* View Mode Hint / Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={fetchNotes}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Refresh Notes & Modules"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: SUBJECT & MODULE BREAKDOWN ================= */}
      {activeTab === 'breakdown' && (
        <div style={{ marginBottom: '2.5rem' }}>
          {breakdownData.subjects.length === 0 ? (
            <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <FolderTree size={32} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                No Subjects or Modules Configured Yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                Connect Card 8 with your courses! Add your subjects and syllabus in <strong>Card 2: Subject & Syllabus Tracker</strong> to unlock automatic module breakdowns where you can attach PDFs to each module.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => onNavigate ? onNavigate('tracker') : null}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem', fontWeight: 700 }}
                >
                  <Plus size={18} />
                  <span>Go to Card 2: Add Subject & Syllabus</span>
                </button>
                <button
                  onClick={() => openUploadModal()}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem', fontWeight: 700 }}
                >
                  <Upload size={18} />
                  <span>Upload General PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Subject Navigation Tabs / Pills */}
              <div style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: '0.85rem',
                overflowX: 'auto',
                paddingBottom: '0.75rem',
                marginBottom: '1.5rem',
                scrollbarWidth: 'thin'
              }}>
                {breakdownData.subjects.map(s => {
                  const isSelected = (currentSubject && currentSubject.id === s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedBreakdownSubjectId(s.id)}
                      className="glass-card"
                      style={{
                        flex: '0 0 auto',
                        minWidth: '240px',
                        maxWidth: '300px',
                        padding: '1rem 1.15rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-lg)',
                        border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border-light)',
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%, var(--bg-surface))'
                          : 'var(--bg-surface)',
                        boxShadow: isSelected ? 'var(--shadow-md), 0 0 0 2px rgba(99, 102, 241, 0.2)' : 'var(--shadow-sm)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.65rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '0.725rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: isSelected ? 'var(--primary)' : 'var(--text-muted)'
                        }}>
                          {s.modules.length} Modules
                        </span>
                        {s.total_pdfs > 0 && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444'
                          }}>
                            <FileText size={11} />
                            {s.total_pdfs} PDF{s.total_pdfs !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div style={{
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        lineHeight: 1.3,
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}>
                        {s.name}
                      </div>

                      {/* Syllabus Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          <span>Syllabus Covered</span>
                          <span style={{ fontWeight: 700 }}>{s.completion_percentage || 0}%</span>
                        </div>
                        <div style={{ height: '5px', borderRadius: '999px', background: 'var(--border-light)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, s.completion_percentage || 0)}%`,
                            background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                            borderRadius: '999px'
                          }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Subject Workspace */}
              {currentSubject && (
                <div>
                  {/* Subject Overview Header */}
                  <div className="glass-card" style={{
                    marginBottom: '1.5rem',
                    padding: '1.25rem 1.5rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%, var(--bg-surface))',
                    border: '1.5px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
                          {currentSubject.name}
                        </h2>
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                          {currentSubject.modules.length} Modules Breakdown
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span>📑 {currentSubject.total_topics} Syllabus Topics</span>
                        <span>&bull;</span>
                        <span>📄 {currentSubject.total_pdfs} Total PDFs</span>
                        <span>&bull;</span>
                        <span>🎯 {currentSubject.completion_percentage}% Progress</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <button
                        onClick={() => openUploadModal(currentSubject.id)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        <Upload size={16} />
                        <span>Upload PDF to Subject</span>
                      </button>
                    </div>
                  </div>

                  {/* Modules List / Accordion */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {currentSubject.modules.map(m => {
                      const isCollapsed = collapsedModules[m.id];
                      return (
                        <div
                          key={m.id}
                          className="glass-card"
                          style={{
                            borderRadius: 'var(--radius-lg)',
                            border: '1.5px solid var(--border-light)',
                            overflow: 'hidden',
                            background: 'var(--bg-surface)',
                            transition: 'all 0.2s ease',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          {/* Module Accordion Header */}
                          <div
                            style={{
                              padding: '1.15rem 1.35rem',
                              background: 'var(--bg-subtle)',
                              borderBottom: isCollapsed ? 'none' : '1px solid var(--border-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                              cursor: 'pointer'
                            }}
                            onClick={() => toggleModuleCollapse(m.id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 300px' }}>
                              <div style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                letterSpacing: '0.04em',
                                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                              }}>
                                MODULE {m.module_number}
                              </div>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                  {m.module_title}
                                </h3>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                  {m.topics.length} Syllabus Topics &bull; {m.pdfs.length} Attached PDF{m.pdfs.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons: Add PDF to Module & Collapse toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => openAddPdfToModule(currentSubject, m)}
                                className="btn btn-primary"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  boxShadow: '0 3px 10px rgba(99, 102, 241, 0.3)'
                                }}
                              >
                                <Plus size={16} />
                                <span>Add PDF to Module {m.module_number}</span>
                              </button>

                              <button
                                onClick={() => toggleModuleCollapse(m.id)}
                                className="btn btn-secondary"
                                style={{ padding: '0.5rem 0.65rem' }}
                                title={isCollapsed ? 'Expand Module' : 'Collapse Module'}
                              >
                                {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                              </button>
                            </div>
                          </div>

                          {/* Module Body (When expanded) */}
                          {!isCollapsed && (
                            <div>
                              {/* Syllabus Topics Ribbon */}
                              {m.topics && m.topics.length > 0 && (
                                <div style={{
                                  padding: '0.75rem 1.25rem',
                                  background: 'rgba(59, 130, 246, 0.03)',
                                  borderBottom: '1px solid var(--border-light)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  flexWrap: 'wrap'
                                }}>
                                  <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Syllabus Topics:
                                  </span>
                                  {m.topics.map(t => (
                                    <span
                                      key={t.id}
                                      style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: t.is_completed ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface)',
                                        color: t.is_completed ? '#10b981' : 'var(--text-secondary)',
                                        border: t.is_completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-light)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem'
                                      }}
                                    >
                                      {t.is_completed ? <Check size={12} color="#10b981" /> : <BookOpen size={11} color="var(--text-muted)" />}
                                      {t.topic_title}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Attached PDFs in this Module */}
                              <div style={{ padding: '1.25rem' }}>
                                {m.pdfs && m.pdfs.length > 0 ? (
                                  <div>
                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                                      gap: '1rem'
                                    }}>
                                      {m.pdfs.map(pdf => (
                                        <div
                                          key={pdf.id}
                                          className="glass-card"
                                          style={{
                                            padding: '1.15rem',
                                            border: `1.5px solid ${pdf.color || '#3b82f6'}`,
                                            borderTop: `4px solid ${pdf.color || '#3b82f6'}`,
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-surface)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            gap: '0.85rem',
                                            boxShadow: 'var(--shadow-sm)',
                                            transition: 'all 0.2s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                          }}
                                        >
                                          <div>
                                            {/* PDF Icon + Category Badge */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{
                                                  width: '34px',
                                                  height: '34px',
                                                  borderRadius: 'var(--radius-sm)',
                                                  background: 'rgba(239, 68, 68, 0.12)',
                                                  color: '#ef4444',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  flexShrink: 0
                                                }}>
                                                  <FileText size={18} />
                                                </div>
                                                <span style={{
                                                  fontSize: '0.725rem',
                                                  fontWeight: 700,
                                                  padding: '0.15rem 0.5rem',
                                                  borderRadius: 'var(--radius-sm)',
                                                  background: 'var(--bg-subtle)',
                                                  color: 'var(--text-muted)'
                                                }}>
                                                  {pdf.category || 'Lecture Notes'}
                                                </span>
                                              </div>
                                              <button
                                                onClick={(e) => handleTogglePin(e, pdf.id)}
                                                style={{
                                                  background: 'transparent',
                                                  border: 'none',
                                                  cursor: 'pointer',
                                                  padding: '2px',
                                                  color: pdf.is_pinned ? '#f59e0b' : 'var(--text-muted)'
                                                }}
                                                title={pdf.is_pinned ? 'Unpin' : 'Pin to top'}
                                              >
                                                <Star size={16} fill={pdf.is_pinned ? '#f59e0b' : 'none'} />
                                              </button>
                                            </div>

                                            {/* Title */}
                                            <h4 style={{
                                              fontSize: '1rem',
                                              fontWeight: 800,
                                              margin: '0 0 0.35rem 0',
                                              lineHeight: 1.35,
                                              color: 'var(--text-primary)'
                                            }}>
                                              {pdf.title}
                                            </h4>

                                            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                              <span>{pdf.file_name || 'Document PDF'}</span>
                                              <span>&bull;</span>
                                              <span>{formatSize(pdf.file_size_bytes)}</span>
                                              {pdf.created_at && (
                                                <>
                                                  <span>&bull;</span>
                                                  <span>{new Date(pdf.created_at).toLocaleDateString()}</span>
                                                </>
                                              )}
                                            </div>
                                          </div>

                                          {/* Actions Bar: Read, Download, AI, Delete */}
                                          <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.45rem',
                                            borderTop: '1px solid var(--border-light)',
                                            paddingTop: '0.75rem'
                                          }}>
                                            <button
                                              onClick={() => {
                                                setViewNoteModal(pdf);
                                                setActiveReaderTab('content');
                                              }}
                                              className="btn btn-primary"
                                              style={{
                                                padding: '0.4rem 0.75rem',
                                                fontSize: '0.8rem',
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.35rem'
                                              }}
                                            >
                                              <Eye size={14} />
                                              <span>Read</span>
                                            </button>

                                            <button
                                              onClick={() => window.open(`/api/notes-drive/${pdf.id}/file`, '_blank')}
                                              className="btn btn-secondary"
                                              style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
                                              title="Download PDF"
                                            >
                                              <Download size={14} />
                                            </button>

                                            <button
                                              onClick={() => handleGenerateAI(pdf.id)}
                                              className="btn btn-secondary"
                                              style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', color: 'var(--primary)' }}
                                              title="AI Study Kit & Flashcards"
                                            >
                                              <Sparkles size={14} />
                                            </button>

                                            <button
                                              onClick={(e) => handleDeleteNote(e, pdf.id, pdf.title)}
                                              className="btn btn-secondary"
                                              style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', color: 'var(--accent-rose)' }}
                                              title="Delete"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}

                                      {/* Add Another PDF Dropzone Card */}
                                      <div
                                        onClick={() => openAddPdfToModule(currentSubject, m)}
                                        style={{
                                          border: '2px dashed var(--border-light)',
                                          borderRadius: 'var(--radius-md)',
                                          padding: '1.5rem',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          background: 'var(--bg-subtle)',
                                          minHeight: '160px',
                                          transition: 'all 0.2s ease',
                                          textAlign: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.borderColor = 'var(--primary)';
                                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.borderColor = 'var(--border-light)';
                                          e.currentTarget.style.background = 'var(--bg-subtle)';
                                        }}
                                      >
                                        <Plus size={26} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>
                                          Add Another PDF
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                          Attach to Module {m.module_number}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Empty State inside Module */
                                  <div
                                    onClick={() => openAddPdfToModule(currentSubject, m)}
                                    style={{
                                      padding: '2.25rem 1.5rem',
                                      border: '2px dashed var(--border-light)',
                                      borderRadius: 'var(--radius-md)',
                                      textAlign: 'center',
                                      cursor: 'pointer',
                                      background: 'var(--bg-subtle)',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--primary)';
                                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--border-light)';
                                      e.currentTarget.style.background = 'var(--bg-subtle)';
                                    }}
                                  >
                                    <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 0.65rem' }} />
                                    <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                                      No PDFs attached to Module {m.module_number} yet
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 1rem', lineHeight: 1.45 }}>
                                      Upload lecture slides, handwritten notes, textbook chapters, or reference PDFs specifically for <strong>{m.module_title}</strong>.
                                    </p>
                                    <button
                                      className="btn btn-primary"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.15rem', fontSize: '0.875rem', fontWeight: 700 }}
                                    >
                                      <Plus size={16} />
                                      <span>Add PDF to Module {m.module_number}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: ALL DRIVE FILES ================= */}
      {activeTab === 'all' && (
        <>
        {/* ================= SEARCH, FILTER & TOOLBAR ================= */}
        <div className="glass-card" style={{
        padding: '1.15rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        {/* Top Filter Row: Search + Subject Dropdown + Sort + View Mode */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1 1 320px', minWidth: '260px' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              placeholder="Search notes by title, subject, formula, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{
                paddingLeft: '2.4rem',
                paddingRight: searchQuery ? '2.2rem' : '1rem',
                fontSize: '0.875rem',
                width: '100%',
                borderRadius: 'var(--radius-md)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Right Controls: Subject Filter + Sort + View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Subject Selector */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input"
              style={{
                fontSize: '0.85rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              <option value="all">📚 All Subjects ({notes.length})</option>
              {stats.subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input"
              style={{
                fontSize: '0.85rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              <option value="all">📂 All Types</option>
              <option value="written">📝 Typed Notes</option>
              <option value="pdf">📄 PDFs</option>
              <option value="image">🖼️ Board Photos</option>
              <option value="doc">📁 Docs / Files</option>
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input"
              style={{
                fontSize: '0.85rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              <option value="newest">🕒 Newest First</option>
              <option value="oldest">⏳ Oldest First</option>
              <option value="title">🔤 Title (A-Z)</option>
              <option value="size">💾 Largest Size</option>
            </select>

            {/* Grid / List Switcher */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
              border: '1px solid var(--border-light)'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                className="btn"
                style={{
                  padding: '0.35rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)',
                  border: 'none',
                  boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none'
                }}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="btn"
                style={{
                  padding: '0.35rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  background: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                  border: 'none',
                  boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none'
                }}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Category Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          flexWrap: 'wrap',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-light)'
        }}>
          {[
            { id: 'all', label: 'All Notes', icon: Folder },
            { id: 'pinned', label: '⭐ Pinned', icon: Star },
            { id: 'Lecture Notes', label: '📚 Lecture Notes', icon: BookOpen },
            { id: 'Revision Cheatsheet', label: '⚡ Cheatsheets', icon: Zap },
            { id: 'Formula Sheet', label: '📐 Formula Sheets', icon: FileSpreadsheet },
            { id: 'Lab & Practical', label: '🧪 Lab & Practical', icon: Layers }
          ].map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= NOTES LIST / GRID CONTENT ================= */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading your Notes Drive...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        /* Empty State */
        <div className="glass-card" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '2px dashed var(--border-light)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Folder size={32} />
          </div>

          <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            {searchQuery || activeCategory !== 'all' || selectedSubject !== 'all'
              ? 'No matching notes found'
              : 'Your Notes Drive is Empty'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            {searchQuery || activeCategory !== 'all' || selectedSubject !== 'all'
              ? 'Try adjusting your search terms or clearing the subject/category filter.'
              : 'Store lecture PDFs, photos of notebook boards, or write rich typed notes to keep all your study materials organized for exams.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={openCreateModal}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
            >
              <Plus size={16} />
              <span>Write Your First Note</span>
            </button>
            <button
              onClick={openUploadModal}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
            >
              <Upload size={16} />
              <span>Upload PDF or Photo</span>
            </button>
            <button
              onClick={handleSeedSamples}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', color: 'var(--primary)' }}
            >
              <Sparkles size={16} />
              <span>Load Sample Notes</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= GRID VIEW ================= */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: '1.25rem'
        }}>
          {filteredNotes.map(n => {
            const typeInfo = getNoteTypeInfo(n.note_type, n.file_ext);
            const TypeIcon = typeInfo.icon;
            const hasAi = Boolean(n.ai_summary);

            return (
              <div
                key={n.id}
                onClick={() => {
                  setViewNoteModal(n);
                  setActiveReaderTab('content');
                }}
                className="glass-card"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  borderTop: `4px solid ${n.color || '#3b82f6'}`,
                  background: 'var(--bg-surface)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
              >
                <div>
                  {/* Card Header: Type badge + Category + Pin Star */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: typeInfo.bg,
                        color: typeInfo.color
                      }}>
                        <TypeIcon size={13} />
                        {typeInfo.label}
                      </span>

                      <span style={{
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        background: 'var(--bg-subtle)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        {n.category}
                      </span>
                    </div>

                    {/* Pin Star Button */}
                    <button
                      onClick={(e) => handleTogglePin(e, n.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: n.is_pinned ? '#f59e0b' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={n.is_pinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Star size={18} fill={n.is_pinned ? '#f59e0b' : 'none'} />
                    </button>
                  </div>

                  {/* Note Title & Subject */}
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    marginBottom: '0.35rem',
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {n.title}
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    marginBottom: '0.75rem'
                  }}>
                    <span>{n.subject_name || 'General'}</span>
                    {n.topic && (
                      <>
                        <span style={{ color: 'var(--border-light)' }}>&bull;</span>
                        <span style={{ color: 'var(--text-muted)' }}>{n.topic}</span>
                      </>
                    )}
                  </div>

                  {/* Content Preview Snippet */}
                  <div style={{
                    fontSize: '0.825rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                    marginBottom: '1rem',
                    background: 'var(--bg-subtle)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    maxHeight: '75px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    border: '1px solid var(--border-light)'
                  }}>
                    {n.content ? (
                      n.content.replace(/[#*`_]/g, '').trim().substring(0, 140) + '...'
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                        {n.file_name ? `Stored file: ${n.file_name}` : 'No text preview available.'}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {n.tags && n.tags.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                      {n.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          background: 'var(--bg-subtle)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          #{tag}
                        </span>
                      ))}
                      {n.tags.length > 3 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          +{n.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Bar: Meta + Action Buttons */}
                <div style={{
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  {/* Left: Size and Date */}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{formatSize(n.file_size_bytes)}</span>
                    <span style={{ margin: '0 4px' }}>&bull;</span>
                    <span>{new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={(e) => e.stopPropagation()}>
                    {/* AI Button */}
                    <button
                      onClick={() => {
                        setViewNoteModal(n);
                        if (!n.ai_summary) {
                          handleGenerateAI(n.id);
                        } else {
                          setActiveReaderTab('ai_kit');
                        }
                      }}
                      className="btn"
                      style={{
                        padding: '0.35rem',
                        background: hasAi ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                        color: hasAi ? 'var(--primary)' : 'var(--text-muted)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      title={hasAi ? 'View AI Study Kit' : 'Generate AI Study Kit'}
                    >
                      <Sparkles size={16} />
                    </button>

                    {/* Edit Note */}
                    <button
                      onClick={(e) => openEditModal(e, n)}
                      className="btn"
                      style={{
                        padding: '0.35rem',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      title="Edit Note Details"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* Download */}
                    <button
                      onClick={() => window.open(`/api/notes-drive/${n.id}/file`, '_blank')}
                      className="btn"
                      style={{
                        padding: '0.35rem',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      title="Download File"
                    >
                      <Download size={15} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDeleteNote(e, n.id, n.title)}
                      className="btn"
                      style={{
                        padding: '0.35rem',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      title="Move to Card 9: Trash"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= LIST VIEW (DRIVE EXPLORER) ================= */
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  background: 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border-light)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <th style={{ padding: '0.85rem 1rem', width: '36px' }}>⭐</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Note Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Subject</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Size</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date Added</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.map(n => {
                  const typeInfo = getNoteTypeInfo(n.note_type, n.file_ext);
                  const TypeIcon = typeInfo.icon;
                  return (
                    <tr
                      key={n.id}
                      onClick={() => {
                        setViewNoteModal(n);
                        setActiveReaderTab('content');
                      }}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Pin Star */}
                      <td style={{ padding: '0.85rem 1rem' }} onClick={(e) => handleTogglePin(e, n.id)}>
                        <Star size={16} fill={n.is_pinned ? '#f59e0b' : 'none'} color={n.is_pinned ? '#f59e0b' : 'var(--text-muted)'} />
                      </td>

                      {/* Name & Type */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            background: typeInfo.bg,
                            color: typeInfo.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <TypeIcon size={15} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</div>
                            {n.topic && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.topic}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--primary)' }}>
                        {n.subject_name || 'General'}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          background: 'var(--bg-subtle)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {n.category}
                        </span>
                      </td>

                      {/* Size */}
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {formatSize(n.file_size_bytes)}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setViewNoteModal(n);
                              setActiveReaderTab('content');
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                            title="Open Note"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={(e) => openEditModal(e, n)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                            title="Edit Note"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => window.open(`/api/notes-drive/${n.id}/file`, '_blank')}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteNote(e, n.id, n.title)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: 'var(--accent-rose)' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* ================= MODAL 1: CREATE / EDIT WRITTEN NOTE ================= */}
      {createModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '840px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1.5px solid var(--border-light)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <BookOpen size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  {editingNote ? 'Edit Stored Note' : 'Create New Typed Study Note'}
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Title Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Note Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Dynamic Programming: Bellman-Ford & Knapsack Problem Notes"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="input"
                    style={{ width: '100%', fontSize: '0.95rem', fontWeight: 600 }}
                  />
                </div>

                {/* Subject & Module Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Subject
                    </label>
                    <select
                      value={formSubjectId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormSubjectId(val);
                        const sObj = breakdownData.subjects.find(s => String(s.id) === String(val));
                        setFormSubject(sObj ? sObj.name : 'General');
                        setFormModuleId('');
                      }}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    >
                      <option value="">General (No Specific Subject)</option>
                      {breakdownData.subjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.modules.length} Modules)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Module Breakdown (Optional)
                    </label>
                    <select
                      value={formModuleId}
                      onChange={(e) => setFormModuleId(e.target.value)}
                      className="input"
                      disabled={!formSubjectId}
                      style={{ width: '100%', fontSize: '0.85rem', opacity: !formSubjectId ? 0.6 : 1 }}
                    >
                      <option value="">Whole Subject / General</option>
                      {formSubjectId && (
                        (breakdownData.subjects.find(s => String(s.id) === String(formSubjectId))?.modules || []).map(m => (
                          <option key={m.id} value={m.id}>
                            Module {m.module_number}: {m.module_title}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Category & Color Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Category / Folder
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    >
                      {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Card Color Accent
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      {COLOR_PALETTE.map(cp => (
                        <div
                          key={cp.hex}
                          onClick={() => setFormColor(cp.hex)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: cp.hex,
                            cursor: 'pointer',
                            border: formColor === cp.hex ? '2.5px solid var(--text-primary)' : '2px solid transparent',
                            transform: formColor === cp.hex ? 'scale(1.2)' : 'scale(1)',
                            transition: 'all 0.15s ease'
                          }}
                          title={cp.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tags & Pinned Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., formulas, midterm, unit3, high-priority"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={formPinned}
                        onChange={(e) => setFormPinned(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                      <span>⭐ Pin this note to top of Drive</span>
                    </label>
                  </div>
                </div>

                {/* Editor Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.4rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      Study Note Content (Markdown & Text)
                    </label>

                    {/* Mode Tabs: Write vs Preview */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px'
                    }}>
                      <button
                        type="button"
                        onClick={() => setEditorTab('write')}
                        className="btn"
                        style={{
                          padding: '0.2rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: editorTab === 'write' ? 'var(--bg-surface)' : 'transparent',
                          color: editorTab === 'write' ? 'var(--primary)' : 'var(--text-muted)',
                          border: 'none'
                        }}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorTab('preview')}
                        className="btn"
                        style={{
                          padding: '0.2rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: editorTab === 'preview' ? 'var(--bg-surface)' : 'transparent',
                          color: editorTab === 'preview' ? 'var(--primary)' : 'var(--text-muted)',
                          border: 'none'
                        }}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {/* Formatting Toolbar */}
                  {editorTab === 'write' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'var(--bg-subtle)',
                      padding: '0.35rem 0.5rem',
                      borderTopLeftRadius: 'var(--radius-sm)',
                      borderTopRightRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      borderBottom: 'none',
                      flexWrap: 'wrap'
                    }}>
                      <button type="button" onClick={() => insertFormat('**', '**')} className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontWeight: 800 }}>B</button>
                      <button type="button" onClick={() => insertFormat('*', '*')} className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontStyle: 'italic' }}>I</button>
                      <button type="button" onClick={() => insertFormat('## ')} className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}>H2</button>
                      <button type="button" onClick={() => insertFormat('### ')} className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}>H3</button>
                      <button type="button" onClick={() => insertFormat('- ')} className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}>&bull; List</button>
                      <button type="button" onClick={() => insertFormat('1. ')} className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}>1. List</button>
                      <button type="button" onClick={() => insertFormat('- [ ] ')} className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}>[x] Task</button>
                      <button type="button" onClick={() => insertFormat('```\n', '\n```')} className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}>Code</button>
                      <button type="button" onClick={() => insertFormat('> 💡 **Key Exam Point:** ')} className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', color: '#f59e0b' }}>💡 Tip</button>
                      <button type="button" onClick={() => insertFormat('Formula: $', '$')} className="btn btn-secondary" style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', color: '#10b981' }}>Formula</button>
                    </div>
                  )}

                  {/* Write vs Preview View */}
                  {editorTab === 'write' ? (
                    <textarea
                      id="note-content-editor"
                      rows={12}
                      placeholder="Type your notes here... You can use headings (##), bullet points (-), formulas, and bold terms (**concept**)."
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      className="input"
                      style={{
                        width: '100%',
                        fontFamily: 'monospace, monospace',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        resize: 'vertical'
                      }}
                    />
                  ) : (
                    <div style={{
                      minHeight: '260px',
                      padding: '1rem',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      fontSize: '0.9rem'
                    }}>
                      {formContent ? formContent : <span style={{ color: 'var(--text-muted)' }}>Nothing to preview yet. Write some notes first!</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                background: 'var(--bg-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={savingNote}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingNote}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  {savingNote ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{editingNote ? 'Save Changes' : 'Store Note in Drive'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: UPLOAD NOTES FILE ================= */}
      {uploadModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '620px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1.5px solid var(--border-light)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Upload size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  Upload Notes File to Drive
                </h3>
              </div>
              <button onClick={() => setUploadModalOpen(false)} className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '78vh', overflowY: 'auto' }}>
                
                {/* Drag & Drop File Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-focus)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: uploadFile ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-subtle)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt,.md,.ppt,.pptx"
                    onChange={handleFileChange}
                  />

                  {uploadFile ? (
                    <div>
                      <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {uploadFile.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {formatSize(uploadFile.size)} &bull; Click to choose a different file
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={36} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        Choose a File or Drag & Drop here
                      </div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                        Supports PDFs, Photos/Images (board snapshots, handwritten notes), Word Docs, PPTs, or Text files
                      </div>
                    </div>
                  )}
                </div>

                {/* Note Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Note Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Module 4: Cloud DevOps & Kubernetes Slides"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Subject & Module Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Select Subject
                    </label>
                    <select
                      value={uploadSubjectId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUploadSubjectId(val);
                        const sObj = breakdownData.subjects.find(s => String(s.id) === String(val));
                        setUploadSubject(sObj ? sObj.name : 'General');
                        setUploadModuleId('');
                      }}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    >
                      <option value="">General (No Specific Subject)</option>
                      {breakdownData.subjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.modules.length} Modules)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Attach to Module (Optional)
                    </label>
                    <select
                      value={uploadModuleId}
                      onChange={(e) => setUploadModuleId(e.target.value)}
                      className="input"
                      disabled={!uploadSubjectId}
                      style={{ width: '100%', fontSize: '0.85rem', opacity: !uploadSubjectId ? 0.6 : 1 }}
                    >
                      <option value="">Whole Subject / Not Module Specific</option>
                      {uploadSubjectId && (
                        (breakdownData.subjects.find(s => String(s.id) === String(uploadSubjectId))?.modules || []).map(m => (
                          <option key={m.id} value={m.id}>
                            Module {m.module_number}: {m.module_title}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Category / Folder
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Topic & Tags */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Topic (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Chapter 5"
                      value={uploadTopic}
                      onChange={(e) => setUploadTopic(e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Tags
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., pdf, unit5, exam"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Pin Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="upload-pin-check"
                    checked={uploadPinned}
                    onChange={(e) => setUploadPinned(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="upload-pin-check" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    ⭐ Pin this note to top of Drive
                  </label>
                </div>
              </div>

              {/* Upload Footer */}
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                background: 'var(--bg-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploading || !uploadFile}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span>{uploading ? 'Storing in Drive...' : 'Upload & Store Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DIRECT ADD PDF TO SPECIFIC MODULE ================= */}
      {moduleUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1.5px solid var(--border-light)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                      Add PDF to Module {moduleUploadModal.module_number}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <strong>{moduleUploadModal.subject_name}</strong> &bull; {moduleUploadModal.module_name}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setModuleUploadModal(null)}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModuleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                
                {/* Target Module Info Callout */}
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <FolderTree size={22} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.825rem', lineHeight: 1.45 }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      Connecting Directly to Course Syllabus:
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      This document will be automatically categorized under <strong>{moduleUploadModal.subject_name} &gt; Module {moduleUploadModal.module_number} ({moduleUploadModal.module_name})</strong> with full OCR text extraction and AI study kit generation enabled.
                    </span>
                  </div>
                </div>

                {/* File Dropzone */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.45rem' }}>
                    Select PDF / Document File *
                  </label>
                  <input
                    type="file"
                    ref={modFileInputRef}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleModuleFileChange}
                    style={{ display: 'none' }}
                  />

                  {!modUploadFile ? (
                    <div
                      onClick={() => modFileInputRef.current && modFileInputRef.current.click()}
                      style={{
                        border: '2px dashed var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: '2rem 1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--bg-subtle)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-light)';
                        e.currentTarget.style.background = 'var(--bg-subtle)';
                      }}
                    >
                      <Upload size={36} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                        Click to select PDF for Module {moduleUploadModal.module_number}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Supports PDF (recommended), Word documents (.docx), slides (.pptx), or text files up to 25MB
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <FileText size={22} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {modUploadFile.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatSize(modUploadFile.size)} &bull; Ready to attach
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => modFileInputRef.current && modFileInputRef.current.click()}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', flexShrink: 0 }}
                      >
                        Change File
                      </button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Module 1 Complete Reference Slides & Lecture Notes"
                    value={modUploadTitle}
                    onChange={(e) => setModUploadTitle(e.target.value)}
                    className="input"
                    style={{ width: '100%', fontSize: '0.95rem' }}
                  />
                </div>

                {/* Category & Tags */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Category
                    </label>
                    <select
                      value={modUploadCategory}
                      onChange={(e) => setModUploadCategory(e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    >
                      {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Tags
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., unit1, lecture, exam"
                      value={modUploadTags}
                      onChange={(e) => setModUploadTags(e.target.value)}
                      className="input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Color Accent & Pin */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Card Color Accent
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {COLOR_PALETTE.map(cp => (
                        <div
                          key={cp.hex}
                          onClick={() => setModUploadColor(cp.hex)}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: cp.hex,
                            cursor: 'pointer',
                            border: modUploadColor === cp.hex ? '2.5px solid var(--text-primary)' : '2px solid transparent',
                            transform: modUploadColor === cp.hex ? 'scale(1.15)' : 'scale(1)',
                            transition: 'all 0.15s ease'
                          }}
                          title={cp.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                    <input
                      type="checkbox"
                      id="mod-pin-check"
                      checked={modUploadPinned}
                      onChange={(e) => setModUploadPinned(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                    />
                    <label htmlFor="mod-pin-check" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                      ⭐ Pin to top of Module & Drive
                    </label>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                background: 'var(--bg-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => setModuleUploadModal(null)}
                  className="btn btn-secondary"
                  disabled={modUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={modUploading || !modUploadFile}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.25rem', fontWeight: 700 }}
                >
                  {modUploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span>{modUploading ? 'Attaching to Module...' : `Attach PDF to Module ${moduleUploadModal.module_number}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: IN-APP NOTE READER & AI STUDY KIT ================= */}
      {viewNoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '960px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1.5px solid var(--border-light)',
            overflow: 'hidden'
          }}>
            {/* Reader Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {viewNoteModal.subject_name || 'General'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {viewNoteModal.category} &bull; {formatSize(viewNoteModal.file_size_bytes)}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 800 }}>
                  {viewNoteModal.title}
                </h2>
              </div>

              {/* Reader Action Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => handleCopyNote(viewNoteModal.content || viewNoteModal.title)}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  title="Copy Note Text"
                >
                  {copiedNote ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedNote ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => window.open(`/api/notes-drive/${viewNoteModal.id}/file`, '_blank')}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  title="Download File / Export"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  title="Print Note"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>

                <button
                  onClick={() => setViewNoteModal(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.6rem' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Reader Tabs: Note Content vs AI Study Kit */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-light)',
              padding: '0 1.5rem',
              background: 'var(--bg-surface)'
            }}>
              <button
                onClick={() => setActiveReaderTab('content')}
                style={{
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: activeReaderTab === 'content' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: activeReaderTab === 'content' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <BookOpen size={16} />
                <span>Note Content</span>
              </button>

              <button
                onClick={() => {
                  setActiveReaderTab('ai_kit');
                  if (!viewNoteModal.ai_summary && !aiGenerating) {
                    handleGenerateAI(viewNoteModal.id);
                  }
                }}
                style={{
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: activeReaderTab === 'ai_kit' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: activeReaderTab === 'ai_kit' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Sparkles size={16} />
                <span>AI Study Kit & Flashcards ✨</span>
              </button>
            </div>

            {/* Reader Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem' }}>
              {activeReaderTab === 'content' ? (
                <div>
                  {/* If note has an uploaded PDF */}
                  {viewNoteModal.note_type === 'pdf' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <FileText size={24} color="#ef4444" />
                          <div>
                            <div style={{ fontWeight: 700 }}>{viewNoteModal.file_name || 'Uploaded PDF Document'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Embedded document viewer &bull; {formatSize(viewNoteModal.file_size_bytes)}
                            </div>
                          </div>
                        </div>

                        <a
                          href={`/api/notes-drive/${viewNoteModal.id}/file`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                        >
                          Open in Full Tab ↗
                        </a>
                      </div>

                      <iframe
                        src={`/api/notes-drive/${viewNoteModal.id}/file`}
                        title="PDF Viewer"
                        style={{
                          width: '100%',
                          height: '520px',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    </div>
                  )}

                  {/* If note has an uploaded Image */}
                  {viewNoteModal.note_type === 'image' && (
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <img
                        src={`/api/notes-drive/${viewNoteModal.id}/file`}
                        alt={viewNoteModal.title}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '520px',
                          objectFit: 'contain',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          boxShadow: 'var(--shadow-md)'
                        }}
                      />
                    </div>
                  )}

                  {/* Text / Markdown Content */}
                  {viewNoteModal.content ? (
                    <div style={{
                      lineHeight: 1.7,
                      fontSize: '0.95rem',
                      whiteSpace: 'pre-wrap',
                      background: 'var(--bg-subtle)',
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)'
                    }}>
                      {viewNoteModal.content}
                    </div>
                  ) : (
                    !['pdf', 'image'].includes(viewNoteModal.note_type) && (
                      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                        No text content stored for this note.
                      </div>
                    )
                  )}
                </div>
              ) : (
                /* ================= TAB 2: AI STUDY KIT & FLASHCARDS ================= */
                <div>
                  {aiGenerating ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                      <Sparkles size={40} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
                      <h4 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.35rem' }}>
                        AI Reading Note & Synthesizing Study Kit...
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Extracting key takeaways, governing formulas, and active recall flashcards.
                      </p>
                    </div>
                  ) : viewNoteModal.ai_summary ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      {/* Summary Box */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)',
                        border: '1.5px solid rgba(99, 102, 241, 0.25)',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 800 }}>
                          <Sparkles size={18} />
                          <span>AI Executive Concept Summary</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: 1.6 }}>
                          {viewNoteModal.ai_summary.summary}
                        </p>
                      </div>

                      {/* Key Exam Takeaways */}
                      {viewNoteModal.ai_summary.key_takeaways && (
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <Zap size={18} color="#f59e0b" />
                            <span>High-Yield Exam Takeaways</span>
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {viewNoteModal.ai_summary.key_takeaways.map((point, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.65rem',
                                background: 'var(--bg-subtle)',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-light)'
                              }}>
                                <span style={{
                                  background: 'var(--primary)',
                                  color: '#fff',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  flexShrink: 0,
                                  marginTop: '2px'
                                }}>
                                  {idx + 1}
                                </span>
                                <span style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Must-Know Definitions & Formulas */}
                      {viewNoteModal.ai_summary.definitions_and_formulas && viewNoteModal.ai_summary.definitions_and_formulas.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <BookOpen size={18} color="#10b981" />
                            <span>Definitions & Formulas</span>
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                            {viewNoteModal.ai_summary.definitions_and_formulas.map((item, idx) => (
                              <div key={idx} style={{
                                background: 'var(--bg-subtle)',
                                padding: '0.85rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: '3.5px solid #10b981',
                                border: '1px solid var(--border-light)',
                                borderLeftWidth: '3.5px'
                              }}>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#10b981', marginBottom: '0.25rem' }}>
                                  {item.term}
                                </div>
                                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                                  {item.definition}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Active Recall Flashcards */}
                      {viewNoteModal.ai_summary.flashcards && viewNoteModal.ai_summary.flashcards.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <Compass size={18} color="#8b5cf6" />
                              <span>Active Recall Flashcards</span>
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Card {currentFlashcard + 1} of {viewNoteModal.ai_summary.flashcards.length}
                            </span>
                          </div>

                          {/* Flip Card Container */}
                          <div
                            onClick={() => setIsFlipped(!isFlipped)}
                            style={{
                              background: isFlipped ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-subtle)',
                              border: isFlipped ? '2px solid #8b5cf6' : '2px dashed var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              padding: '2.5rem 2rem',
                              textAlign: 'center',
                              cursor: 'pointer',
                              minHeight: '180px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.25s ease'
                            }}
                          >
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              color: isFlipped ? '#8b5cf6' : 'var(--primary)',
                              marginBottom: '0.75rem'
                            }}>
                              {isFlipped ? '💡 MODEL REVISION ANSWER (CLICK TO FLIP)' : '❓ TEST QUESTION (CLICK TO REVEAL)'}
                            </span>

                            <div style={{
                              fontSize: isFlipped ? '1rem' : '1.15rem',
                              fontWeight: isFlipped ? 500 : 700,
                              lineHeight: 1.5,
                              color: 'var(--text-primary)'
                            }}>
                              {isFlipped
                                ? viewNoteModal.ai_summary.flashcards[currentFlashcard].answer
                                : viewNoteModal.ai_summary.flashcards[currentFlashcard].question}
                            </div>
                          </div>

                          {/* Flashcard Next / Prev Nav */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                            <button
                              onClick={() => {
                                setCurrentFlashcard(prev => Math.max(0, prev - 1));
                                setIsFlipped(false);
                              }}
                              disabled={currentFlashcard === 0}
                              className="btn btn-secondary"
                              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                            >
                              ← Previous Card
                            </button>
                            <button
                              onClick={() => {
                                setCurrentFlashcard(prev => Math.min(viewNoteModal.ai_summary.flashcards.length - 1, prev + 1));
                                setIsFlipped(false);
                              }}
                              disabled={currentFlashcard === viewNoteModal.ai_summary.flashcards.length - 1}
                              className="btn btn-primary"
                              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                            >
                              Next Card →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                      <Sparkles size={36} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                      <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>No AI Study Kit generated yet</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        Let AI analyze this note to extract key takeaways, formulas, and flashcards.
                      </p>
                      <button
                        onClick={() => handleGenerateAI(viewNoteModal.id)}
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                      >
                        <Sparkles size={16} />
                        <span>Generate AI Study Kit Now</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
