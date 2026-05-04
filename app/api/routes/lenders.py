from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_lender
from app.db.session import get_db
from app.models.employability_score import EmployabilityScore
from app.models.loan import Loan
from app.models.student import Student
from app.models.user import User
from app.schemas.loan import LoanListItem, LoanRead, PortfolioResponse, PortfolioStats

router = APIRouter(prefix="/lenders")

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
            func.row_number()
            .over(
                partition_by=EmployabilityScore.student_id,
                order_by=EmployabilityScore.computed_at.desc(),
            )
            .label("rn"),
        )
        .subquery()
    )


@router.get("/{lender_id}/portfolio", response_model=PortfolioResponse, dependencies=[Depends(require_lender)])
async def lender_portfolio(
    lender_id: int,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    risk_level: str | None = Query(None),
    sort_by: str = Query("disbursement_date"),
    order: str = Query("desc"),
    current_user: User = Depends(require_lender)
) -> PortfolioResponse:
    if current_user.id != lender_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if risk_level and risk_level not in RISK_LEVELS:
        raise HTTPException(status_code=400, detail="Invalid risk level")

    score_subq = latest_score_subquery()
    query = (
        select(Loan, score_subq.c.score, Student, User)
        .join(Student, Student.id == Loan.student_id)
        .join(User, User.id == Student.user_id)
        .outerjoin(score_subq, (score_subq.c.student_id == Student.id) & (score_subq.c.rn == 1))
        .where(Loan.lender_id == lender_id)
    )
    conditions = [Loan.lender_id == lender_id]

    if risk_level:
        if risk_level == "high":
            query = query.where(score_subq.c.score < 60)
            conditions.append(score_subq.c.score < 60)
        elif risk_level == "medium":
            query = query.where(score_subq.c.score.between(60, 74))
            conditions.append(score_subq.c.score.between(60, 74))
        else:
            query = query.where(score_subq.c.score >= 75)
            conditions.append(score_subq.c.score >= 75)

    if sort_by == "score":
        sort_column = score_subq.c.score
    elif sort_by == "amount":
        sort_column = Loan.amount
    else:
        sort_column = Loan.disbursement_date

    query = query.order_by(sort_column.asc() if order == "asc" else desc(sort_column))

    total_query = (
        select(func.count())
        .select_from(Loan)
        .join(Student, Student.id == Loan.student_id)
        .outerjoin(score_subq, (score_subq.c.student_id == Student.id) & (score_subq.c.rn == 1))
        .where(*conditions)
    )
    total = await db.scalar(total_query)
    result = await db.execute(query.limit(limit).offset(offset))

    items = []
    scores = []
    at_risk = 0
    total_disbursed = 0.0

    for loan, score, student, student_user in result.all():
        risk_level_value = risk_from_score(score)
        if risk_level_value == "high":
            at_risk += 1
        if score is not None:
            scores.append(score)
        total_disbursed += float(loan.amount)

        items.append(
            LoanListItem(
                **LoanRead.model_validate(loan).model_dump(),
                latest_score=score,
                risk_level=risk_level_value,
                student_name=student_user.name if student_user else None,
                student_college=student.college if student else None,
            )
        )

    avg_score = sum(scores) / len(scores) if scores else None

    stats_query = (
        select(
            func.coalesce(func.sum(Loan.amount), 0),
            func.coalesce(func.sum(case((score_subq.c.score < 60, 1), else_=0)), 0),
            func.avg(score_subq.c.score)
        )
        .select_from(Loan)
        .join(Student, Student.id == Loan.student_id)
        .outerjoin(score_subq, (score_subq.c.student_id == Student.id) & (score_subq.c.rn == 1))
        .where(*conditions)
    )
    totals = await db.execute(stats_query)
    total_disbursed_all, at_risk_all, avg_score_all = totals.one()

    stats = PortfolioStats(
        total_disbursed=float(total_disbursed_all or 0),
        at_risk_count=int(at_risk_all or 0),
        avg_score=float(avg_score_all) if avg_score_all is not None else None
    )

    return PortfolioResponse(
        total=total or 0,
        limit=limit,
        offset=offset,
        stats=stats,
        items=items
    )
