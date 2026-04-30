from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import MilestoneType

class MilestoneCreate(BaseModel):
    student_id: int
    type: MilestoneType
    completed_at: datetime | None = None
    bps_earned: int | None = Field(default=None, ge=0, le=150)

class MilestoneRead(BaseModel):
    id: int
    student_id: int
    type: MilestoneType
    completed_at: datetime | None
    bps_earned: int

    class Config:
        from_attributes = True

class MilestoneListResponse(BaseModel):
    total: int
    items: list[MilestoneRead]
