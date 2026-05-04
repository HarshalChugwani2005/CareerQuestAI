from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, require_lender
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.loan import Loan
from app.models.student import Student
from app.models.user import User
from app.schemas.loan import LoanCreate, LoanRead, LoanRestructureRequest

router = APIRouter(prefix="/loans")


@router.post("", response_model=LoanRead, dependencies=[Depends(require_lender)])
async def create_loan(payload: LoanCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> Loan:
    student = await db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    loan = Loan(
        student_id=payload.student_id,
        lender_id=current_user.id,
        amount=payload.amount,
        interest_rate=payload.interest_rate,
        base_interest_rate=payload.base_interest_rate or payload.interest_rate,
        tenure_months=payload.tenure_months,
        disbursement_date=payload.disbursement_date,
        status=payload.status,
        grace_period_end=payload.grace_period_end,
    )
    db.add(loan)
    await db.commit()
    await db.refresh(loan)
    return loan


@router.get("/{loan_id}", response_model=LoanRead)
async def get_loan(
    loan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Loan:
    loan = await db.get(Loan, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if current_user.role == UserRole.STUDENT:
        student = await db.get(Student, loan.student_id)
        if not student or student.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    elif current_user.role == UserRole.LENDER and loan.lender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    return loan


@router.put("/{loan_id}/restructure", response_model=LoanRead, dependencies=[Depends(require_lender)])
async def restructure_loan(
    loan_id: int,
    payload: LoanRestructureRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Loan:
    loan = await db.get(Loan, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if loan.lender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    if payload.interest_rate is not None:
        loan.interest_rate = payload.interest_rate
    if payload.tenure_months is not None:
        loan.tenure_months = payload.tenure_months
    if payload.grace_period_end is not None:
        loan.grace_period_end = payload.grace_period_end

    loan.restructure_reason = payload.reason
    loan.restructured_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(loan)
    return loan
