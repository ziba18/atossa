from app.main import app


def test_cycle_logging_routes_are_gone():
    paths = app.openapi()["paths"]
    assert not [p for p in paths if p.startswith("/cycles")]
