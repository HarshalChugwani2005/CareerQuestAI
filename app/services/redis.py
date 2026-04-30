import redis.asyncio as aioredis

from app.core.config import get_settings

settings = get_settings()

def get_redis():
    return aioredis.from_url(settings.redis_url, decode_responses=True)
