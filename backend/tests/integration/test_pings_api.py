import pytest
from uuid import uuid4, UUID

from app.models.ping_log import PingLog
from app.models.monitor import Monitor

FIXED_USER_ID = UUID("12345678-1234-1234-1234-123456789abc")


@pytest.mark.integration
@pytest.mark.asyncio
class TestPingsAPI:
    async def test_get_monitor_pings(self, async_client, db_session):
        # Create monitor via API so ownership matches the auth override
        payload = {"url": "https://ping-test.com", "interval_seconds": 300, "is_active": True}
        create_resp = await async_client.post("/api/v1/monitors/", json=payload)
        assert create_resp.status_code == 201
        monitor_id = create_resp.json()["id"]

        ping = PingLog(
            id=uuid4(),
            monitor_id=UUID(monitor_id),
            status_code=200,
            response_ms=100,
            is_up=True,
        )
        db_session.add(ping)
        await db_session.commit()

        resp = await async_client.get(f"/api/v1/pings/monitor/{monitor_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) == 1
        assert data["total"] == 1
        assert data["items"][0]["status_code"] == 200

    async def test_get_monitor_pings_paginated(self, async_client, db_session):
        payload = {"url": "https://paginated.com", "interval_seconds": 300, "is_active": True}
        create_resp = await async_client.post("/api/v1/monitors/", json=payload)
        assert create_resp.status_code == 201
        monitor_id = create_resp.json()["id"]

        # Create 15 pings
        for i in range(15):
            ping = PingLog(
                id=uuid4(),
                monitor_id=UUID(monitor_id),
                status_code=200,
                response_ms=100 + i,
                is_up=True,
            )
            db_session.add(ping)
        await db_session.commit()

        # Page 1 (default: skip=0, limit=10)
        resp = await async_client.get(f"/api/v1/pings/monitor/{monitor_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 10
        assert data["total"] == 15

        # Page 2 (skip=10, limit=10)
        resp = await async_client.get(f"/api/v1/pings/monitor/{monitor_id}?skip=10&limit=10")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["items"]) == 5
        assert data["total"] == 15

    async def test_get_monitor_pings_404(self, async_client):
        resp = await async_client.get(f"/api/v1/pings/monitor/{uuid4()}")
        assert resp.status_code == 404

    async def test_get_monitor_stats(self, async_client, db_session):
        payload = {"url": "https://stats-test.com", "interval_seconds": 300, "is_active": True}
        create_resp = await async_client.post("/api/v1/monitors/", json=payload)
        monitor_id = create_resp.json()["id"]

        for i in range(5):
            ping = PingLog(
                id=uuid4(),
                monitor_id=UUID(monitor_id),
                status_code=200 if i < 4 else 500,
                response_ms=100 + i * 10,
                is_up=i < 4,
            )
            db_session.add(ping)
        await db_session.commit()

        resp = await async_client.get(f"/api/v1/pings/monitor/{monitor_id}/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_checks"] == 5
        assert data["uptime_count"] == 4
        assert data["uptime_percent"] == 80.0
        assert data["avg_response_ms"] == 120.0
        assert data["last_24h"]["checks"] == 5

    async def test_get_monitor_stats_404(self, async_client):
        resp = await async_client.get(f"/api/v1/pings/monitor/{uuid4()}/stats")
        assert resp.status_code == 404

    async def test_get_monitor_stats_empty(self, async_client):
        payload = {
            "url": "https://empty-stats.com",
            "interval_seconds": 300,
            "is_active": True,
        }
        create_resp = await async_client.post("/api/v1/monitors/", json=payload)
        monitor_id = create_resp.json()["id"]

        resp = await async_client.get(f"/api/v1/pings/monitor/{monitor_id}/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_checks"] == 0
        assert data["uptime_percent"] == 0
        assert data["avg_response_ms"] is None
        assert data["last_24h"]["checks"] == 0
        assert data["last_24h"]["uptime_percent"] == 0

    async def test_get_monitor_pings_default_limit(self, async_client):
        payload = {
            "url": "https://pings-default.com",
            "interval_seconds": 300,
            "is_active": True,
        }
        create_resp = await async_client.post("/api/v1/monitors/", json=payload)
        monitor_id = create_resp.json()["id"]

        resp = await async_client.get(f"/api/v1/pings/monitor/{monitor_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_get_monitor_stats_no_pings(self, async_client, db_session):
        """Cover the None branches for avg_response_ms and zero checks."""
        # Insert monitor directly to avoid rate‑limiting
        monitor = Monitor(
            id=uuid4(),
            user_id=FIXED_USER_ID,  # matches the auth override in conftest.py
            url="https://no-pings.com",
            interval_seconds=300,
            is_active=True,
        )
        db_session.add(monitor)
        await db_session.commit()
        monitor_id = str(monitor.id)

        resp = await async_client.get(f"/api/v1/pings/monitor/{monitor_id}/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["avg_response_ms"] is None
        assert data["total_checks"] == 0
        assert data["last_24h"]["checks"] == 0

    async def test_get_monitor_pings_invalid_uuid(self, async_client):
        resp = await async_client.get("/api/v1/pings/monitor/not-a-uuid")
        assert resp.status_code == 400
        assert resp.json()["detail"] == "Invalid monitor ID format"

    async def test_get_monitor_stats_invalid_uuid(self, async_client):
        resp = await async_client.get("/api/v1/pings/monitor/not-a-uuid/stats")
        assert resp.status_code == 400
        assert resp.json()["detail"] == "Invalid monitor ID format"