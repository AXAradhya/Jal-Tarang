from typing import Any, Dict, List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    APP_NAME: str = "SAIL MARINEX"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://sail_marinex:marinex_secure_pass@localhost:5432/sail_marinex_db"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://sail_marinex:marinex_secure_pass@localhost:5432/sail_marinex_db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://:redis_secure_pass@localhost:6379/0"

    # Security & JWT
    JWT_SECRET: str = "sail_marinex_super_secure_jwt_secret_key_change_in_prod_2026_min_32_chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    PASSWORD_HASH_SCHEME: str = "argon2"

    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    SESSION_TIMEOUT_MINUTES: int = 120

    # Data Encryption
    DATA_ENCRYPTION_KEY: str = "marinex_32byte_secret_key_for_db_encryption_!!"


settings = Settings()
