import json
from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from ..config.settings import settings

# SQLite connection args
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


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


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
