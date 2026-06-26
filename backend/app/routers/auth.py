import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.redis_client import cache_delete, cache_get, cache_set
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)) -> UserResponse:
    # Check for duplicate email
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Check for duplicate username
    result = await db.execute(select(User).where(User.username == body.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    user = User(
        id=uuid.uuid4(),
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        display_name=body.display_name or body.username,
        country=body.country,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token, token_id = create_refresh_token(str(user.id))

    redis_key = f"refresh:{user.id}:{token_id}"
    ttl_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    await cache_set(redis_key, {"user_id": str(user.id), "token_id": token_id}, ttl_seconds)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise JWTError("Not a refresh token")
        user_id: str = payload.get("sub")
        token_id: str = payload.get("jti")
        if not user_id or not token_id:
            raise JWTError("Invalid payload")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    redis_key = f"refresh:{user_id}:{token_id}"
    stored = await cache_get(redis_key)
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked or expired",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )

    # Rotate: delete old refresh token, issue new pair
    await cache_delete(redis_key)
    new_access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token, new_token_id = create_refresh_token(str(user.id))

    new_redis_key = f"refresh:{user.id}:{new_token_id}"
    ttl_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    await cache_set(new_redis_key, {"user_id": str(user.id), "token_id": new_token_id}, ttl_seconds)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(body: RefreshRequest) -> None:
    try:
        payload = decode_token(body.refresh_token)
        user_id = payload.get("sub")
        token_id = payload.get("jti")
        if user_id and token_id:
            redis_key = f"refresh:{user_id}:{token_id}"
            await cache_delete(redis_key)
    except JWTError:
        # Token already invalid — silently succeed
        pass
