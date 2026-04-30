from pydantic import BaseModel

class IRRBreakdownItem(BaseModel):
    milestone_id: int
    type: str
    bps_earned: int

class IRRCalculateResponse(BaseModel):
    loan_id: int
    base_rate: float
    total_bps: int
    effective_rate: float
    breakdown: list[IRRBreakdownItem]

class IRRSavingsResponse(BaseModel):
    student_id: int
    base_rate: float
    effective_rate: float
    total_bps: int
    savings_inr: float
