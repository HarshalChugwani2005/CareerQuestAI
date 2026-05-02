from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base

class EmployabilityScore(Base):
    __tablename__ = "employability_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    computed_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    model_version: Mapped[str] = mapped_column(String(40), nullable=False)

    student: Mapped["Student"] = relationship(back_populates="employability_scores")
