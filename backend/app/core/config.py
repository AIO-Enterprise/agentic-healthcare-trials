"""
M2: Core Configuration
Owner: Backend Dev 1

Central config loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Marketing Analytics Platform"
    DEBUG: bool = True
    SECRET_KEY: str = "CHANGE-ME-in-production-use-openssl-rand-hex-32"
    
    # JWT
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480   # 8 hours
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./marketing_platform.db"
    
    # Anthropic (direct API — leave blank when using Bedrock)
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"

    # AWS Bedrock (set these to route through Bedrock instead of direct API)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    BEDROCK_MODEL: str = "anthropic.claude-sonnet-4-5"
    USE_BEDROCK: bool = False
    
    # File storage
    UPLOAD_DIR: str = "./uploads"
    OUTPUT_DIR: str = "./outputs"

    class Config:
        env_file = ".env"


settings = Settings()
