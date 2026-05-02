import json
import asyncio
import logging
from typing import List, Optional, Callable
from confluent_kafka import Producer, Consumer, KafkaError, Message
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class KafkaProducer:
    def __init__(self):
        self.conf = {
            'bootstrap.servers': settings.kafka_bootstrap_servers,
            'client.id': 'ravi-producer'
        }
        self.producer = Producer(self.conf)

    def _delivery_report(self, err, msg):
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.info(f"Message delivered to {msg.topic()} [{msg.partition()}]")

    async def publish(self, topic: str, key: str, value: dict, retries=3):
        """
        Publish a message to Kafka.
        """
        try:
            payload = json.dumps(value).encode('utf-8')
            # produce() is non-blocking
            self.producer.produce(
                topic, 
                key=key, 
                value=payload, 
                callback=self._delivery_report
            )
            # poll() triggers callback execution
            self.producer.poll(0)
        except Exception as e:
            logger.error(f"Error publishing to Kafka topic {topic}: {e}")
            if retries > 0:
                await asyncio.sleep(1)
                await self.publish(topic, key, value, retries - 1)
            else:
                logger.error(f"Failed to publish message to {topic} after retries")

    def flush(self, timeout=10):
        self.producer.flush(timeout)


class KafkaConsumer:
    def __init__(self, group_id: str = None):
        self.conf = {
            'bootstrap.servers': settings.kafka_bootstrap_servers,
            'group.id': group_id or settings.kafka_group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False  # We will commit manually after processing
        }
        self.consumer = Consumer(self.conf)
        self._producer = KafkaProducer() # For DLQ

    async def subscribe(self, topics: List[str]):
        self.consumer.subscribe(topics)

    async def process(self, msg: Message):
        """
        To be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement process()")

    async def handle_fail(self, msg: Message, error: str):
        """
        Send failed message to DLQ.
        """
        dlq_topic = f"{msg.topic()}.dlq"
        payload = {
            "original_topic": msg.topic(),
            "payload": json.loads(msg.value().decode('utf-8')) if msg.value() else None,
            "error": error,
            "key": msg.key().decode('utf-8') if msg.key() else None
        }
        logger.warning(f"Sending message from {msg.topic()} to DLQ: {dlq_topic}")
        await self._producer.publish(dlq_topic, msg.key().decode('utf-8') if msg.key() else "none", payload)

    async def start(self):
        """
        Main consumption loop.
        """
        logger.info(f"Starting consumer for group {self.conf['group.id']}")
        try:
            while True:
                # poll is blocking, but we use a short timeout to keep it responsive
                msg = self.consumer.poll(1.0)
                
                if msg is None:
                    await asyncio.sleep(0.1) # Yield to event loop
                    continue
                
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        logger.error(f"Consumer error: {msg.error()}")
                        continue
                
                try:
                    await self.process(msg)
                    self.consumer.commit(msg)
                except Exception as e:
                    logger.exception(f"Error processing message from {msg.topic()}")
                    await self.handle_fail(msg, str(e))
                    self.consumer.commit(msg) # Commit anyway so we don't get stuck, it's in DLQ now
        except Exception as e:
            logger.error(f"Fatal error in consumer loop: {e}")
        finally:
            self.close()

    def close(self):
        self.consumer.close()
