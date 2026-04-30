from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, require_lender
from app.db.session import get_db
from app.models.employability_score import EmployabilityScore
from app.models.loan import Loan
from app.models.student import Student
from app.models.user import User
from app.schemas.student import (
    StudentCreate,
    StudentListItem,
    StudentListResponse,
    StudentRead,
    StudentSummary,
    StudentUpdate
)

router = APIRouter(prefix="/students")

RISK_LEVELS = {"high", "medium", "low"}


def risk_from_score(score: int | None) -> str | None:
    if score is None:
        return None
    if score < 60:
        return "high"
    if score < 75:
        return "medium"
    return "low"


def latest_score_subquery():
    return (
        select(
            EmployabilityScore.student_id,
            EmployabilityScore.score,
            EmployabilityScore.computed_at,
            EmployabilityScore.model_version,
            func.row_number()
            .over(
                partition_by=EmployabilityScore.student_id,
                order_by=EmployabilityScore.computed_at.desc(),
            )
            .label("rn"),
        )
        .subquery()
    )


@router.get("", response_model=StudentListResponse, dependencies=[Depends(require_lender)])
async def list_students(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    risk_level: str | None = Query(None),
    sort_by: str = Query("id"),
    order: str = Query("desc"),
) -> StudentListResponse:
    if risk_level and risk_level not in RISK_LEVELS:
        raise HTTPException(status_code=400, detail="Invalid risk level")

    score_subq = latest_score_subquery()
    base_query = (
        select(Student, score_subq.c.score)
        .outerjoin(score_subq, (score_subq.c.student_id == Student.id) & (score_subq.c.rn == 1))
    )

    if risk_level:
        if risk_level == "high":
            base_query = base_query.where(score_subq.c.score < 60)
        elif risk_level == "medium":
            base_query = base_query.where(score_subq.c.score.between(60, 74))
        else:
            base_query = base_query.where(score_subq.c.score >= 75)

    if sort_by == "score":
        sort_column = score_subq.c.score
    elif sort_by == "graduation_year":
        sort_column = Student.graduation_year
    else:
        sort_column = Student.id

    if order == "asc":
        base_query = base_query.order_by(sort_column.asc())
    else:
        base_query = base_query.order_by(desc(sort_column))

    count_query = select(func.count()).select_from(Student)
    if risk_level:
        count_query = count_query.outerjoin(
            score_subq,
            (score_subq.c.student_id == Student.id) & (score_subq.c.rn == 1)
        )
        if risk_level == "high":
            count_query = count_query.where(score_subq.c.score < 60)
        elif risk_level == "medium":
            count_query = count_query.where(score_subq.c.score.between(60, 74))
        else:
            count_query = count_query.where(score_subq.c.score >= 75)

    total = await db.scalar(count_query)
    result = await db.execute(base_query.limit(limit).offset(offset))

    items = []
    for student, score in result.all():
        items.append(
            StudentListItem(
                **StudentRead.model_validate(student).model_dump(),
                latest_score=score,
                risk_level=risk_from_score(score),
            )
        )

    return StudentListResponse(total=total or 0, limit=limit, offset=offset, items=items)


@router.post("", response_model=StudentRead)
async def create_student(
    payload: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Student:
    if current_user.role == "student":
        payload_user_id = current_user.id
    else:
        payload_user_id = payload.user_id

    if payload_user_id is None:
        raise HTTPException(status_code=400, detail="user_id is required")

    existing = await db.execute(select(Student).where(Student.user_id == payload_user_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Student profile already exists")

    student = Student(
        user_id=payload_user_id,
        college=payload.college,
        course=payload.course,
        cgpa=payload.cgpa,
        graduation_year=payload.graduation_year,
        city=payload.city,
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


@router.get("/{student_id}", response_model=StudentRead)
async def get_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Student:
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if current_user.role == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return student


@router.put("/{student_id}", response_model=StudentRead)
async def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Student:
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if current_user.role == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(student, field, value)

    await db.commit()
    await db.refresh(student)
    return student


@router.get("/{student_id}/summary", response_model=StudentSummary)
async def student_summary(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StudentSummary:
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if current_user.role == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    score = await db.execute(
        select(EmployabilityScore)
        .where(EmployabilityScore.student_id == student_id)
        .order_by(EmployabilityScore.computed_at.desc())
        .limit(1)
    )
    latest = score.scalar_one_or_none()

    loan_result = await db.execute(
        select(Loan)
        .where(Loan.student_id == student_id)
        .order_by(Loan.disbursement_date.desc())
        .limit(1)
    )
    latest_loan = loan_result.scalar_one_or_none()

    summary = StudentSummary(**StudentRead.model_validate(student).model_dump())
    if latest:
        summary.latest_score = latest.score
        summary.latest_score_at = latest.computed_at.isoformat()
        summary.latest_score_model = latest.model_version
    if latest_loan:
        summary.latest_loan_id = latest_loan.id
        summary.latest_loan_amount = float(latest_loan.amount)
        summary.latest_loan_status = latest_loan.status.value

    return summary
