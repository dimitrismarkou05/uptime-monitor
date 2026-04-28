from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"

    # Database
    database_url: str
    sync_database_url: str

    # Redis / Celery
    redis_url: str

    # Supabase Auth
    supabase_url: str | None = None
    supabase_service_key: str | None = None

    # SMTP / Alerts
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str | None = None
    smtp_pass: str | None = None
    from_email: str = "alerts@uptime-monitor.local"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()