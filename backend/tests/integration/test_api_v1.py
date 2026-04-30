import pytest
from uuid import uuid4

@pytest.mark.asyncio
async def test_users_endpoints(async_client, token_headers):
    # Cover app/api/v1/users.py missing lines (getting current user, etc)
    resp = await async_client.get("/api/v1/users/me", headers=token_headers)
    assert resp.status_code == 200
    
    # Trigger 404/Error branches in users.py
    resp = await async_client.get(f"/api/v1/users/{uuid4()}", headers=token_headers)
    assert resp.status_code in [404, 403]

@pytest.mark.asyncio
async def test_pings_endpoints(async_client, token_headers):
    # Cover app/api/v1/pings.py missing lines
    # Create a monitor first to have pings to query
    monitor_data = {"url": "https://test.com", "interval_seconds": 300}
    m_resp = await async_client.post("/api/v1/monitors/", json=monitor_data, headers=token_headers)
    monitor_id = m_resp.json()["id"]
    
    # Get stats for the monitor (Corrected path)
    resp = await async_client.get(f"/api/v1/pings/monitor/{monitor_id}/stats", headers=token_headers)
    assert resp.status_code == 200
    
    # Get logs for the monitor (Corrected path)
    resp = await async_client.get(f"/api/v1/pings/monitor/{monitor_id}", headers=token_headers)
    assert resp.status_code == 200