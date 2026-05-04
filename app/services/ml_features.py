from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import JobApplicationStatus, MilestoneType
from app.models.job_application import JobApplication
from app.models.milestone import Milestone
from app.models.student import Student


def course_type_from_course(course: str) -> str:
    value = course.lower()
    if any(keyword in value for keyword in ["computer", "engineering", "data", "science"]):
        return "stem"
    if any(keyword in value for keyword in ["business", "finance", "mba", "bba"]):
        return "business"
    return "arts"


def college_tier_from_name(name: str) -> int:
    value = name.lower()
    if "national" in value or "institute" in value:
        return 1
    if "university" in value:
        return 2
    return 3


def city_demand_from_city(city: str) -> float:
    lookup = {
        "mumbai": 92,
        "bengaluru": 95,
        "delhi": 90,
        "hyderabad": 88,
        "pune": 85,
    }
    return lookup.get(city.lower(), 70)


async def build_student_features(db: AsyncSession, student: Student) -> dict:
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=28)

    apps_result = await db.execute(
        select(JobApplication)
        .where(JobApplication.student_id == student.id)
        .where(JobApplication.applied_at >= month_ago)
    )
    applications = apps_result.scalars().all()
    velocity = len(applications)

    internships = sum(
        1 for app in applications
        if app.status in {JobApplicationStatus.INTERVIEW, JobApplicationStatus.OFFER}
    )

    certs = await db.execute(
        select(Milestone)
        .where(Milestone.student_id == student.id)
        .where(Milestone.type == MilestoneType.CERTIFICATION)
        .where(Milestone.completed_at.is_not(None))
    )
    certifications_count = len(certs.scalars().all())

    github_score = min(100.0, 30 + velocity * 1.2 + certifications_count * 3)

    return {
        "cgpa": student.cgpa,
        "college_tier": college_tier_from_name(student.college),
        "course_type": course_type_from_course(student.course),
        "city_demand_index": city_demand_from_city(student.city),
        "certifications_count": certifications_count,
        "internships": internships,
        "github_score": github_score,
        "application_velocity": velocity,
    }
