from pydantic import BaseModel, Field

class MLScoreRequest(BaseModel):
    student_id: int | None = None
    cgpa: float = Field(..., ge=0, le=10)
    college_tier: int = Field(..., ge=1, le=3)
    course_type: str
    city_demand_index: float = Field(..., ge=0, le=100)
    certifications_count: int = Field(..., ge=0, le=20)
    internships: int = Field(..., ge=0, le=10)
    github_score: float = Field(..., ge=0, le=100)
    application_velocity: int = Field(..., ge=0, le=100)

class SHAPContribution(BaseModel):
    feature: str
    contribution: float

class MLScoreResponse(BaseModel):
    employability_score: int
    predicted_salary: float
    placement_probability: float
    top_contributions: list[SHAPContribution]
    model_version: str
