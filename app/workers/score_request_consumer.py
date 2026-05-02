import asyncio
import json
import logging
from app.ml.inference import predict
from app.services.kafka.base import KafkaConsumer
from app.services.kafka.producers import publish_ml_score_result

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ScoreRequestConsumer(KafkaConsumer):
    def __init__(self):
        super().__init__(group_id="score-request-processor")

    async def process(self, msg):
        data = json.loads(msg.value().decode('utf-8'))
        student_id = data.get("student_id")
        features = data.get("features", {})
        
        logger.info(f"Processing score request for student {student_id}")
        
        # Run prediction
        result = predict(features)
        
        # Publish result to Kafka
        await publish_ml_score_result(
            student_id=student_id,
            score=float(round(result["placement_probability"] * 100)),
            details={
                "predicted_salary": result["predicted_salary"],
                "model_version": "xgb-1.0.0"
            }
        )

async def main():
    consumer = ScoreRequestConsumer()
    await consumer.subscribe(["ml.score.requests"])
    await consumer.start()

if __name__ == "__main__":
    asyncio.run(main())
