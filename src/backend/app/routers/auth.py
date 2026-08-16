"""Tiny Win — Auth Router.

Endpoints: register, login, refresh, logout, me.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import (
    blocklist_token,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    is_token_blocked,
    verify_password,
)
from ..config import settings
from ..database import get_db
from ..models import User
from ..schemas import AuthResponse, LoginRequest, RefreshRequest, RegisterRequest, UserProfile

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "EMAIL_TAKEN", "message": "Email đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập."}},
        )

    # Check duplicate username
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "USERNAME_TAKEN", "message": "Tên người dùng đã tồn tại."}},
        )

    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
        timezone=body.timezone,
    )
    db.add(user)
    await db.flush()

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))

    return AuthResponse(
        access_token=access,
        refresh_token=refresh,
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfile.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email, User.is_active.is_(True)))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "INVALID_CREDENTIALS", "message": "Email hoặc mật khẩu không đúng."}},
        )

    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))

    return AuthResponse(
        access_token=access,
        refresh_token=refresh,
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfile.model_validate(user),
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expected refresh token.")

    jti = payload.get("jti", "")
    if await is_token_blocked(jti):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked.")

    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id), User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    # Revoke old refresh token
    exp = payload.get("exp", 0)
    from datetime import datetime, timezone as tz

    ttl = max(int(exp - datetime.now(tz.utc).timestamp()), 1)
    await blocklist_token(jti, ttl)

    access = create_access_token(str(user.id))
    new_refresh = create_refresh_token(str(user.id))

    return AuthResponse(
        access_token=access,
        refresh_token=new_refresh,
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfile.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(body: RefreshRequest, _user: User = Depends(get_current_user)):
    payload = decode_token(body.refresh_token)
    jti = payload.get("jti", "")
    exp = payload.get("exp", 0)
    from datetime import datetime, timezone as tz

    ttl = max(int(exp - datetime.now(tz.utc).timestamp()), 1)
    await blocklist_token(jti, ttl)


@router.get("/me", response_model=UserProfile)
async def me(user: User = Depends(get_current_user)):
    return UserProfile.model_validate(user)
