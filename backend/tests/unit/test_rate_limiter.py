import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from unittest.mock import Mock
from app.core.rate_limiter import _rate_limit_key

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "rate limit exceeded", "detail": str(exc)},
    )


@app.get("/test")
@limiter.limit("2/minute")
async def dummy_endpoint(request: Request):  # RENAMED from test_endpoint
    return {"ok": True}


client = TestClient(app)


@pytest.mark.unit
class TestRateLimiting:
    def test_allows_under_limit(self):
        r1 = client.get("/test")
        assert r1.status_code == 200
        r2 = client.get("/test")
        assert r2.status_code == 200

    def test_blocks_over_limit(self):
        client.get("/test")
        client.get("/test")
        r3 = client.get("/test")
        assert r3.status_code == 429
        data = r3.json()
        assert "error" in data
        assert "rate limit exceeded" in data["error"].lower()
        
@pytest.mark.unit
class TestRateLimitKey:
    def test_uses_x_forwarded_for(self):
        req = Mock()
        req.headers = {"X-Forwarded-For": "1.2.3.4, 5.6.7.8"}
        req.client = Mock(host="9.10.11.12")
        assert _rate_limit_key(req) == "1.2.3.4"

    def test_falls_back_to_client_host(self):
        req = Mock()
        req.headers = {}
        req.client = Mock(host="9.10.11.12")
        assert _rate_limit_key(req) == "9.10.11.12"

    def test_unknown_when_no_client(self):
        req = Mock()
        req.headers = {}
        req.client = None
        assert _rate_limit_key(req) == "unknown"