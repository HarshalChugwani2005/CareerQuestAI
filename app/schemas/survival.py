from pydantic import BaseModel, Field

class SurvivalRequest(BaseModel):
    student_id: int

class SurvivalPoint(BaseModel):
    week: int
    probability: float

class SurvivalResponse(BaseModel):
    survival_curve: list[SurvivalPoint]
    predicted_placement_week: int | None
    confidence_interval: list[int | None]
    model_version: str

class CohortComparisonResponse(BaseModel):
    student_curve: list[SurvivalPoint]
    cohort_curve: list[SurvivalPoint]
    model_version: str
