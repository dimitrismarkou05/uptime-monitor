import pytest
from unittest.mock import patch, MagicMock, AsyncMock


@pytest.mark.integration
@pytest.mark.asyncio
class TestMain:
    async def test_health_redis_init_failure(self, async_client):
        """Cover the branch where aioredis.from_url raises before r is assigned."""
        with patch("app.main.aioredis.from_url") as mock_from_url:
            mock_from_url.side_effect = Exception("Redis init failed")
            resp = await async_client.get("/health")
            assert resp.status_code == 503
            data = resp.json()
            assert "Redis init failed" in data["services"]["redis"]

    async def test_root_endpoint(self, async_client):
        resp = await async_client.get("/")
        assert resp.status_code == 200
        assert resp.json()["message"] == "Uptime Monitor API"
        
    async def test_health_redis_success_closes_connection(self, async_client):
        with patch("app.main.aioredis.from_url") as mock_from_url:
            mock_redis = MagicMock()
            mock_redis.ping = AsyncMock(return_value=True)
            mock_redis.close = AsyncMock(return_value=None)
            mock_from_url.return_value = mock_redis

            resp = await async_client.get("/health")
            assert resp.status_code == 200
            mock_redis.close.assert_awaited_once()