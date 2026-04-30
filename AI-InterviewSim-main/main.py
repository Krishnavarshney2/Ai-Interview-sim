"""
FastAPI Backend for Luminal AI Interview Platform
Production-ready with PostgreSQL, Redis, and Supabase Storage.

Architecture:
- PostgreSQL: Persistent data (users, interviews, questions, feedback)
- Redis: Rate limiting, caching, ephemeral state
- Supabase Storage: File uploads (resumes)
- In-Memory: Active LLM interview sessions (non-serializable state)
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from collections import defaultdict
import sys
import os
import uuid
import time
import secrets
import logging
import tempfile
import asyncio
from pathlib import Path
from datetime import datetime

# SQLAlchemy
from sqlalchemy.ext.asyncio import AsyncSession

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'prototype-backend'))

# Imports
from config import RATE_LIMITS
from db.database import init_db, close_db, get_db
from db.repository import (
    UserRepository, ResumeRepository, InterviewRepository,
    InterviewQuestionRepository, FeedbackRepository, SubscriptionRepository
)
from db.models import Interview, User, Subscription
from cache.redis_client import check_rate_limit_redis, close_redis, cache_set, cache_get
from storage.supabase_storage import upload_resume

# Resume parser
from resume_parser import ResumeParser

# Interview session (kept in memory for LLM state)
from interview_session import InterviewSession

app = FastAPI(title="Luminal AI Interview API", version="2.0.0")

# ============================================================
# Security Middleware
# ============================================================
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    if os.getenv("ENVIRONMENT") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    
    response.headers["Permissions-Policy"] = "camera=(self), microphone=(self), geolocation=()"
    
    if "/api/" in request.url.path:
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        response.headers["Pragma"] = "no-cache"
    
    return response

# CORS middleware - simple and reliable
# For production, set CORS_ORIGINS=https://your-frontend.com
# For development, defaults to localhost:3000
CORS_ORIGINS_ENV = os.getenv("CORS_ORIGINS", "http://localhost:3000")
CORS_ORIGINS = [o.strip() for o in CORS_ORIGINS_ENV.split(",") if o.strip()]

# Always hardcode known production origins so env-var issues never break prod
HARDCODED_ORIGINS = [
    "https://ai-interview-sim-five.vercel.app",
    "http://localhost:3000",
]
for origin in HARDCODED_ORIGINS:
    if origin not in CORS_ORIGINS:
        CORS_ORIGINS.append(origin)

# Also allow any Vercel preview deployment so redeploys don't break CORS
CORS_REGEX = r"https://.*\.vercel\.app"

logger.info(f"CORS configured with origins: {CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight for 24 hours
)

# ============================================================
# Constants
# ============================================================
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_FILE_TYPES = {'.pdf'}
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
SESSION_TTL = 3600  # 1 hour

# In-memory active interview sessions (LLM state only)
# Key: session_id -> InterviewSession object
active_sessions: Dict[str, Any] = {}

# ============================================================
# Startup / Shutdown
# ============================================================
@app.on_event("startup")
async def startup():
    """Initialize database tables on startup with timeout."""
    logger.info("Starting up Luminal AI API...")
    try:
        # Wrap DB init in timeout so a slow/blocked DB connection doesn't hang forever
        await asyncio.wait_for(init_db(), timeout=15.0)
        logger.info("Database initialized successfully")
    except asyncio.TimeoutError:
        logger.error("Database initialization timed out after 15s. Server will start but DB ops may fail.")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}", exc_info=True)
        # Don't crash the server if DB init fails - we can still serve health checks

    logger.info("Luminal AI API startup complete. Ready to serve requests.")

@app.on_event("shutdown")
async def shutdown():
    """Clean up resources."""
    logger.info("Shutting down Luminal AI API...")
    await close_db()
    await close_redis()

# ============================================================
# Helpers
# ============================================================
def get_client_ip(request: Request) -> str:
    """Extract client IP, handling proxies."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    return request.client.host if request.client else "unknown"


def generate_secure_session_id() -> str:
    """Generate cryptographically secure session ID."""
    return f"sess_{secrets.token_hex(16)}"


