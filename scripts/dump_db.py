import asyncio
import sys
import os
from sqlalchemy import select

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import async_session_factory
from app.models.user import User
from app.models.student import Student
from app.models.loan import Loan

async def dump_data():
    async with async_session_factory() as db:
        print("--- USERS ---")
        users = await db.execute(select(User))
        for u in users.scalars().all():
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Name: {u.name}")
            
        print("\n--- STUDENTS ---")
        students = await db.execute(select(Student))
        for s in students.scalars().all():
            print(f"ID: {s.id}, UserID: {s.user_id}, College: {s.college}")
            
        print("\n--- LOANS ---")
        loans = await db.execute(select(Loan))
        for l in loans.scalars().all():
            print(f"ID: {l.id}, StudentID: {l.student_id}, LenderID: {l.lender_id}, Status: {l.status}")

if __name__ == "__main__":
    asyncio.run(dump_data())
