import pytest
from uuid import uuid4

from app.models.monitor import Monitor
from app.models.user import User


@pytest.mark.integration
@pytest.mark.asyncio
class TestMonitorAPI:
    async def test_list_monitors_empty(self, async_client):
        resp = await async_client.get("/api/v1/monitors/")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_create_and_get_monitor(self, async_client):
        payload = {
            "url": "https://example.com",
            "interval_seconds": 300,
            "is_active": True,
        }
        create_resp = await async_client.post("/api/v1/monitors/", json=payload)
        assert create_resp.status_code == 201
        data = create_resp.json()
        assert data["url"] == "https://example.com/"
        assert data["interval_seconds"] == 300

        monitor_id = data["id"]
        get_resp = await async_client.get(f"/api/v1/monitors/{monitor_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == monitor_id

    async def test_update_monitor(self, async_client):
        payload = {
            "url": "https://example.com",
            "interval_seconds": 300,
            "is_active": True,
        }
        create_resp = await async_client.post("/api/v1/monitors/", json=payload)
        monitor_id = create_resp.json()["id"]

        patch_resp = await async_client.patch(
            f"/api/v1/monitors/{monitor_id}",
            json={"interval_seconds": 600},
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["interval_seconds"] == 600

    async def test_delete_monitor(self, async_client):
        payload = {
            "url": "https://delete-me.com",
            "interval_seconds": 300,
            "is_active": True,
        }
        create_resp = await async_client.post("/api/v1/monitors/", json=payload)
        monitor_id = create_resp.json()["id"]

        del_resp = await async_client.delete(f"/api/v1/monitors/{monitor_id}")
        assert del_resp.status_code == 204

        get_resp = await async_client.get(f"/api/v1/monitors/{monitor_id}")
        assert get_resp.status_code == 404