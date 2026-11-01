# EXAMFRIEND 🎓 &bull; Student-Centric Web Application

> Built strictly in accordance with the project specifications in `EXAMFRIEND.docx`.

EXAMFRIEND is a full-stack, AI-powered study companion designed to empower students to track upcoming exams, decompose course syllabi into actionable checklists, generate daily study roadmaps, practice with mock papers synthesized from past year files, and rehearse oral vivas with a supportive AI teacher.

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite, Modern Vanilla CSS Design System with Glassmorphism, Google Fonts (`Outfit` & `Plus Jakarta Sans`), Lucide Icons, Canvas Confetti, Web Speech API (Microphone Speech Recognition & Speech Synthesis).
- **Backend**: Python (FastAPI, Uvicorn, Pydantic, SQLAlchemy ORM, ReportLab, PyMuPDF, PyPDF, Groq LLM with `qwen/qwen3.8-27b`).
- **Database**: PostgreSQL (`postgresql://postgres@localhost:5432/examfriend_db`) with automatic SQLite fallback for high availability.

---

## 🚀 Running the Application Locally

### 1. Database
PostgreSQL is running locally on port 5432 with database `examfriend_db`.

### 2. Backend (FastAPI)
```powershell
cd c:\Users\Riya\Downloads\exam\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
- API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### 3. Frontend (React + Vite)
```powershell
cd c:\Users\Riya\Downloads\exam\frontend
npm run dev
```
- Web Application URL: `http://localhost:5173/`

### 4. Mobile App (Android APK via Capacitor)
The project is pre-configured with Capacitor for native Android:
```powershell
cd c:\Users\Riya\Downloads\exam\frontend
npm run cap:build
npm run cap:open
```
- Opens the ready Android project in **Android Studio**.
- Click **Build** &rarr; **Build Bundle(s) / APK(s)** &rarr; **Build APK(s)** to generate `app-debug.apk`.

---

## 📋 Core Modules & Specification Mapping

### 🔐 Authentication & Student Profile
- Secure **Sign Up** & **Login** with password hashing (`bcrypt`) and JWT session bearer tokens.
- **1-Click Demo Login** (`student@examfriend.edu` / `password123`) for instant testing.
- Student statistics pill tracking active streak, upcoming exams count, and syllabus completion rate.

### ⏱️ Card 1: Exam Countdown
- Inputs: **Exam Name**, **Exam Date**, **Exam Time**, and **Type of Exam** (Final Exam, Midterm, Lab/Viva, Quiz, Competitive).
- **Automatic Chronological Sorting**: The closest upcoming exam is automatically positioned at the top with a highlighted card and a live countdown ticker (Days, Hours, Minutes, Seconds).
- Standard controls: `Add Exam`, `Delete Exam`, `Start Study Prep`, `Back`.

### 📚 Card 2: Subject & Syllabus Tracker
- Inputs: **Subject Name**, **Number of Modules**, and **PDF Syllabus Upload**.
- **Backend PDF Decomposer**: Reads uploaded PDF using PyMuPDF and parses it into a strict hierarchical tree: `Module 1 -> Topic 1, Topic 2...`.
- **"Done" Checkboxes**: Interactive checkboxes next to each topic (*"yeh padh liya h to tick karo"*).
- **Dynamic Percentage Tracker**: Circular SVG progress rings and progress bars update completion percentage in real time. Celebratory confetti triggers upon 100% completion!

### 📅 Card 3: Study Plan Generator
- Integrated directly with **Card 1** (saved exams) and **Card 2** (syllabus topics).
- **Customizable Start Date**: Set your desired **Plan Start Date** (defaults to today or pick any upcoming date) to anchor Day 1.
- **Target Exam Date**: Specify your target exam date or auto-sync with the closest exam from Card 1.
- Dynamic subject selector: Select the number of subjects to render linked subject selection dropdowns.
- **Bullet Points Topic Layout**: Right-hand column displays Day 1 (and all subsequent days) topics as **clear, indented bullet points** (`• Topic 1`, `• Topic 2`, `• Topic 3`), completely eliminating dense paragraphs.
- **Download Study Plan as PDF**: Generates an official university timetable PDF via ReportLab with formatted bullet points.

### 📝 Card 4: Practice Paper Generator
- Upload a **ZIP file** containing past year question papers (PDF, DOCX, TXT).
- Input: **"Number of Practice Papers Needed"** (1 to 5) + Target Subject.
- Synthesizes mock papers strictly matching the past paper layout (Section A 2-markers, Section B 6-markers, Section C 10-markers).
- Interactive reader with revealable **Model Answer Keys / Solution Hints**.
- **Download Practice Paper as PDF**: Exports official university examination formatted PDFs.

### 🎙️ Card 5: AI Viva & Notes Tester
- Upload study notes as a **PDF**.
- **Mode A (Long Answer Oral Viva)**:
  - User clicks **"Start Viva"** and speaks answers verbally using live microphone voice recognition.
  - **Supportive Teacher AI Guidance**: If the student pauses or struggles (*"I'm Stuck / Need Hint"*), the AI acts like an encouraging professor and provides gentle hints.
  - User clicks **"Stop Answer"** &rarr; AI rates response out of 10, highlights strengths, points out mistakes, provides delivery improvement tips, and displays the ideal model answer.
