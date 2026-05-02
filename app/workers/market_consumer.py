import asyncio
import json
import logging
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from app.db.session import async_session_factory
from app.models.market_signal import MarketSignal
from app.services.kafka.base import KafkaConsumer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarketConsumer(KafkaConsumer):
    def __init__(self):
        super().__init__(group_id="market-signal-processor")

    async def process(self, msg):
        data = json.loads(msg.value().decode('utf-8'))
        signal_data = data.get("data", {})
        
        logger.info(f"Processing market signal for skill: {signal_data.get('skill')}")
        
        async with async_session_factory() as db:
            stmt = insert(MarketSignal).values(
                skill=signal_data.get("skill"),
                city=signal_data.get("city"),
                course_type=signal_data.get("course_type"),
                demand_score=signal_data.get("demand_score"),
                job_count=signal_data.get("job_count"),
                avg_salary=signal_data.get("avg_salary")
            )
            
            # Upsert on conflict
            stmt = stmt.on_conflict_do_update(
                constraint="uq_market_skill_city_course",
                set_={
                    "demand_score": stmt.excluded.demand_score,
                    "job_count": stmt.excluded.job_count,
                    "avg_salary": stmt.excluded.avg_salary,
                    "fetched_at": MarketSignal.fetched_at # Or func.now()
                }
            )
            
            await db.execute(stmt)
            await db.commit()

async def main():
    consumer = MarketConsumer()
    await consumer.subscribe(["market.signals"])
    await consumer.start()

if __name__ == "__main__":
    asyncio.run(main())
