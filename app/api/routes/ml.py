import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.ml.inference import MODEL_VERSION, predict
from app.ml.survival_inference import MODEL_VERSION as SURVIVAL_MODEL_VERSION, predict_curve
from app.models.employability_score import EmployabilityScore
from app.models.student import Student
from app.schemas.ml import MLScoreRequest, MLScoreResponse, SHAPContribution
from app.schemas.survival import (
    CohortComparisonResponse,
    SurvivalPoint,
    SurvivalRequest,
    SurvivalResponse
)
from app.services.kafka.producers import publish_ml_score_result
from app.services.ml_features import build_student_features
from app.services.redis import get_redis

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




async def get_student_or_404(db: AsyncSession, student_id: int) -> Student:
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.post("/survival", response_model=SurvivalResponse)
async def survival(payload: SurvivalRequest, db: AsyncSession = Depends(get_db)) -> SurvivalResponse:
    redis = get_redis()
    cache_key = f"survival:{payload.student_id}"
    cached = None
    try:
        cached = await redis.get(cache_key)
    except Exception:
        cached = None
    if cached:
        try:
            await redis.close()
        except Exception:
            pass
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

    try:
        await redis.set(cache_key, response.model_dump_json(), ex=21600)
    except Exception:
        pass
    try:
        await redis.close()
    except Exception:
        pass
    return response


@router.get("/survival/{student_id}/cohort-comparison", response_model=CohortComparisonResponse)
async def cohort_comparison(student_id: int, db: AsyncSession = Depends(get_db)) -> CohortComparisonResponse:
    redis = get_redis()
    cache_key = f"survival:cohort:{student_id}"
    cached = None
    try:
        cached = await redis.get(cache_key)
    except Exception:
        cached = None
    if cached:
        try:
            await redis.close()
        except Exception:
            pass
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

    try:
        await redis.set(cache_key, response.model_dump_json(), ex=21600)
    except Exception:
        pass
    try:
        await redis.close()
    except Exception:
        pass
    return response
