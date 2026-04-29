import pytest
from unittest.mock import patch
from importlib import reload


@pytest.mark.unit
class TestSession:
    @patch("app.db.session.settings")
    def test_session_module_loads(self, mock_settings):
        mock_settings.database_url = "postgresql+asyncpg://u:p@localhost/db"
        mock_settings.sync_database_url = "postgresql+psycopg2://u:p@localhost/db"

        import app.db.session as session_module
        reload(session_module)

        assert session_module.async_engine is not None
        assert session_module.sync_engine is not None
        assert session_module.AsyncSessionLocal is not None
        assert session_module.SyncSessionLocal is not None