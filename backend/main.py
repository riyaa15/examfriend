import os
import shutil
import json
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import engine, get_db, Base
import models
import auth
import ai_service
import pdf_utils

# Create database tables in PostgreSQL / fallback SQLite
Base.metadata.create_all(bind=engine)

# Safe migration for language column in ai_teacher_lessons
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE ai_teacher_lessons ADD COLUMN language VARCHAR(50) DEFAULT 'English'"))
        conn.commit()
except Exception:
    pass

# Safe migrations for notes_drive_items (Card 8: Subject & Module Breakdown)
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE notes_drive_items ADD COLUMN IF NOT EXISTS subject_id INTEGER"))
        conn.execute(text("ALTER TABLE notes_drive_items ADD COLUMN IF NOT EXISTS module_id INTEGER"))
        conn.execute(text("ALTER TABLE notes_drive_items ADD COLUMN IF NOT EXISTS module_name VARCHAR(255)"))
        conn.execute(text("ALTER TABLE notes_drive_items ADD COLUMN IF NOT EXISTS module_number INTEGER"))
        conn.commit()
except Exception:
    pass

# Safe migrations for study_plans (Card 3: Start Date, Target Date, Holidays)
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS start_date VARCHAR(50)"))
        conn.execute(text("ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS target_date VARCHAR(50)"))
        conn.execute(text("ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS holidays INTEGER DEFAULT 0"))
        conn.commit()
except Exception:
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE study_plans ADD COLUMN holidays INTEGER DEFAULT 0"))
            conn.commit()
    except Exception:
        pass

