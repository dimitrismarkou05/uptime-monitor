import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.db.init_db import init_db
from app.models.user import User
from app.db.init_db import main

@pytest.mark.unit
@pytest.mark.asyncio
class TestInitDb:
    async def test_creates_admin_when_missing(self):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None

        mock_db = MagicMock()
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()

        with patch("app.db.init_db.logger") as mock_logger:
            await init_db(mock_db)

        assert mock_db.add.call_count == 1
        added_user = mock_db.add.call_args[0][0]
        assert isinstance(added_user, User)
        assert added_user.email == "admin@example.com"
        assert added_user.supabase_uid == "system-admin-id"
        mock_db.commit.assert_awaited_once()
        mock_logger.info.assert_any_call("Admin user admin@example.com created.")

    async def test_skips_when_admin_exists(self):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = User(
            email="admin@example.com",
            supabase_uid="system-admin-id",
        )

        mock_db = MagicMock()
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()

        with patch("app.db.init_db.logger") as mock_logger:
            await init_db(mock_db)

        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_awaited()
        mock_logger.info.assert_any_call("Admin user already exists. Skipping creation.")
        
@pytest.mark.unit
@pytest.mark.asyncio
class TestInitDbMain:
    async def test_main_entrypoint(self):
        with patch("app.core.logging.setup_logging") as mock_setup:  # ← FIXED PATH
            with patch("app.db.init_db.AsyncSessionLocal") as mock_session_cls:
                mock_session = AsyncMock()
                mock_session_cls.return_value.__aenter__ = AsyncMock(
                    return_value=mock_session
                )
                mock_session_cls.return_value.__aexit__ = AsyncMock(
                    return_value=False
                )

                with patch("app.db.init_db.init_db", new_callable=AsyncMock) as mock_init:
                    await main()
                    mock_setup.assert_called_once()
                    mock_init.assert_awaited_once_with(mock_session)