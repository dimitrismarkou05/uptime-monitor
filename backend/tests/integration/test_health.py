import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.integration
@pytest.mark.asyncio
class TestHealthCheck:
    async def test_health_all_services_up(self, async_client):
        with patch("app.main.aioredis.from_url") as mock_from_url:
            mock_redis = AsyncMock()
            mock_redis.ping = AsyncMock(return_value=True)
            mock_redis.close = AsyncMock()
            mock_from_url.return_value = mock_redis

            resp = await async_client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "ok"
            assert data["services"]["database"] == "ok"
            assert data["services"]["redis"] == "ok"
            mock_redis.close.assert_awaited_once()

    async def test_health_redis_degraded(self, async_client):
        with patch("app.main.aioredis.from_url") as mock_from_url:
            mock_redis = AsyncMock()
            mock_redis.ping = AsyncMock(side_effect=Exception("conn refused"))
            mock_redis.close = AsyncMock()
            mock_from_url.return_value = mock_redis

            resp = await async_client.get("/health")
            assert resp.status_code == 503
            data = resp.json()
            assert data["status"] == "degraded"
            assert "error" in data["services"]["redis"]

    async def test_root_endpoint(self, async_client):
        resp = await async_client.get("/")
        assert resp.status_code == 200
        assert resp.json()["message"] == "Uptime Monitor API"
        
    async def test_health_database_degraded(self, async_client):
        with patch("app.main.aioredis.from_url") as mock_from_url:
            mock_redis = AsyncMock()
            mock_redis.ping = AsyncMock(return_value=True)
            mock_from_url.return_value = mock_redis
            
            with patch("sqlalchemy.ext.asyncio.AsyncSession.execute", side_effect=Exception("DB Down")):
                resp = await async_client.get("/health")
                assert resp.status_code == 503
                data = resp.json()
                assert data["status"] == "degraded"
                assert "error" in data["services"]["database"]
                
    async def test_health_redis_close_on_error(self, async_client):
        """Cover the finally block where r.close() is called after ping error."""
        with patch("app.main.aioredis.from_url") as mock_from_url:
            mock_redis = AsyncMock()
            mock_redis.ping = AsyncMock(side_effect=Exception("ping failed"))
            mock_redis.close = AsyncMock()
            mock_from_url.return_value = mock_redis

            resp = await async_client.get("/health")
            assert resp.status_code == 503
            mock_redis.close.assert_awaited_once()