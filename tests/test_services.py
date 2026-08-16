import pytest
from datetime import datetime, date, timezone, timedelta
import uuid

import sys
from pathlib import Path
# Add backend to sys.path so tests can import app modules directly
sys.path.insert(0, str(Path(__file__).parent.parent / "src" / "backend"))

from app.services.timezone_utils import user_local_date, seconds_until_midnight
from app.auth import hash_password, verify_password, create_access_token, decode_token


def test_password_hashing():
    raw_password = "SecurePassword123!"
    hashed = hash_password(raw_password)
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_generation_and_decoding():
    user_id = str(uuid.uuid4())
    token = create_access_token(user_id)
    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["type"] == "access"
    assert "exp" in payload


def test_user_local_date():
    # Target UTC time: 2026-08-16 20:00:00 UTC
    # In Asia/Ho_Chi_Minh (+7), it is 2026-08-17 03:00:00
    now_utc = datetime(2026, 8, 16, 20, 0, 0, tzinfo=timezone.utc)
    vn_date = user_local_date("Asia/Ho_Chi_Minh", now_utc)
    assert vn_date == date(2026, 8, 17)

    # Target UTC time: 2026-08-16 10:00:00 UTC
    # In Asia/Ho_Chi_Minh (+7), it is 2026-08-16 17:00:00
    now_utc_early = datetime(2026, 8, 16, 10, 0, 0, tzinfo=timezone.utc)
    vn_date_early = user_local_date("Asia/Ho_Chi_Minh", now_utc_early)
    assert vn_date_early == date(2026, 8, 16)


def test_seconds_until_midnight():
    # Local time in UTC: 2026-08-16 23:59:50
    now_utc = datetime(2026, 8, 16, 23, 59, 50, tzinfo=timezone.utc)
    ttl = seconds_until_midnight("UTC", now_utc)
    assert ttl == 10  # 10 seconds until midnight