from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserRead

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