def sanitize_error_message(error: Exception) -> str:
    """Sanitize error messages to prevent information leakage."""
    error_str = str(error)
    import re
    error_str = re.sub(r'[C-Z]:[\\\/][^\s,"\']+', '[PATH REDACTED]', error_str)
    error_str = re.sub(r'/[a-zA-Z0-9_./-]+', '[PATH REDACTED]', error_str)
    sensitive_patterns = ['password', 'secret', 'key', 'token', 'credential']
    for pattern in sensitive_patterns:
        if pattern.lower() in error_str.lower():
            return "An internal error occurred. Please try again."
    return error_str


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> Optional[Any]:
    """
    Extract and validate user from Supabase JWT token.
    Syncs user to local database if not exists.
    Returns user object or None for unauthenticated requests.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        # Validate token with Supabase (using our cache to avoid repeated validation)
        cache_key = f"user_token:{token[:16]}"
        cached_user = await cache_get(cache_key)
        
        if cached_user:
            return cached_user
        
        # Use Supabase client to validate token and get user
        from supabase import create_client
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
        supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
        
        if not supabase_url or not supabase_key:
            return None
        
        sb = create_client(supabase_url, supabase_key)
        
        # Run sync Supabase auth call in a thread pool to avoid blocking the async event loop.
        # A blocking HTTP call here hangs ALL concurrent requests in production.
        def _get_user_sync():
            return sb.auth.get_user(token)
        
        try:
            user_response = await asyncio.wait_for(
                asyncio.to_thread(_get_user_sync),
                timeout=5.0
            )
        except asyncio.TimeoutError:
            logger.warning("Supabase auth validation timed out")
            return None
        
        if not user_response or not user_response.user:
            return None
        
        supabase_user = user_response.user
        
        # Sync to local database
        user = await UserRepository.get_or_create(
            db,
            supabase_uid=supabase_user.id,
            email=supabase_user.email or "",
            name=supabase_user.user_metadata.get("full_name") if supabase_user.user_metadata else None
        )
        
        # Cache for 5 minutes
        await cache_set(cache_key, user, ttl=300)
        
        return user
        
    except Exception as e:
        logger.warning(f"Token validation failed: {e}")
        return None


async def require_user(request: Request, db: AsyncSession = Depends(get_db)):
    """Dependency that requires authentication."""
    user = await get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


async def check_rate_limit(request: Request, endpoint: str) -> dict:
    """Check rate limit using Redis with DB fallback."""
    client_ip = get_client_ip(request)
    limits = RATE_LIMITS.get(endpoint, RATE_LIMITS["default"])
    
    # Try Redis first
    result = await check_rate_limit_redis(
        client_ip, endpoint,
        limits["requests"], limits["window"]
    )
    
    return result


def cleanup_expired_sessions():
    """Remove expired in-memory sessions."""
    current_time = time.time()
    expired = [
        sid for sid, data in active_sessions.items()
        if current_time - data.get("created_at", 0) > SESSION_TTL
    ]
    for sid in expired:
        del active_sessions[sid]
        logger.info(f"Expired session removed: {sid}")


# ============================================================
# Pydantic Models
# ============================================================
class InterviewStartRequest(BaseModel):
    role: str = Field(..., min_length=1, max_length=100)
    rounds: int = Field(..., ge=1, le=20)
    resume_id: Optional[str] = Field(None, max_length=100)

class AnswerRequest(BaseModel):
    answer: str = Field(..., min_length=1, max_length=10000)
    session_id: Optional[str] = Field(None, max_length=100)

# ============================================================
# Diagnostic Endpoints (no auth, lightweight)
# ============================================================
@app.post("/api/test-upload")
async def test_upload(
    request: Request,
    file: UploadFile = File(...),
):
    """
    Test endpoint for file upload with NO auth and NO external dependencies.
    Used to isolate CORS vs backend-crash issues.
    """
    logger.info(f"test-upload received: {file.filename}, size unknown yet")
    try:
        content = await file.read()
        logger.info(f"test-upload read {len(content)} bytes")
        return JSONResponse({
            "success": True,
            "filename": file.filename,
            "size": len(content),
            "message": "Test upload works"
        })
    except Exception as e:
        logger.error(f"test-upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Test upload failed")


# ============================================================
# Health Endpoints
# ============================================================
@app.get("/")
async def root():
    return {"status": "ok", "message": "Luminal AI Interview API v2.0.0", "version": "2.0.0"}

@app.get("/debug/cors")
async def debug_cors():
    """Return current CORS configuration for debugging."""
    return {
        "cors_origins": CORS_ORIGINS,
        "cors_regex": CORS_REGEX,
        "environment": os.getenv("ENVIRONMENT", "development"),
    }

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check with DB connectivity test."""
    db_ok = True
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    
    return {
        "status": "healthy" if db_ok else "degraded",
        "api": "running",
        "database": "connected" if db_ok else "disconnected",
        "backend_modules": "loaded"
    }

