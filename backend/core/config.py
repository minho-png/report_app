from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Report Analysis API"
    ALLOWED_ORIGINS: List[str] = ["*"]  # Relaxed CORS for local development
    
    # LLM Settings (can be loaded from .env)
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
