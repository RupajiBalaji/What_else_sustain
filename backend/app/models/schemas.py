from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


# --- Health ---
class HealthResponse(BaseModel):
    status: str = "ok"
    db_type: str = "sqlite"
    db_status: str = "connected"


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


# --- Task P3-02 Session Architecture Schemas ---

class SessionInitRequest(BaseModel):
    session_id: Optional[str] = None
    class_code: Optional[str] = None
    scenario: str = "farm_crop_residue"
    device_class: str = "desktop"
    quality_tier: str = "Medium"


class SessionInitResponse(BaseModel):
    status: str = "created"
    session_id: str
    class_code: Optional[str] = None


class SessionEventCreate(BaseModel):
    event_type: str = Field(..., min_length=1, max_length=64)
    payload: Dict[str, Any] = Field(default_factory=dict)
    ts: Optional[Union[datetime, str]] = None


class SessionEventResponse(BaseModel):
    status: str = "recorded"
    event_id: int
    session_id: str


class QuizAttemptCreate(BaseModel):
    stage: str = Field(..., pattern="^(pre|post)$")
    score: int = Field(..., ge=0)
    total: int = Field(default=5, ge=1)
    duration_ms: int = Field(default=0, ge=0)
    answers: Dict[str, Any] = Field(default_factory=dict)


class QuizAttemptResponse(BaseModel):
    status: str = "recorded"
    attempt_id: int
    session_id: str
    stage: str
    score: int
    total: int


class SessionSummaryResponse(BaseModel):
    session_id: str
    class_code: Optional[str] = None
    scenario: str
    first_choice: Optional[str] = None
    alternatives_tried: List[str] = Field(default_factory=list)
    pre_score: Optional[int] = None
    post_score: Optional[int] = None
    quiz_delta: Optional[int] = None
    rank: Optional[str] = None
    net_balance: int = 0
    duration_sec: float = 0.0
    events_count: int = 0


# --- Task P3-04 & P3-05 Class & Teacher Schemas ---

class ClassCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)


class ClassCreateResponse(BaseModel):
    class_code: str
    name: str
    teacher_token: str
    manage_url: str


class ClassValidateResponse(BaseModel):
    valid: bool
    class_code: str
    name: Optional[str] = None


class ClassDashboardResponse(BaseModel):
    class_code: str
    name: str
    total_players: int
    first_choice_burn_count: int
    first_choice_burn_percentage: float
    alternatives_tried_counts: Dict[str, int]
    avg_quiz_pre: float
    avg_quiz_post: float
    avg_quiz_delta: float
    rank_distribution: Dict[str, int]
    avg_session_time_sec: float
