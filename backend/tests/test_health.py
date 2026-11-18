import pytest
from unittest.mock import patch


def test_health_check_default(client):
    """Verifies default /api/health response with database connectivity."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["db_type"] in ("sqlite", "postgres")
    assert data["db_status"] == "connected"


def test_health_check_postgres_reporting(client):
    """Verifies that /api/health accurately reports postgres when configured."""
    with patch("backend.app.routers.health.get_db_info", return_value={"db_type": "postgres", "db_status": "connected"}):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["db_type"] == "postgres"
        assert data["db_status"] == "connected"


def test_database_url_rewrite_postgres():
    """Verifies postgres:// URL rewriting to postgresql:// for SQLAlchemy 2 compatibility."""
    from backend.app.config.settings import Settings
    s = Settings(DATABASE_URL="postgres://user:pass@ep-cool-1234.us-east-2.aws.neon.tech/neondb?sslmode=require")
    assert s.get_database_url().startswith("postgresql://")
    assert "postgres://" not in s.get_database_url()


def test_database_url_fallback():
    """Verifies empty or whitespace DATABASE_URL falls back to local sqlite."""
    from backend.app.config.settings import Settings
    s = Settings(DATABASE_URL="")
    assert s.get_database_url() == "sqlite:///./local.db"
