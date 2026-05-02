import asyncio
import json
import logging
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.loan import Loan
from app.models.milestone import Milestone
from app.services.kafka.base import KafkaConsumer
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_BPS = 150

def calculate_bps(milestones: list[Milestone]) -> int:
    return min(MAX_BPS, sum(item.bps_earned for item in milestones))

class MilestoneConsumer(KafkaConsumer):
    def __init__(self):
        super().__init__(group_id="milestone-processor")

    async def process(self, msg):
        data = json.loads(msg.value().decode('utf-8'))
        student_id = data.get("student_id")
        
        logger.info(f"Processing milestone for student {student_id}, triggering IRR recalc")
        
        async with async_session_factory() as db:
            # Find active loans for this student
            result = await db.execute(
                select(Loan).where(Loan.student_id == student_id)
            )
            loans = result.scalars().all()
            
            if not loans:
                logger.info(f"No loans found for student {student_id}")
                return
            
            # Get all milestones for bps calculation
            m_result = await db.execute(
                select(Milestone).where(Milestone.student_id == student_id)
            )
            milestones = m_result.scalars().all()
            total_bps = calculate_bps(milestones)
            
            for loan in loans:
                # If this was triggered by a specific milestone, we could check it here.
                # Requirement: trigger 25bps reduction on milestone.
                reduction = 0.25 # 25bps
                
                base_rate = float(loan.base_interest_rate or loan.interest_rate)
                effective_rate = max(0.0, base_rate - reduction)
                
                logger.info(f"Applying 25bps reduction to Loan {loan.id}: {base_rate} -> {effective_rate}")
                loan.base_interest_rate = base_rate
                loan.interest_rate = effective_rate
                loan.restructured_at = datetime.now(timezone.utc)
                loan.restructure_reason = "milestone_25bps_reduction"
            
            await db.commit()

async def main():
    consumer = MilestoneConsumer()
    await consumer.subscribe(["student.milestones"])
    await consumer.start()

if __name__ == "__main__":
    asyncio.run(main())
