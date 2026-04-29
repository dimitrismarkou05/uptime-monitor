from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserRead
from app.core.security import get_supabase_admin

router = APIRouter()

async def _get_or_create_user(
    current_user: dict,
    db: AsyncSession,
) -> User:
    """Ensure the Supabase-authenticated user exists in our database."""
    result = await db.execute(
        select(User).where(User.supabase_uid == current_user["supabase_uid"])
    )
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=current_user["id"],
            email=current_user["email"],
            supabase_uid=current_user["supabase_uid"],
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user

@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's profile (auto-creates if missing)."""
    user = await _get_or_create_user(current_user, db)
    return user

@router.post("/sync", response_model=UserRead, status_code=200)
async def sync_user(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Explicitly sync Supabase user to local DB."""
    user = await _get_or_create_user(current_user, db)
    return user

@router.delete("/me", status_code=204)
async def delete_current_user(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete user from local database and Supabase Auth."""
    user = await _get_or_create_user(current_user, db)
    
    # 1. Delete from Supabase Auth using the admin client
    supabase = get_supabase_admin()
    try:
        supabase.auth.admin.delete_user(current_user["supabase_uid"])
    except Exception as e:
        # Log this in a real system, but proceed to clear local data regardless
        print(f"Failed to delete Supabase auth user: {e}")

    # 2. Delete local user (SQLAlchemy cascades delete to monitors & ping logs)
    await db.delete(user)
    await db.commit()
    return None