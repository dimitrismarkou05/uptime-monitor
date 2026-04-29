import pytest
from unittest.mock import Mock, patch
from uuid import uuid4

from app.core.security import verify_token


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
            assert str(result["id"]) == valid_uuid  # verify UUID coercion worked

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