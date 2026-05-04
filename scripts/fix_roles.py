import asyncio
import sys
import os
from sqlalchemy import select, update

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import async_session_factory
from app.models.user import User
from app.models.student import Student
from app.models.loan import Loan
from app.models.enums import UserRole, LoanStatus

async def fix_roles_and_loans():
    async with async_session_factory() as db:
        # 1. Promote harshal@gmail.com to LENDER
        harshal_res = await db.execute(select(User).where(User.email == 'harshal@gmail.com'))
        harshal = harshal_res.scalar_one_or_none()
        if harshal:
            print(f"Promoting {harshal.email} to LENDER")
            harshal.role = UserRole.LENDER
        
        # 2. Assign all student loans to harshal@gmail.com (as the new admin)
        if harshal:
            await db.execute(
                update(Loan)
                .values(lender_id=harshal.id)
            )
            print("Re-assigned all loans to Harshal.")

        # 3. Create student profile for ved@gmail.com if missing
        ved_res = await db.execute(select(User).where(User.email == 'ved@gmail.com'))
        ved = ved_res.scalar_one_or_none()
        if ved:
            ved_student_res = await db.execute(select(Student).where(Student.user_id == ved.id))
            if not ved_student_res.scalar_one_or_none():
                print(f"Creating missing student profile for {ved.email}")
                student = Student(
                    user_id=ved.id,
                    college="VESIT",
                    cgpa=8.5,
                    course="Engineering",
                    graduation_year=2025,
                    city="Mumbai"
                )
                db.add(student)
                await db.flush()
                
                # Create demo loan for Ved
                print(f"Creating demo loan for {ved.email}")
                new_loan = Loan(
                    student_id=student.id,
                    lender_id=harshal.id if harshal else 4,
                    amount=1000000.0,
                    interest_rate=8.5,
                    base_interest_rate=12.0,
                    tenure_months=60,
                    disbursement_date=date.today() if 'date' in globals() else __import__('datetime').date.today(),
                    status=LoanStatus.ACTIVE
                )
                db.add(new_loan)

        await db.commit()
        print("Data correction complete!")

if __name__ == "__main__":
    asyncio.run(fix_roles_and_loans())
