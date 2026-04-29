import logging
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)

async def init_db(db: AsyncSession) -> None:
    """
    Initialize database with base/seed data.
    Tables are created via Alembic migrations, so we only handle data here.
    """
    logger.info("Starting database initialization...")
    
    # Define your default admin details
    admin_email = "admin@example.com"
    
    result = await db.execute(select(User).where(User.email == admin_email))
    user = result.scalar_one_or_none()
    
    if not user:
        admin_user = User(
            email=admin_email,
            supabase_uid="system-admin-id", # Replace with actual Supabase UID if needed
        )
        db.add(admin_user)
        await db.commit()
        logger.info(f"Admin user {admin_email} created.")
    else:
        logger.info("Admin user already exists. Skipping creation.")
    
    logger.info("Database initialization complete.")


async def main():
    """Wrapper to run the async seed function manually."""
    # Ensure our logging is formatted when running standalone
    from app.core.logging import setup_logging
    setup_logging()
    
    async with AsyncSessionLocal() as session:
        await init_db(session)

if __name__ == "__main__":
    asyncio.run(main())