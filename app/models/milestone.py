from sqlalchemy import DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import MilestoneType

class Milestone(Base):
    __tablename__ = "milestones"
    __table_args__ = (UniqueConstraint("student_id", "type", name="uq_milestones_student_type"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False)
    type: Mapped[MilestoneType] = mapped_column(Enum(MilestoneType, name="milestonetype"), nullable=False)
    completed_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
    bps_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    student: Mapped["Student"] = relationship(back_populates="milestones")
