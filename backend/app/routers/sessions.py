from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.schemas import SessionCreateRequest, SessionResponse, StatsResponse
from ..services.session_service import save_game_session, compute_aggregate_stats

router = APIRouter(tags=["Sessions"])


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(body: SessionCreateRequest, db: Session = Depends(get_db)):
    """
    Record anonymous gameplay choices and learning assessment data.
    Strictly forbids names, emails, IP addresses, or personal identifiable info.
    """
    return save_game_session(db, body)


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    """
    Aggregate gameplay metrics and average quiz improvement score.
    """
    return compute_aggregate_stats(db)
