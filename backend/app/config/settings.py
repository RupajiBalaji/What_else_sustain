import json
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Supports single key or comma-separated list of keys for rotational load-balancing
    GEMINI_API_KEY: str = ""
    GEMINI_API_KEYS: str = ""

    # Stored as str to allow any env format (e.g. "*", '["*"]', or comma-separated domains)
    ALLOWED_ORIGINS: Union[str, List[str]] = "*"
    PORT: int = 8000
    DATABASE_URL: str = "sqlite:///./local.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def get_allowed_origins(self) -> List[str]:
        """Safely parses ALLOWED_ORIGINS whether passed as '*', JSON list, or comma-separated."""
        val = self.ALLOWED_ORIGINS
        if isinstance(val, list):
            return val
        if isinstance(val, str):
            val = val.strip()
            if not val or val == "*":
                return ["*"]
            if val.startswith("[") and val.endswith("]"):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [item.strip() for item in val.split(",") if item.strip()]
        return ["*"]

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
