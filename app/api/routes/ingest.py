from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pandas as pd
import io
import time
from typing import List

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentCreate, StudentRead
from app.schemas.ingest import (
    StudentIngestRequest, StudentIngestResponse, 
    BulkIngestResponse, DataQualityReport,
    classify_nirf_tier
)
from app.services.enrichment import (
    enrich_github, enrich_linkedin
)
from app.services.kafka.producers import publish_student_activity

router = APIRouter(prefix="/ingest", tags=["ingest"])

@router.post("/student/manual", response_model=StudentIngestResponse)
async def ingest_manual(
    payload: StudentIngestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_time = time.time()
    
    # Use the authenticated user's ID
    user_id = current_user.id
    
    # Check if student profile already exists
    existing = await db.execute(select(Student).where(Student.user_id == user_id))
    existing_student = existing.scalar_one_or_none()
    
    if existing_student:
        raise HTTPException(status_code=409, detail="Student profile already exists for this user")
    
    # Auto-classify college tier if not provided
    college_tier = payload.college_tier or classify_nirf_tier(payload.college_name)
    
    student = Student(
        user_id=user_id,
        college=payload.college_name,
        cgpa=payload.cgpa,
        course=payload.course,
        graduation_year=payload.graduation_year,
        city=payload.city,
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    
    # Publish to Kafka
    await publish_student_activity(
        student_id=student.id,
        activity_type="profile_creation",
        details={
            "college": student.college,
            "course": student.course,
            "graduation_year": student.graduation_year
        }
    )
    
    # Enrichment
    github_score = await enrich_github(payload.github_url) if payload.github_url else None
    linkedin_data = await enrich_linkedin(payload.linkedin_url) if payload.linkedin_url else None
    
    # Build quality report
    provided = payload.model_dump(exclude_unset=True)
    all_fields = set(payload.model_fields.keys())
    missing = sorted(all_fields - set(provided.keys()))
    completeness = (len(provided) / len(all_fields)) * 100 if all_fields else 100.0
    
    quality = DataQualityReport(
        completeness_pct=round(completeness, 1),
        outliers={},
        missing_fields=missing,
        stats={"cgpa": payload.cgpa, "college_tier": college_tier}
    )
    
    elapsed = (time.time() - start_time) * 1000
    
    return StudentIngestResponse(
        student_id=student.id,
        created=True,
        github_score=github_score,
        linkedin_data=linkedin_data,
        quality_report=quality
    )

@router.post("/student/bulk", response_model=BulkIngestResponse)
async def ingest_bulk(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_time = time.time()
    content = await file.read()
    df = pd.read_csv(io.StringIO(content.decode('utf-8')))
    
    required_cols = {'college_name', 'cgpa', 'course', 'graduation_year', 'city'}
    missing_cols = required_cols - set(df.columns)
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing_cols)}"
        )
    
    valid_rows = 0
    invalid_details = []
    
    for idx, row in df.iterrows():
        try:
            student = Student(
                user_id=current_user.id,
                college=str(row.get('college_name', 'Unknown')),
                cgpa=float(row.get('cgpa', 0.0)),
                course=str(row.get('course', 'Unknown')),
                graduation_year=int(row.get('graduation_year', 2025)),
                city=str(row.get('city', 'Unknown')),
            )
            db.add(student)
            await db.flush() # Get student.id
            
            # Publish to Kafka
            await publish_student_activity(
                student_id=student.id,
                activity_type="bulk_ingestion",
                details={"row": idx}
            )
            
            valid_rows += 1
        except Exception as e:
            invalid_details.append({"row": idx, "error": str(e)})
    
    await db.commit()
    
    elapsed = (time.time() - start_time) * 1000
    
    return BulkIngestResponse(
        total_rows=len(df),
        valid_rows=valid_rows,
        invalid_rows=len(df) - valid_rows,
        invalid_details=invalid_details,
        quality_report=DataQualityReport(
            completeness_pct=100.0,
            outliers={},
            missing_fields=[],
            stats={"rows_processed": len(df)}
        ),
        processing_time_ms=round(elapsed, 2)
    )
