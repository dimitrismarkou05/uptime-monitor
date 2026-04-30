import pytest
from uuid import uuid4, UUID
from unittest.mock import patch, MagicMock

from app.models.user import User

FIXED_USER_ID = UUID("12345678-1234-1234-1234-123456789abc")


@pytest.mark.integration
@pytest.mark.asyncio
class TestUsersAPI:
    async def test_get_me_creates_user(self, async_client):
        resp = await async_client.get("/api/v1/users/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "test@example.com"
        assert UUID(data["id"]) == FIXED_USER_ID

    async def test_get_me_returns_existing_user(self, async_client, db_session):
        user = User(
            id=FIXED_USER_ID,
            email="test@example.com",
            supabase_uid="supabase-test-uid-123",
        )
        db_session.add(user)
        await db_session.commit()

        resp = await async_client.get("/api/v1/users/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(FIXED_USER_ID)

    async def test_sync_user_explicit(self, async_client):
        resp = await async_client.post("/api/v1/users/sync")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "test@example.com"

    async def test_delete_me(self, async_client, db_session):
        # Ensure user exists
        await async_client.post("/api/v1/users/sync")

        with patch("app.api.v1.users.get_supabase_admin") as mock_get_admin:
            mock_admin = MagicMock()
            mock_admin.auth.admin.delete_user.return_value = None
            mock_get_admin.return_value = mock_admin

            resp = await async_client.delete("/api/v1/users/me")
            assert resp.status_code == 204
    
    async def test_delete_me_supabase_error(self, async_client, db_session):
        await async_client.post("/api/v1/users/sync")

        with patch("app.api.v1.users.get_supabase_admin") as mock_get_admin:
            mock_admin = MagicMock()
            mock_admin.auth.admin.delete_user.side_effect = Exception("Supabase timeout")
            mock_get_admin.return_value = mock_admin

            # Should catch the error internally, log it, and still return 204 successfully
            resp = await async_client.delete("/api/v1/users/me")
            assert resp.status_code == 204
            
    async def test_delete_me_when_user_not_in_db(self, async_client):
        """Delete should create user first (via _get_or_create_user) then delete."""
        from unittest.mock import patch, MagicMock

        with patch("app.api.v1.users.get_supabase_admin") as mock_get_admin:
            mock_admin = MagicMock()
            mock_admin.auth.admin.delete_user.return_value = None
            mock_get_admin.return_value = mock_admin

            resp = await async_client.delete("/api/v1/users/me")
            assert resp.status_code == 204