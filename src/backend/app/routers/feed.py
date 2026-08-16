"""Tiny Win — Feed Router.

Endpoint: GET /feed — friend feed with feed-lock enforcement.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_db
from ..models import Friendship, FriendshipStatusEnum, Reaction, User, Win
from ..redis import cache_get, cache_set
from ..schemas import FeedMeta, FeedResponse, WinResponse
from ..services.timezone_utils import user_local_date

router = APIRouter(prefix="/feed", tags=["Feed"])


@router.get("", response_model=FeedResponse)
async def get_feed(
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = user_local_date(user.timezone)

    # Feed Lock: user must have posted today (PRD §4.1, US-C1, Business Rule #10)
    my_win_result = await db.execute(select(Win).where(Win.author_id == user.id, Win.date_key == today))
    if not my_win_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "FEED_LOCKED", "message": "Đăng Tiny Win của bạn hôm nay để mở xem bảng tin bạn bè!"}},
        )

    # Check cache
    cache_key = f"feed:{user.id}:{today}:{cursor}:{limit}"
    cached = await cache_get(cache_key)
    if cached:
        return FeedResponse(**cached)

    # Get accepted friend IDs
    friend_query = select(Friendship).where(
        Friendship.status == FriendshipStatusEnum.ACCEPTED,
        or_(
            Friendship.requester_id == user.id,
            Friendship.addressee_id == user.id,
        ),
    )
    friend_rows = await db.execute(friend_query)
    friend_ids: list[uuid.UUID] = []
    for f in friend_rows.scalars().all():
        friend_ids.append(f.addressee_id if f.requester_id == user.id else f.requester_id)

    if not friend_ids:
        resp = FeedResponse(date_key=today, wins=[], meta=FeedMeta(total=0))
        await cache_set(cache_key, resp.model_dump(mode="json"), 60)
        return resp

    # Fetch friends' wins for today
    wins_query = (
        select(Win)
        .where(Win.author_id.in_(friend_ids), Win.date_key == today)
        .order_by(Win.created_at.desc())
        .limit(limit)
    )
    if cursor:
        wins_query = wins_query.where(Win.id < uuid.UUID(cursor))

    wins_result = await db.execute(wins_query)
    wins = wins_result.scalars().all()

    # Build response with author info and my_reaction
    win_responses: list[WinResponse] = []
    for w in wins:
        author_result = await db.execute(select(User).where(User.id == w.author_id))
        author = author_result.scalar_one()

        reaction_result = await db.execute(select(Reaction).where(Reaction.win_id == w.id, Reaction.user_id == user.id))
        reaction = reaction_result.scalar_one_or_none()

        win_responses.append(
            WinResponse(
                id=w.id,
                author_id=w.author_id,
                author_username=author.username,
                author_display_name=author.display_name,
                content=w.content,
                date_key=w.date_key,
                created_at=w.created_at,
                my_reaction=reaction.type if reaction else None,
            )
        )

    next_cursor = str(wins[-1].id) if len(wins) == limit else None

    resp = FeedResponse(
        date_key=today,
        wins=win_responses,
        meta=FeedMeta(total=len(win_responses), cursor=next_cursor),
    )

    await cache_set(cache_key, resp.model_dump(mode="json"), 60)
    return resp
