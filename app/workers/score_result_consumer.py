import asyncio
import json
import logging
from app.db.session import async_session_factory
from app.models.employability_score import EmployabilityScore
from app.services.kafka.base import KafkaConsumer
from app.services.kafka.producers import publish_alert

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

EWS_THRESHOLD = 40

class ScoreResultConsumer(KafkaConsumer):
    def __init__(self):
        super().__init__(group_id="score-result-processor")

    async def process(self, msg):
        data = json.loads(msg.value().decode('utf-8'))
        student_id = data.get("student_id")
        score = data.get("score")
        model_version = data.get("details", {}).get("model_version", "unknown")
        
        logger.info(f"Updating EmployabilityScore for student {student_id}: {score}")
        
        async with async_session_factory() as db:
            record = EmployabilityScore(
                student_id=student_id,
                score=int(score),
                model_version=model_version
            )
            db.add(record)
            
            # EWS Check
            if score < EWS_THRESHOLD:
                logger.warning(f"EWS Triggered for student {student_id}! Score: {score}")
                await publish_alert(
                    alert_type="EWS_TRIGGER",
                    message=f"Student {student_id} has a low employability score: {score}",
                    severity="high"
                )
            
            await db.commit()

async def main():
    consumer = ScoreResultConsumer()
    await consumer.subscribe(["ml.score.results"])
    await consumer.start()

if __name__ == "__main__":
    asyncio.run(main())
