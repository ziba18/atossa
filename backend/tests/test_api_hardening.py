import pytest
from pydantic import ValidationError
from app.schemas.auth import LoginRequest, RegisterRequest


def test_overlong_password_and_name_rejected():
    with pytest.raises(ValidationError):
        RegisterRequest(email="a@example.com", password="x" * 129)
    with pytest.raises(ValidationError):
        RegisterRequest(email="a@example.com", password="x" * 12, display_name="n" * 101)
    with pytest.raises(ValidationError):
        LoginRequest(email="a@example.com", password="x" * 5000)


def test_normal_values_accepted():
    RegisterRequest(email="a@example.com", password="x" * 128, display_name="Sam")


def test_security_headers_present():
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).get("/health")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["cache-control"] == "no-store"
