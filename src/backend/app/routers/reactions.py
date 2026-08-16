"""Tiny Win — Reactions Router.

Endpoints: PUT /wins/{win_id}/reaction, DELETE /wins/{win_id}/reaction.
"""

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user
from ..database import get_db
from ..models import Friendship, FriendshipStatusEnum, Reaction, User, Win
from ..redis import cache_del
from ..schemas import ReactionResponse, UpsertReactionRequest

router = APIRouter(tags=["Reactions"])


async def _verify_win_access(win_id: uuid.UUID, user: User, db: AsyncSession) -> Win:
    """Verify win exists and user is an accepted friend of the author."""
    result = await db.execute(select(Win).where(Win.id == win_id))
    win = result.scalar_one_or_none()
    if not win:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error": {"code": "NOT_FOUND", "message": "Không tìm thấy tài nguyên yêu cầu."}})

    # Cannot react to own win
    if win.author_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "REACTION_FORBIDDEN", "message": "Bạn không thể reaction bài của chính mình."}},
        )

    # Must be accepted friend (check both directions)
    from sqlalchemy import or_, and_

    friend_check = await db.execute(
        select(Friendship).where(
            Friendship.status == FriendshipStatusEnum.ACCEPTED,
            or_(
                and_(Friendship.requester_id == user.id, Friendship.addressee_id == win.author_id),
                and_(Friendship.requester_id == win.author_id, Friendship.addressee_id == user.id),
            ),
        )
    )
    if not friend_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "REACTION_FORBIDDEN", "message": "Bạn chỉ có thể react bài viết của bạn bè."}},
        )

    return win


@router.put("/wins/{win_id}/reaction", response_model=ReactionResponse)
async def upsert_reaction(
    win_id: uuid.UUID,
    body: UpsertReactionRequest,
    idempotency_key: uuid.UUID = Header(..., alias="Idempotency-Key"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    win = await _verify_win_access(win_id, user, db)

    # Upsert: check existing reaction
    result = await db.execute(select(Reaction).where(Reaction.win_id == win_id, Reaction.user_id == user.id))
    reaction = result.scalar_one_or_none()

    if reaction:
        reaction.type = body.type
    else:
        reaction = Reaction(win_id=win_id, user_id=user.id, type=body.type)
        db.add(reaction)

    await db.flush()

    # Invalidate feed cache for the win author
    await cache_del(f"feed:{win.author_id}")

    return ReactionResponse(win_id=win_id, user_id=user.id, type=reaction.type, updated_at=reaction.updated_at)


@router.delete("/wins/{win_id}/reaction", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reaction(
    win_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Reaction).where(Reaction.win_id == win_id, Reaction.user_id == user.id))
    reaction = result.scalar_one_or_none()

    if reaction:
        await db.delete(reaction)
        await cache_del(f"feed:{user.id}")
