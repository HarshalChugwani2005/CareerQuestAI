from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.core.security import require_lender
from app.models.kafka_event import KafkaEvent
from app.services.kafka.base import KafkaProducer
import logging

router = APIRouter(prefix="/kafka", tags=["kafka"])
logger = logging.getLogger(__name__)

@router.get("/health", dependencies=[Depends(require_lender)])
async def get_kafka_health(db: AsyncSession = Depends(get_db)):
    producer = KafkaProducer()
    try:
        # Check if we can list topics (basic connectivity test)
        metadata = producer.producer.list_topics(timeout=5.0)
        topics = list(metadata.topics.keys())
        
        # Check DLQ counts from DB (assuming we log them)
        dlq_result = await db.execute(
            select(KafkaEvent.topic, func.count(KafkaEvent.id))
            .where(KafkaEvent.status == "failed")
            .group_by(KafkaEvent.topic)
        )
        dlq_counts = {topic: count for topic, count in dlq_result.all()}
        dlq_count_total = sum(dlq_counts.values())

        return {
            "status": "healthy",
            "topics_count": len(topics),
            "dlq_count_total": dlq_count_total
        }
    except Exception as e:
        logger.error(f"Kafka health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": "Kafka unavailable"
        }
