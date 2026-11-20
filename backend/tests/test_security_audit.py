import pytest
from starlette.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_security_headers_present():
    """Check 10.1: Security headers must be present on responses."""
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert "strict-origin" in res.headers.get("referrer-policy", "")
    assert "camera=()" in res.headers.get("permissions-policy", "")


def test_path_traversal_blocked():
    """Check 10.4: Path traversal and dotfiles must be blocked with 403."""
    res1 = client.get("/../local.db")
    assert res1.status_code == 403

    res2 = client.get("/.env")
    assert res2.status_code == 403

    res3 = client.get("/..%2F..%2F.env")
    assert res3.status_code == 403


def test_cors_configuration():
    """Check 6.2: Wildcard CORS with credentials disallowed."""
    from backend.app.config.settings import settings
    origins = settings.get_allowed_origins()
    assert "*" not in origins


def test_session_creation_schema_validation():
    """Check 5.1: Invalid payload rejected with 422 Unprocessable Entity."""
    # Missing required 'scenario' when choice is provided
    res = client.post("/api/sessions", json={"session_id": "invalid", "choice": "burn"})
    assert res.status_code == 422


def test_director_rate_limiting():
    """Check 6.1: Repeated automated requests trigger rate limit / graceful fallback."""
    payload = {
        "state": "Punjab",
        "crop": "Paddy",
        "acres": 5.0,
        "language": "en"
    }
    # Make multiple requests
    responses = [client.post("/api/director/scenario", json=payload) for _ in range(25)]
    # All must succeed with valid schema responses (either AI or graceful offline fallback)
    assert all(r.status_code == 200 for r in responses)
    data = responses[-1].json()
    assert "introStory" in data
    assert "villageName" in data
