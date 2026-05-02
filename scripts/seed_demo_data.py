import asyncio
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.user import User
from app.models.student import Student
from app.models.loan import Loan
from app.core.security import hash_password

async def seed_data():
    async with async_session_factory() as db:
        # Create a Demo Lender
        lender_user = User(
            email="lender@careerquest.ai",
            hashed_password=hash_password("lender123"),
            name="Capital Ventures",
            role="lender"
        )
        db.add(lender_user)
        await db.flush()

        from datetime import date

        # Create Active Alex
        alex_user = User(
            email="alex@careerquest.ai",
            hashed_password=hash_password("alex123"),
            name="Active Alex",
            role="student"
        )
        db.add(alex_user)
        await db.flush()

        alex_student = Student(
            user_id=alex_user.id,
            college="IIT Bombay",
            cgpa=9.2,
            course="Computer Science",
            graduation_year=2025,
            city="Mumbai"
        )
        db.add(alex_student)
        await db.flush()

        alex_loan = Loan(
            student_id=alex_student.id,
            lender_id=lender_user.id,
            amount=500000,
            interest_rate=12.5,
            base_interest_rate=12.5,
            tenure_months=36,
            disbursement_date=date(2023, 9, 1),
            status="active"
        )
        db.add(alex_loan)

        # Create Idle Ian
        ian_user = User(
            email="ian@careerquest.ai",
            hashed_password=hash_password("ian123"),
            name="Idle Ian",
            role="student"
        )
        db.add(ian_user)
        await db.flush()

        ian_student = Student(
            user_id=ian_user.id,
            college="Local College",
            cgpa=6.5,
            course="Mechanical Engineering",
            graduation_year=2024,
            city="Pune"
        )
        db.add(ian_student)
        await db.flush()

        ian_loan = Loan(
            student_id=ian_student.id,
            lender_id=lender_user.id,
            amount=300000,
            interest_rate=14.0,
            base_interest_rate=14.0,
            tenure_months=48,
            disbursement_date=date(2024, 1, 15),
            status="active"
        )
        db.add(ian_loan)

        await db.commit()
        print("Demo data seeded: Active Alex & Idle Ian")

if __name__ == "__main__":
    asyncio.run(seed_data())
