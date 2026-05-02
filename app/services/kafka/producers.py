from app.services.kafka.base import KafkaProducer
import logging

logger = logging.getLogger(__name__)

# Singleton producer instance
producer = KafkaProducer()

async def publish_student_activity(student_id: int, activity_type: str, details: dict):
    await producer.publish(
        "student.activity",
        key=str(student_id),
        value={
            "student_id": student_id,
            "activity_type": activity_type,
            "details": details
        }
    )

async def publish_student_milestone(student_id: int, milestone_id: int, milestone_type: str):
    await producer.publish(
        "student.milestones",
        key=str(student_id),
        value={
            "student_id": student_id,
            "milestone_id": milestone_id,
            "milestone_type": milestone_type
        }
    )

async def publish_market_signal(signal_id: int, signal_type: str, data: dict):
    await producer.publish(
        "market.signals",
        key=str(signal_id),
        value={
            "signal_id": signal_id,
            "signal_type": signal_type,
            "data": data
        }
    )

async def publish_ml_score_request(student_id: int, features: dict):
    await producer.publish(
        "ml.score.requests",
        key=str(student_id),
        value={
            "student_id": student_id,
            "features": features
        }
    )

async def publish_ml_score_result(student_id: int, score: float, details: dict):
    await producer.publish(
        "ml.score.results",
        key=str(student_id),
        value={
            "student_id": student_id,
            "score": score,
            "details": details
        }
    )

async def publish_alert(alert_type: str, message: str, severity: str):
    await producer.publish(
        "alerts.triggered",
        key=alert_type,
        value={
            "alert_type": alert_type,
            "message": message,
            "severity": severity
        }
    )
