from app.routers.basket_buddy import router


def test_basket_sign_in_routes_are_rate_limited():
    auth_routes = [r for r in router.routes if r.path.startswith("/basket-buddy/auth/")]
    assert len(auth_routes) == 2
    for r in auth_routes:
        assert r.dependencies, f"{r.path} has no rate limit"
