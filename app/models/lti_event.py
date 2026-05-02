from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class LTIEvent(Base):
    __tablename__ = "lti_events"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    raw_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    student_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("students.id"))
    course_name: Mapped[str] = mapped_column(String(500), nullable=False)
    grade: Mapped[float | None] = mapped_column(Float)
    completion_date: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    milestone_type: Mapped[str | None] = mapped_column(String(100))
    lms_platform: Mapped[str] = mapped_column(String(50))  # canvas/moodle
    
    student: Mapped["Student"] = relationship(back_populates="lti_events")

