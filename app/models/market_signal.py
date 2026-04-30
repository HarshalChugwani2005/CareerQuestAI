from sqlalchemy import DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from sqlalchemy.sql import func

class MarketSignal(Base):
    __tablename__ = "market_signals"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    skill: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    course_type: Mapped[str | None] = mapped_column(String(50))
    demand_score: Mapped[float] = mapped_column(Float, nullable=False)
    job_count: Mapped[int] = mapped_column(Integer, nullable=False)
    avg_salary: Mapped[float] = mapped_column(Float, nullable=True)
    fetched_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    __table_args__ = (
        UniqueConstraint("skill", "city", "course_type", name="uq_market_skill_city_course"),
    )

