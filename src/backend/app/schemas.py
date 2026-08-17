"""Tiny Win — Pydantic v2 request/response schemas.

Maps to docs/openapi.yaml component schemas.
"""

import uuid
from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


# ── Enums ────────────────────────────────────────────────────────────────────


class ReactionType(str, Enum):
    FIRE = "🔥"
    EYES = "👀"
    HANDSHAKE = "🤝"


# ── Auth ─────────────────────────────────────────────────────────────────────


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30, examples=["hoanganh"])
    email: EmailStr = Field(examples=["hoang@example.com"])
    password: str = Field(min_length=8, examples=["S3cur3P@ss!"])
    timezone: str = Field(examples=["Asia/Ho_Chi_Minh"])
    display_name: str | None = Field(default=None, max_length=50, examples=["Hoàng Anh"])


class LoginRequest(BaseModel):
    email: EmailStr = Field(examples=["hoang@example.com"])
    password: str = Field(examples=["S3cur3P@ss!"])


class RefreshRequest(BaseModel):
    refresh_token: str


class UserProfile(BaseModel):
    id: uuid.UUID
    username: str
    display_name: str | None = None
    timezone: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int  # seconds
    user: UserProfile


# ── Wins ─────────────────────────────────────────────────────────────────────


class CreateWinRequest(BaseModel):
    content: str = Field(min_length=1, max_length=120, examples=["Uống đủ 2L nước hôm nay 💧"])


class WinResponse(BaseModel):
    id: uuid.UUID
    author_id: uuid.UUID
    author_username: str
    author_display_name: str | None = None
    content: str
    date_key: date
    created_at: datetime
    my_reaction: ReactionType | None = None


class TodayWinStatus(BaseModel):
    has_posted_today: bool
    date_key: date
    win: WinResponse | None = None


# ── Reactions ────────────────────────────────────────────────────────────────


class UpsertReactionRequest(BaseModel):
    type: ReactionType


class ReactionResponse(BaseModel):
    win_id: uuid.UUID
    user_id: uuid.UUID
    type: ReactionType | None = None
    updated_at: datetime


# ── Feed ─────────────────────────────────────────────────────────────────────


class FeedMeta(BaseModel):
    total: int
    cursor: str | None = None


class FeedResponse(BaseModel):
    date_key: date
    wins: list[WinResponse]
    meta: FeedMeta


# ── Streaks & Calendar ───────────────────────────────────────────────────────


class StreakResponse(BaseModel):
    user_id: uuid.UUID
    current_streak: int
    longest_streak: int
    total_wins: int
    last_win_date: date | None = None


class CalendarResponse(BaseModel):
    user_id: uuid.UUID
    year: int
    month: int
    days: list[date]


# ── Errors ───────────────────────────────────────────────────────────────────


class ErrorDetail(BaseModel):
    code: str
    message: str
    detail: str | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


# ── Friends & QR/Invite ──────────────────────────────────────────────────────


class InviteTokenResponse(BaseModel):
    token: str
    invite_url: str
    expires_in_seconds: int
    user_id: uuid.UUID
    username: str


class ConnectFriendRequest(BaseModel):
    token: str | None = None
    username: str | None = None


class FriendUser(BaseModel):
    id: uuid.UUID
    username: str
    display_name: str | None = None
    current_streak: int = 0


class FriendResponse(BaseModel):
    friendship_id: uuid.UUID
    friend: FriendUser
    status: str
    created_at: datetime


class FriendListResponse(BaseModel):
    friends: list[FriendResponse]
    total: int

