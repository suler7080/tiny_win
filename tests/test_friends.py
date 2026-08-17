import uuid
import sys
from pathlib import Path
import pytest

# Add backend to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent / "src" / "backend"))

from app.schemas import (
    ConnectFriendRequest,
    FriendListResponse,
    FriendResponse,
    FriendUser,
    InviteTokenResponse,
)


def test_invite_token_schema():
    uid = uuid.uuid4()
    resp = InviteTokenResponse(
        token="abc123token",
        invite_url="https://tinywin.app/join/abc123token",
        expires_in_seconds=172800,
        user_id=uid,
        username="minhthu",
    )
    assert resp.token == "abc123token"
    assert resp.invite_url == "https://tinywin.app/join/abc123token"
    assert resp.expires_in_seconds == 172800
    assert resp.username == "minhthu"


def test_connect_friend_request_schema():
    req_token = ConnectFriendRequest(token="https://tinywin.app/join/token123")
    assert req_token.token == "https://tinywin.app/join/token123"

    req_user = ConnectFriendRequest(username="hoanganh")
    assert req_user.username == "hoanganh"


def test_friend_list_response_schema():
    u_id = uuid.uuid4()
    f_id = uuid.uuid4()
    friend_user = FriendUser(
        id=u_id,
        username="hoanganh",
        display_name="Hoàng Anh",
        current_streak=5,
    )
    friend_resp = FriendResponse(
        friendship_id=f_id,
        friend=friend_user,
        status="accepted",
        created_at="2026-08-17T08:00:00Z",
    )
    list_resp = FriendListResponse(friends=[friend_resp], total=1)
    assert list_resp.total == 1
    assert list_resp.friends[0].friend.username == "hoanganh"
    assert list_resp.friends[0].friend.current_streak == 5
