import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock, patch
from app.api.deps import get_current_user


@pytest.mark.unit
@pytest.mark.asyncio
class TestDeps:
    async def test_get_current_user_success(self):
        mock_creds = AsyncMock()
        mock_creds.credentials = "valid-token"

        with patch("app.api.deps.verify_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = {"id": "user-id", "email": "a@b.com"}
            result = await get_current_user(mock_creds)
            assert result["email"] == "a@b.com"
            mock_verify.assert_awaited_once_with("valid-token")

    async def test_get_current_user_invalid(self):
        mock_creds = AsyncMock()
        mock_creds.credentials = "bad-token"

        with patch("app.api.deps.verify_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.side_effect = HTTPException(
                status_code=401, detail="Invalid token"
            )
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(mock_creds)
            assert exc_info.value.status_code == 401