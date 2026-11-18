import json
from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import create_engine, text, Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from ..config.settings import settings

normalized_url = settings.get_database_url()

# Database engine initialization with SQLite / PostgreSQL connection handling
if normalized_url.startswith("sqlite"):
    engine = create_engine(
        normalized_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
else:
    engine = create_engine(
        normalized_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# --- Section 7.1 Core Educational and Analytics Tables ---

class SchoolRecord(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    district = Column(String(128), nullable=True)
    state = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class ClassRecord(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    class_code = Column(String(8), index=True, unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    teacher_token = Column(String(64), index=True, nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class StudentRecord(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(128), index=True, unique=True, nullable=False)
    class_code = Column(String(8), index=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class ScenarioRunRecord(Base):
    __tablename__ = "scenario_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(128), index=True, unique=True, nullable=False)
    session_id = Column(String(128), index=True, nullable=False)
    class_code = Column(String(8), index=True, nullable=True)
    scenario_id = Column(String(64), default="farm_crop_residue", nullable=False)
    first_choice = Column(String(64), nullable=True)
    final_choice = Column(String(64), nullable=True)
    rewind_count = Column(Integer, default=0, nullable=False)
    smoke_exposure = Column(Float, default=0.0, nullable=False)
    net_balance = Column(Integer, default=0, nullable=False)
    metrics_json = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class AggregatedMetricRecord(Base):
    __tablename__ = "aggregated_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_key = Column(String(128), index=True, unique=True, nullable=False)
    metric_value = Column(Float, default=0.0, nullable=False)
    category = Column(String(64), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


# --- Session and Event Tracking Tables ---

class SessionRecord(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(128), index=True, unique=True, nullable=False)
    class_code = Column(String(8), index=True, nullable=True)
    scenario = Column(String(64), default="farm_crop_residue", nullable=False)
    first_choice = Column(String(64), nullable=True)
    device_class = Column(String(32), default="desktop", nullable=False)
    quality_tier = Column(String(16), default="Medium", nullable=False)
    rank = Column(String(8), nullable=True)
    net_balance = Column(Integer, default=0, nullable=False)
    session_duration_sec = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class SessionEventRecord(Base):
    __tablename__ = "session_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(128), index=True, nullable=False)
    event_type = Column(String(64), index=True, nullable=False)
    payload_json = Column(Text, default="{}", nullable=False)
    ts = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def payload(self):
        try:
            return json.loads(self.payload_json)
        except Exception:
            return {}


class QuizAttemptRecord(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(128), index=True, nullable=False)
    stage = Column(String(16), index=True, nullable=False)  # "pre" or "post"
    score = Column(Integer, nullable=False)
    total = Column(Integer, default=5, nullable=False)
    duration_ms = Column(Integer, default=0, nullable=False)
    answers_json = Column(Text, default="{}", nullable=False)
    ts = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def answers(self):
        try:
            return json.loads(self.answers_json)
        except Exception:
            return {}


# Legacy record retained for backwards compatibility with earlier /api/sessions payload
class GameSessionRecord(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(128), index=True, nullable=False)
    scenario = Column(String(64), index=True, nullable=False)
    choice = Column(String(64), index=True, nullable=False)
    smoke_index = Column(Float, nullable=True)
    quiz_pre_json = Column(Text, default="[]", nullable=False)
    quiz_post_json = Column(Text, default="[]", nullable=False)
    language = Column(String(8), default="en", nullable=False)
    ts = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def quiz_pre(self):
        try:
            return json.loads(self.quiz_pre_json)
        except Exception:
            return []

    @property
    def quiz_post(self):
        try:
            return json.loads(self.quiz_post_json)
        except Exception:
            return []


def get_db_info() -> dict:
    """Probes the configured database and returns its driver type and connectivity status."""
    url = settings.get_database_url()
    db_type = "postgres" if url.startswith("postgres") else "sqlite"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"db_type": db_type, "db_status": "connected"}
    except Exception as e:
        return {"db_type": db_type, "db_status": f"error: {str(e)}"}


def init_db():
    """Idempotently ensures all application tables are migrated and present."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
