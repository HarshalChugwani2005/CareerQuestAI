from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole

class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    email: EmailStr | None = None
