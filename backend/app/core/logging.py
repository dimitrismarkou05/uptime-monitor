import logging
import sys

from app.core.config import settings

def setup_logging() -> None:
    """Configure basic structured logging for the application."""
    
    # Set log level based on environment
    log_level = logging.DEBUG if settings.environment == "development" else logging.INFO
    
    # Configure the root logger
    logging.basicConfig(
        stream=sys.stdout,
        level=log_level,
        format="%(asctime)s - [%(levelname)s] - %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    
    # Silence chatty third-party libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    
    # Adjust SQLAlchemy logging based on environment
    sqlalchemy_level = logging.INFO if settings.environment == "development" else logging.WARNING
    logging.getLogger("sqlalchemy.engine").setLevel(sqlalchemy_level)
    
    # Celery worker logs
    logging.getLogger("celery").setLevel(logging.INFO)