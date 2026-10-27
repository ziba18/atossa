import inspect
import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.database import Base  # noqa: E402
import app.models  # noqa: E402,F401
from app.routers.profiles import delete_account  # noqa: E402

OWNER_COLUMNS = ("user_id", "owner_user_id", "viewer_user_id")


def test_delete_account_covers_every_table_that_references_the_user():
    source = inspect.getsource(delete_account)
    missing = []
    for mapper in Base.registry.mappers:
        table = mapper.local_table
        if any(c in table.c for c in OWNER_COLUMNS) and mapper.class_.__name__ not in source:
            missing.append(table.name)
    assert not missing, f"delete_account does not clear: {missing}"
