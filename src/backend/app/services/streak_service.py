"""Streak update logic for Tiny Win.

Called after each win INSERT to maintain the streaks table.
Mirrors the fn_update_streak() trigger in docs/schema.sql.
"""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Streak


async def update_streak_after_win(db: AsyncSession, user_id, win_date_key: date) -> Streak:
    """Update (or create) the streak row for user_id after posting a win on win_date_key.

    This is a Python mirror of the DB trigger. We call it from the
    create-win endpoint so the API response includes fresh streak data.
    The DB trigger also fires; the result is idempotent.
    """
    result = await db.execute(select(Streak).where(Streak.user_id == user_id))
    streak = result.scalar_one_or_none()

    if streak is None:
        streak = Streak(user_id=user_id, current_streak=1, longest_streak=1, last_win_date=win_date_key, total_wins=1)
        db.add(streak)
        return streak

    streak.total_wins += 1

    if streak.last_win_date is None:
        streak.current_streak = 1
    elif win_date_key == streak.last_win_date + timedelta(days=1):
        streak.current_streak += 1
    elif win_date_key > streak.last_win_date:
        streak.current_streak = 1
    # same date_key → idempotent, no change

    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_win_date = win_date_key

    return streak
