"""
Supabase Storage client for file uploads.
Replaces local file storage with cloud-backed Supabase Storage.
"""

import os
import uuid
from typing import Optional, Dict, Any
from supabase import create_client, Client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "resumes")

# Initialize Supabase client (lazy)
_supabase: Optional[Client] = None


def get_supabase() -> Client:
    """Get or create Supabase client with service role key."""
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("Supabase URL and service key must be configured")
        _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase


async def upload_resume(
    file_content: bytes,
    file_name: str,
    user_id: str
) -> Dict[str, Any]:
    """
    Upload a resume to Supabase Storage.
    Returns {"path": str, "public_url": str} on success.
    """
    sb = get_supabase()
    
    # Generate unique file path: resumes/{user_id}/{uuid}_{filename}
    file_ext = os.path.splitext(file_name)[1].lower()
    safe_name = f"{uuid.uuid4().hex}{file_ext}"
    storage_path = f"{user_id}/{safe_name}"
    
    # Upload file
    response = sb.storage.from_(SUPABASE_BUCKET).upload(
        path=storage_path,
        file=file_content,
        file_options={"content-type": "application/pdf", "upsert": "false"}
    )
    
    # Get public URL
    public_url = sb.storage.from_(SUPABASE_BUCKET).get_public_url(storage_path)
    
    return {
        "path": storage_path,
        "public_url": public_url,
        "file_name": file_name,
    }


async def delete_resume(storage_path: str) -> bool:
    """Delete a resume from Supabase Storage."""
    try:
        sb = get_supabase()
        sb.storage.from_(SUPABASE_BUCKET).remove([storage_path])
        return True
    except Exception:
        return False
