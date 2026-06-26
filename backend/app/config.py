from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    # Local dev defaults to a file-based SQLite DB (no install needed).
    # For production, set DATABASE_URL to a Postgres URL, e.g.
    #   postgresql+asyncpg://dragon:dragon@localhost:5432/dragon
    DATABASE_URL: str = "sqlite+aiosqlite:///./dragon.db"
    REDIS_URL: str = "redis://localhost:6379"
    # When False (default for local dev), caching + refresh-token storage
    # use an in-memory fallback instead of Redis. Set True in production.
    USE_REDIS: bool = False
    SECRET_KEY: str = "change-me-in-production-use-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    APP_ENV: str = "development"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
