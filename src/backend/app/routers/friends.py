"""Tiny Win — Friends & QR/Invite Router.

Endpoints:
- POST /friends/invite — Generate shareable invite token & QR link (48h TTL)
- POST /friends/connect — Connect via invite link / QR token / username
- GET  /friends — List connected friends
- DELETE /friends/{friend_id} — Remove a friend
"""

import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import get_current_user
from ..database import get_db
from ..models import Friendship, FriendshipStatusEnum, Streak, User
from ..redis import cache_del, cache_get, cache_set
from ..schemas import (
    ConnectFriendRequest,
    FriendListResponse,
    FriendResponse,
    FriendUser,
    InviteTokenResponse,
)

router = APIRouter(prefix="/friends", tags=["Friends"])

INVITE_TTL_SECONDS = 48 * 3600  # 48 hours


@router.post("/invite", response_model=InviteTokenResponse)
async def create_invite_token(
    user: User = Depends(get_current_user),
):
    """Generate a shareable invite code / QR URL for adding friends."""
    token = secrets.token_urlsafe(12)
    invite_url = f"https://tinywin.app/join/{token}"

    token_data = {
        "user_id": str(user.id),
        "username": user.username,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await cache_set(f"invite:{token}", token_data, ttl_seconds=INVITE_TTL_SECONDS)

    return InviteTokenResponse(
        token=token,
        invite_url=invite_url,
        expires_in_seconds=INVITE_TTL_SECONDS,
        user_id=user.id,
        username=user.username,
    )


@router.post("/connect", response_model=FriendResponse)
async def connect_friend(
    payload: ConnectFriendRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Connect with a friend using an invite token / URL or direct username."""
    target_user_id: uuid.UUID | None = None

    if payload.token:
        # Extract token if full URL was pasted
        raw_token = payload.token.strip()
        if "/join/" in raw_token:
            raw_token = raw_token.split("/join/")[-1].strip().split("?")[0].split("/")[0]

        token_data = await cache_get(f"invite:{raw_token}")
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": {"code": "INVALID_INVITE_TOKEN", "message": "Mã mời kết bạn không hợp lệ hoặc đã hết hạn (48h)."}},
            )
        target_user_id = uuid.UUID(token_data["user_id"])

    elif payload.username:
        clean_username = payload.username.strip().lstrip("@")
        user_query = await db.execute(select(User).where(User.username == clean_username))
        target_user = user_query.scalar_one_or_none()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": {"code": "USER_NOT_FOUND", "message": f"Không tìm thấy người dùng @{clean_username}."}},
            )
        target_user_id = target_user.id
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "MISSING_PARAM", "message": "Cần cung cấp mã mời (token) hoặc username để kết bạn."}},
        )

    if target_user_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "SELF_FRIEND_FORBIDDEN", "message": "Bạn không thể tự kết bạn với chính mình."}},
        )

    # Check target user exists
    target_query = await db.execute(
        select(User).options(selectinload(User.streak)).where(User.id == target_user_id)
    )
    target_user = target_query.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "USER_NOT_FOUND", "message": "Người dùng không tồn tại."}},
        )

    # Check existing friendship
    friendship_query = select(Friendship).where(
        or_(
            (Friendship.requester_id == user.id) & (Friendship.addressee_id == target_user_id),
            (Friendship.requester_id == target_user_id) & (Friendship.addressee_id == user.id),
        )
    )
    res = await db.execute(friendship_query)
    existing = res.scalar_one_or_none()

    if existing:
        if existing.status == FriendshipStatusEnum.BLOCKED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": {"code": "FRIENDSHIP_BLOCKED", "message": "Không thể kết bạn với người dùng này."}},
            )
        if existing.status != FriendshipStatusEnum.ACCEPTED:
            existing.status = FriendshipStatusEnum.ACCEPTED
            await db.commit()
            await db.refresh(existing)
        friendship = existing
    else:
        friendship = Friendship(
            requester_id=user.id,
            addressee_id=target_user_id,
            status=FriendshipStatusEnum.ACCEPTED,
        )
        db.add(friendship)
        await db.commit()
        await db.refresh(friendship)

    # Invalidate feed caches
    await cache_del(f"feed:{user.id}:*")
    await cache_del(f"feed:{target_user_id}:*")

    target_streak = target_user.streak.current_streak if target_user.streak else 0

    return FriendResponse(
        friendship_id=friendship.id,
        friend=FriendUser(
            id=target_user.id,
            username=target_user.username,
            display_name=target_user.display_name,
            current_streak=target_streak,
        ),
        status=friendship.status.value,
        created_at=friendship.created_at or datetime.now(timezone.utc),
    )


@router.get("", response_model=FriendListResponse)
async def list_friends(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all accepted friends."""
    friend_query = select(Friendship).where(
        Friendship.status == FriendshipStatusEnum.ACCEPTED,
        or_(
            Friendship.requester_id == user.id,
            Friendship.addressee_id == user.id,
        ),
    )
    friend_rows = await db.execute(friend_query)
    friendships = friend_rows.scalars().all()

    if not friendships:
        return FriendListResponse(friends=[], total=0)

    # Collect friend user IDs
    friend_ids = [
        f.addressee_id if f.requester_id == user.id else f.requester_id
        for f in friendships
    ]

    users_query = await db.execute(
        select(User).options(selectinload(User.streak)).where(User.id.in_(friend_ids))
    )
    users_map = {u.id: u for u in users_query.scalars().all()}

    results: list[FriendResponse] = []
    for f in friendships:
        target_id = f.addressee_id if f.requester_id == user.id else f.requester_id
        target_u = users_map.get(target_id)
        if target_u:
            results.append(
                FriendResponse(
                    friendship_id=f.id,
                    friend=FriendUser(
                        id=target_u.id,
                        username=target_u.username,
                        display_name=target_u.display_name,
                        current_streak=target_u.streak.current_streak if target_u.streak else 0,
                    ),
                    status=f.status.value,
                    created_at=f.created_at or datetime.now(timezone.utc),
                )
            )

    return FriendListResponse(friends=results, total=len(results))


@router.delete("/{friend_id}")
async def remove_friend(
    friend_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a friend connection."""
    friendship_query = select(Friendship).where(
        or_(
            (Friendship.requester_id == user.id) & (Friendship.addressee_id == friend_id),
            (Friendship.requester_id == friend_id) & (Friendship.addressee_id == user.id),
        )
    )
    res = await db.execute(friendship_query)
    friendship = res.scalar_one_or_none()

    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "FRIENDSHIP_NOT_FOUND", "message": "Không tìm thấy quan hệ bạn bè."}},
        )

    await db.delete(friendship)
    await db.commit()

    # Invalidate feed caches
    await cache_del(f"feed:{user.id}:*")
    await cache_del(f"feed:{friend_id}:*")

    return {"message": "Đã hủy kết bạn thành công."}