# ============================================================
# Resume Upload (Supabase Storage)
# ============================================================
@app.post("/api/parse-resume")
async def parse_resume(
    request: Request,
    file: UploadFile = File(...),
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Parse uploaded resume PDF and store in Supabase Storage + database.
    """
    logger.info(f"parse-resume called by user={user.id if user else 'none'}")

    # Rate limit check
    try:
        rate_check = await check_rate_limit(request, "parse_resume")
        if not rate_check["allowed"]:
            logger.warning(f"Rate limit hit for user={user.id if user else 'none'}")
            raise HTTPException(
                status_code=429,
                detail=f"Too many upload requests. Try again in {rate_check['retry_after']}s."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rate limit check failed: {e}", exc_info=True)
        # Don't block upload if rate limiter is down

    try:
        # Validate file
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            logger.warning(f"Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
        
        logger.info(f"Reading file: {file.filename}")
        file_content = await file.read()
        logger.info(f"File read: {len(file_content)} bytes")
        
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Max 10MB.")
        
        if len(file_content) < 100:
            raise HTTPException(status_code=400, detail="File too small or corrupted.")
        
        safe_filename = os.path.basename(file.filename)
        logger.info(f"Processing resume upload: {safe_filename}")
        
        # Upload to Supabase Storage
        try:
            storage_info = await upload_resume(file_content, safe_filename, str(user.id))
            storage_key = storage_info["path"]
            logger.info(f"Resume uploaded to Supabase Storage: {storage_key}")
        except Exception as e:
            logger.error(f"Supabase Storage upload failed: {e}")
            # Fallback to local storage
            storage_key = f"local/{user.id}/{secrets.token_hex(8)}.pdf"
            local_path = UPLOAD_DIR / storage_key.replace("local/", "")
            local_path.parent.mkdir(parents=True, exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(file_content)
        
        # Parse resume locally
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf', dir=UPLOAD_DIR) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name
        
        try:
            parser = ResumeParser()
            parsed_data = parser.parse(tmp_path)
            
            if "error" in parsed_data:
                logger.warning(f"Resume parsing warning: {parsed_data['error']}")
        except Exception as e:
            logger.error(f"Resume parsing failed: {e}")
            parsed_data = {"error": str(e), "skills": [], "experience": []}
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
        
        # Deactivate old resumes and save new one to DB
        await ResumeRepository.deactivate_all_for_user(db, user.id)
        resume = await ResumeRepository.create(
            db,
            user_id=user.id,
            storage_key=storage_key,
            file_name=safe_filename,
            file_size=len(file_content),
            parsed_data=parsed_data,
            raw_text=parsed_data.get("raw_text", "")
        )
        
        logger.info(f"Resume saved to database: {resume.id}")
        
        return JSONResponse({
            "success": True,
            "data": parsed_data,
            "resume_id": str(resume.id),
            "message": "Resume parsed and stored successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process resume.")


async def check_subscription_limit(user_id: Any, db: AsyncSession) -> bool:
    """Check if user has reached free plan interview limit."""
    from db.repository import SubscriptionRepository
    sub = await SubscriptionRepository.get_by_user_id(db, user_id)
    
    # Pro/enterprise users have no limit
    if sub and sub.status == "active" and sub.plan in ("pro", "enterprise"):
        return True
    
    # Free users: check monthly interview count
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count(Interview.id))
        .where(and_(
            Interview.user_id == user_id,
            Interview.created_at >= month_start
        ))
    )
    monthly_count = result.scalar() or 0
    
    # Free plan: 3 interviews per month
    return monthly_count < 3


# ============================================================
# Interview Management
# ============================================================
@app.post("/api/interview/start")
async def start_interview(
    request: Request,
    interview_data: InterviewStartRequest,
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a new interview session. Persisted to database."""
    # Check subscription limit
    can_start = await check_subscription_limit(user.id, db)
    if not can_start:
        raise HTTPException(
            status_code=403,
            detail="You've reached your monthly interview limit. Upgrade to Pro for unlimited interviews."
        )
    
    # Rate limit
    rate_check = await check_rate_limit(request, "interview_start")
    if not rate_check["allowed"]:
        raise HTTPException(
            status_code=429,
            detail=f"Too many interview starts. Try again in {rate_check['retry_after']}s."
        )
    
    try:
        cleanup_expired_sessions()
        
        # Abandon any existing in-progress interview for this user
        existing = await InterviewRepository.get_active_by_user(db, user.id)
        if existing:
            await InterviewRepository.update_status(db, existing.id, "abandoned")
            logger.info(f"Abandoned previous interview: {existing.id}")
        
        # Get resume if available
        resume = None
        resume_id = None
        if interview_data.resume_id:
            from uuid import UUID as PyUUID
            try:
                resume = await ResumeRepository.get_by_id(db, PyUUID(interview_data.resume_id))
                if resume and resume.user_id == user.id:
                    resume_id = resume.id
            except Exception:
                pass
        
        if not resume:
            resume = await ResumeRepository.get_active_by_user(db, user.id)
            if resume:
                resume_id = resume.id
        
        # Create interview record in database
        interview = await InterviewRepository.create(
            db,
            user_id=user.id,
            role=interview_data.role,
            rounds_total=interview_data.rounds,
            resume_id=resume_id
        )
        
        # Build resume data for LLM
        resume_data = {"name": user.name or "Candidate", "skills": [], "experience": "Software Developer"}
        if resume and resume.parsed_data:
            resume_data = resume.parsed_data
        
        # Generate secure session ID for in-memory LLM state
        session_id = generate_secure_session_id()
        
        # Create InterviewSession (in-memory LLM state)
        session = InterviewSession(
            resume_obj=resume_data,
            role=interview_data.role,
            rounds=interview_data.rounds,
            session_id=session_id
        )
        
        # Generate first question
        question = session.ask_question()
        
        if not question:
            raise HTTPException(status_code=500, detail="Failed to generate interview question.")
        
        # Save first question to database
        await InterviewQuestionRepository.create(
            db, interview.id, round_number=1, question=question
        )
        
        # Store in-memory session
        active_sessions[session_id] = {
            "session": session,
            "interview_id": str(interview.id),
            "user_id": str(user.id),
            "created_at": time.time()
        }
        
        logger.info(f"Interview started: db_id={interview.id}, session={session_id}")
        
        return JSONResponse({
            "success": True,
            "session_id": session_id,
            "interview_id": str(interview.id),
            "question": question,
            "round": 1,
            "total_rounds": interview_data.rounds,
            "message": "Interview started successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start interview: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=sanitize_error_message(e))


@app.post("/api/interview/answer")
async def submit_answer(
    request: Request,
    answer_data: AnswerRequest,
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit an answer and get the next question."""
    # Rate limit
    rate_check = await check_rate_limit(request, "interview_answer")
    if not rate_check["allowed"]:
        raise HTTPException(
            status_code=429,
            detail=f"Too many answers. Try again in {rate_check['retry_after']}s."
        )
    
    try:
        cleanup_expired_sessions()
        
        # Validate session
        if not answer_data.session_id or answer_data.session_id not in active_sessions:
            raise HTTPException(status_code=400, detail="No active interview session. Start a new interview.")
        
        session_data = active_sessions[answer_data.session_id]
        
        # Verify ownership
        if str(session_data["user_id"]) != str(user.id):
            raise HTTPException(status_code=403, detail="Session does not belong to you.")
        
        interview_id = session_data["interview_id"]
        session = session_data["session"]
        
        # Get interview from DB
        from uuid import UUID as PyUUID
        interview = await InterviewRepository.get_by_id(db, PyUUID(interview_id))
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found.")
        
        # Validate answer
        if len(answer_data.answer) > 10000:
            raise HTTPException(status_code=400, detail="Answer too long. Max 10,000 characters.")
        
        # Record answer in DB
        questions = await InterviewQuestionRepository.get_by_interview(db, PyUUID(interview_id))
        current_question = questions[-1] if questions else None
        
        if current_question:
            await InterviewQuestionRepository.record_answer(
                db, current_question.id, answer_data.answer
            )
        
        # Record in LLM session
        session.provide_answer(answer_data.answer)
        
        # Check if interview complete
        if session.current_round >= session.rounds:
            logger.info(f"Interview complete: {interview_id}")
            
            # Generate feedback
            feedback = session.generate_final_feedback()
            
            # Save feedback to DB
            await FeedbackRepository.create(
                db,
                interview_id=PyUUID(interview_id),
                relevance=feedback.get("relevance", 0),
                clarity=feedback.get("clarity", 0),
                depth=feedback.get("depth", 0),
                examples=feedback.get("examples", 0),
                communication=feedback.get("communication", 0),
                overall=feedback.get("overall", 0),
                summary=feedback.get("summary", ""),
                strengths=feedback.get("strengths", []),
                growth_areas=feedback.get("growth_areas", [])
            )
            
            # Update interview status
            duration = int(time.time() - session_data["created_at"])
            await InterviewRepository.update_status(
                db, PyUUID(interview_id), "completed",
                overall_score=feedback.get("overall", 0),
                duration_seconds=duration
            )
            
            # Clean up in-memory session
            del active_sessions[answer_data.session_id]
            
            return JSONResponse({
                "success": True,
                "isComplete": True,
                "feedback": feedback,
                "message": "Interview complete"
            })
        
        # Generate next question
        next_question = session.ask_question()
        
        if not next_question:
            raise HTTPException(status_code=500, detail="Failed to generate next question.")
        
        # Save next question to DB
        new_q = await InterviewQuestionRepository.create(
            db, PyUUID(interview_id),
            round_number=session.current_round + 1,
            question=next_question
        )
        
        # Update interview round count
        await InterviewRepository.increment_round(db, PyUUID(interview_id))
        
        # Check for follow-up
        followup = None
        if session.history and session.history[-1].get('followup'):
            followup = session.history[-1]['followup']
            # Update DB with followup
            if current_question:
                await InterviewQuestionRepository.record_answer(
                    db, current_question.id, answer_data.answer,
                    followup_question=followup
                )
        
        logger.info(f"Answer recorded for interview {interview_id}, round {session.current_round + 1}")
        
        return JSONResponse({
            "success": True,
            "nextQuestion": next_question,
            "followup": followup,
            "round": session.current_round + 1,
            "totalRounds": session.rounds,
            "isComplete": False,
            "message": "Answer recorded"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process answer: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=sanitize_error_message(e))


@app.post("/api/interview/feedback")
async def generate_feedback(
    interview_id: str,
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Get feedback for a specific interview."""
    try:
        from uuid import UUID as PyUUID
        interview = await InterviewRepository.get_by_id(db, PyUUID(interview_id))
        
        if not interview or str(interview.user_id) != str(user.id):
            raise HTTPException(status_code=404, detail="Interview not found.")
        
        feedback = await FeedbackRepository.get_by_interview(db, PyUUID(interview_id))
        
        if not feedback:
            raise HTTPException(status_code=404, detail="Feedback not yet generated.")
        
        return JSONResponse({
            "success": True,
            "feedback": {
                "overall_score": feedback.overall,
                "categories": {
                    "technical_accuracy": feedback.depth,
                    "communication": feedback.communication,
                    "problem_solving": feedback.examples,
                    "experience_level": feedback.relevance,
                    "confidence": feedback.clarity,
                    "structure": feedback.overall
                },
                "strengths": feedback.strengths or [],
                "growth_areas": feedback.growth_areas or [],
                "summary": feedback.summary
            },
            "message": "Feedback retrieved successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get feedback: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve feedback.")


@app.get("/api/interview/history")
async def get_history(
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """Get real interview history from database."""
    try:
        interviews = await InterviewRepository.get_all_by_user(db, user.id, limit=limit, offset=offset)
        
        history = []
        for interview in interviews:
            history.append({
                "id": str(interview.id),
                "role": interview.role,
                "rounds_total": interview.rounds_total,
                "rounds_completed": interview.rounds_completed,
                "status": interview.status,
                "score": interview.overall_score,
                "duration_seconds": interview.duration_seconds,
                "created_at": interview.created_at.isoformat() if interview.created_at else None,
                "completed_at": interview.completed_at.isoformat() if interview.completed_at else None
            })
        
        return JSONResponse({
            "success": True,
            "history": history,
            "message": "History retrieved"
        })
        
    except Exception as e:
        logger.error(f"Failed to get history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve history.")


@app.get("/api/user/stats")
async def get_user_stats(
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated user statistics for dashboard."""
    try:
        stats = await InterviewRepository.get_recent_stats(db, user.id)
        category_averages = await FeedbackRepository.get_category_averages(db, user.id)
        
        return JSONResponse({
            "success": True,
            "stats": stats,
            "category_averages": category_averages,
            "message": "Stats retrieved"
        })
        
    except Exception as e:
        logger.error(f"Failed to get stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve stats.")


@app.get("/api/interview/recent")
async def get_recent_interviews(
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 5
):
    """Get recent interviews for dashboard."""
    try:
        interviews = await InterviewRepository.get_all_by_user(db, user.id, limit=limit)
        
        recent = []
        for interview in interviews:
            duration_mins = round(interview.duration_seconds / 60) if interview.duration_seconds else 0
            score = interview.overall_score or 0
            
            score_color = "text-tertiary" if score >= 90 else "text-primary" if score >= 80 else "text-secondary" if score >= 70 else "text-error"
            
            recent.append({
                "id": str(interview.id),
                "role": interview.role,
                "company": "Luminal AI",
                "date": interview.created_at.strftime("%b %d, %Y") if interview.created_at else "",
                "duration": f"{duration_mins} minutes" if duration_mins else "N/A",
                "score": f"{int(score)}/100" if score else "N/A",
                "scoreColor": score_color,
                "status": interview.status
            })
        
        return JSONResponse({
            "success": True,
            "recent": recent,
            "message": "Recent interviews retrieved"
        })
    except Exception as e:
        logger.error(f"Failed to get recent: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve recent interviews.")


@app.get("/api/analytics/trends")
async def get_score_trends(
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Get score trends over time for analytics charts."""
    try:
        interviews = await InterviewRepository.get_all_by_user(db, user.id, limit=50)
        
        trends = []
        for interview in interviews:
            if interview.status == "completed" and interview.overall_score:
                trends.append({
                    "date": interview.completed_at.strftime("%b %d") if interview.completed_at else "",
                    "score": round(interview.overall_score * 20)  # Convert 0-5 to 0-100
                })
        
        # If no data, return empty array (frontend will handle)
        return JSONResponse({
            "success": True,
            "trends": trends,
            "message": "Trends retrieved"
        })
    except Exception as e:
        logger.error(f"Failed to get trends: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve trends.")


@app.get("/api/analytics/weekly")
async def get_weekly_activity(
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Get weekly interview activity."""
    try:
        from sqlalchemy import func
        from sqlalchemy.orm import joinedload
        from datetime import datetime, timedelta
        
        # Get interviews from last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        result = await db.execute(
            select(Interview)
            .where(and_(
                Interview.user_id == user.id,
                Interview.created_at >= week_ago
            ))
            .order_by(Interview.created_at)
        )
        interviews = result.scalars().all()
        
        # Group by day of week
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        weekly = {day: {"interviews": 0, "total_score": 0, "count": 0} for day in days}
        
        for interview in interviews:
            day_name = interview.created_at.strftime("%a") if interview.created_at else ""
            if day_name in weekly:
                weekly[day_name]["interviews"] += 1
                if interview.overall_score:
                    weekly[day_name]["total_score"] += interview.overall_score * 20
                    weekly[day_name]["count"] += 1
        
        data = []
        for day in days:
            avg = round(weekly[day]["total_score"] / weekly[day]["count"]) if weekly[day]["count"] > 0 else 0
            data.append({
                "day": day,
                "interviews": weekly[day]["interviews"],
                "score": avg
            })
        
        return JSONResponse({
            "success": True,
            "weekly": data,
            "message": "Weekly activity retrieved"
        })
    except Exception as e:
        logger.error(f"Failed to get weekly: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve weekly activity.")


# ============================================================
# Billing & Subscriptions (Stripe)
# ============================================================
@app.post("/api/billing/create-checkout-session")
async def create_checkout_session(
    request: Request,
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe Checkout session for subscription."""
    try:
        import stripe as stripe_lib
        from config import STRIPE_SECRET_KEY, STRIPE_PRICE_PRO
        
        if not STRIPE_SECRET_KEY or not STRIPE_PRICE_PRO:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        stripe_lib.api_key = STRIPE_SECRET_KEY
        
        body = await request.json()
        price_id = body.get("price_id", STRIPE_PRICE_PRO)
        
        # Get or create Stripe customer
        from db.repository import SubscriptionRepository
        sub = await SubscriptionRepository.get_by_user_id(db, user.id)
        
        if sub and sub.stripe_customer_id:
            customer_id = sub.stripe_customer_id
        else:
            customer = stripe_lib.Customer.create(
                email=user.email,
                metadata={"user_id": str(user.id)}
            )
            customer_id = customer.id
            await SubscriptionRepository.create_or_update(
                db, user.id, stripe_customer_id=customer_id
            )
        
        # Create checkout session
        session = stripe_lib.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1,
            }],
            mode="subscription",
            success_url=f"{request.headers.get('origin', 'http://localhost:3000')}/dashboard?success=true",
            cancel_url=f"{request.headers.get('origin', 'http://localhost:3000')}/pricing?canceled=true",
            subscription_data={
                "metadata": {"user_id": str(user.id)}
            }
        )
        
        return JSONResponse({"success": True, "sessionId": session.id, "url": session.url})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create checkout session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create checkout session.")


@app.get("/api/billing/subscription")
async def get_subscription(
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's subscription status."""
    try:
        from db.repository import SubscriptionRepository
        sub = await SubscriptionRepository.get_by_user_id(db, user.id)
        
        if not sub:
            return JSONResponse({
                "success": True,
                "subscription": {"status": "inactive", "plan": "free"},
                "message": "No subscription found"
            })
        
        return JSONResponse({
            "success": True,
            "subscription": {
                "status": sub.status,
                "plan": sub.plan,
                "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
                "cancel_at_period_end": bool(sub.cancel_at_period_end),
            },
            "message": "Subscription retrieved"
        })
        
    except Exception as e:
        logger.error(f"Failed to get subscription: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve subscription.")


@app.post("/api/billing/portal")
async def create_portal_session(
    request: Request,
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe Customer Portal session."""
    try:
        import stripe as stripe_lib
        from config import STRIPE_SECRET_KEY
        from db.repository import SubscriptionRepository
        
        if not STRIPE_SECRET_KEY:
            raise HTTPException(status_code=500, detail="Stripe not configured")
        
        stripe_lib.api_key = STRIPE_SECRET_KEY
        
        sub = await SubscriptionRepository.get_by_user_id(db, user.id)
        if not sub or not sub.stripe_customer_id:
            raise HTTPException(status_code=400, detail="No active subscription found")
        
        session = stripe_lib.billing_portal.Session.create(
            customer=sub.stripe_customer_id,
            return_url=f"{request.headers.get('origin', 'http://localhost:3000')}/profile"
        )
        
        return JSONResponse({"success": True, "url": session.url})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create portal session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create billing portal session.")


@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events."""
    try:
        import stripe as stripe_lib
        from config import STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY
        from db.repository import SubscriptionRepository, UserRepository
        
        if not STRIPE_SECRET_KEY:
            return JSONResponse({"success": False, "message": "Stripe not configured"})
        
        stripe_lib.api_key = STRIPE_SECRET_KEY
        
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        if STRIPE_WEBHOOK_SECRET and sig_header:
            try:
                event = stripe_lib.Webhook.construct_event(
                    payload, sig_header, STRIPE_WEBHOOK_SECRET
                )
            except stripe_lib.error.SignatureVerificationError:
                raise HTTPException(status_code=400, detail="Invalid signature")
        else:
            # For development without webhook secret
            event = await request.json()
        
        event_type = event.get("type") if isinstance(event, dict) else event.type
        event_data = event.get("data", {}).get("object") if isinstance(event, dict) else event.data.object
        
        logger.info(f"Stripe webhook received: {event_type}")
        
        if event_type == "checkout.session.completed":
            customer_id = event_data.get("customer")
            subscription_id = event_data.get("subscription")
            metadata = event_data.get("metadata", {})
            user_id = metadata.get("user_id")
            
            if user_id:
                await SubscriptionRepository.create_or_update(
                    db,
                    PyUUID(user_id),
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id,
                    status="active",
                    plan="pro"
                )
                logger.info(f"Subscription activated for user {user_id}")
        
        elif event_type == "invoice.payment_succeeded":
            subscription_id = event_data.get("subscription")
            # Update period dates if needed
            pass
        
        elif event_type in ("customer.subscription.deleted", "customer.subscription.updated"):
            subscription_id = event_data.get("id")
            status = event_data.get("status")
            cancel_at_period_end = event_data.get("cancel_at_period_end", False)
            
            # Find user by subscription ID
            from sqlalchemy import select
            from db.models import Subscription
            result = await db.execute(
                select(Subscription).where(Subscription.stripe_subscription_id == subscription_id)
            )
            sub = result.scalar_one_or_none()
            
            if sub:
                sub.status = status if status else "inactive"
                sub.cancel_at_period_end = 1 if cancel_at_period_end else 0
                if status == "canceled" or status == "incomplete_expired":
                    sub.plan = "free"
                await db.commit()
                logger.info(f"Subscription updated: {subscription_id} -> {status}")
        
        return JSONResponse({"success": True, "message": "Webhook processed"})
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {e}", exc_info=True)
        return JSONResponse({"success": False, "message": "Webhook processing failed"})


# ============================================================
# Admin Endpoints
# ============================================================
@app.get("/api/admin/stats")
async def admin_stats(
    user = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin dashboard statistics."""
    # Simple admin check - in production, use a proper admin role
    ADMIN_EMAILS = os.getenv("ADMIN_EMAILS", "").split(",")
    if user.email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        from sqlalchemy import func
        
        # Total users
        result = await db.execute(select(func.count(User.id)))
        total_users = result.scalar() or 0
        
        # Total interviews
        result = await db.execute(select(func.count(Interview.id)))
        total_interviews = result.scalar() or 0
        
        # Completed interviews
        result = await db.execute(
            select(func.count(Interview.id)).where(Interview.status == "completed")
        )
        completed_interviews = result.scalar() or 0
        
        # Active subscriptions
        result = await db.execute(
            select(func.count(Subscription.id)).where(Subscription.status == "active")
        )
        active_subs = result.scalar() or 0
        
        # Recent signups (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        result = await db.execute(
            select(func.count(User.id)).where(User.created_at >= week_ago)
        )
        recent_signups = result.scalar() or 0
        
        return JSONResponse({
            "success": True,
            "stats": {
                "total_users": total_users,
                "total_interviews": total_interviews,
                "completed_interviews": completed_interviews,
                "active_subscriptions": active_subs,
                "recent_signups": recent_signups,
            },
            "message": "Admin stats retrieved"
        })
        
    except Exception as e:
        logger.error(f"Failed to get admin stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve admin stats.")


# ============================================================
# Main Entry Point
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
