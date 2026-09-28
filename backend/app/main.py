from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.exceptions.handlers import register_exception_handlers
from app.api.v1.auth import router as auth_router
from app.api.v1.question import router as question_router
from app.api.v1.exam import router as exam_router
from app.api.v1.exam_session import router as exam_session_router
from app.api.v1.answer import router as answer_router
from app.api.v1.result_api import router as result_router
from app.api.v1.proctor_event import router as proctor_event_router
from app.api.v1.grading import router as grading_router
from app.websocket.proctor import router as proctor_router
from app.db.database import engine, Base

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware (Must wrap all incoming requests before router processing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Custom Exception Handlers
register_exception_handlers(app)

# Include API Routers
app.include_router(auth_router)
app.include_router(question_router)
app.include_router(exam_router)
app.include_router(exam_session_router)
app.include_router(answer_router)
app.include_router(result_router)
app.include_router(proctor_router)
app.include_router(proctor_event_router)
app.include_router(grading_router)

# Static file serving for uploads (answers & snapshots)
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "answers").mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "snapshots").mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads",
)


@app.on_event("startup")
def on_startup():
    """Ensure database tables are automatically initialized on startup."""
    try:
        import app.models  # noqa: F401 - ensures all models are registered
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Database table verification: {e}")


@app.get("/")
def home():
    return {
        "status": "online",
        "message": "Backend Running Successfully",
        "project": settings.PROJECT_NAME,
        "algorithm": settings.ALGORITHM,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
    }