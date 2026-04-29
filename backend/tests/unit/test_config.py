import pytest
from unittest.mock import patch
from app.core.config import Settings, get_settings


@pytest.mark.unit
class TestConfig:
    def test_settings_loads_required_fields(self):
        with patch.dict(
            "os.environ",
            {
                "DATABASE_URL": "postgresql+asyncpg://u:p@localhost/db",
                "SYNC_DATABASE_URL": "postgresql+psycopg2://u:p@localhost/db",
                "REDIS_URL": "redis://localhost:6379/0",
            },
            clear=False,
        ):
            s = Settings()
            assert s.database_url == "postgresql+asyncpg://u:p@localhost/db"
            assert s.sync_database_url == "postgresql+psycopg2://u:p@localhost/db"
            assert s.redis_url == "redis://localhost:6379/0"

    def test_settings_defaults(self):
        with patch.dict(
            "os.environ",
            {
                "DATABASE_URL": "postgresql+asyncpg://u:p@localhost/db",
                "SYNC_DATABASE_URL": "postgresql+psycopg2://u:p@localhost/db",
                "REDIS_URL": "redis://localhost:6379/0",
            },
            clear=False,
        ):
            s = Settings()
            assert s.environment == "development"
            assert s.smtp_host == "localhost"
            assert s.smtp_port == 1025
            assert s.from_email == "alerts@uptime-monitor.local"

    def test_get_settings_cached(self):
        with patch.dict(
            "os.environ",
            {
                "DATABASE_URL": "postgresql+asyncpg://u:p@localhost/db",
                "SYNC_DATABASE_URL": "postgresql+psycopg2://u:p@localhost/db",
                "REDIS_URL": "redis://localhost:6379/0",
            },
            clear=False,
        ):
            s1 = get_settings()
            s2 = get_settings()
            assert s1 is s2