from app.services.password_policy import password_problem


def test_accepts_ordinary_passphrase():
    assert password_problem("correct horse battery", "a@example.com") is None


def test_rejects_short_common_repeated_and_email_name():
    assert password_problem("short") is not None
    assert password_problem("Password123") is not None
    assert password_problem("aaaaaaaaaa") is not None
    assert password_problem("jessica99", "jessica99@example.com") is not None


def test_rejects_over_bcrypt_limit():
    assert password_problem("x1" * 40) is not None
    assert password_problem("é" * 40) is not None


def test_list_file_is_loaded_and_blocks_listed_entries():
    from app.services.password_policy import COMMON_PASSWORDS
    # Every 8+ character entry from the public top-10k list; shorter ones fail the length rule anyway.
    assert len(COMMON_PASSWORDS) >= 2000
    assert password_problem("01234567") is not None