- **Mode B (MCQ Type)**:
  - **With Option**: Question with 4 choices &rarr; Select option and click **"Check Answer"** to view instant feedback and explanation.
  - **Without Option**: Question only &rarr; Click **"Start Answer"** and speak verbally. AI provides teacher hints when stuck and rates the spoken answer.
- Integrated Text-to-Speech (TTS) examiner voice.

### 👨‍🏫 Card 6: AI Teacher, Voice & Video
- Voice & Chalkboard Video Classroom.
- Interactive multi-speed voice explanation and blackboard visualization.

### 🎴 Card 7: AI Flashcards Generator (PDF-to-Flashcards Synthesis)
- **Upload Any Study PDF / Notes**: Synthesizes aesthetic, interactive **3D flip flashcards** directly from lecture slides, course PDFs, or handwritten notes.
- **Pedagogical Focus Modes**:
  - 🎯 **All Core Concepts**: Well-rounded syllabus fundamentals, architecture, and real-world mechanisms.
  - 📐 **Formulas & Definitions**: Mathematical governing equations, laws, and precise terminology.
  - 🔥 **High-Yield Exam Hotspots**: Questions repeatedly tested in university finals where students typically lose marks.
  - ⚖️ **Differentiations & Comparisons**: Contrasting components, protocols, and 2-column comparative differences.
- **3D Interactive Flip Deck Experience**:
  - Smooth 3D perspective flip card (click or press `Space` to flip).
  - Keyboard shortcuts (`←` Previous, `→` Next, `Space` Flip, `1` Hard, `2` Good, `3` Easy).
  - 🔊 **Text-to-Speech**: In-app audio readout for auditory learners.
  - ⭐ **Star & Bookmark**: Filter and focus solely on challenging cards.
  - 💡 **Examiner Trap & Secret Memory Tip**: Built-in mnemonics and common university exam pitfall warnings on every card.
- **Leitner Active Recall & Spaced Repetition Self-Grading**:
  - Grade each card as 🔴 Hard (Again), 🟡 Good (Review Soon), or 🟢 Easy (Mastered!).
  - Live deck mastery score (%) progress ring.
  - Confetti celebration upon completing all cards in a deck.
- **Multiple Study Modes**:
  - 🃏 **3D Carousel Mode**: Focused single-card deep study.
  - 🗂️ **Grid Overview Mode**: Responsive grid layout with quick study shortcuts and live keyword search.
- **Printable Pocket Cards PDF Export**:
  - 1-click generation of high-resolution printable pocket flashcards with dotted cut-lines, questions, answers, and examiner tips.
- **Card 9 Trash Integration**: Full soft-delete and instant restore compatibility.

### 📂 Card 8: Notes Drive (Subject & Module Breakdown + Student Vault)
- **Subject & Module Breakdown Integration (Connected to Card 2)**:
  - Seamlessly links to registered subjects from Card 2 (Subject & Syllabus Tracker).
  - **Module Hierarchy**: Displays each subject's modules (e.g. Module 1: Supervised Learning, Module 2: Neural Networks), module topics, syllabus completion progress, and total attached study materials.
  - **Direct PDF Module Upload**: Click **"➕ Add PDF to Module X"** directly on any module card or empty module dropzone to immediately attach lecture slides, handwritten notes, or textbook PDFs to that specific module.
  - Auto-categorizes with subject and module metadata, enabling instant curriculum-aligned revision.
- **Dual View Modes**:
  - 📚 **Subject & Module Breakdown**: Curriculum-aligned tree view by subject and module with topic badges and direct PDF dropzones.
  - 📁 **All Drive Files**: Unified file explorer with live search, subject/category/type filtering, and Grid vs. Table views.
- **Dual Note Creation**:
  - **Upload Files**: Upload PDFs, Photos/Images (board snapshots, handwritten notes), Word Docs, PPTs, or Text files with OCR and text extraction.
  - **Write Typed Notes**: Built-in rich note editor with markdown formatting (headings, bold, lists, tasks, code blocks, formulas, callouts), color accents, and live preview.
- **Organization & Fast Search**:
  - Filter by Subject (auto-synced with Card 2), Category (Lecture Notes, Cheatsheets, Formula Sheets, Lab), and File Type.
  - ⭐ Pin high-priority notes to top of Drive or module.
  - Instant live keyword search across titles, topics, tags, and full note content.
- **In-App Document Reader**:
  - View typed notes, embedded PDFs, and high-resolution board photos right inside the app.
  - 1-click text copy, file download, and formatted browser print.
- **AI Study Kit & Flashcards**:
  - Instant AI analysis generates 3-sentence Concept Summary, 4 High-Yield Exam Takeaways, Definitions & Formulas, and Interactive Active Recall Flashcards with question flip!
- **Safe Recovery**: Deleting any note moves it safely to Card 9 Trash with 1-click restore.

### 🗑️ Card 9: Trash & Safe Data Recovery
- Safety vault for Cards 1 through 8 (Exams, Subjects, Study Plans, Practice Papers, Viva, AI Teacher, Question Banks, and Notes Drive).
- Soft delete architecture with 1-click restore back to original card with intact associations.
- Permanent delete and Empty Trash controls.

