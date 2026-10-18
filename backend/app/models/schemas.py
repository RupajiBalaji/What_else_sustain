from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


# --- Health ---
class HealthResponse(BaseModel):
    status: str = "ok"


# --- Advisor ---
class AdvisorRequest(BaseModel):
    prompt: Any = None
    lang: str = "en"


class AdvisorResponse(BaseModel):
    answer: Optional[str] = None
    source: str = "offline"
    fallbackNeeded: bool = False
    message: Optional[str] = None


# --- Smoke Simulation ---
class SmokeSimulationRequest(BaseModel):
    acres: float = Field(..., gt=0, description="Field size in acres")
    wind_speed_ms: float = Field(..., ge=0, description="Wind speed in m/s")
    wind_dir_deg: float = Field(..., ge=0, le=360, description="Wind direction in degrees (0=North, 90=East, etc.)")
    distance_to_village_m: float = Field(..., gt=0, description="Distance from burn field to village in meters")
    burn_minutes: float = Field(..., gt=0, description="Duration of burning in minutes")


class SmokeSimulationResponse(BaseModel):
    player_smoke_index: float = Field(..., ge=0, le=100, description="Relative smoke exposure index (0-100) for player")
    village_smoke_index: float = Field(..., ge=0, le=100, description="Relative smoke exposure index (0-100) for village")
    grid: List[List[float]] = Field(..., description="40x40 relative smoke plume dispersion grid (0.0 to 1.0)")
    grid_size: int = 40
    grid_extent_m: float = 2000.0
    disclaimer: str = "Modelled game estimate, not a measured air-quality reading."
    all_params_verified: bool = False


# --- Play Session Tracking ---
class SessionCreateRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=128)
    scenario: str = Field(..., min_length=1, max_length=64)
    choice: str = Field(..., min_length=1, max_length=64)
    smoke_index: Optional[float] = None
    quiz_pre: List[Any] = Field(default_factory=list)
    quiz_post: List[Any] = Field(default_factory=list)
    language: str = Field(default="en", max_length=8)
    ts: Optional[Union[datetime, str]] = None


class SessionResponse(BaseModel):
    status: str = "recorded"
    session_id: str


class StatsResponse(BaseModel):
    total_sessions: int
    scenario_counts: Dict[str, int]
    choice_counts: Dict[str, int]
    language_counts: Dict[str, int]
    avg_quiz_improvement: float
