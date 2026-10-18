import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Supports single key or comma-separated list of keys for rotational load-balancing
    # e.g. GEMINI_API_KEY="key1,key2,key3" or GEMINI_API_KEYS="key1,key2"
    GEMINI_API_KEY: str = ""
    GEMINI_API_KEYS: str = ""

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    PORT: int = 8000
    DATABASE_URL: str = "sqlite:///./local.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: Union[str, List[str]]) -> List[str]:
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("[") and value.endswith("]"):
                try:
                    return json.loads(value)
                except Exception:
                    pass
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    def get_gemini_keys(self) -> List[str]:
        """Collects all configured Gemini API keys into a sanitized list."""
        raw_keys: List[str] = []
        if self.GEMINI_API_KEYS:
            raw_keys.extend(self.GEMINI_API_KEYS.split(","))
        if self.GEMINI_API_KEY:
            raw_keys.extend(self.GEMINI_API_KEY.split(","))
        # Strip whitespace, deduplicate while preserving order, remove empty entries
        seen = set()
        clean_keys = []
        for k in raw_keys:
            cleaned = k.strip()
            if cleaned and cleaned not in seen:
                seen.add(cleaned)
                clean_keys.append(cleaned)
        return clean_keys


settings = Settings()
