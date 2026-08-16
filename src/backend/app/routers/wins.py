"""Tiny Win — Wins Router.

Endpoints: create win, get today's status, get win by ID.
"""

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_db
from ..models import Reaction, User, Win
from ..redis import cache_del, cache_get, cache_set
from ..schemas import CreateWinRequest, TodayWinStatus, WinResponse
from ..services.streak_service import update_streak_after_win
from ..services.timezone_utils import seconds_until_midnight, user_local_date

router = APIRouter(prefix="/wins", tags=["Wins"])


def _win_to_response(win: Win, author: User, my_reaction_type=None) -> WinResponse:
    return WinResponse(
        id=win.id,
        author_id=win.author_id,
        author_username=author.username,
        author_display_name=author.display_name,
        content=win.content,
        date_key=win.date_key,
        created_at=win.created_at,
        my_reaction=my_reaction_type,
    )


@router.post("", response_model=WinResponse, status_code=status.HTTP_201_CREATED)
async def create_win(
    body: CreateWinRequest,
    idempotency_key: uuid.UUID = Header(..., alias="Idempotency-Key"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = body.content.strip()
    if not content or len(content) > 120:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": {"code": "CONTENT_INVALID", "message": "Nội dung phải có từ 1 đến 120 ký tự và không chỉ gồm khoảng trắng."}},
        )

    today = user_local_date(user.timezone)

    # Idempotency check — return existing win if same key
    existing_by_key = await db.execute(select(Win).where(Win.idempotency_key == idempotency_key))
    existing_win = existing_by_key.scalar_one_or_none()
    if existing_win:
        return _win_to_response(existing_win, user)

    # One-win-per-day check
    existing_today = await db.execute(select(Win).where(Win.author_id == user.id, Win.date_key == today))
    if existing_today.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "WIN_ALREADY_EXISTS", "message": "Bạn đã đăng Tiny Win hôm nay rồi. Hẹn gặp lại ngày mai!", "detail": f"date_key={today}"}},
        )

    win = Win(author_id=user.id, content=content, date_key=today, idempotency_key=idempotency_key)
    db.add(win)
    await db.flush()

    # Update streak
    await update_streak_after_win(db, user.id, today)

    # Invalidate caches
    await cache_del(f"today_status:{user.id}")
    await cache_del(f"feed:{user.id}")

    return _win_to_response(win, user)


@router.get("/today", response_model=TodayWinStatus)
async def get_today_status(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = user_local_date(user.timezone)

    # Check cache
    cache_key = f"today_status:{user.id}"
    cached = await cache_get(cache_key)
    if cached:
        return TodayWinStatus(**cached)

    result = await db.execute(select(Win).where(Win.author_id == user.id, Win.date_key == today))
    win = result.scalar_one_or_none()

    resp = TodayWinStatus(
        has_posted_today=win is not None,
        date_key=today,
        win=_win_to_response(win, user) if win else None,
    )

    # Cache until end of user's day
    ttl = seconds_until_midnight(user.timezone)
    await cache_set(cache_key, resp.model_dump(mode="json"), ttl)

    return resp


@router.get("/{win_id}", response_model=WinResponse)
async def get_win(win_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Win).where(Win.id == win_id))
    win = result.scalar_one_or_none()

    if not win:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": "Không tìm thấy tài nguyên yêu cầu."}})

    # Fetch author
    author_result = await db.execute(select(User).where(User.id == win.author_id))
    author = author_result.scalar_one()

    # Get current user's reaction on this win
    reaction_result = await db.execute(select(Reaction).where(Reaction.win_id == win_id, Reaction.user_id == user.id))
    reaction = reaction_result.scalar_one_or_none()

    return _win_to_response(win, author, reaction.type if reaction else None)
