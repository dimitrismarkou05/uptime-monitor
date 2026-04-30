import pytest
from unittest.mock import patch


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