from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import date

from app.schemas.student import StudentCreate

class NIRFTierResponse(BaseModel):
    college_name: str
    tier: int  # 1,2,3
    nirf_rank: Optional[int] = None

class GitHubEnrichment(BaseModel):
    repo_count: int
    total_stars: int
    commit_frequency: float  # commits/week
    top_languages: List[str]
    activity_score: float  # 0-100

class LinkedInEnrichment(BaseModel):
    skills_count: int
    connections: Optional[int]
    profile_complete: bool

class DataQualityReport(BaseModel):
    completeness_pct: float
    outliers: Dict[str, List[str]]  # field: [row_indices]
    missing_fields: List[str]
    stats: Dict[str, Any]

class StudentIngestRequest(BaseModel):
    cgpa: float = Field(..., ge=0, le=10.0)
    college_name: str
    college_tier: Optional[int] = Field(None, ge=1, le=3)
    course: str
    graduation_year: int = Field(..., ge=2020, le=2030)
    city: str
    internships_count: int = Field(..., ge=0)
    projects_count: int = Field(..., ge=0)
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None

    @field_validator('github_url')
    @classmethod
    def validate_github(cls, v):
        if v and not v.startswith('https://github.com/'):
            raise ValueError('Valid GitHub URL required')
        return v

    @field_validator('linkedin_url')
    @classmethod
    def validate_linkedin(cls, v):
        if v and not v.startswith('https://linkedin.com/'):
            raise ValueError('Valid LinkedIn URL required')
        return v

class StudentIngestResponse(BaseModel):
    student_id: int
    created: bool
    github_score: Optional[float]
    linkedin_data: Optional[LinkedInEnrichment]
    quality_report: DataQualityReport

class BulkIngestResponse(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    invalid_details: List[Dict[str, Any]]
    quality_report: DataQualityReport
    processing_time_ms: float

# NIRF lookup (top colleges)
NIRF_TIERS = {
    # Tier 1 (NIRF 1-10)
    "iit": 1, "iisc": 1, "iiser": 1, "bits": 1, "vit": 1,
    "iit bombay": 1, "iit delhi": 1, "iit madras": 1,
    
    # Tier 2 (11-50)
    "nit": 2, "dtu": 2, "nsit": 2, "iiit": 2, "manipal": 2,
    
    # Tier 3 (regional)
    "university": 3, "college": 3
}

def classify_nirf_tier(college_name: str) -> int:
    """Auto-classify college tier using NIRF patterns"""
    name_lower = college_name.lower()
    for keyword, tier in NIRF_TIERS.items():
        if keyword in name_lower:
            return tier
    return 3  # default
