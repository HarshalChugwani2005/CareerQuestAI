import asyncio
import sys
import os
from sqlalchemy import select
from datetime import date

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import async_session_factory
from app.models.user import User
from app.models.student import Student
from app.models.loan import Loan
from app.models.enums import LoanStatus

async def fix_portfolio():
    async with async_session_factory() as db:
        # 1. Find Harshal (the lender)
        lender_result = await db.execute(select(User).where(User.email == 'harshal@gmail.com'))
        harshal = lender_result.scalar_one_or_none()
        
        if not harshal:
            print("Harshal not found!")
            return

        # 2. Find all students without a loan
        # We'll check for all students and see if they have at least one loan
        students_result = await db.execute(select(Student))
        all_students = students_result.scalars().all()
        
        for student in all_students:
            # Check if student already has a loan
            loan_check = await db.execute(select(Loan).where(Loan.student_id == student.id))
            existing_loan = loan_check.scalar_one_or_none()
            
            if not existing_loan:
                print(f"Creating demo loan for student ID {student.id}")
                new_loan = Loan(
                    student_id=student.id,
                    lender_id=harshal.id,
                    amount=1000000.0,
                    interest_rate=8.5,
                    base_interest_rate=12.0,
                    tenure_months=60,
                    disbursement_date=date.today(),
                    status=LoanStatus.ACTIVE
                )
                db.add(new_loan)
        
        await db.commit()
        print("Portfolio sync complete!")

if __name__ == "__main__":
    asyncio.run(fix_portfolio())
