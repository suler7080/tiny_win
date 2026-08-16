"""Tiny Win — Streaks & Calendar Router.

Endpoints: GET /users/{user_id}/streaks, GET /users/{user_id}/calendar.
"""

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, extract, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_db
from ..models import Friendship, FriendshipStatusEnum, Streak, User, Win
from ..redis import cache_get, cache_set
from ..schemas import CalendarResponse, StreakResponse
from ..services.timezone_utils import user_local_date

router = APIRouter(tags=["Streaks & Calendar"])


async def _check_streak_access(target_user_id: uuid.UUID, current_user: User, db: AsyncSession) -> User:
    """Verify that current_user can view target_user's streaks (self or accepted friend)."""
    result = await db.execute(select(User).where(User.id == target_user_id, User.is_active.is_(True)))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": "Không tìm thấy tài nguyên yêu cầu."}})

    if target.id == current_user.id:
        return target

    friend_check = await db.execute(
        select(Friendship).where(
            Friendship.status == FriendshipStatusEnum.ACCEPTED,
            or_(
                and_(Friendship.requester_id == current_user.id, Friendship.addressee_id == target_user_id),
                and_(Friendship.requester_id == target_user_id, Friendship.addressee_id == current_user.id),
            ),
        )
    )
    if not friend_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "FORBIDDEN", "message": "Bạn không có quyền xem thông tin này."}},
        )

    return target


@router.get("/users/{user_id}/streaks", response_model=StreakResponse)
async def get_streaks(
    user_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target = await _check_streak_access(user_id, user, db)

    # Check cache
    cache_key = f"streaks:{user_id}"
    cached = await cache_get(cache_key)
    if cached:
        return StreakResponse(**cached)

    result = await db.execute(select(Streak).where(Streak.user_id == user_id))
    streak = result.scalar_one_or_none()

    resp = StreakResponse(
        user_id=user_id,
        current_streak=streak.current_streak if streak else 0,
        longest_streak=streak.longest_streak if streak else 0,
        total_wins=streak.total_wins if streak else 0,
        last_win_date=streak.last_win_date if streak else None,
    )

    await cache_set(cache_key, resp.model_dump(mode="json"), 300)  # TTL 5 min
    return resp


@router.get("/users/{user_id}/calendar", response_model=CalendarResponse)
async def get_calendar(
    user_id: uuid.UUID,
    year: int | None = Query(None, ge=2024),
    month: int | None = Query(None, ge=1, le=12),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target = await _check_streak_access(user_id, user, db)

    today = user_local_date(target.timezone)
    if year is None:
        year = today.year
    if month is None:
        month = today.month

    cache_key = f"calendar:{user_id}:{year}:{month}"
    cached = await cache_get(cache_key)
    if cached:
        return CalendarResponse(**cached)

    result = await db.execute(
        select(Win.date_key)
        .where(
            Win.author_id == user_id,
            extract("year", Win.date_key) == year,
            extract("month", Win.date_key) == month,
        )
        .order_by(Win.date_key)
    )
    days = [row[0] for row in result.all()]

    resp = CalendarResponse(user_id=user_id, year=year, month=month, days=days)

    await cache_set(cache_key, resp.model_dump(mode="json"), 600)  # TTL 10 min
    return resp
