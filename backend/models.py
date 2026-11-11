import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone = Column(String(50), unique=True, index=True, nullable=True)
    username = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=True)
    age = Column(Integer, nullable=True, default=20)
    studying_in = Column(String(255), nullable=True, default="B.Tech Computer Science")
    study_hours = Column(Float, nullable=True, default=4.0)
    target_exam = Column(String(255), nullable=True, default="Semester Finals")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    exams = relationship("Exam", back_populates="user", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    practice_papers = relationship("PracticePaper", back_populates="user", cascade="all, delete-orphan")
    viva_sessions = relationship("VivaSession", back_populates="user", cascade="all, delete-orphan")
    teacher_lessons = relationship("AITeacherLesson", back_populates="user", cascade="all, delete-orphan")
    question_banks = relationship("QuestionBank", back_populates="user", cascade="all, delete-orphan")
    flashcard_decks = relationship("FlashcardDeck", back_populates="user", cascade="all, delete-orphan")
    handwritten_notes = relationship("HandwrittenNote", back_populates="user", cascade="all, delete-orphan")
    notes_drive = relationship("NotesDriveItem", back_populates="user", cascade="all, delete-orphan")

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(50), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    purpose = Column(String(50), default="login")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    exam_date = Column(Date, nullable=False)
    exam_time = Column(String(50), default="09:00")
    exam_type = Column(String(100), default="Final Exam")
    notes = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="exams")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    num_modules = Column(Integer, default=1)
    syllabus_filename = Column(String(255), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="subjects")
    modules = relationship("Module", back_populates="subject", cascade="all, delete-orphan", order_by="Module.module_number")

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    module_number = Column(Integer, default=1)
    module_title = Column(String(255), nullable=False)

    subject = relationship("Subject", back_populates="modules")
    topics = relationship("Topic", back_populates="module", cascade="all, delete-orphan", order_by="Topic.id")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    topic_title = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    module = relationship("Module", back_populates="topics")

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    start_date = Column(String(50), nullable=True) # YYYY-MM-DD
    target_date = Column(String(50), nullable=True) # YYYY-MM-DD
    holidays = Column(Integer, default=0, nullable=True)
    selected_subjects = Column(Text, nullable=False) # JSON encoded list of subject names/ids
    plan_data = Column(Text, nullable=False) # JSON encoded list of days & scheduled topics
    pdf_filename = Column(String(255), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="study_plans")

class PracticePaper(Base):
    __tablename__ = "practice_papers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_name = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    paper_number = Column(Integer, default=1)
    total_marks = Column(Integer, default=100)
    duration_mins = Column(Integer, default=180)
    paper_data = Column(Text, nullable=False) # JSON encoded structured sections & questions
    pdf_filename = Column(String(255), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="practice_papers")

class VivaSession(Base):
    __tablename__ = "viva_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    notes_filename = Column(String(255), nullable=True)
    mode = Column(String(50), nullable=False) # "long", "mcq_with_opt", "mcq_without_opt"
    questions_data = Column(Text, nullable=False) # JSON encoded list of viva questions & hints
    responses_data = Column(Text, default="[]") # JSON encoded student answers & feedback
    overall_score = Column(Float, nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="viva_sessions")

class AITeacherLesson(Base):
    __tablename__ = "ai_teacher_lessons"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String(255), nullable=False)
    pdf_filename = Column(String(255), nullable=True)
    style = Column(String(100), default="comprehensive")
    language = Column(String(50), default="English", nullable=True)
    content = Column(Text, nullable=False) # Detailed written lecture
    audio_summary = Column(Text, nullable=False) # Conversational voice lecture script
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="teacher_lessons")

class QuestionBank(Base):
    __tablename__ = "question_banks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    subject_name = Column(String(255), nullable=True)
    zip_filename = Column(String(255), nullable=True)
    total_papers_analyzed = Column(Integer, default=1)
    total_questions = Column(Integer, default=0)
    questions_data = Column(Text, nullable=False) # JSON encoded list of unique deduplicated questions
    pdf_filename = Column(String(255), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="question_banks")

class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    subject_name = Column(String(255), nullable=True)
    topic = Column(String(255), nullable=True)
    pdf_filename = Column(String(255), nullable=True)
    cards_count = Column(Integer, default=0)
    cards_data = Column(Text, nullable=False) # JSON encoded list of flashcards
    focus_mode = Column(String(100), default="All Core Concepts")
    mastery_score = Column(Float, default=0.0)
    pdf_export_filename = Column(String(255), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="flashcard_decks")


class HandwrittenNote(Base):
    __tablename__ = "handwritten_notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String(255), nullable=False)
    subject_name = Column(String(255), nullable=True)
    source_filename = Column(String(255), nullable=True)
    file_type = Column(String(50), default="pdf") # "pdf", "photo", "text"
    summary = Column(Text, nullable=True)
    definitions_data = Column(Text, default="[]") # JSON list of definitions & formulas
    qa_data = Column(Text, nullable=False) # JSON list of extracted Q&As with marks & model solutions
    key_points_data = Column(Text, default="[]") # JSON list of tips, mnemonics, margin notes
    diagram_notes = Column(Text, nullable=True) # Text or ASCII representation for visual reference
    pdf_filename = Column(String(255), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    user = relationship("User", back_populates="handwritten_notes")

class NotesDriveItem(Base):
    __tablename__ = "notes_drive_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    subject_name = Column(String(255), nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=True)
    module_name = Column(String(255), nullable=True)
    module_number = Column(Integer, nullable=True)
    topic = Column(String(255), nullable=True)
    category = Column(String(100), default="Lecture Notes") # "Lecture Notes", "Revision Cheatsheet", "Formula Sheet", "Lab & Practical", "Past Q&A", "Assignment", "Other"
    note_type = Column(String(50), default="written") # "written", "pdf", "image", "doc", "text"
    content = Column(Text, nullable=True) # Written text/markdown or extracted OCR content
    file_path = Column(String(255), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    file_ext = Column(String(50), nullable=True)
    tags = Column(String(255), nullable=True) # e.g. "unit3,dp,formulas"
    color = Column(String(50), default="#3b82f6")
    is_pinned = Column(Boolean, default=False)
    ai_summary = Column(Text, nullable=True) # JSON or markdown string of AI insights
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notes_drive")
