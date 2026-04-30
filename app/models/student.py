from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    college: Mapped[str] = mapped_column(String(200), nullable=False)
    course: Mapped[str] = mapped_column(String(200), nullable=False)
    cgpa: Mapped[float] = mapped_column(Float, nullable=False)
    graduation_year: Mapped[int] = mapped_column(Integer, nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)

    user: Mapped["User"] = relationship(back_populates="student_profile")
    loans: Mapped[list["Loan"]] = relationship(back_populates="student")
    employability_scores: Mapped[list["EmployabilityScore"]] = relationship(back_populates="student")
    milestones: Mapped[list["Milestone"]] = relationship(back_populates="student")
    job_applications: Mapped[list["JobApplication"]] = relationship(back_populates="student")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="student")
    lti_events: Mapped[list["LTIEvent"]] = relationship(back_populates="student")
