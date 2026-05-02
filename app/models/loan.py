from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.enums import LoanStatus

class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False)
    lender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    interest_rate: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    base_interest_rate: Mapped[float] = mapped_column(Numeric(5, 2), nullable=True)
    tenure_months: Mapped[int] = mapped_column(Integer, nullable=False)
    disbursement_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[LoanStatus] = mapped_column(Enum(LoanStatus, name="loanstatus"), nullable=False)
    grace_period_end: Mapped[date] = mapped_column(Date, nullable=True)
    restructure_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    restructured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student: Mapped["Student"] = relationship(back_populates="loans")
    lender: Mapped["User"] = relationship(back_populates="loans_given")
