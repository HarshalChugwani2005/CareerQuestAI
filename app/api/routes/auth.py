from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, hash_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    PasswordMessage,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse
)
from app.schemas.user import UserRead, UserUpdate
from app.services import auth as auth_service

router = APIRouter(prefix="/auth")

@router.post("/register", response_model=UserRead)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> User:
    existing = await auth_service.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = await auth_service.create_user(db, payload.name, payload.email, payload.password, payload.role)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    user = await auth_service.authenticate_user(db, payload.email, payload.password)
    tokens = await auth_service.issue_tokens(user)
    return TokenResponse(**tokens)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    user_id = auth_service.decode_refresh_token(payload.refresh_token)
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    tokens = await auth_service.issue_tokens(user)
    return TokenResponse(**tokens)

@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user

@router.put("/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> User:
    if payload.name is not None:
        current_user.name = payload.name
    if payload.email is not None:
        current_user.email = payload.email
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/forgot-password", response_model=PasswordMessage)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)) -> PasswordMessage:
    user = await auth_service.get_user_by_email(db, payload.email)
    if not user:
        return PasswordMessage(detail="If the account exists, a reset link was sent")
    reset_token = auth_service.build_reset_token(user.id)
    return PasswordMessage(detail="Password reset token generated", reset_token=reset_token)

@router.post("/reset-password", response_model=PasswordMessage)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)) -> PasswordMessage:
    user_id = auth_service.decode_reset_token(payload.token)
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.hashed_password = hash_password(payload.new_password)
    await db.commit()
    return PasswordMessage(detail="Password reset successfully")