app = FastAPI(
    title="EXAMFRIEND API",
    description="Student-centric full-stack backend with PostgreSQL and AI capabilities",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload & Generated Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
GENERATED_DIR = os.path.join(BASE_DIR, "generated")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(GENERATED_DIR, exist_ok=True)

# ----------------- PYDANTIC SCHEMAS ----------------- #

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ExamCreate(BaseModel):
    name: str
    exam_date: str # YYYY-MM-DD
    exam_time: Optional[str] = "09:00"
    exam_type: Optional[str] = "Final Exam"
    notes: Optional[str] = None
    auto_create_subject: Optional[bool] = False

class ExamResponse(BaseModel):
    id: int
    name: str
    exam_date: str
    exam_time: str
    exam_type: str
    notes: Optional[str]

    class Config:
        from_attributes = True

class StudyPlanRequest(BaseModel):
    title: str
    subject_ids: List[int]
    start_date: Optional[str] = None
    target_date: Optional[str] = None
    holidays: Optional[int] = 0
    holiday_dates: Optional[List[str]] = None

class VivaHintRequest(BaseModel):
    question_text: str
    current_answer: str
    hint_index: int = 0

class VivaEvaluateRequest(BaseModel):
    question_id: int
    question_text: str
    concept: str
    student_answer: str
    model_answer: str
    evaluation_criteria: List[str]

class VivaCheckMcqRequest(BaseModel):
    question_id: int
    selected_option: str
    correct_option: str
    explanation: str

class TrashActionRequest(BaseModel):
    card_type: str
    item_id: int

class TopicCreate(BaseModel):
    topic_title: str

class TopicUpdate(BaseModel):
    topic_title: str

class ModuleCreate(BaseModel):
    module_title: str
    module_number: Optional[int] = None

class QuestionBankToggleRequest(BaseModel):
    question_id: int
    is_solved: bool

class FlashcardCardUpdate(BaseModel):
    id: int
    mastery: Optional[str] = None # "unrated", "hard", "good", "easy"
    is_starred: Optional[bool] = None

class FlashcardProgressRequest(BaseModel):
    cards: List[FlashcardCardUpdate]

class NoteDriveCreateRequest(BaseModel):
    title: str
    subject_id: Optional[int] = None
    subject_name: Optional[str] = "General"
    module_id: Optional[int] = None
    module_name: Optional[str] = None
    module_number: Optional[int] = None
    topic: Optional[str] = ""
    category: Optional[str] = "Lecture Notes"
    content: Optional[str] = ""
    tags: Optional[str] = ""
    color: Optional[str] = "#3b82f6"
    is_pinned: Optional[bool] = False

class NoteDriveUpdateRequest(BaseModel):
    title: Optional[str] = None
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    module_id: Optional[int] = None
    module_name: Optional[str] = None
    module_number: Optional[int] = None
    topic: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None
    color: Optional[str] = None
    is_pinned: Optional[bool] = None

# ----------------- AUTH ROUTES ----------------- #


@app.post("/api/auth/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    hashed = auth.hash_password(data.password)
    user = models.User(
        username=data.username.strip(),
        email=data.email.lower().strip(),
        hashed_password=hashed
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }

@app.post("/api/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email.lower().strip()).first()
    if not user or not auth.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    token = auth.create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }

@app.get("/api/auth/me")
def get_me(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    exams_count = db.query(models.Exam).filter(models.Exam.user_id == user.id, models.Exam.is_deleted == False).count()
    subjects_count = db.query(models.Subject).filter(models.Subject.user_id == user.id, models.Subject.is_deleted == False).count()
    
    # Calculate overall progress
    all_topics = db.query(models.Topic).join(models.Module).join(models.Subject).filter(
        models.Subject.user_id == user.id,
        models.Subject.is_deleted == False
    ).all()
    completed = sum(1 for t in all_topics if t.is_completed)
    total = len(all_topics)
    overall_progress = round((completed / total * 100), 1) if total > 0 else 0

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "stats": {
            "upcoming_exams": exams_count,
            "total_subjects": subjects_count,
            "completed_topics": completed,
            "total_topics": total,
            "overall_progress": overall_progress
        }
    }

# ----------------- CARD 1: EXAM COUNTDOWN ----------------- #

@app.get("/api/exams")
def get_exams(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Sorted chronologically with closest upcoming exam at the top
    exams = db.query(models.Exam).filter(
        models.Exam.user_id == user.id,
        models.Exam.is_deleted == False
    ).order_by(models.Exam.exam_date.asc(), models.Exam.exam_time.asc()).all()

    results = []
    today = datetime.date.today()
    for e in exams:
        diff_days = (e.exam_date - today).days
        results.append({
            "id": e.id,
            "name": e.name,
            "exam_date": e.exam_date.isoformat(),
            "exam_time": e.exam_time or "09:00",
            "exam_type": e.exam_type or "Final Exam",
            "notes": e.notes,
            "days_left": diff_days,
            "is_past": diff_days < 0
        })
    return results

@app.post("/api/exams")
def create_exam(data: ExamCreate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        e_date = datetime.date.fromisoformat(data.exam_date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    exam = models.Exam(
        user_id=user.id,
        name=data.name.strip(),
        exam_date=e_date,
        exam_time=data.exam_time or "09:00",
        exam_type=data.exam_type or "Final Exam",
        notes=data.notes,
        is_deleted=False
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    # Seamlessly connect Card 1 to Card 2: auto-create Subject in Card 2 so user doesn't have to enter it
    if getattr(data, "auto_create_subject", False):
        clean_subj_name = data.name.strip()
        existing_subj = db.query(models.Subject).filter(
            models.Subject.user_id == user.id,
            models.Subject.name.ilike(clean_subj_name)
        ).first()
        if not existing_subj:
            parsed = ai_service.parse_syllabus_with_ai("", clean_subj_name, 5)
            subj_count = len(parsed.get("modules", [])) or 5
            new_subj = models.Subject(
                user_id=user.id,
                name=clean_subj_name,
                num_modules=subj_count
            )
            db.add(new_subj)
            db.commit()
            db.refresh(new_subj)
            for m_data in parsed.get("modules", []):
                mod = models.Module(
                    subject_id=new_subj.id,
                    module_number=m_data.get("module_number", 1),
                    module_title=m_data.get("module_title", f"Module {m_data.get('module_number', 1)}")
                )
                db.add(mod)
                db.commit()
                db.refresh(mod)
                for t_name in m_data.get("topics", []):
                    if str(t_name).strip():
                        db.add(models.Topic(
                            module_id=mod.id,
                            topic_title=str(t_name).strip(),
                            is_completed=False
                        ))
            db.commit()

    return {"message": "Exam added successfully!", "exam_id": exam.id}

@app.delete("/api/exams/{exam_id}")
def delete_exam(exam_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id, models.Exam.user_id == user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    # Soft delete
    exam.is_deleted = True
    exam.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Exam moved to Trash successfully"}

# ----------------- CARD 2: SUBJECT & SYLLABUS TRACKER ----------------- #

@app.get("/api/subjects")
def get_subjects(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    subjects = db.query(models.Subject).filter(
        models.Subject.user_id == user.id,
        models.Subject.is_deleted == False
    ).all()
    results = []
    
    for s in subjects:
        modules_list = []
        total_topics = 0
        completed_topics = 0

        for m in s.modules:
            t_list = []
            for t in m.topics:
                total_topics += 1
                if t.is_completed:
                    completed_topics += 1
                t_list.append({
                    "id": t.id,
                    "topic_title": t.topic_title,
                    "is_completed": t.is_completed,
                    "completed_at": t.completed_at.isoformat() if t.completed_at else None
                })
            modules_list.append({
                "id": m.id,
                "module_number": m.module_number,
                "module_title": m.module_title,
                "topics": t_list
            })

        completion_pct = round((completed_topics / total_topics * 100), 1) if total_topics > 0 else 0.0

        results.append({
            "id": s.id,
            "name": s.name,
            "num_modules": s.num_modules,
            "syllabus_filename": s.syllabus_filename,
            "total_topics": total_topics,
            "completed_topics": completed_topics,
            "completion_percentage": completion_pct,
            "modules": modules_list
        })
    return results

@app.post("/api/subjects")
async def create_subject(
    name: Optional[str] = Form(None),
    num_modules: int = Form(5),
    file: Optional[UploadFile] = File(None),
    syllabus_text: Optional[str] = Form(None),
    exam_date: Optional[str] = Form(None),
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    saved_filename = None
    extracted_text = ""

    if file and file.filename:
        filename = f"{user.id}_{int(datetime.datetime.utcnow().timestamp())}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_filename = file.filename

        # Extract text from PDF, Photo, ZIP, Word or Text file
        extracted_text = pdf_utils.extract_text_from_file_or_photo(file_path)
    elif syllabus_text and syllabus_text.strip():
        extracted_text = syllabus_text.strip()

    # Auto-infer subject name if not provided so user never has to type it
    resolved_name = (name or "").strip()
    if not resolved_name:
        if file and file.filename:
            raw_base = os.path.splitext(file.filename)[0]
            clean = re.sub(r'(?i)[_\-+]*(?:syllabus|curriculum|module|unit|notes|paper|exam|test)[_\-+]*', ' ', raw_base)
            clean = re.sub(r'[_\-+]+', ' ', clean).strip()
            resolved_name = clean.title() if len(clean) >= 2 else raw_base.title()
        elif syllabus_text and syllabus_text.strip():
            first_line = syllabus_text.strip().split("\n")[0].strip()
            first_line = re.sub(r'^(?:syllabus for|course|subject)[:\s\-]*', '', first_line, flags=re.IGNORECASE).strip()
            resolved_name = first_line[:50] if len(first_line) >= 2 else "New Subject"
        else:
            resolved_name = "New Subject"

    # Parse syllabus into detailed Module -> granular Topics hierarchy
    parsed = ai_service.parse_syllabus_with_ai(extracted_text, resolved_name, max(1, num_modules))
    actual_module_count = len(parsed.get("modules", [])) or max(1, num_modules)

    # Subject creation
    subject = models.Subject(
        user_id=user.id,
        name=resolved_name,
        num_modules=actual_module_count,
        syllabus_filename=saved_filename
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)

    for m_data in parsed.get("modules", []):
        mod = models.Module(
            subject_id=subject.id,
            module_number=m_data.get("module_number", 1),
            module_title=m_data.get("module_title", f"Module {m_data.get('module_number', 1)}")
        )
        db.add(mod)
        db.commit()
        db.refresh(mod)

        for t_name in m_data.get("topics", []):
            if str(t_name).strip():
                top = models.Topic(
                    module_id=mod.id,
                    topic_title=str(t_name).strip(),
                    is_completed=False
                )
                db.add(top)
        db.commit()

    # If exam_date was provided, automatically connect Card 2 to Card 1 Countdown
    if exam_date and exam_date.strip():
        try:
            e_dt = datetime.date.fromisoformat(exam_date.strip())
            existing_exam = db.query(models.Exam).filter(
                models.Exam.user_id == user.id,
                models.Exam.name.ilike(resolved_name)
            ).first()
            if not existing_exam:
                new_exam = models.Exam(
                    user_id=user.id,
                    name=resolved_name,
                    exam_date=e_dt,
                    exam_time="09:30",
                    exam_type="Final Exam",
                    is_deleted=False
                )
                db.add(new_exam)
                db.commit()
        except Exception as e_err:
            print(f"Auto-create exam error: {e_err}")

    return {"message": "Subject and detailed syllabus created successfully!", "subject_id": subject.id}

@app.post("/api/subjects/{subject_id}/modules")
def add_module_to_subject(
    subject_id: int, 
    data: ModuleCreate, 
    user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id, models.Subject.user_id == user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    current_count = db.query(models.Module).filter(models.Module.subject_id == subject.id).count()
    mod = models.Module(
        subject_id=subject.id,
        module_number=data.module_number or (current_count + 1),
        module_title=data.module_title.strip()
    )
    db.add(mod)
    subject.num_modules = max(subject.num_modules, current_count + 1)
    db.commit()
    db.refresh(mod)
    return {"message": "Module added successfully!", "module_id": mod.id}

@app.post("/api/modules/{module_id}/topics")
def add_topic_to_module(
    module_id: int, 
    data: TopicCreate, 
    user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    module = db.query(models.Module).join(models.Subject).filter(
        models.Module.id == module_id, 
        models.Subject.user_id == user.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    topic = models.Topic(
        module_id=module.id,
        topic_title=data.topic_title.strip(),
        is_completed=False
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return {"message": "Topic added successfully!", "topic_id": topic.id}

@app.put("/api/topics/{topic_id}")
def update_topic(
    topic_id: int, 
    data: TopicUpdate, 
    user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    topic = db.query(models.Topic).join(models.Module).join(models.Subject).filter(
        models.Topic.id == topic_id,
        models.Subject.user_id == user.id
    ).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    topic.topic_title = data.topic_title.strip()
    db.commit()
    return {"message": "Topic updated successfully!", "topic_id": topic.id, "topic_title": topic.topic_title}

@app.delete("/api/topics/{topic_id}")
def delete_topic(
    topic_id: int, 
    user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    topic = db.query(models.Topic).join(models.Module).join(models.Subject).filter(
        models.Topic.id == topic_id,
        models.Subject.user_id == user.id
    ).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    db.delete(topic)
    db.commit()
    return {"message": "Topic deleted successfully"}

@app.post("/api/modules/{module_id}/expand")
def expand_module_topics(
    module_id: int, 
    user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    module = db.query(models.Module).join(models.Subject).filter(
        models.Module.id == module_id, 
        models.Subject.user_id == user.id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    current_topic_titles = [t.topic_title for t in module.topics]
    expanded = ai_service.deep_expand_module_topics(
        subject_name=module.subject.name,
        module_title=module.module_title,
        current_topics=current_topic_titles
    )

    added_count = 0
    for t_text in expanded:
        t_clean = t_text.strip()
        if t_clean and t_clean.lower() not in [c.lower() for c in current_topic_titles]:
            new_top = models.Topic(
                module_id=module.id,
                topic_title=t_clean,
                is_completed=False
            )
            db.add(new_top)
            added_count += 1
            current_topic_titles.append(t_clean)
    db.commit()

    return {"message": f"Successfully expanded module with {added_count} new granular topics!", "added_count": added_count}

@app.post("/api/topics/{topic_id}/toggle")
def toggle_topic(topic_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Verify topic belongs to user
    topic = db.query(models.Topic).join(models.Module).join(models.Subject).filter(
        models.Topic.id == topic_id,
        models.Subject.user_id == user.id
    ).first()
    
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.is_completed = not topic.is_completed
    topic.completed_at = datetime.datetime.utcnow() if topic.is_completed else None
    db.commit()

    # Recalculate subject stats
    subject = topic.module.subject
    all_topics = db.query(models.Topic).join(models.Module).filter(models.Module.subject_id == subject.id).all()
    completed = sum(1 for t in all_topics if t.is_completed)
    total = len(all_topics)
    pct = round((completed / total * 100), 1) if total > 0 else 0

    return {
        "topic_id": topic.id,
        "is_completed": topic.is_completed,
        "subject_id": subject.id,
        "completion_percentage": pct,
        "completed_topics": completed,
        "total_topics": total
    }

@app.delete("/api/subjects/{subject_id}")
def delete_subject(subject_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id, models.Subject.user_id == user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    subject.is_deleted = True
    subject.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Subject moved to Trash successfully"}

# ----------------- CARD 3: STUDY PLAN GENERATOR ----------------- #

@app.get("/api/study-plans")
def get_study_plans(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    plans = db.query(models.StudyPlan).filter(
        models.StudyPlan.user_id == user.id,
        models.StudyPlan.is_deleted == False
    ).order_by(models.StudyPlan.created_at.desc()).all()
    results = []
    for p in plans:
        try:
            p_data = json.loads(p.plan_data)
            s_data = json.loads(p.selected_subjects)
        except Exception:
            p_data = []
            s_data = []
        holidays_val = getattr(p, "holidays", 0) or 0
        if not holidays_val and p_data:
            holidays_val = sum(1 for item in p_data if item.get("is_holiday"))
        results.append({
            "id": p.id,
            "title": p.title,
            "start_date": getattr(p, "start_date", None),
            "target_date": getattr(p, "target_date", None),
            "holidays": holidays_val,
            "selected_subjects": s_data,
            "plan_data": p_data,
            "pdf_url": f"/api/study-plans/{p.id}/pdf" if p.pdf_filename else None,
            "created_at": p.created_at.isoformat()
        })
    return results

@app.post("/api/study-plans/generate")
def generate_study_plan(
    data: StudyPlanRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch selected subjects and their topics
    subjects = db.query(models.Subject).filter(
        models.Subject.id.in_(data.subject_ids),
        models.Subject.user_id == user.id
    ).all()

    if not subjects:
        raise HTTPException(status_code=400, detail="Please select at least one valid subject.")

    # Check closest exam date among user exams
    closest_exam = db.query(models.Exam).filter(
        models.Exam.user_id == user.id,
        models.Exam.exam_date >= datetime.date.today()
    ).order_by(models.Exam.exam_date.asc()).first()

    # Collect topics: prioritize uncompleted topics, then all topics
    topic_items = []
    for s in subjects:
        for m in s.modules:
            for t in m.topics:
                if not t.is_completed and t.topic_title and t.topic_title.strip():
                    topic_items.append({
                        "subject": s.name,
                        "topic": t.topic_title.strip(),
                        "module": m.module_title.strip() if m.module_title else ""
                    })

    if not topic_items:
        for s in subjects:
            for m in s.modules:
                for t in m.topics:
                    if t.topic_title and t.topic_title.strip():
                        topic_items.append({
                            "subject": s.name,
                            "topic": t.topic_title.strip(),
                            "module": m.module_title.strip() if m.module_title else ""
                        })

    if not topic_items:
        for s in subjects:
            topic_items.append({
                "subject": s.name,
                "topic": f"{s.name} Core Concepts & Key Formulas",
                "module": "General"
            })

    today = datetime.date.today()
    start_dt = today
    if data.start_date:
        try:
            start_dt = datetime.date.fromisoformat(data.start_date)
        except Exception:
            start_dt = today

    req_holidays = max(0, data.holidays or 0)

    if data.target_date:
        try:
            target_dt = datetime.date.fromisoformat(data.target_date)
            diff_days = (target_dt - start_dt).days + 1
            total_days = max(1, min(120, diff_days))
        except Exception:
            total_days = max(7, min(30, len(subjects) * 2 + req_holidays))
    else:
        if closest_exam and (closest_exam.exam_date - start_dt).days >= 5:
            diff_days = (closest_exam.exam_date - start_dt).days + 1
            total_days = min(60, diff_days)
        else:
            study_days_needed = max(5, min(30, (len(topic_items) + 1) // 2 + 2))
            total_days = study_days_needed + req_holidays

    # Calculate actual holiday count (can be at most total_days - 1 if total_days > 1)
    holidays_count = max(0, min(total_days - 1 if total_days > 1 else 0, req_holidays))
    all_dates = [start_dt + datetime.timedelta(days=i) for i in range(total_days)]

    # Determine holiday dates
    holiday_date_set = set()
    if data.holiday_dates:
        for hd in data.holiday_dates:
            try:
                h_dt = datetime.date.fromisoformat(hd)
                if start_dt <= h_dt <= all_dates[-1]:
                    holiday_date_set.add(h_dt.isoformat())
                    if len(holiday_date_set) >= holidays_count:
                        break
            except Exception:
                pass

    # Auto-pick Sundays as holidays if needed
    if len(holiday_date_set) < holidays_count:
        sundays = [d for d in all_dates if d.weekday() == 6 and d.isoformat() not in holiday_date_set]
        for sun in sundays:
            holiday_date_set.add(sun.isoformat())
            if len(holiday_date_set) >= holidays_count:
                break

    # Auto-pick Saturdays if still needed
    if len(holiday_date_set) < holidays_count:
        saturdays = [d for d in all_dates if d.weekday() == 5 and d.isoformat() not in holiday_date_set]
        for sat in saturdays:
            holiday_date_set.add(sat.isoformat())
            if len(holiday_date_set) >= holidays_count:
                break

    # Spaced distribution if still needed
    if len(holiday_date_set) < holidays_count:
        eligible = [d for d in all_dates[1:-1] if d.isoformat() not in holiday_date_set]
        if not eligible:
            eligible = [d for d in all_dates if d.isoformat() not in holiday_date_set]
        remaining = holidays_count - len(holiday_date_set)
        if eligible:
            step = max(1, len(eligible) // (remaining + 1))
            for i in range(step, len(eligible), step):
                holiday_date_set.add(eligible[i].isoformat())
                if len(holiday_date_set) >= holidays_count:
                    break
            for d in eligible:
                if len(holiday_date_set) >= holidays_count:
                    break
                holiday_date_set.add(d.isoformat())

    # Study days list
    study_day_dates = [d for d in all_dates if d.isoformat() not in holiday_date_set]
    if not study_day_dates:
        study_day_dates = [all_dates[0]]
        holiday_date_set.discard(all_dates[0].isoformat())

    num_study_days = len(study_day_dates)

    # Dedicate last 1-2 study days to final revision if enough study days exist
    if num_study_days >= 7:
        revision_days_count = 2
    elif num_study_days >= 4:
        revision_days_count = 1
    else:
        revision_days_count = 0

    learning_days_count = max(1, num_study_days - revision_days_count)
    items_per_day = max(1, (len(topic_items) + learning_days_count - 1) // learning_days_count)

    study_day_assignments = {}
    item_ptr = 0

    for idx, s_date in enumerate(study_day_dates):
        is_revision_day = (idx >= learning_days_count)
        if is_revision_day:
            rev_num = idx - learning_days_count + 1
            if rev_num == 1 and revision_days_count == 2:
                top_str = "Comprehensive Revision across all covered topics"
                study_day_assignments[s_date.isoformat()] = {
                    "subject": "All Selected Subjects",
                    "topic": top_str,
                    "topics": [top_str]
                }
            else:
                top_str = "Final Mock Test & Rapid Formula Recall"
                study_day_assignments[s_date.isoformat()] = {
                    "subject": "All Selected Subjects",
                    "topic": top_str,
                    "topics": [top_str]
                }
        elif item_ptr < len(topic_items):
            batch = topic_items[item_ptr : item_ptr + items_per_day]
            item_ptr += items_per_day
            subj_names = list(dict.fromkeys([b["subject"] for b in batch]))
            subj_str = ", ".join(subj_names[:2]) + (f" (+{len(subj_names)-2} more)" if len(subj_names) > 2 else "")
            
            # Pure clean topic names: "Topic A • Topic B"
            topics_list = [b["topic"] for b in batch]
            topic_str = " • ".join(topics_list)

            study_day_assignments[s_date.isoformat()] = {
                "subject": subj_str,
                "topic": topic_str,
                "topics": topics_list
            }
        else:
            # Fallback when days exceed topics: practice earlier topics
            subj = subjects[idx % len(subjects)].name
            fallback_top = f"{subj} Practice Questions & Deep Dive"
            study_day_assignments[s_date.isoformat()] = {
                "subject": subj,
                "topic": fallback_top,
                "topics": [fallback_top]
            }

    # Build chronological days_schedule with sequential Day 1 to Day N study days
    days_schedule = []
    study_day_counter = 1
    for curr_date in all_dates:
        iso_str = curr_date.isoformat()
        date_formatted = curr_date.strftime("%d %b %Y (%a)")

        if iso_str in holiday_date_set:
            days_schedule.append({
                "day": "Holiday",
                "date": date_formatted,
                "date_iso": iso_str,
                "is_holiday": True,
                "subject": "🌴 Holiday",
                "topic_1": "Rest & Recharge",
                "topic_2": "Optional Light Review (No Study Scheduled)",
                "topic": "Holiday / Rest Day",
                "topics": ["Rest & Recharge (No study scheduled)"],
                "completed": False
            })
        else:
            assigned = study_day_assignments.get(iso_str, {
                "subject": subjects[0].name,
                "topic": "Topic Review & Practice",
                "topics": ["Topic Review & Practice"]
            })
            raw_top_list = assigned.get("topics", [])
            t1 = raw_top_list[0] if len(raw_top_list) > 0 else assigned["topic"]
            t2 = raw_top_list[1] if len(raw_top_list) > 1 else "Active Recall & Practice Problems"

            days_schedule.append({
                "day": f"Day {study_day_counter}",
                "date": date_formatted,
                "date_iso": iso_str,
                "is_holiday": False,
                "subject": assigned["subject"],
                "topic_1": t1,
                "topic_2": t2,
                "topic": f"{t1} • {t2}",
                "topics": [t1, t2],
                "completed": False
            })
            study_day_counter += 1

    # Save to Database
    pdf_filename = f"plan_{user.id}_{int(datetime.datetime.utcnow().timestamp())}.pdf"
    pdf_path = os.path.join(GENERATED_DIR, pdf_filename)
    
    pdf_utils.generate_study_plan_pdf(
        plan_title=data.title,
        user_name=user.username,
        days_data=days_schedule,
        output_path=pdf_path
    )

    plan = models.StudyPlan(
        user_id=user.id,
        title=data.title,
        start_date=start_dt.isoformat(),
        target_date=all_dates[-1].isoformat(),
        holidays=len(holiday_date_set),
        selected_subjects=json.dumps([s.name for s in subjects]),
        plan_data=json.dumps(days_schedule),
        pdf_filename=pdf_filename
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "message": "Study plan generated successfully!",
        "plan_id": plan.id,
        "title": plan.title,
        "start_date": plan.start_date,
        "target_date": plan.target_date,
        "holidays": len(holiday_date_set),
        "plan": days_schedule,
        "pdf_url": f"/api/study-plans/{plan.id}/pdf"
    }

@app.get("/api/study-plans/{plan_id}/pdf")
def download_study_plan_pdf(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(models.StudyPlan).filter(models.StudyPlan.id == plan_id).first()
    if not plan or not plan.pdf_filename:
        raise HTTPException(status_code=404, detail="Plan PDF not found")
    
    file_path = os.path.join(GENERATED_DIR, plan.pdf_filename)
    if not os.path.exists(file_path):
        # Regenerate if file was cleared
        try:
            days = json.loads(plan.plan_data)
            pdf_utils.generate_study_plan_pdf(plan.title, "Student", days, file_path)
        except Exception:
            raise HTTPException(status_code=404, detail="Could not retrieve PDF file")

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=f"{plan.title.replace(' ', '_')}_StudyPlan.pdf"
    )

@app.delete("/api/study-plans/{plan_id}")
def delete_study_plan(plan_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    plan = db.query(models.StudyPlan).filter(models.StudyPlan.id == plan_id, models.StudyPlan.user_id == user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    plan.is_deleted = True
    plan.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Study plan moved to Trash successfully"}

# ----------------- CARD 4: PRACTICE PAPER GENERATOR ----------------- #

@app.get("/api/practice-papers")
def get_practice_papers(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    papers = db.query(models.PracticePaper).filter(
        models.PracticePaper.user_id == user.id,
        models.PracticePaper.is_deleted == False
    ).order_by(models.PracticePaper.created_at.desc()).all()
    results = []
    for p in papers:
        try:
            p_data = json.loads(p.paper_data)
        except Exception:
            p_data = {}
        results.append({
            "id": p.id,
            "title": p.title,
            "subject_name": p.subject_name,
            "paper_number": p.paper_number,
            "total_marks": p.total_marks,
            "duration_mins": p.duration_mins,
            "paper_data": p_data,
            "pdf_url": f"/api/practice-papers/{p.id}/pdf",
            "created_at": p.created_at.isoformat()
        })
    return results

@app.post("/api/practice-papers/generate")
async def generate_practice_papers(
    subject_id: int = Form(...),
    num_papers: int = Form(1),
    file: UploadFile = File(...),
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify subject
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id, models.Subject.user_id == user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Selected subject not found")

    # Save uploaded file (supports ZIP, PDF, Photo, Word, Text)
    timestamp = int(datetime.datetime.utcnow().timestamp())
    orig_name = file.filename or f"papers_{timestamp}.zip"
    safe_name = "".join(c for c in orig_name if c.isalnum() or c in ('.', '_', '-'))
    uploaded_path = os.path.join(UPLOAD_DIR, f"papers_{user.id}_{timestamp}_{safe_name}")
    
    with open(uploaded_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract all text from past question papers (ZIP, PDF, photo, docx, txt)
    past_papers_text = pdf_utils.extract_text_from_file_or_photo(uploaded_path)

    # Gather known syllabus topics for this subject
    syllabus_topics = []
    for m in subject.modules:
        for t in m.topics:
            syllabus_topics.append(t.topic_title)

    # Generate practice papers using AI or pattern matcher
    generated_list = ai_service.generate_practice_papers_with_ai(
        past_papers_text=past_papers_text,
        subject_name=subject.name,
        syllabus_topics=syllabus_topics,
        num_papers=max(1, min(5, num_papers))
    )

    created_papers = []
    for idx, paper_dict in enumerate(generated_list, 1):
        pdf_name = f"mock_paper_{user.id}_{timestamp}_{idx}.pdf"
        pdf_path = os.path.join(GENERATED_DIR, pdf_name)
        
        pdf_utils.generate_practice_paper_pdf(paper_dict, pdf_path)

        p_obj = models.PracticePaper(
            user_id=user.id,
            subject_name=subject.name,
            title=paper_dict.get("title", f"{subject.name} Mock Practice Paper #{idx}"),
            paper_number=idx,
            total_marks=paper_dict.get("total_marks", 100),
            duration_mins=paper_dict.get("duration_mins", 180),
            paper_data=json.dumps(paper_dict),
            pdf_filename=pdf_name
        )
        db.add(p_obj)
        db.commit()
        db.refresh(p_obj)
        created_papers.append({
            "id": p_obj.id,
            "title": p_obj.title,
            "pdf_url": f"/api/practice-papers/{p_obj.id}/pdf"
        })

    return {
        "message": f"Successfully generated {len(created_papers)} practice paper(s) matching your past paper pattern!",
        "papers": created_papers
    }

@app.get("/api/practice-papers/{paper_id}/pdf")
def download_practice_paper_pdf(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(models.PracticePaper).filter(models.PracticePaper.id == paper_id).first()
    if not paper or not paper.pdf_filename:
        raise HTTPException(status_code=404, detail="Practice Paper PDF not found")
    
    file_path = os.path.join(GENERATED_DIR, paper.pdf_filename)
    if not os.path.exists(file_path):
        try:
            p_data = json.loads(paper.paper_data)
            pdf_utils.generate_practice_paper_pdf(p_data, file_path)
        except Exception:
            raise HTTPException(status_code=404, detail="Could not retrieve PDF file")

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=f"{paper.title.replace(' ', '_')}.pdf"
    )

@app.delete("/api/practice-papers/{paper_id}")
def delete_practice_paper(paper_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    paper = db.query(models.PracticePaper).filter(models.PracticePaper.id == paper_id, models.PracticePaper.user_id == user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    paper.is_deleted = True
    paper.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Practice paper moved to Trash successfully"}

# ----------------- CARD 5: AI VIVA & NOTES TESTER ----------------- #

@app.post("/api/viva/upload-notes")
async def upload_viva_notes(
    mode: str = Form(...), # "long", "mcq_with_opt", "mcq_without_opt"
    file: UploadFile = File(...),
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    timestamp = int(datetime.datetime.utcnow().timestamp())
    notes_filename = f"notes_{user.id}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, notes_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text from notes (PDF, Photo, ZIP, Word, Text)
    notes_text = pdf_utils.extract_text_from_file_or_photo(file_path)

    # Generate Viva Questions
    questions = ai_service.generate_viva_questions_from_notes(notes_text, mode=mode, count=5)

    viva_session = models.VivaSession(
        user_id=user.id,
        title=f"Viva on {file.filename.replace('.pdf', '')}",
        notes_filename=file.filename,
        mode=mode,
        questions_data=json.dumps(questions),
        responses_data="[]"
    )
    db.add(viva_session)
    db.commit()
    db.refresh(viva_session)

    return {
        "session_id": viva_session.id,
        "title": viva_session.title,
        "mode": viva_session.mode,
        "questions": questions
    }

@app.post("/api/viva/hint")
def request_teacher_hint(data: VivaHintRequest):
    """Provides gentle real-time teacher hints when student struggles or pauses."""
    hint_obj = ai_service.get_teacher_hint(data.question_text, data.current_answer, data.hint_index)
    return hint_obj

@app.post("/api/viva/evaluate")
def evaluate_viva(data: VivaEvaluateRequest):
    """Evaluates verbal oral viva answer or written reply."""
    eval_result = ai_service.evaluate_viva_response(
        question_text=data.question_text,
        concept=data.concept,
        student_answer=data.student_answer,
        model_answer=data.model_answer,
        evaluation_criteria=data.evaluation_criteria
    )
    return eval_result

@app.post("/api/viva/check-mcq")
def check_mcq_answer(data: VivaCheckMcqRequest):
    """Checks MCQ option and returns instant feedback."""
    is_correct = (data.selected_option.strip().upper() == data.correct_option.strip().upper())
    return {
        "is_correct": is_correct,
        "correct_option": data.correct_option,
        "selected_option": data.selected_option,
        "explanation": data.explanation
    }

@app.get("/api/viva/sessions")
def get_viva_sessions(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(models.VivaSession).filter(
        models.VivaSession.user_id == user.id,
        models.VivaSession.is_deleted == False
    ).order_by(models.VivaSession.created_at.desc()).all()
    results = []
    for s in sessions:
        try:
            q_data = json.loads(s.questions_data)
        except Exception:
            q_data = []
        results.append({
            "id": s.id,
            "title": s.title,
            "notes_filename": s.notes_filename,
            "mode": s.mode,
            "questions_count": len(q_data),
            "created_at": s.created_at.isoformat()
        })
    return results

@app.delete("/api/viva/sessions/{session_id}")
def delete_viva_session(session_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    session = db.query(models.VivaSession).filter(models.VivaSession.id == session_id, models.VivaSession.user_id == user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_deleted = True
    session.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Viva session moved to Trash successfully"}

# ----------------- CARD 6: AI TEACHER (TOPIC & NOTES EXPLAINER) ----------------- #

@app.post("/api/teacher/explain")
async def explain_topic(
    topic: str = Form(...),
    style: str = Form("comprehensive"),
    language: str = Form("English"),
    file: Optional[UploadFile] = File(None),
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    saved_filename = None
    extracted_text = ""
    if file and file.filename:
        timestamp = int(datetime.datetime.utcnow().timestamp())
        unique_name = f"teacher_{user.id}_{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_filename = file.filename
        extracted_text = pdf_utils.extract_text_from_file_or_photo(file_path)

    lesson_data = ai_service.generate_ai_teacher_lesson(
        topic=topic.strip(),
        pdf_text=extracted_text,
        style=style,
        language=language.strip()
    )

    lesson_obj = models.AITeacherLesson(
        user_id=user.id,
        topic=topic.strip(),
        pdf_filename=saved_filename,
        style=style,
        language=language.strip(),
        content=json.dumps(lesson_data),
        audio_summary=lesson_data.get("voice_script", "")
    )
    db.add(lesson_obj)
    db.commit()
    db.refresh(lesson_obj)

    return {
        "lesson_id": lesson_obj.id,
        "topic": lesson_obj.topic,
        "style": lesson_obj.style,
        "language": getattr(lesson_obj, "language", None) or language.strip(),
        "pdf_filename": lesson_obj.pdf_filename,
        "written_explanation": lesson_data.get("written_explanation", ""),
        "step_by_step_solution": lesson_data.get("step_by_step_solution", ""),
        "voice_script": lesson_data.get("voice_script", ""),
        "video_slides": lesson_data.get("video_slides", []),
        "key_takeaways": lesson_data.get("key_takeaways", []),
        "quick_quiz": lesson_data.get("quick_quiz", []),
        "created_at": lesson_obj.created_at.isoformat()
    }

@app.get("/api/teacher/lessons")
def get_teacher_lessons(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    lessons = db.query(models.AITeacherLesson).filter(
        models.AITeacherLesson.user_id == user.id,
        models.AITeacherLesson.is_deleted == False
    ).order_by(models.AITeacherLesson.created_at.desc()).all()

    results = []
    for l in lessons:
        try:
            parsed = json.loads(l.content)
        except Exception:
            parsed = {"written_explanation": l.content, "key_takeaways": [], "quick_quiz": []}
        results.append({
            "id": l.id,
            "topic": l.topic,
            "style": l.style,
            "language": getattr(l, "language", None) or parsed.get("language", "English"),
            "pdf_filename": l.pdf_filename,
            "written_explanation": parsed.get("written_explanation", ""),
            "step_by_step_solution": parsed.get("step_by_step_solution", ""),
            "voice_script": l.audio_summary or parsed.get("voice_script", ""),
            "video_slides": parsed.get("video_slides", []),
            "key_takeaways": parsed.get("key_takeaways", []),
            "quick_quiz": parsed.get("quick_quiz", []),
            "created_at": l.created_at.isoformat()
        })
    return results

@app.delete("/api/teacher/lessons/{lesson_id}")
def delete_teacher_lesson(lesson_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    lesson = db.query(models.AITeacherLesson).filter(
        models.AITeacherLesson.id == lesson_id,
        models.AITeacherLesson.user_id == user.id
    ).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    lesson.is_deleted = True
    lesson.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Lesson moved to Trash successfully"}

# ----------------- CARD 7: MAKE QUESTION BANK ----------------- #

@app.post("/api/question-banks/generate")
async def generate_question_bank(
    subject_name: str = Form(...),
    title: Optional[str] = Form(None),
    file: UploadFile = File(...),
    target_marks: Optional[str] = Form(None),
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    timestamp = int(datetime.datetime.utcnow().timestamp())
    saved_filename = file.filename or f"papers_{timestamp}.zip"
    uploaded_path = os.path.join(UPLOAD_DIR, f"qb_{user.id}_{timestamp}_{saved_filename}")
    extract_folder = os.path.join(UPLOAD_DIR, f"qb_extract_{user.id}_{timestamp}")

    with open(uploaded_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text from the ZIP, PDF, Photo, Word, or Text file
    all_papers_text = pdf_utils.extract_text_from_file_or_photo(uploaded_path)

    # Generate deduplicated question bank
    bank_data = ai_service.generate_question_bank_from_papers(
        past_papers_text=all_papers_text,
        subject_name=subject_name.strip(),
        target_marks_filter=target_marks
    )

    clean_title = title.strip() if title and title.strip() else f"{subject_name.strip()} Master Question Bank"
    bank_data["title"] = clean_title
    bank_data["subject_name"] = subject_name.strip()

    # Generate PDF
    pdf_name = f"question_bank_{user.id}_{timestamp}.pdf"
    pdf_path = os.path.join(GENERATED_DIR, pdf_name)
    pdf_utils.generate_question_bank_pdf(bank_data, pdf_path)

    # Store in database
    qb_obj = models.QuestionBank(
        user_id=user.id,
        title=clean_title,
        subject_name=subject_name.strip(),
        zip_filename=saved_filename,
        total_papers_analyzed=bank_data.get("total_papers_analyzed", 1),
        total_questions=bank_data.get("total_questions", len(bank_data.get("questions", []))),
        questions_data=json.dumps(bank_data.get("questions", [])),
        pdf_filename=pdf_name,
        is_deleted=False
    )
    db.add(qb_obj)
    db.commit()
    db.refresh(qb_obj)

    return {
        "message": f"Successfully built Question Bank with {qb_obj.total_questions} unique deduplicated questions!",
        "question_bank_id": qb_obj.id,
        "title": qb_obj.title,
        "subject_name": qb_obj.subject_name,
        "total_papers_analyzed": qb_obj.total_papers_analyzed,
        "total_questions": qb_obj.total_questions,
        "duplicates_merged_count": bank_data.get("duplicates_merged_count", 0),
        "questions": bank_data.get("questions", []),
        "pdf_url": f"/api/question-banks/{qb_obj.id}/pdf"
    }

@app.get("/api/question-banks")
def get_question_banks(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    banks = db.query(models.QuestionBank).filter(
        models.QuestionBank.user_id == user.id,
        models.QuestionBank.is_deleted == False
    ).order_by(models.QuestionBank.created_at.desc()).all()

    results = []
    for b in banks:
        try:
            q_list = json.loads(b.questions_data)
        except Exception:
            q_list = []
        solved_count = sum(1 for q in q_list if q.get("is_solved", False))
        results.append({
            "id": b.id,
            "title": b.title,
            "subject_name": b.subject_name,
            "zip_filename": b.zip_filename,
            "total_papers_analyzed": b.total_papers_analyzed,
            "total_questions": b.total_questions,
            "solved_count": solved_count,
            "questions": q_list,
            "pdf_url": f"/api/question-banks/{b.id}/pdf" if b.pdf_filename else None,
            "created_at": b.created_at.isoformat()
        })
    return results

@app.get("/api/question-banks/{bank_id}")
def get_single_question_bank(bank_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    bank = db.query(models.QuestionBank).filter(
        models.QuestionBank.id == bank_id,
        models.QuestionBank.user_id == user.id,
        models.QuestionBank.is_deleted == False
    ).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Question Bank not found")
    
    try:
        q_list = json.loads(bank.questions_data)
    except Exception:
        q_list = []

    return {
        "id": bank.id,
        "title": bank.title,
        "subject_name": bank.subject_name,
        "zip_filename": bank.zip_filename,
        "total_papers_analyzed": bank.total_papers_analyzed,
        "total_questions": bank.total_questions,
        "questions": q_list,
        "pdf_url": f"/api/question-banks/{bank.id}/pdf" if bank.pdf_filename else None,
        "created_at": bank.created_at.isoformat()
    }

@app.get("/api/question-banks/{bank_id}/pdf")
def download_question_bank_pdf(bank_id: int, db: Session = Depends(get_db)):
    bank = db.query(models.QuestionBank).filter(models.QuestionBank.id == bank_id).first()
    if not bank or not bank.pdf_filename:
        raise HTTPException(status_code=404, detail="Question Bank PDF not found")
    
    file_path = os.path.join(GENERATED_DIR, bank.pdf_filename)
    if not os.path.exists(file_path):
        try:
            q_list = json.loads(bank.questions_data)
            pdf_utils.generate_question_bank_pdf({
                "title": bank.title,
                "subject_name": bank.subject_name,
                "total_papers_analyzed": bank.total_papers_analyzed,
                "total_questions": bank.total_questions,
                "questions": q_list
            }, file_path)
        except Exception:
            raise HTTPException(status_code=404, detail="Could not retrieve Question Bank PDF")

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=f"{bank.title.replace(' ', '_')}.pdf"
    )

@app.post("/api/question-banks/{bank_id}/toggle-solved")
def toggle_question_solved(
    bank_id: int, 
    data: QuestionBankToggleRequest, 
    user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    bank = db.query(models.QuestionBank).filter(
        models.QuestionBank.id == bank_id,
        models.QuestionBank.user_id == user.id
    ).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Question Bank not found")
    
    try:
        q_list = json.loads(bank.questions_data)
    except Exception:
        q_list = []

    updated = False
    for q in q_list:
        if q.get("id") == data.question_id:
            q["is_solved"] = data.is_solved
            updated = True
            break

    if updated:
        bank.questions_data = json.dumps(q_list)
        db.commit()

    solved_count = sum(1 for q in q_list if q.get("is_solved", False))
    return {
        "question_id": data.question_id,
        "is_solved": data.is_solved,
        "solved_count": solved_count,
        "total_questions": len(q_list)
    }

@app.delete("/api/question-banks/{bank_id}")
def delete_question_bank(bank_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    bank = db.query(models.QuestionBank).filter(
        models.QuestionBank.id == bank_id,
        models.QuestionBank.user_id == user.id
    ).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Question Bank not found")
    bank.is_deleted = True
    bank.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Question Bank moved to Trash successfully"}

# ----------------- CARD 7: AI FLASHCARD GENERATOR (PDF SYNTHESIS) ----------------- #

@app.post("/api/flashcards/generate")
def generate_flashcards(
    file: Optional[UploadFile] = File(None),
    title: Optional[str] = Form(""),
    subject_name: Optional[str] = Form("General"),
    topic: Optional[str] = Form(""),
    card_count: int = Form(10),
    focus_mode: str = Form("All Core Concepts"),
    raw_text: Optional[str] = Form(None),
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    timestamp = int(datetime.datetime.utcnow().timestamp())
    saved_filename = None
    extracted_text = ""

    if file and file.filename:
        saved_filename = file.filename
        safe_name = "".join(c for c in saved_filename if c.isalnum() or c in ('.', '_', '-'))
        uploaded_path = os.path.join(UPLOAD_DIR, f"fc_{user.id}_{timestamp}_{safe_name}")
        with open(uploaded_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        extracted_text = pdf_utils.extract_text_from_file_or_photo(uploaded_path)
    
    if raw_text and raw_text.strip():
        extracted_text = (extracted_text + "\n\n" + raw_text.strip()).strip()

    # Determine topic / title
    clean_topic = topic.strip() if topic and topic.strip() else ""
    if not clean_topic and file and file.filename:
        clean_topic = os.path.splitext(file.filename)[0].replace("_", " ").replace("-", " ").title()
    if not clean_topic:
        clean_topic = "Core Exam Concepts"

    clean_subj = subject_name.strip() if subject_name and subject_name.strip() else "Exam Preparation"
    deck_title = title.strip() if title and title.strip() else f"{clean_topic} Flashcards"

    # Call AI service
    ai_result = ai_service.generate_flashcards_from_pdf(
        content_text=extracted_text,
        topic=clean_topic,
        subject_name=clean_subj,
        card_count=max(4, min(30, card_count)),
        focus_mode=focus_mode
    )

    cards_list = ai_result.get("cards", [])
    # Ensure every card has standard structure
    for idx, c in enumerate(cards_list):
        c["id"] = idx + 1
        if "mastery" not in c:
            c["mastery"] = "unrated"
        if "is_starred" not in c:
            c["is_starred"] = False
        if "category" not in c or not c["category"]:
            c["category"] = "Core Concept"
        if "difficulty" not in c or not c["difficulty"]:
            c["difficulty"] = "Medium"

    # Generate printable PDF
    pdf_name = f"flashcards_{user.id}_{timestamp}.pdf"
    pdf_path = os.path.join(GENERATED_DIR, pdf_name)
    try:
        pdf_utils.generate_flashcards_pdf({
            "title": deck_title,
            "subject_name": clean_subj,
            "cards": cards_list
        }, pdf_path)
    except Exception as e:
        print(f"Error generating flashcards PDF: {e}")
        pdf_name = None

    # Save Deck to DB
    deck = models.FlashcardDeck(
        user_id=user.id,
        title=deck_title,
        subject_name=clean_subj,
        topic=clean_topic,
        pdf_filename=saved_filename,
        cards_count=len(cards_list),
        cards_data=json.dumps(cards_list),
        focus_mode=focus_mode,
        mastery_score=0,
        pdf_export_filename=pdf_name,
        is_deleted=False
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)

    return {
        "message": f"Successfully generated {len(cards_list)} interactive flashcards!",
        "deck_id": deck.id,
        "deck": {
            "id": deck.id,
            "title": deck.title,
            "subject_name": deck.subject_name,
            "topic": deck.topic,
            "pdf_filename": deck.pdf_filename,
            "cards_count": deck.cards_count,
            "focus_mode": deck.focus_mode,
            "mastery_score": deck.mastery_score,
            "pdf_url": f"/api/flashcards/decks/{deck.id}/pdf" if deck.pdf_export_filename else None,
            "cards": cards_list,
            "created_at": deck.created_at.isoformat()
        }
    }

@app.get("/api/flashcards/decks")
def get_flashcard_decks(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    decks = db.query(models.FlashcardDeck).filter(
        models.FlashcardDeck.user_id == user.id,
        models.FlashcardDeck.is_deleted == False
    ).order_by(models.FlashcardDeck.created_at.desc()).all()

    total_cards = 0
    total_mastered = 0
    subjects_set = set()
    result_decks = []

    for d in decks:
        try:
            cards = json.loads(d.cards_data)
        except Exception:
            cards = []

        easy_count = sum(1 for c in cards if c.get("mastery") == "easy")
        good_count = sum(1 for c in cards if c.get("mastery") == "good")
        hard_count = sum(1 for c in cards if c.get("mastery") == "hard")
        starred_count = sum(1 for c in cards if c.get("is_starred", False))
        unrated_count = len(cards) - (easy_count + good_count + hard_count)

        if len(cards) > 0:
            calc_mastery = round(((easy_count * 100) + (good_count * 50)) / len(cards))
        else:
            calc_mastery = 0

        total_cards += len(cards)
        total_mastered += easy_count
        if d.subject_name:
            subjects_set.add(d.subject_name)

        result_decks.append({
            "id": d.id,
            "title": d.title,
            "subject_name": d.subject_name or "General",
            "topic": d.topic or "",
            "pdf_filename": d.pdf_filename,
            "cards_count": len(cards),
            "focus_mode": d.focus_mode,
            "mastery_score": calc_mastery,
            "stats": {
                "easy": easy_count,
                "good": good_count,
                "hard": hard_count,
                "starred": starred_count,
                "unrated": unrated_count
            },
            "pdf_url": f"/api/flashcards/decks/{d.id}/pdf" if d.pdf_export_filename else None,
            "created_at": d.created_at.isoformat() if d.created_at else datetime.datetime.utcnow().isoformat(),
            "updated_at": d.updated_at.isoformat() if d.updated_at else datetime.datetime.utcnow().isoformat()
        })

    avg_mastery = round((total_mastered / total_cards * 100)) if total_cards > 0 else 0

    return {
        "decks": result_decks,
        "stats": {
            "total_decks": len(result_decks),
            "total_cards": total_cards,
            "total_mastered": total_mastered,
            "average_mastery": avg_mastery,
            "subjects": sorted(list(subjects_set))
        }
    }

@app.get("/api/flashcards/decks/{deck_id}")
def get_single_flashcard_deck(
    deck_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    deck = db.query(models.FlashcardDeck).filter(
        models.FlashcardDeck.id == deck_id,
        models.FlashcardDeck.user_id == user.id,
        models.FlashcardDeck.is_deleted == False
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Flashcard Deck not found")

    try:
        cards = json.loads(deck.cards_data)
    except Exception:
        cards = []

    easy_count = sum(1 for c in cards if c.get("mastery") == "easy")
    good_count = sum(1 for c in cards if c.get("mastery") == "good")
    hard_count = sum(1 for c in cards if c.get("mastery") == "hard")
    starred_count = sum(1 for c in cards if c.get("is_starred", False))
    unrated_count = len(cards) - (easy_count + good_count + hard_count)

    calc_mastery = round(((easy_count * 100) + (good_count * 50)) / len(cards)) if len(cards) > 0 else 0

    return {
        "id": deck.id,
        "title": deck.title,
        "subject_name": deck.subject_name or "General",
        "topic": deck.topic or "",
        "pdf_filename": deck.pdf_filename,
        "cards_count": len(cards),
        "focus_mode": deck.focus_mode,
        "mastery_score": calc_mastery,
        "stats": {
            "easy": easy_count,
            "good": good_count,
            "hard": hard_count,
            "starred": starred_count,
            "unrated": unrated_count
        },
        "cards": cards,
        "pdf_url": f"/api/flashcards/decks/{deck.id}/pdf" if deck.pdf_export_filename else None,
        "created_at": deck.created_at.isoformat() if deck.created_at else datetime.datetime.utcnow().isoformat(),
        "updated_at": deck.updated_at.isoformat() if deck.updated_at else datetime.datetime.utcnow().isoformat()
    }

@app.put("/api/flashcards/decks/{deck_id}/progress")
def update_flashcard_progress(
    deck_id: int,
    data: FlashcardProgressRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    deck = db.query(models.FlashcardDeck).filter(
        models.FlashcardDeck.id == deck_id,
        models.FlashcardDeck.user_id == user.id,
        models.FlashcardDeck.is_deleted == False
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Flashcard Deck not found")

    try:
        cards = json.loads(deck.cards_data)
    except Exception:
        cards = []

    # Map card updates by id
    update_map = {item.id: item for item in data.cards}
    for card in cards:
        cid = card.get("id")
        if cid in update_map:
            up = update_map[cid]
            if up.mastery is not None:
                card["mastery"] = up.mastery
            if up.is_starred is not None:
                card["is_starred"] = up.is_starred

    deck.cards_data = json.dumps(cards)
    easy_count = sum(1 for c in cards if c.get("mastery") == "easy")
    good_count = sum(1 for c in cards if c.get("mastery") == "good")
    calc_mastery = round(((easy_count * 100) + (good_count * 50)) / len(cards)) if len(cards) > 0 else 0
    deck.mastery_score = calc_mastery
    deck.updated_at = datetime.datetime.utcnow()
    db.commit()

    return {
        "message": "Progress recorded successfully!",
        "mastery_score": calc_mastery,
        "cards": cards
    }

@app.get("/api/flashcards/decks/{deck_id}/pdf")
def download_flashcard_deck_pdf(
    deck_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    deck = db.query(models.FlashcardDeck).filter(
        models.FlashcardDeck.id == deck_id,
        models.FlashcardDeck.user_id == user.id
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    pdf_filename = deck.pdf_export_filename or f"flashcards_{user.id}_{deck.id}.pdf"
    pdf_path = os.path.join(GENERATED_DIR, pdf_filename)

    if not os.path.exists(pdf_path):
        try:
            cards = json.loads(deck.cards_data)
            pdf_utils.generate_flashcards_pdf({
                "title": deck.title,
                "subject_name": deck.subject_name or "General",
                "cards": cards
            }, pdf_path)
            deck.pdf_export_filename = pdf_filename
            db.commit()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate printable PDF: {e}")

    safe_title = "".join(c for c in deck.title if c.isalnum() or c in (' ', '_', '-')).strip()
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"Flashcards_{safe_title}.pdf"
    )

@app.delete("/api/flashcards/decks/{deck_id}")
def delete_flashcard_deck(
    deck_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    deck = db.query(models.FlashcardDeck).filter(
        models.FlashcardDeck.id == deck_id,
        models.FlashcardDeck.user_id == user.id
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Flashcard Deck not found")

    deck.is_deleted = True
    deck.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": f"Flashcard Deck '{deck.title}' moved to Trash successfully"}

@app.post("/api/flashcards/seed-demo")
def seed_demo_flashcards(
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if already seeded
    existing = db.query(models.FlashcardDeck).filter(
        models.FlashcardDeck.user_id == user.id,
        models.FlashcardDeck.title == "Neural Networks & Deep Learning Core Concepts",
        models.FlashcardDeck.is_deleted == False
    ).first()
    if existing:
        return {"message": "Demo deck already exists!", "deck_id": existing.id}

    demo_cards = [
        {
            "id": 1,
            "question": "What is the Backpropagation algorithm, and what mathematical principle underlies it?",
            "answer": "• Backpropagation is the primary supervised learning method for computing gradients of the loss function with respect to every weight in a deep neural network.\n• Mathematical Basis: Recursive application of the multivariable Calculus Chain Rule from output layer backwards to input layer.\n• Computed gradients are subsequently utilized by optimizers like SGD or Adam to update weights.",
            "exam_tip": "💡 Key Equation: dL/dw = (dL/dy) * (dy/dz) * (dz/dw). Write the partial derivative chain in 5-mark answers!",
            "category": "Algorithm",
            "difficulty": "Medium",
            "mastered": "easy",
            "is_starred": True
        },
        {
            "id": 2,
            "question": "Why does the Vanishing Gradient problem happen with Sigmoid/Tanh activations, and how do Modern Architectures solve it?",
            "answer": "• Cause: Maximum derivative of Sigmoid is 0.25 (and Tanh is 1.0). In deep networks (>5 layers), multiplying fractions across layers exponentially drives gradients to zero.\n• Result: Front layers learn extremely slowly or stall completely.\n• Solutions:\n  1. ReLU / Leaky ReLU activations (gradient = 1 for positive activations).\n  2. Residual skip connections (ResNet: x + F(x)).\n  3. Batch Normalization & Layer Normalization.",
            "exam_tip": "💡 Draw Sigmoid bell-shaped derivative curve showing max height = 0.25 at z=0.",
            "category": "Architecture",
            "difficulty": "Hard",
            "mastered": "good",
            "is_starred": False
        },
        {
            "id": 3,
            "question": "Differentiate between Overfitting and Underfitting with Bias-Variance Tradeoff.",
            "answer": "• Underfitting (High Bias): Model is too simplistic (e.g. linear model on polynomial data); performs poorly on both training and test sets.\n• Overfitting (High Variance): Model memorizes training noise; very low training error but high test error.\n• Best Sweet Spot: Optimal complexity where Total Error = Bias² + Variance + Irreducible Noise is minimized.",
            "exam_tip": "💡 Examiner favourite: Draw the classic U-shaped Test Error vs Complexity curve.",
            "category": "Comparison",
            "difficulty": "Easy",
            "mastered": "unrated",
            "is_starred": False
        },
        {
            "id": 4,
            "question": "Explain how the Self-Attention mechanism in Transformers computes attention weights.",
            "answer": "• Every token vector is linearly projected into 3 representations: Query (Q), Key (K), and Value (V).\n• Dot Product: Computes semantic similarity between Q and all keys K.\n• Scaling: Divided by sqrt(d_k) to prevent extreme softmax gradients.\n• Softmax: Softmax(Q K^T / sqrt(d_k)) yields probability weights.\n• Output: Weighted sum of Value vectors (V).",
            "exam_tip": "💡 Flashcard formula: Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) * V.",
            "category": "Formula",
            "difficulty": "Hard",
            "mastered": "unrated",
            "is_starred": True
        },
        {
            "id": 5,
            "question": "How does Dropout Regularization work during training versus inference?",
            "answer": "• During Training: Randomly deactivates neurons with probability p (e.g. 0.5) at each forward step. Forces network to learn robust redundant features and prevents co-adaptation.\n• During Inference: All neurons are ACTIVE. Activations are scaled by (1 - p) (or inverted dropout where activations are divided by 1 - p during training) to maintain expected magnitude.",
            "exam_tip": "💡 Remember: Inverted Dropout scales during training so inference has zero computational penalty.",
            "category": "High-Yield",
            "difficulty": "Medium",
            "mastered": "good",
            "is_starred": False
        },
        {
            "id": 6,
            "question": "What is the purpose of Convolutions and Pooling layers in CNNs?",
            "answer": "• Convolution Layer: Applies learnable spatial filters (kernels) to extract translation-invariant local features (edges, textures, shapes).\n• Activation (ReLU): Injects non-linearity.\n• Pooling Layer (Max/Avg): Subsamples spatial dimensions (height x width), reducing parameter count, computational complexity, and controlling overfitting.",
            "exam_tip": "💡 Formula for Output Feature Map size: W_out = [(W - K + 2P)/S] + 1.",
            "category": "Architecture",
            "difficulty": "Medium",
            "mastered": "easy",
            "is_starred": False
        },
        {
            "id": 7,
            "question": "Compare Adam Optimizer with Standard Stochastic Gradient Descent (SGD) with Momentum.",
            "answer": "• SGD + Momentum: Accelerates down consistent slopes and dampens oscillations using velocity v_t = gamma * v_{t-1} + lr * g_t.\n• Adam (Adaptive Moment Estimation): Combines Momentum (1st moment / mean) AND RMSprop (2nd moment / uncentered variance) with bias correction.\n• Advantage: Adapts learning rate per individual parameter automatically.",
            "exam_tip": "💡 Standard hyperparameters to cite in exam: beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8.",
            "category": "Comparison",
            "difficulty": "Hard",
            "mastered": "hard",
            "is_starred": True
        },
        {
            "id": 8,
            "question": "When is Precision preferred over Recall, and what metric combines both?",
            "answer": "• Precision (TP / (TP + FP)): Critical when False Positives are catastrophic (e.g. Spam filters, Youtube video recommendations).\n• Recall (TP / (TP + FN)): Critical when False Negatives are dangerous (e.g. Cancer detection, Fraud alerts, Airport weapon detection).\n• Combined Metric: F1-Score = 2 * (Precision * Recall) / (Precision + Recall) (Harmonic Mean).",
            "exam_tip": "💡 Harmonic mean is used because it heavily penalizes extreme imbalances between Precision and Recall.",
            "category": "Definition",
            "difficulty": "Easy",
            "mastered": "unrated",
            "is_starred": False
        }
    ]

    timestamp = int(datetime.datetime.utcnow().timestamp())
    pdf_name = f"flashcards_{user.id}_{timestamp}.pdf"
    pdf_path = os.path.join(GENERATED_DIR, pdf_name)
    try:
        pdf_utils.generate_flashcards_pdf({
            "title": "Neural Networks & Deep Learning Core Concepts",
            "subject_name": "Artificial Intelligence & Deep Learning",
            "cards": demo_cards
        }, pdf_path)
    except Exception as e:
        print(f"Error generating demo flashcards PDF: {e}")
        pdf_name = None

    deck = models.FlashcardDeck(
        user_id=user.id,
        title="Neural Networks & Deep Learning Core Concepts",
        subject_name="Artificial Intelligence & Deep Learning",
        topic="Neural Network Architectures & Optimization",
        pdf_filename="deep_learning_syllabus.pdf",
        cards_count=len(demo_cards),
        cards_data=json.dumps(demo_cards),
        focus_mode="High-Yield Exam Hotspots",
        mastery_score=40,
        pdf_export_filename=pdf_name,
        is_deleted=False
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)

    return {
        "message": "Demo Flashcard deck created successfully!",
        "deck_id": deck.id,
        "title": deck.title,
        "cards_count": deck.cards_count
    }

# ----------------- CARD 8: HANDWRITTEN NOTES & Q&A MAKER ----------------- #

@app.post("/api/handwritten-notes/generate")
def generate_handwritten_notes(
    topic: str = Form(...),
    subject_name: Optional[str] = Form(""),
    raw_notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    timestamp = int(datetime.datetime.utcnow().timestamp())
    saved_filename = None
    extracted_text = ""
    file_type = "text"

    if file and file.filename:
        saved_filename = file.filename
        uploaded_path = os.path.join(UPLOAD_DIR, f"notes_{user.id}_{timestamp}_{saved_filename}")
        with open(uploaded_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        extracted_text = pdf_utils.extract_text_from_file_or_photo(uploaded_path)
        lower_name = saved_filename.lower()
        if lower_name.endswith(".pdf"):
            file_type = "pdf"
        elif lower_name.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp")):
            file_type = "photo"
        else:
            file_type = "file"
    
    # Combine with raw_notes if provided
    if raw_notes and raw_notes.strip():
        extracted_text = (extracted_text + "\n\n" + raw_notes.strip()).strip()

    # Generate handwritten notes and exhaustive Q&As via AI service
    notes_data = ai_service.generate_handwritten_notes_with_qa(
        content_text=extracted_text,
        topic=topic.strip(),
        subject_name=(subject_name or "").strip()
    )
    notes_data["source_filename"] = saved_filename or "Topic-Directed Notes"

    # Generate downloadable PDF
    pdf_name = f"handwritten_notes_{user.id}_{timestamp}.pdf"
    pdf_path = os.path.join(GENERATED_DIR, pdf_name)
    try:
        pdf_utils.generate_handwritten_notes_pdf(notes_data, pdf_path)
    except Exception as e:
        print(f"Error generating handwritten notes PDF: {e}")
        pdf_name = None

    visual_sheet_data = {
        "question_number": notes_data.get("question_number", "7."),
        "question_title": notes_data.get("question_title", f"Explain the Architecture & Levels of {topic.strip()}."),
        "introduction": notes_data.get("introduction", notes_data.get("core_summary", "")),
        "hierarchy": notes_data.get("hierarchy", []),
        "tasks_table": notes_data.get("tasks_table", []),
        "pipeline": notes_data.get("pipeline", []),
        "pipeline_caption": notes_data.get("pipeline_caption", "Output of one level becomes the input for the next level"),
        "key_points": notes_data.get("key_points", []),
        "end_to_end_example": notes_data.get("end_to_end_example", {}),
        "doodle_left": notes_data.get("doodle_left", "⭐"),
        "doodle_right": notes_data.get("doodle_right", "📖✨")
    }

    # Save to database
    note_obj = models.HandwrittenNote(
        user_id=user.id,
        topic=topic.strip(),
        subject_name=(subject_name or "").strip(),
        source_filename=saved_filename,
        file_type=file_type,
        summary=notes_data.get("introduction") or notes_data.get("core_summary", ""),
        definitions_data=json.dumps(notes_data.get("definitions_and_formulas", [])),
        qa_data=json.dumps(notes_data.get("questions_and_answers", [])),
        key_points_data=json.dumps({
            "mnemonics": notes_data.get("mnemonics_and_tricks", []),
            "margin_notes": notes_data.get("margin_notes", []),
            "tagline": notes_data.get("tagline", "Aesthetic Handwritten Revision Sheet & Master Q&A Pack"),
            "visual_sheet": visual_sheet_data
        }),
        diagram_notes=json.dumps(visual_sheet_data),
        pdf_filename=pdf_name,
        is_deleted=False
    )
    db.add(note_obj)
    db.commit()
    db.refresh(note_obj)

    return {
        "message": f"Successfully generated Handwritten Notes & {len(notes_data.get('questions_and_answers', []))} Q&As!",
        "note_id": note_obj.id,
        "id": note_obj.id,
        "topic": note_obj.topic,
        "subject_name": note_obj.subject_name,
        "source_filename": note_obj.source_filename,
        "file_type": note_obj.file_type,
        "core_summary": notes_data.get("core_summary", ""),
        "tagline": notes_data.get("tagline", "Aesthetic Handwritten Revision Sheet & Master Q&A Pack"),
        "question_number": visual_sheet_data["question_number"],
        "question_title": visual_sheet_data["question_title"],
        "introduction": visual_sheet_data["introduction"],
        "hierarchy": visual_sheet_data["hierarchy"],
        "tasks_table": visual_sheet_data["tasks_table"],
        "pipeline": visual_sheet_data["pipeline"],
        "pipeline_caption": visual_sheet_data["pipeline_caption"],
        "key_points": visual_sheet_data["key_points"],
        "end_to_end_example": visual_sheet_data["end_to_end_example"],
        "doodle_left": visual_sheet_data["doodle_left"],
        "doodle_right": visual_sheet_data["doodle_right"],
        "definitions_and_formulas": notes_data.get("definitions_and_formulas", []),
        "diagram_box": notes_data.get("diagram_box", {}),
        "questions_and_answers": notes_data.get("questions_and_answers", []),
        "total_questions": len(notes_data.get("questions_and_answers", [])),
        "mnemonics_and_tricks": notes_data.get("mnemonics_and_tricks", []),
        "margin_notes": notes_data.get("margin_notes", []),
        "pdf_url": f"/api/handwritten-notes/{note_obj.id}/pdf" if pdf_name else None,
        "created_at": note_obj.created_at.isoformat()
    }

@app.get("/api/handwritten-notes")
def get_handwritten_notes(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notes = db.query(models.HandwrittenNote).filter(
        models.HandwrittenNote.user_id == user.id,
        models.HandwrittenNote.is_deleted == False
    ).order_by(models.HandwrittenNote.created_at.desc()).all()

    results = []
    for n in notes:
        try:
            q_list = json.loads(n.qa_data)
        except Exception:
            q_list = []
        try:
            d_list = json.loads(n.definitions_data)
        except Exception:
            d_list = []
        try:
            kp_dict = json.loads(n.key_points_data)
        except Exception:
            kp_dict = {}
        try:
            diag_obj = json.loads(n.diagram_notes) if n.diagram_notes else {}
        except Exception:
            diag_obj = {}

        # Merge visual sheet data if stored in diag_obj or kp_dict
        v_sheet = diag_obj if ("hierarchy" in diag_obj or "tasks_table" in diag_obj) else kp_dict.get("visual_sheet", {})

        results.append({
            "id": n.id,
            "topic": n.topic,
            "subject_name": n.subject_name,
            "source_filename": n.source_filename,
            "file_type": n.file_type,
            "core_summary": n.summary,
            "tagline": kp_dict.get("tagline", "Aesthetic Handwritten Revision Sheet & Master Q&A Pack"),
            "question_number": v_sheet.get("question_number", "7."),
            "question_title": v_sheet.get("question_title", f"Explain the Architecture & Levels of {n.topic}."),
            "introduction": v_sheet.get("introduction", n.summary or ""),
            "hierarchy": v_sheet.get("hierarchy", []),
            "tasks_table": v_sheet.get("tasks_table", []),
            "pipeline": v_sheet.get("pipeline", []),
            "pipeline_caption": v_sheet.get("pipeline_caption", "Output of one level becomes the input for the next level"),
            "key_points": v_sheet.get("key_points", []),
            "end_to_end_example": v_sheet.get("end_to_end_example", {}),
            "doodle_left": v_sheet.get("doodle_left", "⭐"),
            "doodle_right": v_sheet.get("doodle_right", "📖✨"),
            "definitions_and_formulas": d_list,
            "diagram_box": diag_obj,
            "questions_and_answers": q_list,
            "total_questions": len(q_list),
            "mnemonics_and_tricks": kp_dict.get("mnemonics", []),
            "margin_notes": kp_dict.get("margin_notes", []),
            "pdf_url": f"/api/handwritten-notes/{n.id}/pdf" if n.pdf_filename else None,
            "created_at": n.created_at.isoformat()
        })
    return results

@app.get("/api/handwritten-notes/{note_id}")
def get_single_handwritten_note(note_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    n = db.query(models.HandwrittenNote).filter(
        models.HandwrittenNote.id == note_id,
        models.HandwrittenNote.user_id == user.id,
        models.HandwrittenNote.is_deleted == False
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Handwritten Note not found")

    try:
        q_list = json.loads(n.qa_data)
    except Exception:
        q_list = []
    try:
        d_list = json.loads(n.definitions_data)
    except Exception:
        d_list = []
    try:
        kp_dict = json.loads(n.key_points_data)
    except Exception:
        kp_dict = {}
    try:
        diag_obj = json.loads(n.diagram_notes) if n.diagram_notes else {}
    except Exception:
        diag_obj = {}

    v_sheet = diag_obj if ("hierarchy" in diag_obj or "tasks_table" in diag_obj) else kp_dict.get("visual_sheet", {})

    return {
        "id": n.id,
        "topic": n.topic,
        "subject_name": n.subject_name,
        "source_filename": n.source_filename,
        "file_type": n.file_type,
        "core_summary": n.summary,
        "tagline": kp_dict.get("tagline", "Aesthetic Handwritten Revision Sheet & Master Q&A Pack"),
        "question_number": v_sheet.get("question_number", "7."),
        "question_title": v_sheet.get("question_title", f"Explain the Architecture & Levels of {n.topic}."),
        "introduction": v_sheet.get("introduction", n.summary or ""),
        "hierarchy": v_sheet.get("hierarchy", []),
        "tasks_table": v_sheet.get("tasks_table", []),
        "pipeline": v_sheet.get("pipeline", []),
        "pipeline_caption": v_sheet.get("pipeline_caption", "Output of one level becomes the input for the next level"),
        "key_points": v_sheet.get("key_points", []),
        "end_to_end_example": v_sheet.get("end_to_end_example", {}),
        "doodle_left": v_sheet.get("doodle_left", "⭐"),
        "doodle_right": v_sheet.get("doodle_right", "📖✨"),
        "definitions_and_formulas": d_list,
        "diagram_box": diag_obj,
        "questions_and_answers": q_list,
        "total_questions": len(q_list),
        "mnemonics_and_tricks": kp_dict.get("mnemonics", []),
        "margin_notes": kp_dict.get("margin_notes", []),
        "pdf_url": f"/api/handwritten-notes/{n.id}/pdf" if n.pdf_filename else None,
        "created_at": n.created_at.isoformat()
    }

@app.get("/api/handwritten-notes/{note_id}/pdf")
def download_handwritten_note_pdf(note_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    note = db.query(models.HandwrittenNote).filter(
        models.HandwrittenNote.id == note_id,
        models.HandwrittenNote.user_id == user.id
    ).first()
    if not note or not note.pdf_filename:
        raise HTTPException(status_code=404, detail="PDF not found for this note")
    
    pdf_path = os.path.join(GENERATED_DIR, note.pdf_filename)
    if not os.path.exists(pdf_path):
        try:
            q_list = json.loads(note.qa_data)
            d_list = json.loads(note.definitions_data)
            kp_dict = json.loads(note.key_points_data)
            diag_obj = json.loads(note.diagram_notes) if note.diagram_notes else {}
            notes_dict = {
                "topic": note.topic,
                "subject_name": note.subject_name,
                "source_filename": note.source_filename or "Study Material",
                "tagline": kp_dict.get("tagline", ""),
                "core_summary": note.summary,
                "definitions_and_formulas": d_list,
                "diagram_box": diag_obj,
                "questions_and_answers": q_list,
                "mnemonics_and_tricks": kp_dict.get("mnemonics", []),
                "margin_notes": kp_dict.get("margin_notes", [])
            }
            pdf_utils.generate_handwritten_notes_pdf(notes_dict, pdf_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {e}")

    safe_name = "".join(c for c in note.topic if c.isalnum() or c in (' ', '_', '-')).strip()
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"Handwritten_Notes_{safe_name}.pdf"
    )

@app.delete("/api/handwritten-notes/{note_id}")
def delete_handwritten_note(note_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    note = db.query(models.HandwrittenNote).filter(
        models.HandwrittenNote.id == note_id,
        models.HandwrittenNote.user_id == user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note.is_deleted = True
    note.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Handwritten Note moved to Trash successfully"}

# ----------------- CARD 8: NOTES DRIVE (STUDENT NOTES STORAGE) ----------------- #

@app.get("/api/notes-drive")
def get_notes_drive(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notes = db.query(models.NotesDriveItem).filter(
        models.NotesDriveItem.user_id == user.id,
        models.NotesDriveItem.is_deleted == False
    ).order_by(models.NotesDriveItem.is_pinned.desc(), models.NotesDriveItem.updated_at.desc()).all()

    total_bytes = sum(n.file_size_bytes or 0 for n in notes)
    pinned_count = sum(1 for n in notes if n.is_pinned)
    subjects_set = sorted(list(set(n.subject_name for n in notes if n.subject_name)))
    categories_set = sorted(list(set(n.category for n in notes if n.category)))

    results = []
    for n in notes:
        ai_data = None
        if n.ai_summary:
            try:
                ai_data = json.loads(n.ai_summary)
            except Exception:
                ai_data = {"summary": n.ai_summary}

        results.append({
            "id": n.id,
            "title": n.title,
            "subject_id": n.subject_id,
            "subject_name": n.subject_name or "General",
            "module_id": n.module_id,
            "module_name": n.module_name or "",
            "module_number": n.module_number,
            "topic": n.topic or "",
            "category": n.category or "Lecture Notes",
            "note_type": n.note_type or "written",
            "content": n.content or "",
            "file_name": n.file_name,
            "file_size_bytes": n.file_size_bytes or 0,
            "file_ext": n.file_ext or "",
            "has_file": bool(n.file_path and os.path.exists(n.file_path)),
            "tags": [t.strip() for t in n.tags.split(",") if t.strip()] if n.tags else [],
            "color": n.color or "#3b82f6",
            "is_pinned": bool(n.is_pinned),
            "ai_summary": ai_data,
            "created_at": n.created_at.isoformat() if n.created_at else datetime.datetime.utcnow().isoformat(),
            "updated_at": n.updated_at.isoformat() if n.updated_at else datetime.datetime.utcnow().isoformat(),
        })

    return {
        "notes": results,
        "stats": {
            "total_notes": len(results),
            "total_storage_bytes": total_bytes,
            "total_storage_formatted": f"{total_bytes / (1024 * 1024):.2f} MB" if total_bytes >= 1024*1024 else f"{total_bytes / 1024:.1f} KB",
            "pinned_count": pinned_count,
            "subjects": subjects_set,
            "categories": categories_set
        }
    }

@app.get("/api/notes-drive/by-subjects")
def get_notes_drive_by_subjects(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    subjects = db.query(models.Subject).filter(
        models.Subject.user_id == user.id,
        models.Subject.is_deleted == False
    ).order_by(models.Subject.name).all()

    notes = db.query(models.NotesDriveItem).filter(
        models.NotesDriveItem.user_id == user.id,
        models.NotesDriveItem.is_deleted == False
    ).order_by(models.NotesDriveItem.is_pinned.desc(), models.NotesDriveItem.created_at.desc()).all()

    def serialize_note(n):
        ai_data = None
        if n.ai_summary:
            try:
                ai_data = json.loads(n.ai_summary)
            except Exception:
                ai_data = {"summary": n.ai_summary}
        return {
            "id": n.id,
            "title": n.title,
            "subject_id": n.subject_id,
            "subject_name": n.subject_name or "General",
            "module_id": n.module_id,
            "module_name": n.module_name or "",
            "module_number": n.module_number,
            "topic": n.topic or "",
            "category": n.category or "Lecture Notes",
            "note_type": n.note_type or "written",
            "content": n.content or "",
            "file_name": n.file_name,
            "file_size_bytes": n.file_size_bytes or 0,
            "file_ext": n.file_ext or "",
            "has_file": bool(n.file_path and os.path.exists(n.file_path)),
            "tags": [t.strip() for t in n.tags.split(",") if t.strip()] if n.tags else [],
            "color": n.color or "#3b82f6",
            "is_pinned": bool(n.is_pinned),
            "ai_summary": ai_data,
            "created_at": n.created_at.isoformat() if n.created_at else "",
            "updated_at": n.updated_at.isoformat() if n.updated_at else "",
        }

    serialized_notes = [serialize_note(n) for n in notes]
    claimed_note_ids = set()
    subject_results = []
    total_module_pdfs = 0

    for s in subjects:
        # Match notes for this subject by ID or exact case-insensitive name
        s_notes = [
            n for n in serialized_notes
            if (n["subject_id"] == s.id or (not n["subject_id"] and n["subject_name"].strip().lower() == s.name.strip().lower()))
        ]

        total_topics = 0
        completed_topics = 0
        modules_data = []
        s_pdf_count = 0
        s_note_count = len(s_notes)

        for m in s.modules:
            # Match notes specifically for this module
            m_notes = [
                n for n in s_notes
                if (n["module_id"] == m.id or (n["module_number"] == m.module_number and (n["subject_id"] == s.id or n["subject_name"].strip().lower() == s.name.strip().lower())))
            ]
            for mn in m_notes:
                claimed_note_ids.add(mn["id"])

            m_pdfs = [
                n for n in m_notes
                if n["note_type"] == "pdf" or (n["file_ext"] and n["file_ext"].lower() == ".pdf")
            ]
            s_pdf_count += len(m_pdfs)
            total_module_pdfs += len(m_pdfs)

            t_list = []
            for t in m.topics:
                total_topics += 1
                if t.is_completed:
                    completed_topics += 1
                t_list.append({"id": t.id, "topic_title": t.topic_title, "is_completed": t.is_completed})

            modules_data.append({
                "id": m.id,
                "module_number": m.module_number,
                "module_title": m.module_title,
                "topics": t_list,
                "notes": m_notes,
                "pdfs": m_pdfs,
                "total_notes": len(m_notes),
                "total_pdfs": len(m_pdfs)
            })

        # Notes in this subject that were not explicitly attached to any module
        unassigned_module_notes = [n for n in s_notes if n["id"] not in claimed_note_ids]
        for umn in unassigned_module_notes:
            claimed_note_ids.add(umn["id"])
            if umn["note_type"] == "pdf" or (umn["file_ext"] and umn["file_ext"].lower() == ".pdf"):
                s_pdf_count += 1
                total_module_pdfs += 1

        completion_pct = round((completed_topics / total_topics * 100), 1) if total_topics > 0 else 0.0

        subject_results.append({
            "id": s.id,
            "name": s.name,
            "num_modules": s.num_modules,
            "syllabus_filename": s.syllabus_filename,
            "total_topics": total_topics,
            "completed_topics": completed_topics,
            "completion_percentage": completion_pct,
            "total_notes": s_note_count,
            "total_pdfs": s_pdf_count,
            "modules": modules_data,
            "unassigned_module_notes": unassigned_module_notes
        })

    # Notes that do not belong to any registered subject
    unassigned_notes = [n for n in serialized_notes if n["id"] not in claimed_note_ids]

    return {
        "subjects": subject_results,
        "total_subjects": len(subject_results),
        "total_module_pdfs": total_module_pdfs,
        "unassigned_notes": unassigned_notes,
        "total_all_notes": len(serialized_notes)
    }

@app.post("/api/notes-drive/create")
def create_written_note(
    data: NoteDriveCreateRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    clean_title = (data.title or "Untitled Note").strip()
    clean_content = data.content or ""
    size_bytes = len(clean_content.encode("utf-8"))

    subj_id = data.subject_id
    subj_name = (data.subject_name or "General").strip()
    mod_id = data.module_id
    mod_name = data.module_name
    mod_num = data.module_number

    if mod_id:
        mod = db.query(models.Module).filter(models.Module.id == mod_id).first()
        if mod:
            mod_name = mod.module_title
            mod_num = mod.module_number
            if not subj_id:
                subj_id = mod.subject_id
    if subj_id:
        subj = db.query(models.Subject).filter(models.Subject.id == subj_id).first()
        if subj:
            subj_name = subj.name

    note = models.NotesDriveItem(
        user_id=user.id,
        title=clean_title,
        subject_id=subj_id,
        subject_name=subj_name,
        module_id=mod_id,
        module_name=mod_name,
        module_number=mod_num,
        topic=(data.topic or "").strip(),
        category=(data.category or "Lecture Notes").strip(),
        note_type="written",
        content=clean_content,
        file_size_bytes=size_bytes,
        tags=data.tags or "",
        color=data.color or "#3b82f6",
        is_pinned=bool(data.is_pinned),
        is_deleted=False
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "message": f"Successfully stored note '{clean_title}' in Notes Drive!",
        "note": {
            "id": note.id,
            "title": note.title,
            "subject_id": note.subject_id,
            "subject_name": note.subject_name,
            "module_id": note.module_id,
            "module_name": note.module_name,
            "module_number": note.module_number,
            "topic": note.topic,
            "category": note.category,
            "note_type": note.note_type,
            "content": note.content,
            "file_size_bytes": note.file_size_bytes,
            "tags": [t.strip() for t in note.tags.split(",") if t.strip()] if note.tags else [],
            "color": note.color,
            "is_pinned": note.is_pinned,
            "created_at": note.created_at.isoformat()
        }
    }

@app.post("/api/notes-drive/upload")
def upload_drive_note_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    subject_id: Optional[int] = Form(None),
    subject_name: Optional[str] = Form("General"),
    module_id: Optional[int] = Form(None),
    module_name: Optional[str] = Form(None),
    module_number: Optional[int] = Form(None),
    topic: Optional[str] = Form(""),
    category: Optional[str] = Form("Lecture Notes"),
    tags: Optional[str] = Form(""),
    color: Optional[str] = Form("#3b82f6"),
    is_pinned: bool = Form(False),
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    timestamp = int(datetime.datetime.utcnow().timestamp())
    original_filename = file.filename or "uploaded_note"
    ext = os.path.splitext(original_filename)[1].lower()
    
    if ext == ".pdf":
        note_type = "pdf"
    elif ext in [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]:
        note_type = "image"
    elif ext in [".doc", ".docx", ".ppt", ".pptx"]:
        note_type = "doc"
    elif ext in [".txt", ".md", ".py", ".java", ".c", ".cpp", ".json", ".csv"]:
        note_type = "text"
    else:
        note_type = "doc"

    safe_name = "".join(c for c in original_filename if c.isalnum() or c in ('.', '_', '-'))
    saved_path = os.path.join(UPLOAD_DIR, f"drive_{user.id}_{timestamp}_{safe_name}")

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(saved_path)

    extracted_text = ""
    try:
        extracted_text = pdf_utils.extract_text_from_file_or_photo(saved_path)
    except Exception as e:
        print(f"Error extracting text from uploaded drive file: {e}")

    auto_title = title.strip() if (title and title.strip()) else os.path.splitext(original_filename)[0].replace("_", " ").replace("-", " ").title()

    if module_id:
        mod = db.query(models.Module).filter(models.Module.id == module_id).first()
        if mod:
            module_name = mod.module_title
            module_number = mod.module_number
            if not subject_id:
                subject_id = mod.subject_id
    if subject_id:
        subj = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
        if subj:
            subject_name = subj.name

    note = models.NotesDriveItem(
        user_id=user.id,
        title=auto_title,
        subject_id=subject_id,
        subject_name=(subject_name or "General").strip(),
        module_id=module_id,
        module_name=module_name,
        module_number=module_number,
        topic=(topic or "").strip(),
        category=(category or "Lecture Notes").strip(),
        note_type=note_type,
        content=extracted_text,
        file_path=saved_path,
        file_name=original_filename,
        file_size_bytes=file_size,
        file_ext=ext,
        tags=tags or "",
        color=color or "#3b82f6",
        is_pinned=is_pinned,
        is_deleted=False
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "message": f"Successfully uploaded '{original_filename}' to Notes Drive!",
        "note_id": note.id,
        "title": note.title,
        "subject_id": note.subject_id,
        "subject_name": note.subject_name,
        "module_id": note.module_id,
        "module_name": note.module_name,
        "module_number": note.module_number,
        "file_name": note.file_name,
        "file_size_bytes": file_size,
        "note_type": note_type
    }

@app.put("/api/notes-drive/{note_id}")
def update_drive_note(
    note_id: int,
    data: NoteDriveUpdateRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(models.NotesDriveItem).filter(
        models.NotesDriveItem.id == note_id,
        models.NotesDriveItem.user_id == user.id,
        models.NotesDriveItem.is_deleted == False
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if data.title is not None:
        note.title = data.title.strip()
    if data.subject_id is not None:
        note.subject_id = data.subject_id
    if data.subject_name is not None:
        note.subject_name = data.subject_name.strip()
    if data.module_id is not None:
        note.module_id = data.module_id
    if data.module_name is not None:
        note.module_name = data.module_name
    if data.module_number is not None:
        note.module_number = data.module_number
    if data.topic is not None:
        note.topic = data.topic.strip()
    if data.category is not None:
        note.category = data.category.strip()
    if data.content is not None:
        note.content = data.content
        if note.note_type == "written":
            note.file_size_bytes = len(data.content.encode("utf-8"))
    if data.tags is not None:
        note.tags = data.tags
    if data.color is not None:
        note.color = data.color
    if data.is_pinned is not None:
        note.is_pinned = data.is_pinned

    note.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Note updated successfully!"}

@app.post("/api/notes-drive/{note_id}/pin")
def toggle_pin_drive_note(
    note_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(models.NotesDriveItem).filter(
        models.NotesDriveItem.id == note_id,
        models.NotesDriveItem.user_id == user.id,
        models.NotesDriveItem.is_deleted == False
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    note.is_pinned = not note.is_pinned
    note.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": f"Note {'pinned' if note.is_pinned else 'unpinned'} successfully", "is_pinned": note.is_pinned}

@app.get("/api/notes-drive/{note_id}")
def get_single_drive_note(
    note_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(models.NotesDriveItem).filter(
        models.NotesDriveItem.id == note_id,
        models.NotesDriveItem.user_id == user.id,
        models.NotesDriveItem.is_deleted == False
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    ai_data = None
    if note.ai_summary:
        try:
            ai_data = json.loads(note.ai_summary)
        except Exception:
            ai_data = {"summary": note.ai_summary}

    return {
        "id": note.id,
        "title": note.title,
        "subject_id": note.subject_id,
        "subject_name": note.subject_name or "General",
        "module_id": note.module_id,
        "module_name": note.module_name or "",
        "module_number": note.module_number,
        "topic": note.topic or "",
        "category": note.category or "Lecture Notes",
        "note_type": note.note_type or "written",
        "content": note.content or "",
        "file_name": note.file_name,
        "file_size_bytes": note.file_size_bytes or 0,
        "file_ext": note.file_ext or "",
        "has_file": bool(note.file_path and os.path.exists(note.file_path)),
        "tags": [t.strip() for t in note.tags.split(",") if t.strip()] if note.tags else [],
        "color": note.color or "#3b82f6",
        "is_pinned": bool(note.is_pinned),
        "ai_summary": ai_data,
        "created_at": note.created_at.isoformat() if note.created_at else datetime.datetime.utcnow().isoformat(),
        "updated_at": note.updated_at.isoformat() if note.updated_at else datetime.datetime.utcnow().isoformat(),
    }

@app.get("/api/notes-drive/{note_id}/file")
def download_drive_note_file(
    note_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(models.NotesDriveItem).filter(
        models.NotesDriveItem.id == note_id,
        models.NotesDriveItem.user_id == user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if note.file_path and os.path.exists(note.file_path):
        media_type = "application/octet-stream"
        ext = (note.file_ext or "").lower()
        if ext == ".pdf":
            media_type = "application/pdf"
        elif ext in [".png", ".jpg", ".jpeg", ".webp"]:
            media_type = f"image/{ext.replace('.', '')}"
        elif ext in [".txt", ".md"]:
            media_type = "text/plain"

        return FileResponse(
            path=note.file_path,
            media_type=media_type,
            filename=note.file_name or f"Note_{note.id}{note.file_ext or ''}"
        )
    elif note.content:
        safe_title = "".join(c for c in note.title if c.isalnum() or c in (' ', '_', '-')).strip() or f"Note_{note.id}"
        tmp_name = f"export_{note.id}_{int(datetime.datetime.utcnow().timestamp())}.md"
        tmp_path = os.path.join(GENERATED_DIR, tmp_name)
        with open(tmp_path, "w", encoding="utf-8") as f:
            f.write(f"# {note.title}\n")
            f.write(f"**Subject:** {note.subject_name or 'General'} | **Category:** {note.category} | **Date:** {note.created_at.strftime('%Y-%m-%d') if note.created_at else ''}\n\n")
            if note.tags:
                f.write(f"**Tags:** {note.tags}\n\n")
            f.write("---\n\n")
            f.write(note.content or "")
        return FileResponse(path=tmp_path, media_type="text/markdown", filename=f"{safe_title}.md")
    else:
        raise HTTPException(status_code=404, detail="No file or content available for this note")

@app.post("/api/notes-drive/{note_id}/ai-summarize")
def ai_summarize_note(
    note_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(models.NotesDriveItem).filter(
        models.NotesDriveItem.id == note_id,
        models.NotesDriveItem.user_id == user.id,
        models.NotesDriveItem.is_deleted == False
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    summary_data = ai_service.summarize_drive_note(
        title=note.title,
        content=note.content or note.title,
        subject_name=note.subject_name or "General"
    )
    note.ai_summary = json.dumps(summary_data)
    note.updated_at = datetime.datetime.utcnow()
    db.commit()

    return {
        "message": "AI Study Kit generated successfully!",
        "ai_summary": summary_data
    }

@app.delete("/api/notes-drive/{note_id}")
def delete_drive_note(
    note_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(models.NotesDriveItem).filter(
        models.NotesDriveItem.id == note_id,
        models.NotesDriveItem.user_id == user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    note.is_deleted = True
    note.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Note moved to Trash successfully"}

@app.post("/api/notes-drive/seed-samples")
def seed_sample_drive_notes(
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    sample_notes = [
        models.NotesDriveItem(
            user_id=user.id,
            title="Machine Learning Loss Functions & Optimization Cheatsheet",
            subject_name="Machine Learning",
            topic="Unit 1 - Optimization Algorithms",
            category="Revision Cheatsheet",
            note_type="written",
            content="""# Machine Learning Loss Functions & Optimization

## 1. Loss Functions Summary
- **Mean Squared Error (MSE)**: Used for Regression. Sensitive to outliers. Formula: $MSE = \\frac{1}{N} \\sum (y_i - \\hat{y}_i)^2$
- **Binary Cross-Entropy (Log Loss)**: Used for binary classification with sigmoid output.
- **Categorical Cross-Entropy**: Multi-class classification paired with softmax activation.

## 2. Gradient Descent Variants
1. **Batch Gradient Descent**: Computes gradient over entire dataset. Stable convergence, high memory usage.
2. **Stochastic Gradient Descent (SGD)**: Updates weights per single sample. Noisy gradients, escapes local minima.
3. **Mini-batch SGD**: Compromise using batch size of 32/64/128. Default in deep learning frameworks.
4. **Adam Optimizer**: Combines Momentum (first moment) with RMSprop (second raw moment). Adaptive learning rates per parameter.

## 3. High-Yield Exam Formulas
- Weight update rule: $W_{new} = W_{old} - \\eta \\cdot \\nabla L(W)$
- Learning rate $\\eta$ schedule: Step decay vs Cosine Annealing.
- Never forget bias term regularization omission!""",
            file_size_bytes=1040,
            tags="ml,optimization,formulas,cheatsheet",
            color="#3b82f6",
            is_pinned=True,
            is_deleted=False
        ),
        models.NotesDriveItem(
            user_id=user.id,
            title="Cloud Computing & Kubernetes Architecture Reference",
            subject_name="Cloud Computing",
            topic="Unit 3 - Container Orchestration",
            category="Lecture Notes",
            note_type="written",
            content="""# Cloud Computing & Kubernetes Master Lecture Notes

## 1. Control Plane Components
- **kube-apiserver**: REST frontend exposing cluster API. Scale horizontally.
- **etcd**: Consistent, highly-available key-value store holding all cluster state.
- **kube-scheduler**: Assigns unscheduled pods to nodes based on resource constraints.
- **kube-controller-manager**: Runs node controller, replication controller, endpoint controller.

## 2. Worker Node Components
- **kubelet**: Agent ensuring containers described in PodSpecs are running and healthy.
- **kube-proxy**: Network proxy maintaining IP packet filtering rules (iptables/IPVS).
- **Container Runtime**: containerd or CRI-O executing runtime lifecycle.

## 3. Key Differences for Exam (5-Marker)
- **Pod vs Container**: Pod is atomic schedulable unit; can share network namespace, IPC, and storage volumes.
- **Deployment vs StatefulSet**: Deployments are cattle (interchangeable, random pod names); StatefulSets are pets (ordered, persistent hostnames & PVC bindings).""",
            file_size_bytes=1120,
            tags="cloud,kubernetes,exam-prep",
            color="#8b5cf6",
            is_pinned=True,
            is_deleted=False
        ),
        models.NotesDriveItem(
            user_id=user.id,
            title="Computer Networks Subnetting & IP Addressing Formula Sheet",
            subject_name="Computer Networks",
            topic="Unit 2 - Network Layer",
            category="Formula Sheet",
            note_type="written",
            content="""# Computer Networks Subnetting Quick Sheet

## 1. IPv4 Classful Addressing
- **Class A**: 1.0.0.0 to 126.255.255.255 (/8 default mask 255.0.0.0)
- **Class B**: 128.0.0.0 to 191.255.255.255 (/16 default mask 255.255.0.0)
- **Class C**: 192.0.0.0 to 223.255.255.255 (/24 default mask 255.255.255.0)

## 2. CIDR Calculation Rules
- Number of usable hosts: $2^{(32 - N)} - 2$ (Subtract Network ID and Broadcast Address).
- Number of subnets formed: $2^{\\text{borrowed bits}}$.
- Subnet mask increments: $256 - \\text{Octet Value}$.

## 3. Standard Port Numbers to Remember
- DNS: Port 53 (UDP/TCP)
- HTTP/HTTPS: Port 80 / 443
- SSH: Port 22
- DHCP: Port 67 (Server) / 68 (Client)""",
            file_size_bytes=860,
            tags="networking,ip,subnetting,formulas",
            color="#10b981",
            is_pinned=False,
            is_deleted=False
        )
    ]

    db.add_all(sample_notes)
    db.commit()
    return {"message": "Sample notes seeded successfully into your Notes Drive!"}

# ----------------- CARD 9: TRASH & SAFE DATA RECOVERY ----------------- #

@app.get("/api/trash")
def get_trash_items(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    trash_items = []

    # 1. Exams
    deleted_exams = db.query(models.Exam).filter(models.Exam.user_id == user.id, models.Exam.is_deleted == True).all()
    for e in deleted_exams:
        trash_items.append({
            "id": f"exam_{e.id}",
            "original_id": e.id,
            "card_type": "exam",
            "card_number": 1,
            "card_name": "Exam Countdown",
            "title": e.name,
            "subtitle": f"Date: {e.exam_date} | Time: {e.exam_time}",
            "deleted_at": e.deleted_at.isoformat() if e.deleted_at else datetime.datetime.utcnow().isoformat(),
            "badge_color": "blue"
        })

    # 2. Subjects
    deleted_subjects = db.query(models.Subject).filter(models.Subject.user_id == user.id, models.Subject.is_deleted == True).all()
    for s in deleted_subjects:
        trash_items.append({
            "id": f"subject_{s.id}",
            "original_id": s.id,
            "card_type": "subject",
            "card_number": 2,
            "card_name": "Subject & Syllabus",
            "title": s.name,
            "subtitle": f"{s.num_modules} Module(s)",
            "deleted_at": s.deleted_at.isoformat() if s.deleted_at else datetime.datetime.utcnow().isoformat(),
            "badge_color": "indigo"
        })

    # 3. Study Plans
    deleted_plans = db.query(models.StudyPlan).filter(models.StudyPlan.user_id == user.id, models.StudyPlan.is_deleted == True).all()
    for p in deleted_plans:
        trash_items.append({
            "id": f"study_plan_{p.id}",
            "original_id": p.id,
            "card_type": "study_plan",
            "card_number": 3,
            "card_name": "Study Plan",
            "title": p.title,
            "subtitle": "Revision Schedule",
            "deleted_at": p.deleted_at.isoformat() if p.deleted_at else datetime.datetime.utcnow().isoformat(),
            "badge_color": "emerald"
        })

    # 4. Practice Papers
    deleted_papers = db.query(models.PracticePaper).filter(models.PracticePaper.user_id == user.id, models.PracticePaper.is_deleted == True).all()
    for pp in deleted_papers:
        trash_items.append({
            "id": f"practice_paper_{pp.id}",
            "original_id": pp.id,
            "card_type": "practice_paper",
            "card_number": 4,
            "card_name": "Practice Paper",
            "title": pp.title,
            "subtitle": f"Subject: {pp.subject_name} | {pp.total_marks} Marks",
            "deleted_at": pp.deleted_at.isoformat() if pp.deleted_at else datetime.datetime.utcnow().isoformat(),
            "badge_color": "purple"
        })

    # 5. Viva Sessions
    deleted_vivas = db.query(models.VivaSession).filter(models.VivaSession.user_id == user.id, models.VivaSession.is_deleted == True).all()
    for v in deleted_vivas:
        trash_items.append({
            "id": f"viva_session_{v.id}",
            "original_id": v.id,
            "card_type": "viva_session",
            "card_number": 5,
            "card_name": "AI Viva Session",
            "title": v.title,
            "subtitle": f"Mode: {v.mode}",
            "deleted_at": v.deleted_at.isoformat() if v.deleted_at else datetime.datetime.utcnow().isoformat(),
            "badge_color": "amber"
        })

    # 6. AI Teacher Lessons
    deleted_lessons = db.query(models.AITeacherLesson).filter(models.AITeacherLesson.user_id == user.id, models.AITeacherLesson.is_deleted == True).all()
    for l in deleted_lessons:
        trash_items.append({
            "id": f"ai_teacher_{l.id}",
            "original_id": l.id,
            "card_type": "ai_teacher",
            "card_number": 6,
            "card_name": "AI Teacher Lesson",
            "title": l.topic,
            "subtitle": f"Style: {l.style}" + (f" | File: {l.pdf_filename}" if l.pdf_filename else ""),
            "deleted_at": l.deleted_at.isoformat() if l.deleted_at else datetime.datetime.utcnow().isoformat(),
            "badge_color": "rose"
        })

    # 7. Flashcard Decks (Card 7)
    deleted_decks = db.query(models.FlashcardDeck).filter(models.FlashcardDeck.user_id == user.id, models.FlashcardDeck.is_deleted == True).all()
    for d in deleted_decks:
        trash_items.append({
            "id": f"flashcard_deck_{d.id}",
            "original_id": d.id,
            "card_type": "flashcard_deck",
            "card_number": 7,
            "card_name": "AI Flashcard Deck",
            "title": d.title,
            "subtitle": f"Subject: {d.subject_name or 'Exam'} | {d.cards_count} Cards ({d.focus_mode})",
            "deleted_at": d.deleted_at.isoformat() if d.deleted_at else datetime.datetime.utcnow().isoformat(),
            "badge_color": "amber"
        })

    # Legacy: Question Banks (Card 7)
    deleted_qbs = db.query(models.QuestionBank).filter(models.QuestionBank.user_id == user.id, models.QuestionBank.is_deleted == True).all()
    for qb in deleted_qbs:
        trash_items.append({
            "id": f"question_bank_{qb.id}",
            "original_id": qb.id,
            "card_type": "question_bank",
            "card_number": 7,
            "card_name": "Question Bank",
            "title": qb.title,
            "subtitle": f"Subject: {qb.subject_name or 'Exam'} | {qb.total_questions} Questions",
            "deleted_at": qb.deleted_at.isoformat() if qb.deleted_at else datetime.datetime.utcnow().isoformat(),
            "badge_color": "cyan"
        })

    # 8. Notes Drive (Card 8)
    deleted_drive_notes = db.query(models.NotesDriveItem).filter(
        models.NotesDriveItem.user_id == user.id,
        models.NotesDriveItem.is_deleted == True
    ).all()
    for dn in deleted_drive_notes:
        trash_items.append({
            "id": f"notes_drive_{dn.id}",
            "original_id": dn.id,
            "card_type": "notes_drive",
            "card_number": 8,
            "card_name": "Notes Drive",
            "title": dn.title,
            "subtitle": f"Subject: {dn.subject_name or 'General'} | {dn.category} ({dn.note_type.upper()})",
            "deleted_at": dn.deleted_at.isoformat() if dn.deleted_at else datetime.datetime.utcnow().isoformat(),
            "badge_color": "blue"
        })

    # Legacy: Handwritten Notes (Card 8)
    deleted_notes = db.query(models.HandwrittenNote).filter(models.HandwrittenNote.user_id == user.id, models.HandwrittenNote.is_deleted == True).all()
    for n in deleted_notes:
        trash_items.append({
            "id": f"handwritten_note_{n.id}",
            "original_id": n.id,
            "card_type": "handwritten_note",
            "card_number": 8,
            "card_name": "Handwritten Notes (Legacy)",
            "title": n.topic,
            "subtitle": f"Subject: {n.subject_name or 'General'} | {n.file_type.upper() if n.file_type else 'NOTES'}",
            "deleted_at": n.deleted_at.isoformat() if n.deleted_at else datetime.datetime.utcnow().isoformat(),
            "badge_color": "indigo"
        })

    trash_items.sort(key=lambda x: x["deleted_at"], reverse=True)
    return trash_items

@app.post("/api/trash/restore")
def restore_trash_item(data: TrashActionRequest, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    model_map = {
        "exam": models.Exam,
        "subject": models.Subject,
        "study_plan": models.StudyPlan,
        "practice_paper": models.PracticePaper,
        "viva_session": models.VivaSession,
        "ai_teacher": models.AITeacherLesson,
        "flashcard_deck": models.FlashcardDeck,
        "question_bank": models.QuestionBank,
        "notes_drive": models.NotesDriveItem,
        "handwritten_note": models.HandwrittenNote
    }
    model_cls = model_map.get(data.card_type)
    if not model_cls:
        raise HTTPException(status_code=400, detail="Invalid card type")
    
    item = db.query(model_cls).filter(model_cls.id == data.item_id, model_cls.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in trash")
    
    item.is_deleted = False
    item.deleted_at = None
    db.commit()
    return {"message": "Item restored successfully!", "card_type": data.card_type, "item_id": data.item_id}

@app.delete("/api/trash/permanent")
def permanently_delete_item(card_type: str, item_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    model_map = {
        "exam": models.Exam,
        "subject": models.Subject,
        "study_plan": models.StudyPlan,
        "practice_paper": models.PracticePaper,
        "viva_session": models.VivaSession,
        "ai_teacher": models.AITeacherLesson,
        "flashcard_deck": models.FlashcardDeck,
        "question_bank": models.QuestionBank,
        "notes_drive": models.NotesDriveItem,
        "handwritten_note": models.HandwrittenNote
    }
    model_cls = model_map.get(card_type)
    if not model_cls:
        raise HTTPException(status_code=400, detail="Invalid card type")
    
    item = db.query(model_cls).filter(model_cls.id == item_id, model_cls.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # If notes_drive item has a file on disk, remove it safely
    if card_type == "notes_drive" and hasattr(item, "file_path") and item.file_path and os.path.exists(item.file_path):
        try:
            os.remove(item.file_path)
        except Exception as e:
            print(f"Error removing file {item.file_path}: {e}")

    db.delete(item)
    db.commit()
    return {"message": "Item permanently deleted from database"}

@app.delete("/api/trash/empty")
def empty_trash(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    models_list = [
        models.Exam, 
        models.Subject, 
        models.StudyPlan, 
        models.PracticePaper, 
        models.VivaSession, 
        models.AITeacherLesson,
        models.FlashcardDeck,
        models.QuestionBank,
        models.NotesDriveItem,
        models.HandwrittenNote
    ]
    deleted_total = 0
    for m in models_list:
        rows = db.query(m).filter(m.user_id == user.id, m.is_deleted == True).all()
        for r in rows:
            if hasattr(r, "file_path") and r.file_path and os.path.exists(r.file_path):
                try:
                    os.remove(r.file_path)
                except Exception:
                    pass
            db.delete(r)
            deleted_total += 1
    db.commit()
    return {"message": f"Emptied trash! Permanently removed {deleted_total} item(s)."}


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "EXAMFRIEND",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }


# ===================================================================
# SERVE PRODUCTION FRONTEND SPA & ASSETS (24/7 Single-Port Server)
# ===================================================================
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
