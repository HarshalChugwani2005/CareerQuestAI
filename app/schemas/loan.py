from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import LoanStatus

class LoanCreate(BaseModel):
    student_id: int
    amount: float
    interest_rate: float
    base_interest_rate: float | None = None
    tenure_months: int
    disbursement_date: date
    status: LoanStatus
    grace_period_end: date | None = None

class LoanRead(BaseModel):
    id: int
    student_id: int
    lender_id: int
    amount: float
    interest_rate: float
    base_interest_rate: float | None
    tenure_months: int
    disbursement_date: date
    status: LoanStatus
    grace_period_end: date | None
    restructure_reason: str | None
    restructured_at: datetime | None
    updated_at: datetime | None

    class Config:
        from_attributes = True

class LoanRestructureRequest(BaseModel):
    interest_rate: float | None = Field(default=None, ge=0)
    tenure_months: int | None = Field(default=None, ge=1)
    grace_period_end: date | None = None
    reason: str = Field(..., min_length=4, max_length=255)

class LoanListItem(LoanRead):
    latest_score: int | None = None
    risk_level: str | None = None
    student_name: str | None = None
    student_college: str | None = None

class PortfolioStats(BaseModel):
    total_disbursed: float
    at_risk_count: int
    avg_score: float | None

class PortfolioResponse(BaseModel):
    total: int
    limit: int
    offset: int
    stats: PortfolioStats
    items: list[LoanListItem]
