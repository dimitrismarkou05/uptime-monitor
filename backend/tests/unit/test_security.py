import pytest
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4

from app.core.security import verify_token, get_supabase_admin


@pytest.mark.unit
class TestVerifyToken:
    @pytest.mark.asyncio
    async def test_valid_token(self):
        valid_uuid = str(uuid4())
        mock_user = Mock()
        mock_user.id = valid_uuid
        mock_user.email = "test@example.com"

        mock_response = Mock()
        mock_response.user = mock_user

        with patch("app.core.security.get_supabase_admin") as mock_get_supabase:
            mock_supabase = Mock()
            mock_supabase.auth.get_user.return_value = mock_response
            mock_get_supabase.return_value = mock_supabase

            result = await verify_token("valid-token")

            assert result["email"] == "test@example.com"
            assert result["supabase_uid"] == valid_uuid
            assert str(result["id"]) == valid_uuid

    @pytest.mark.asyncio
    async def test_invalid_token(self):
        with patch("app.core.security.get_supabase_admin") as mock_get_supabase:
            mock_supabase = Mock()
            mock_supabase.auth.get_user.side_effect = Exception("Invalid token")
            mock_get_supabase.return_value = mock_supabase

            from fastapi import HTTPException

            with pytest.raises(HTTPException) as exc_info:
                await verify_token("invalid-token")
            assert exc_info.value.status_code == 401


@pytest.mark.unit
class TestGetSupabaseAdmin:
    @patch("app.core.security.create_client")
    def test_singleton_behavior(self, mock_create):
        import app.core.security as sec

        original = sec._supabase
        sec._supabase = None

        try:
            mock_client = MagicMock()
            mock_create.return_value = mock_client

            client1 = get_supabase_admin()
            client2 = get_supabase_admin()

            assert client1 is client2 is mock_client
            mock_create.assert_called_once()
        finally:
            sec._supabase = original