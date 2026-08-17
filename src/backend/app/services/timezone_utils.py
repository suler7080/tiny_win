"""Timezone utilities for Tiny Win.

Server is source-of-truth for date boundaries (PRD §5, Rule #1).
Uses user's IANA timezone to compute date_key.
"""

from datetime import date, datetime, timedelta, timezone

from zoneinfo import ZoneInfo


def user_local_date(user_timezone: str | None = None, now_utc: datetime | None = None) -> date:
    """Return today's date in the user's local timezone (defaults to Asia/Ho_Chi_Minh)."""
    if now_utc is None:
        now_utc = datetime.now(timezone.utc)
    try:
        tz = ZoneInfo(user_timezone) if user_timezone else ZoneInfo("Asia/Ho_Chi_Minh")
    except Exception:
        tz = ZoneInfo("Asia/Ho_Chi_Minh")
    return now_utc.astimezone(tz).date()


def seconds_until_midnight(user_timezone: str | None = None, now_utc: datetime | None = None) -> int:
    """Return seconds remaining until midnight in the user's timezone."""
    if now_utc is None:
        now_utc = datetime.now(timezone.utc)
    try:
        tz = ZoneInfo(user_timezone) if user_timezone else ZoneInfo("Asia/Ho_Chi_Minh")
    except Exception:
        tz = ZoneInfo("Asia/Ho_Chi_Minh")
    local_now = now_utc.astimezone(tz)
    midnight = local_now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    diff = (midnight - local_now).total_seconds()
    return max(int(diff), 1)

