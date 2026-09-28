# AI Proctored Examination System

An enterprise-grade, full-stack AI-proctored online examination platform built with **FastAPI**, **PostgreSQL**, and **Next.js (Turbopack)**.

---

## 🏗️ Architecture & Features Overview

The system strictly adheres to the AI Proctoring architectural flow:

```
[Student starts exam] ──> [JWT Auth Valid?] ──> [Serve Randomised Question Set]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
[Student Answers Questions]             [Webcam + AI Proctoring Init]
(MCQ, Multi, T/F, Text, Image)          (Face Presence, Gaze, Tab Switch)
            │                                     │
            ▼                                     ▼
[Student Submits Exam]                  [Violation Detected?] ──> [Increment Suspicion Score]
            │                                     │
            ├───────────────┬─────────────────────┤
            ▼               ▼                     ▼
     [MCQ Auto-Grade] [LLM Subjective Grade] [Snapshot Capture & WebSocket Telemetry]
            │               │                     │
            └───────┬───────┴─────────────────────┘
                    ▼
       [Examiner Review Portal] 
       (AI scores pre-filled, editable + Proctoring review panel & snapshot gallery)
                    │
                    ▼
       [Examiner Integrity Decision]
            ├── [Disqualify Candidate] -> Marks 0, Session CANCELLED
            └── [Approve & Publish]   -> Marks Persisted, Results Published
                    │
                    ▼
       [Generate PDF Report & Student Results Dashboard]
       (ReportLab Downloadable Official Audit Transcript)
```

### Key Functional Capabilities

1. **Authentication & Role-Based Access Control**:
   - JWT authentication embedding roles (`STUDENT`, `EXAMINER`, `ADMIN`), user ID, email, and full name.
   - Comprehensive permission checking across all endpoints.

2. **Multimodal Question Support**:
   - Multiple Choice Questions (Single selection)
   - Multi-Select Questions
   - True / False Questions
   - Short Answer (Evaluated via LLM / Heuristics)
   - Long Answer Essay (Evaluated via LLM / Heuristics)
   - Image / Handwritten Answer Sheet Upload

3. **Client-Side AI Proctoring Engine**:
   - Continuous Face Presence Tracking
   - Gaze Direction Monitoring (Detecting lateral deflection / looking away)
   - Multi-Face Detection
   - Tab-Switch & Blur Detection
   - Fullscreen Exit Warning System
   - Copy-Paste Prevention
   - Live Suspicion Score Accumulation (0–100)
   - Automatic Canvas Snapshot Capture upon violation transmitted to backend via base64 payloads
   - WebSocket Heartbeat Telemetry

4. **Automated & LLM-Powered Grading**:
   - Instant MCQ & True/False deterministic scoring.
   - Intelligent Subjective Grading (GPT-4o / Semantic Heuristic Rubric) with AI score justification pre-filled for examiners.
   - Examiner Override Portal for reviewing and adjusting marks with instant score recalculation.

5. **Examiner Audit & Integrity Decisions**:
   - Proctoring Review Panel with full violation event timeline.
   - Timestamped Evidence Snapshot Gallery with modal inspection.
   - **Disqualify Candidate** (flags integrity breach, zeros marks, updates session status to CANCELLED).
   - **Publish Results** (finalizes scores and makes them visible to the student).

6. **Official PDF Examination Report**:
   - Generated dynamically with ReportLab.
   - Candidate details, exam session metrics, score breakdown, performance grade.
   - Complete proctoring audit log with suspicion level classification (NORMAL, SUSPICIOUS, HIGH RISK).
   - Secure verification token and official examiner sign-off stamp.

---

## 🚀 Quick Start Guide

### 1. Database Setup (PostgreSQL)
Ensure PostgreSQL is running locally on port `5432`:
- **Database**: `ai_exam_db`
- **User**: `postgres`
- **Password**: `admin`

*(Configured in `backend/.env`)*

### 2. Backend Setup & Startup
Open a PowerShell terminal:
```powershell
cd backend
..\venv\Scripts\Activate.ps1

# Seed sample exams, questions, and default users (if not already seeded)
python -m app.db.seed

# Start the FastAPI server (Port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs: `http://localhost:8000/docs`

### 3. Frontend Setup & Startup
Open a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 👥 Default Demo Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@ai-exam.com` | `admin12345` | Global oversight, exams, questions, all dashboards |
| **Examiner** | `examiner@ai-exam.com` | `examiner123` | Exam creation, AI grading review, proctoring snapshots, disqualification |
| **Student** | `student@ai-exam.com` | `student123` | Assessment taking, live webcam proctoring, score card, PDF download |

---

## 🧪 Automated Testing
Run the complete end-to-end integration test suite:
```powershell
cd backend
$env:PYTHONPATH="."
..\venv\Scripts\pytest.exe tests/test_full_system.py -v
```
Verify the frontend build and TypeScript compilation:
```powershell
cd frontend
npm run build
```

---

## 🐳 Containerized Production Deployment (Docker)

To deploy the entire stack (PostgreSQL, FastAPI Backend, and Next.js Frontend) in one command:

```bash
docker compose up -d --build
```

- **Frontend Portal**: `http://localhost:3000`
- **Backend API & Docs**: `http://localhost:8000/docs`
- **Database**: Automated healthcheck & persistent volume storage

