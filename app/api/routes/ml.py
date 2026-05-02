import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.job_application import JobApplication
from app.models.milestone import Milestone
from app.models.student import Student
from app.models.enums import JobApplicationStatus, MilestoneType
from app.ml.inference import MODEL_VERSION, predict
from app.ml.survival_inference import MODEL_VERSION as SURVIVAL_MODEL_VERSION, predict_curve
from app.models.employability_score import EmployabilityScore
from app.schemas.ml import MLScoreRequest, MLScoreResponse, SHAPContribution
from app.schemas.survival import (
    CohortComparisonResponse,
    SurvivalPoint,
    SurvivalRequest,
    SurvivalResponse
)
from app.services.redis import get_redis
from app.services.kafka.producers import publish_ml_score_result

router = APIRouter(prefix="/ml")

@router.post("/score", response_model=MLScoreResponse)
async def score(payload: MLScoreRequest, db: AsyncSession = Depends(get_db)) -> MLScoreResponse:
    result = predict(payload.model_dump())
    employability_score = int(round(result["placement_probability"] * 100))

    if payload.student_id is not None:
        record = EmployabilityScore(
            student_id=payload.student_id,
            score=employability_score,
            model_version=MODEL_VERSION,
        )
        db.add(record)
        await db.commit()

        # Publish to Kafka
        await publish_ml_score_result(
            student_id=payload.student_id,
            score=float(employability_score),
            details={
                "predicted_salary": result["predicted_salary"],
                "model_version": MODEL_VERSION
            }
        )

    return MLScoreResponse(
        employability_score=employability_score,
        predicted_salary=round(result["predicted_salary"], 2),
        placement_probability=round(result["placement_probability"], 4),
        top_contributions=[SHAPContribution(**item) for item in result["top_contributions"]],
        model_version=MODEL_VERSION,
    )


def course_type_from_course(course: str) -> str:
    value = course.lower()
    if any(keyword in value for keyword in ["computer", "engineering", "data", "science"]):
        return "stem"
    if any(keyword in value for keyword in ["business", "finance", "mba", "bba"]):
        return "business"
    return "arts"


def college_tier_from_name(name: str) -> int:
    value = name.lower()
    if "national" in value or "institute" in value:
        return 1
    if "university" in value:
        return 2
    return 3


def city_demand_from_city(city: str) -> float:
    lookup = {
        "mumbai": 92,
        "bengaluru": 95,
        "delhi": 90,
        "hyderabad": 88,
        "pune": 85,
    }
    return lookup.get(city.lower(), 70)


async def build_student_features(db: AsyncSession, student: Student) -> dict:
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=28)

    apps_result = await db.execute(
        select(JobApplication)
        .where(JobApplication.student_id == student.id)
        .where(JobApplication.applied_at >= month_ago)
    )
    applications = apps_result.scalars().all()
    velocity = len(applications)

    internships = sum(
        1 for app in applications
        if app.status in {JobApplicationStatus.INTERVIEW, JobApplicationStatus.OFFER}
    )

    certs = await db.execute(
        select(Milestone)
        .where(Milestone.student_id == student.id)
        .where(Milestone.type == MilestoneType.CERTIFICATION)
        .where(Milestone.completed_at.is_not(None))
    )
    certifications_count = len(certs.scalars().all())

    github_score = min(100.0, 30 + velocity * 1.2 + certifications_count * 3)

    return {
        "cgpa": student.cgpa,
        "college_tier": college_tier_from_name(student.college),
        "course_type": course_type_from_course(student.course),
        "city_demand_index": city_demand_from_city(student.city),
        "certifications_count": certifications_count,
        "internships": internships,
        "github_score": github_score,
        "application_velocity": velocity,
    }


async def get_student_or_404(db: AsyncSession, student_id: int) -> Student:
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.post("/survival", response_model=SurvivalResponse)
async def survival(payload: SurvivalRequest, db: AsyncSession = Depends(get_db)) -> SurvivalResponse:
    redis = get_redis()
    cache_key = f"survival:{payload.student_id}"
    cached = await redis.get(cache_key)
    if cached:
        await redis.close()
        data = json.loads(cached)
        return SurvivalResponse(**data)

    student = await get_student_or_404(db, payload.student_id)
    features = await build_student_features(db, student)
    result = predict_curve(features)

    response = SurvivalResponse(
        survival_curve=[SurvivalPoint(**item) for item in result["curve"]],
        predicted_placement_week=result["median"],
        confidence_interval=result["confidence"],
        model_version=SURVIVAL_MODEL_VERSION,
    )

    await redis.set(cache_key, response.model_dump_json(), ex=21600)
    await redis.close()
    return response


@router.get("/survival/{student_id}/cohort-comparison", response_model=CohortComparisonResponse)
async def cohort_comparison(student_id: int, db: AsyncSession = Depends(get_db)) -> CohortComparisonResponse:
    redis = get_redis()
    cache_key = f"survival:cohort:{student_id}"
    cached = await redis.get(cache_key)
    if cached:
        await redis.close()
        data = json.loads(cached)
        return CohortComparisonResponse(**data)

    student = await get_student_or_404(db, student_id)
    cohort_students = await db.execute(
        select(Student).where(Student.college == student.college)
    )
    cohort_list = cohort_students.scalars().all()

    if not cohort_list:
        cohort_list = [student]

    feature_list = []
    for item in cohort_list:
        feature_list.append(await build_student_features(db, item))

    avg_features = {}
    for key in feature_list[0].keys():
        values = [item[key] for item in feature_list]
        if isinstance(values[0], str):
            avg_features[key] = max(set(values), key=values.count)
        else:
            avg_features[key] = sum(values) / len(values)

    student_curve = predict_curve(await build_student_features(db, student))
    cohort_curve = predict_curve(avg_features)

    response = CohortComparisonResponse(
        student_curve=[SurvivalPoint(**item) for item in student_curve["curve"]],
        cohort_curve=[SurvivalPoint(**item) for item in cohort_curve["curve"]],
        model_version=SURVIVAL_MODEL_VERSION,
    )

    await redis.set(cache_key, response.model_dump_json(), ex=21600)
    await redis.close()
    return response
