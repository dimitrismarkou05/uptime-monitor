import asyncio
from fastapi import HTTPException, status
from supabase import create_client

from app.core.config import settings

_supabase = None

def get_supabase_admin():
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.supabase_url, settings.supabase_service_key)
    return _supabase


async def verify_token(token: str) -> dict:
    """Verify a Supabase JWT without blocking the event loop."""
    supabase = get_supabase_admin()
    try:
        response = await asyncio.to_thread(supabase.auth.get_user, token)
        if response.user is None:
            raise ValueError("Invalid user")
        return {
            "id": response.user.id,
            "email": response.user.email,
            "supabase_uid": response.user.id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )