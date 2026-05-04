from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ravi"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_audience: str = "ravi"
    jwt_issuer: str = "ravi"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 43200
    reset_token_expire_minutes: int = 30
    cors_allow_origins: List[str] = ["http://localhost:5173"]
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_group_id: str = "ravi-group"
    jwt_exempt_paths: List[str] = [
        "/",
        "/health",
        "/api/health",
        "/docs",
        "/openapi.json",
        "/redoc",
        "/auth/",
        "/milestones/verify",
        "/ml/score",
    ]

@lru_cache
def get_settings() -> Settings:
    return Settings()
