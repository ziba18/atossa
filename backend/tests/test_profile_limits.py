import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-0123456789")
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from pydantic import ValidationError  # noqa: E402

from app.schemas.profile import ProfileUpdate  # noqa: E402


def test_normal_profile_update_is_accepted():
    ProfileUpdate(display_name="Sam", date_of_birth="1995-04-02", timezone="Europe/London",
                  daily_log_reminder_time="20:00", average_cycle_length=28, average_period_length=5)


@pytest.mark.parametrize("field,value", [
    ("display_name", "x" * 101),
    ("avatar_url", "x" * 501),
    ("timezone", "x" * 65),
    ("average_cycle_length", 100000),
    ("average_period_length", -1),
])
def test_oversized_profile_values_are_rejected(field, value):
    with pytest.raises(ValidationError):
        ProfileUpdate(**{field: value})
