from pydantic import BaseModel, Field

class StudentCreate(BaseModel):
    user_id: int | None = None
    college: str = Field(..., max_length=200)
    course: str = Field(..., max_length=200)
    cgpa: float
    graduation_year: int
    city: str = Field(..., max_length=120)

class StudentUpdate(BaseModel):
    college: str | None = Field(default=None, max_length=200)
    course: str | None = Field(default=None, max_length=200)
    cgpa: float | None = None
    graduation_year: int | None = None
    city: str | None = Field(default=None, max_length=120)

class StudentRead(BaseModel):
    id: int
    user_id: int
    college: str
    course: str
    cgpa: float
    graduation_year: int
    city: str

    class Config:
        from_attributes = True

class StudentListItem(StudentRead):
    latest_score: int | None = None
    risk_level: str | None = None

class StudentSummary(StudentRead):
    latest_score: int | None = None
    latest_score_at: str | None = None
    latest_score_model: str | None = None
    latest_loan_id: int | None = None
    latest_loan_amount: float | None = None
    latest_loan_status: str | None = None

class StudentListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[StudentListItem]
