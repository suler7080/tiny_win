"""Tiny Win — SQLAlchemy ORM models.

Maps exactly to docs/schema.sql: users, friendships, wins, reactions, streaks.
"""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    CheckConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


# ── Enum types (match schema.sql) ────────────────────────────────────────────


class ReactionTypeEnum(str, enum.Enum):
    FIRE = "🔥"
    EYES = "👀"
    HANDSHAKE = "🤝"


class FriendshipStatusEnum(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"


# ── Users ────────────────────────────────────────────────────────────────────


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(50))
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    wins: Mapped[list["Win"]] = relationship(back_populates="author", cascade="all, delete-orphan")
    streak: Mapped["Streak | None"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("char_length(username) >= 3", name="users_username_length"),
    )


# ── Friendships ──────────────────────────────────────────────────────────────


class Friendship(Base):
    __tablename__ = "friendships"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    addressee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[FriendshipStatusEnum] = mapped_column(Enum(FriendshipStatusEnum, name="friendship_status"), nullable=False, default=FriendshipStatusEnum.PENDING)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("requester_id", "addressee_id", name="friendships_unique_pair"),
        CheckConstraint("requester_id <> addressee_id", name="friendships_no_self_ref"),
    )


# ── Wins ─────────────────────────────────────────────────────────────────────


class Win(Base):
    __tablename__ = "wins"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(String(120), nullable=False)
    date_key: Mapped[date] = mapped_column(Date, nullable=False)
    idempotency_key: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    author: Mapped["User"] = relationship(back_populates="wins")
    reactions: Mapped[list["Reaction"]] = relationship(back_populates="win", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("author_id", "date_key", name="wins_one_per_day"),
        UniqueConstraint("idempotency_key", name="wins_idempotency_unique"),
        CheckConstraint("char_length(trim(content)) >= 1", name="wins_content_not_blank"),
        CheckConstraint("char_length(trim(content)) <= 120", name="wins_content_max_len"),
    )


# ── Reactions ────────────────────────────────────────────────────────────────


class Reaction(Base):
    __tablename__ = "reactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    win_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("wins.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[ReactionTypeEnum] = mapped_column(Enum(ReactionTypeEnum, name="reaction_type"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    win: Mapped["Win"] = relationship(back_populates="reactions")

    __table_args__ = (
        UniqueConstraint("win_id", "user_id", name="reactions_unique_user_win"),
    )


# ── Streaks ──────────────────────────────────────────────────────────────────


class Streak(Base):
    __tablename__ = "streaks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    longest_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_win_date: Mapped[date | None] = mapped_column(Date)
    total_wins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="streak")

    __table_args__ = (
        CheckConstraint("current_streak >= 0", name="streaks_current_gte_zero"),
        CheckConstraint("longest_streak >= 0", name="streaks_longest_gte_zero"),
        CheckConstraint("longest_streak >= current_streak", name="streaks_longest_gte_cur"),
    )
