from typing import Union, Optional, Dict, Any
from fastapi import APIRouter, Depends, status, Response, Query, Request, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.schemas import (
    SessionCreateRequest,
    SessionResponse,
    StatsResponse,
    SessionInitRequest,
    SessionInitResponse,
    SessionUnifiedRequest,
    SessionEventCreate,
    SessionEventResponse,
    QuizAttemptCreate,
    QuizAttemptResponse,
    SessionSummaryResponse,
    ClassCreateRequest,
    ClassCreateResponse,
    ClassValidateResponse,
    ClassDashboardResponse
)
from ..services.session_service import (
    save_game_session,
    compute_aggregate_stats,
    init_or_get_session,
    add_session_event,
    record_quiz_attempt,
    get_session_summary,
    create_class,
    validate_class,
    get_class_dashboard,
    export_class_csv
)

router = APIRouter(tags=["Sessions & Classes"])


# ==========================================
# 1. SESSION LIFECYCLE & TELEMETRY (Task P3-02)
# ==========================================

@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionUnifiedRequest,
    db: Session = Depends(get_db)
):
    """
    Initialize a new play session (Task P3-02) or record legacy gameplay result.
    Strictly forbids names, emails, IP addresses, or personal identifiable info.
    """
    data = body.model_dump(exclude_unset=True)
    if body.choice is not None:
        return save_game_session(db, SessionCreateRequest(**data))
    return init_or_get_session(db, SessionInitRequest(**data))


@router.post("/sessions/{session_id}/events", response_model=SessionEventResponse, status_code=status.HTTP_201_CREATED)
async def post_session_event(
    session_id: str,
    event: SessionEventCreate,
    db: Session = Depends(get_db)
):
    """
    Append an anonymous game event (phase_change, choice_made, rewind_triggered, etc.).
    """
    return add_session_event(db, session_id, event)


@router.post("/sessions/{session_id}/quiz", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
async def post_quiz_attempt(
    session_id: str,
    attempt: QuizAttemptCreate,
    db: Session = Depends(get_db)
):
    """
    Record pre-check or post-check quiz scores and answer mapping.
    """
    return record_quiz_attempt(db, session_id, attempt)


@router.get("/sessions/{session_id}/summary", response_model=SessionSummaryResponse)
async def get_summary(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve session summary, choices made, quiz deltas, and duration.
    """
    return get_session_summary(db, session_id)


# ==========================================
# 2. CLASS CODE & TEACHER DASHBOARD (Tasks P3-04 & P3-05)
# ==========================================

@router.post("/classes", response_model=ClassCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_new_class(
    body: ClassCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new class for a teacher. Returns a unique 6-character code and management token.
    """
    return create_class(db, body)


@router.get("/classes/{class_code}", response_model=ClassValidateResponse)
async def check_class_code(
    class_code: str,
    db: Session = Depends(get_db)
):
    """
    Validate a class code for students before starting a session.
    """
    return validate_class(db, class_code)


@router.get("/classes/{class_code}/dashboard", response_model=ClassDashboardResponse)
async def get_dashboard(
    class_code: str,
    token: str = Query(..., description="Teacher secret management token"),
    db: Session = Depends(get_db)
):
    """
    Retrieve real-time aggregate learning metrics for the teacher dashboard.
    """
    return get_class_dashboard(db, class_code, token)


@router.get("/classes/{class_code}/export.csv")
async def download_csv(
    class_code: str,
    token: str = Query(..., description="Teacher secret management token"),
    db: Session = Depends(get_db)
):
    """
    Export all anonymous class session data as a CSV download.
    """
    csv_data = export_class_csv(db, class_code, token)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=class_{class_code.upper()}_export.csv"
        }
    )


# ==========================================
# 3. GLOBAL AGGREGATE STATS
# ==========================================

@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    """
    Aggregate gameplay metrics across all anonymous sessions.
    """
    return compute_aggregate_stats(db)
