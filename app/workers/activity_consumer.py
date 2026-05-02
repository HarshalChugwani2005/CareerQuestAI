import asyncio
import json
import logging
from sqlalchemy import select
from app.db.session import async_session_factory
from app.services.kafka.base import KafkaConsumer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ActivityConsumer(KafkaConsumer):
    def __init__(self):
        super().__init__(group_id="activity-aggregator")

    async def process(self, msg):
        data = json.loads(msg.value().decode('utf-8'))
        student_id = data.get("student_id")
        activity_type = data.get("activity_type")
        source = data.get("details", {}).get("source", "unknown")
        
        if source in ["linkedin", "indeed"] and activity_type == "job_application":
            async with async_session_factory() as db:
                # Increment application count in a TelemetrySession aggregate (simulated here)
                # In real scenario, we'd use Redis or a dedicated table
                # Check if they hit 50
                from app.models.job_application import JobApplication
                from sqlalchemy import func
                count_result = await db.execute(
                    select(func.count(JobApplication.id)).where(JobApplication.student_id == student_id)
                )
                app_count = count_result.scalar() or 0
                
                if app_count >= 50:
                    logger.info(f"Student {student_id} reached 50 apps milestone!")
                    from app.services.kafka.producers import publish_student_milestone
                    await publish_student_milestone(
                        student_id=student_id,
                        milestone_id=0, # Dynamic ID
                        milestone_type="APPLICATIONS_STREAK"
                    )
        
        logger.info(f"Aggregating activity for student {student_id}: {activity_type} from {source}")
        await asyncio.sleep(0.1)

async def main():
    consumer = ActivityConsumer()
    await consumer.subscribe(["student.activity"])
    await consumer.start()

if __name__ == "__main__":
    asyncio.run(main())
