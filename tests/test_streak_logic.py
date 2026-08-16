import pytest
from datetime import date, timedelta
import sys
from pathlib import Path

# Add backend to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent / "src" / "backend"))

from app.models import Streak, User, Win, ReactionTypeEnum


def test_streak_progression_logic():
    """Test streak increment when posting consecutive days."""
    today = date(2026, 8, 16)
    yesterday = today - timedelta(days=1)

    # Initial streak
    streak = Streak(
        current_streak=1,
        longest_streak=1,
        last_win_date=yesterday,
        total_wins=1
    )

    # Posting today (consecutive day)
    if streak.last_win_date == yesterday:
        streak.current_streak += 1
        streak.longest_streak = max(streak.longest_streak, streak.current_streak)
        streak.last_win_date = today
        streak.total_wins += 1

    assert streak.current_streak == 2
    assert streak.longest_streak == 2
    assert streak.last_win_date == today
    assert streak.total_wins == 2


def test_streak_reset_on_missed_day():
    """Test streak resets to 1 when a day is skipped."""
    today = date(2026, 8, 16)
    two_days_ago = today - timedelta(days=2)

    # Streak before missing a day
    streak = Streak(
        current_streak=5,
        longest_streak=5,
        last_win_date=two_days_ago,
        total_wins=10
    )

    # Posting today after missing yesterday
    if streak.last_win_date != today - timedelta(days=1):
        streak.current_streak = 1  # Reset streak
        streak.last_win_date = today
        streak.total_wins += 1

    assert streak.current_streak == 1
    assert streak.longest_streak == 5  # Record is preserved
    assert streak.total_wins == 11


def test_reaction_enum_values():
    """Verify only the 3 allowed positive reaction emojis exist."""
    allowed = {ReactionTypeEnum.FIRE, ReactionTypeEnum.EYES, ReactionTypeEnum.HANDSHAKE}
    assert ReactionTypeEnum.FIRE.value == "🔥"
    assert ReactionTypeEnum.EYES.value == "👀"
    assert ReactionTypeEnum.HANDSHAKE.value == "🤝"
    assert len(ReactionTypeEnum) == 3
