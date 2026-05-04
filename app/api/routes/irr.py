from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, require_lender
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.loan import Loan
from app.models.milestone import Milestone
from app.models.student import Student
from app.models.user import User
from app.models.enums import MilestoneType
from app.schemas.irr import IRRBreakdownItem, IRRCalculateResponse, IRRSavingsResponse
from app.schemas.milestone import MilestoneCreate, MilestoneListResponse, MilestoneRead

router = APIRouter()

DEFAULT_BPS = {
    MilestoneType.CERTIFICATION: 25,
    MilestoneType.APPLICATIONS_STREAK: 15,
    MilestoneType.MOCK_INTERVIEW: 20,
    MilestoneType.OFFER_RECEIVED: 30,
}

MAX_BPS = 150


def ensure_student_access(current_user: User, student: Student) -> None:
    if current_user.role == UserRole.STUDENT and student.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


def calculate_bps(milestones: list[Milestone]) -> int:
    return min(MAX_BPS, sum(item.bps_earned for item in milestones))


@router.post("/milestones", response_model=MilestoneRead)
async def record_milestone(
    payload: MilestoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Milestone:
    student = await db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    ensure_student_access(current_user, student)

    existing = await db.execute(
        select(Milestone)
        .where(Milestone.student_id == payload.student_id)
        .where(Milestone.type == payload.type)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Milestone already recorded")

    bps = payload.bps_earned
    if bps is None:
        bps = DEFAULT_BPS.get(payload.type, 0)

    milestone = Milestone(
        student_id=payload.student_id,
        type=payload.type,
        completed_at=payload.completed_at or datetime.now(timezone.utc),
        bps_earned=bps,
    )
    db.add(milestone)
    await db.commit()
    await db.refresh(milestone)
    return milestone


@router.post("/milestones/verify", response_model=MilestoneRead)
async def verify_milestone(payload: MilestoneCreate, db: AsyncSession = Depends(get_db)) -> Milestone:
    existing = await db.execute(
        select(Milestone)
        .where(Milestone.student_id == payload.student_id)
        .where(Milestone.type == payload.type)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Milestone already recorded")

    bps = payload.bps_earned
    if bps is None:
        bps = DEFAULT_BPS.get(payload.type, 0)

    milestone = Milestone(
        student_id=payload.student_id,
        type=payload.type,
        completed_at=payload.completed_at or datetime.now(timezone.utc),
        bps_earned=bps,
    )
    db.add(milestone)
    await db.commit()
    await db.refresh(milestone)
    return milestone


@router.get("/milestones/{student_id}", response_model=MilestoneListResponse)
async def list_milestones(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> MilestoneListResponse:
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    ensure_student_access(current_user, student)

    result = await db.execute(select(Milestone).where(Milestone.student_id == student_id))
    items = result.scalars().all()
    return MilestoneListResponse(total=len(items), items=[MilestoneRead.model_validate(item) for item in items])


@router.get("/irr/{loan_id}/calculate", response_model=IRRCalculateResponse)
async def irr_calculate(
    loan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> IRRCalculateResponse:
    loan = await db.get(Loan, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    student = await db.get(Student, loan.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    ensure_student_access(current_user, student)

    result = await db.execute(select(Milestone).where(Milestone.student_id == student.id))
    milestones = result.scalars().all()

    total_bps = calculate_bps(milestones)
    base_rate = float(loan.base_interest_rate or loan.interest_rate)
    effective_rate = max(0.0, base_rate - total_bps / 100)

    breakdown = [
        IRRBreakdownItem(
            milestone_id=item.id,
            type=item.type.value,
            bps_earned=item.bps_earned,
        )
        for item in milestones
    ]

    return IRRCalculateResponse(
        loan_id=loan.id,
        base_rate=base_rate,
        total_bps=total_bps,
        effective_rate=effective_rate,
        breakdown=breakdown,
    )


@router.put("/loans/{loan_id}/apply-irr", response_model=IRRCalculateResponse, dependencies=[Depends(require_lender)])
async def apply_irr(
    loan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> IRRCalculateResponse:
    loan = await db.get(Loan, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.lender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    student = await db.get(Student, loan.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    result = await db.execute(select(Milestone).where(Milestone.student_id == student.id))
    milestones = result.scalars().all()

    total_bps = calculate_bps(milestones)
    base_rate = float(loan.base_interest_rate or loan.interest_rate)
    effective_rate = max(0.0, base_rate - total_bps / 100)

    loan.base_interest_rate = base_rate
    loan.interest_rate = effective_rate
    loan.restructure_reason = "irr_applied"
    loan.restructured_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(loan)

    breakdown = [
        IRRBreakdownItem(
            milestone_id=item.id,
            type=item.type.value,
            bps_earned=item.bps_earned,
        )
        for item in milestones
    ]

    return IRRCalculateResponse(
        loan_id=loan.id,
        base_rate=base_rate,
        total_bps=total_bps,
        effective_rate=effective_rate,
        breakdown=breakdown,
    )


@router.get("/irr/{student_id}/savings", response_model=IRRSavingsResponse)
async def irr_savings(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> IRRSavingsResponse:
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    ensure_student_access(current_user, student)

    loan_result = await db.execute(
        select(Loan).where(Loan.student_id == student_id).order_by(Loan.disbursement_date.desc()).limit(1)
    )
    loan = loan_result.scalar_one_or_none()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    result = await db.execute(select(Milestone).where(Milestone.student_id == student.id))
    milestones = result.scalars().all()

    total_bps = calculate_bps(milestones)
    base_rate = float(loan.base_interest_rate or loan.interest_rate)
    effective_rate = max(0.0, base_rate - total_bps / 100)

    tenure_years = loan.tenure_months / 12
    principal = float(loan.amount)
    base_interest = principal * (base_rate / 100) * tenure_years
    effective_interest = principal * (effective_rate / 100) * tenure_years

    return IRRSavingsResponse(
        student_id=student.id,
        base_rate=base_rate,
        effective_rate=effective_rate,
        total_bps=total_bps,
        savings_inr=round(base_interest - effective_interest, 2),
    )
