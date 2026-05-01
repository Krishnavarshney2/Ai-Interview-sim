"""
Central configuration for AI-InterviewSim.

All hardcoded values (model names, thresholds, paths) are centralized here
for easy customization without modifying core logic files.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(override=True)

# ============================================================
# Project Paths
# ============================================================
PROJECT_ROOT = Path(__file__).parent
BACKEND_DIR = PROJECT_ROOT / "backend"
PROTOTYPE_BACKEND_DIR = PROJECT_ROOT / "prototype-backend"
UTILS_DIR = PROJECT_ROOT / "utils"
FRONTEND_DIR = PROJECT_ROOT / "frontend"
UI_DIR = PROJECT_ROOT / "UI"
TEST_FILES_DIR = PROJECT_ROOT / "test-files"

# ============================================================
# LLM Configuration - GROQ
# ============================================================
# Groq API Key (REQUIRED - get from https://console.groq.com/)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

if not GROQ_API_KEY:
    print("⚠️  WARNING: GROQ_API_KEY not set in .env file!")
    print("📝 Get your free API key from: https://console.groq.com/")
    print("📝 Create a .env file with: GROQ_API_KEY=your_key_here\n")

# Default model for interviews (Groq models)
# Available free models on Groq:
#   - llama-3.1-70b-versatile (recommended, best quality)
#   - llama-3.1-8b-instant (ultra-fast)
#   - mixtral-8x7b-32768 (good balance)
#   - gemma2-9b-it (Google's Gemma)
#   - llama3-70b-8192
#   - llama3-8b-8192
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

# Temperature for LLM responses (0.0 = deterministic, 1.0 = creative)
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.7"))

# Max tokens for LLM responses
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "1024"))

# ============================================================
# Embedding Configuration
# ============================================================
# Model for question similarity / duplicate detection
# Using HuggingFace local embeddings (no API key needed)
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# Similarity threshold for duplicate question detection (0.0-1.0)
# Higher = stricter matching. 0.75 means 75% cosine similarity = duplicate
DUPLICATE_THRESHOLD = float(os.getenv("DUPLICATE_THRESHOLD", "0.75"))

# ============================================================
# Interview Configuration
# ============================================================
# Default number of rounds if not specified by user
DEFAULT_ROUNDS = 5

# Max retries when generating a non-duplicate question
MAX_DUPLICATE_RETRIES = 3

# ============================================================
# Resume Parser Configuration
# ============================================================
# Max characters sent to LLM for parsing (limit to avoid context overflow)
RESUME_TEXT_LIMIT = 4000

# Max retries for resume parsing
RESUME_PARSE_RETRIES = 3

# ============================================================
# Attention Tracking Configuration
# ============================================================
# Default attention tracking duration per answer (seconds)
ATTENTION_TRACK_DURATION = 6

# Minimum acceptable attention score to factor into feedback (0-100)
MIN_ATTENTION_SCORE = 50

# ============================================================
# Voice Configuration
# ============================================================
# Speech-to-text model (Whisper - local)
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")

# Text-to-speech language code
TTS_LANGUAGE = os.getenv("TTS_LANGUAGE", "en")

# ============================================================
# UI Configuration
# ============================================================
# Gradio server port
GRADIO_PORT = int(os.getenv("GRADIO_PORT", "7860"))

# Streamlit server port
STREAMLIT_PORT = int(os.getenv("STREAMLIT_PORT", "8501"))

# ============================================================
# Database Configuration
# ============================================================
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/luminal_ai"
)

DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
DB_ECHO = os.getenv("DB_ECHO", "false").lower() == "true"

# ============================================================
# Redis Configuration
# ============================================================
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# ============================================================
# Supabase Storage Configuration
# ============================================================
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "resumes")

# ============================================================
# Stripe Configuration
# ============================================================
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_PRO = os.getenv("STRIPE_PRICE_PRO", "")
STRIPE_PRICE_ENTERPRISE = os.getenv("STRIPE_PRICE_ENTERPRISE", "")

# ============================================================
# Rate Limiting Configuration
# ============================================================
RATE_LIMITS = {
    "default": {"requests": 60, "window": 60},
    "interview_start": {"requests": 10, "window": 60},
    "interview_answer": {"requests": 20, "window": 60},
    "parse_resume": {"requests": 5, "window": 60},
}

# ============================================================
# Helper Functions
# ============================================================

def get_llm_config():
    """Return a dict with LLM configuration."""
    return {
        "model": LLM_MODEL,
        "api_key": GROQ_API_KEY,
        "temperature": LLM_TEMPERATURE,
        "max_tokens": LLM_MAX_TOKENS,
    }


def get_embedding_config():
    """Return a dict with embedding configuration."""
    return {
        "model": EMBEDDING_MODEL,
        "duplicate_threshold": DUPLICATE_THRESHOLD,
    }


def print_config_summary():
    """Print a summary of current configuration."""
    print("\n" + "=" * 50)
    print("⚙️  AI-InterviewSim Configuration")
    print("=" * 50)
    print(f"  LLM Provider:     Groq")
    print(f"  LLM Model:        {LLM_MODEL}")
    print(f"  API Key Set:      {'✅ Yes' if GROQ_API_KEY else '❌ No'}")
    print(f"  Temperature:      {LLM_TEMPERATURE}")
    print(f"  Embedding Model:  {EMBEDDING_MODEL}")
    print(f"  Duplicate Thresh: {DUPLICATE_THRESHOLD}")
    print(f"  Default Rounds:   {DEFAULT_ROUNDS}")
    print(f"  Whisper Model:    {WHISPER_MODEL}")
    print(f"  Gradio Port:      {GRADIO_PORT}")
    print("=" * 50 + "\n")


# Auto-print config when module is imported directly
if __name__ == "__main__":
    print_config_summary()
