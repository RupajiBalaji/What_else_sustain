import csv
import io
import json
import secrets
import string
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from ..models.database import (
    GameSessionRecord,
    SessionRecord,
    SessionEventRecord,
    QuizAttemptRecord,
    ClassRecord
)
from ..models.schemas import (
    SessionCreateRequest,
    SessionResponse,
    StatsResponse,
    SessionInitRequest,
    SessionInitResponse,
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


def generate_class_code() -> str:
    """Generate a clean, unambiguous 6-character uppercase class code."""
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(chars) for _ in range(6))


# ==========================================
# 1. NEW SESSION ENDPOINTS (Task P3-02)
# ==========================================

def init_or_get_session(db: Session, req: SessionInitRequest) -> SessionInitResponse:
    sid = req.session_id or f"wes_{secrets.token_hex(8)}"
    existing = db.query(SessionRecord).filter(SessionRecord.session_id == sid).first()

    code = req.class_code.strip().upper() if req.class_code else None
    if code:
        # Validate class code if supplied
        cls = db.query(ClassRecord).filter(ClassRecord.class_code == code).first()
        if not cls:
            code = None  # Friendly fallback: continue playing without invalid code

    if existing:
        if code and not existing.class_code:
            existing.class_code = code
            db.commit()
        return SessionInitResponse(status="exists", session_id=existing.session_id, class_code=existing.class_code)

    record = SessionRecord(
        session_id=sid,
        class_code=code,
        scenario=req.scenario,
        device_class=req.device_class,
        quality_tier=req.quality_tier
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return SessionInitResponse(status="created", session_id=record.session_id, class_code=record.class_code)


def add_session_event(db: Session, session_id: str, req: SessionEventCreate) -> SessionEventResponse:
    # Ensure session exists or auto-register
    session = db.query(SessionRecord).filter(SessionRecord.session_id == session_id).first()
    if not session:
        session = SessionRecord(session_id=session_id)
        db.add(session)
        db.commit()

    ts_val = datetime.now(timezone.utc)
    if req.ts:
        if isinstance(req.ts, datetime):
            ts_val = req.ts
        elif isinstance(req.ts, str):
            try:
                ts_val = datetime.fromisoformat(req.ts.replace("Z", "+00:00"))
            except Exception:
                pass

    event = SessionEventRecord(
        session_id=session_id,
        event_type=req.event_type,
        payload_json=json.dumps(req.payload),
        ts=ts_val
    )
    db.add(event)

    # Update session top-level denormalized fields if applicable
    if req.event_type == "choice_made":
        choice = req.payload.get("choice")
        if choice and not session.first_choice:
            session.first_choice = choice
    elif req.event_type == "season_completed":
        if "rank" in req.payload:
            session.rank = str(req.payload["rank"])
        if "net_balance" in req.payload:
            try:
                session.net_balance = int(req.payload["net_balance"])
            except Exception:
                pass
        if "duration_sec" in req.payload:
            try:
                session.session_duration_sec = float(req.payload["duration_sec"])
            except Exception:
                pass

    db.commit()
    db.refresh(event)

    return SessionEventResponse(status="recorded", event_id=event.id, session_id=session_id)


def record_quiz_attempt(db: Session, session_id: str, req: QuizAttemptCreate) -> QuizAttemptResponse:
    session = db.query(SessionRecord).filter(SessionRecord.session_id == session_id).first()
    if not session:
        session = SessionRecord(session_id=session_id)
        db.add(session)
        db.commit()

    attempt = QuizAttemptRecord(
        session_id=session_id,
        stage=req.stage,
        score=req.score,
        total=req.total,
        duration_ms=req.duration_ms,
        answers_json=json.dumps(req.answers)
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return QuizAttemptResponse(
        status="recorded",
        attempt_id=attempt.id,
        session_id=session_id,
        stage=attempt.stage,
        score=attempt.score,
        total=attempt.total
    )


def get_session_summary(db: Session, session_id: str) -> SessionSummaryResponse:
    session = db.query(SessionRecord).filter(SessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session {session_id} not found")

    events = db.query(SessionEventRecord).filter(SessionEventRecord.session_id == session_id).order_by(SessionEventRecord.ts.asc()).all()
    alternatives = []
    first_choice = session.first_choice

    for ev in events:
        if ev.event_type == "choice_made":
            c = ev.payload.get("choice")
            if c:
                if not first_choice:
                    first_choice = c
                if c not in ["burn"]:
                    alternatives.append(c)

    # Unique alternatives
    alternatives_tried = list(dict.fromkeys(alternatives))

    # Quiz scores
    pre_attempt = db.query(QuizAttemptRecord).filter(QuizAttemptRecord.session_id == session_id, QuizAttemptRecord.stage == "pre").first()
    post_attempt = db.query(QuizAttemptRecord).filter(QuizAttemptRecord.session_id == session_id, QuizAttemptRecord.stage == "post").first()

    pre_score = pre_attempt.score if pre_attempt else None
    post_score = post_attempt.score if post_attempt else None
    quiz_delta = (post_score - pre_score) if (pre_score is not None and post_score is not None) else None

    return SessionSummaryResponse(
        session_id=session.session_id,
        class_code=session.class_code,
        scenario=session.scenario,
        first_choice=first_choice,
        alternatives_tried=alternatives_tried,
        pre_score=pre_score,
        post_score=post_score,
        quiz_delta=quiz_delta,
        rank=session.rank,
        net_balance=session.net_balance,
        duration_sec=session.session_duration_sec,
        events_count=len(events)
    )


# ==========================================
# 2. CLASS CODE & TEACHER DASHBOARD (Tasks P3-04 & P3-05)
# ==========================================

def create_class(db: Session, req: ClassCreateRequest) -> ClassCreateResponse:
    # Generate unique code
    code = generate_class_code()
    while db.query(ClassRecord).filter(ClassRecord.class_code == code).first():
        code = generate_class_code()

    teacher_token = secrets.token_urlsafe(32)
    cls = ClassRecord(
        class_code=code,
        name=req.name.strip(),
        teacher_token=teacher_token
    )
    db.add(cls)
    db.commit()
    db.refresh(cls)

    return ClassCreateResponse(
        class_code=cls.class_code,
        name=cls.name,
        teacher_token=cls.teacher_token,
        manage_url=f"/teacher?code={cls.class_code}&token={cls.teacher_token}"
    )


def validate_class(db: Session, code: str) -> ClassValidateResponse:
    clean_code = code.strip().upper()
    cls = db.query(ClassRecord).filter(ClassRecord.class_code == clean_code).first()
    if not cls:
        return ClassValidateResponse(valid=False, class_code=clean_code, name=None)
    return ClassValidateResponse(valid=True, class_code=cls.class_code, name=cls.name)


def get_class_dashboard(db: Session, class_code: str, token: str) -> ClassDashboardResponse:
    code = class_code.strip().upper()
    cls = db.query(ClassRecord).filter(ClassRecord.class_code == code).first()
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    if cls.teacher_token != token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid teacher management token")

    sessions = db.query(SessionRecord).filter(SessionRecord.class_code == code).all()
    total_players = len(sessions)

    if total_players == 0:
        return ClassDashboardResponse(
            class_code=code,
            name=cls.name,
            total_players=0,
            first_choice_burn_count=0,
            first_choice_burn_percentage=0.0,
            alternatives_tried_counts={},
            avg_quiz_pre=0.0,
            avg_quiz_post=0.0,
            avg_quiz_delta=0.0,
            rank_distribution={"S": 0, "A": 0, "B": 0, "C": 0},
            avg_session_time_sec=0.0
        )

    burn_count = sum(1 for s in sessions if s.first_choice == "burn")
    burn_pct = round((burn_count / total_players) * 100, 1) if total_players > 0 else 0.0

    session_ids = [s.session_id for s in sessions]
    events = db.query(SessionEventRecord).filter(SessionEventRecord.session_id.in_(session_ids)).all()

    alts_count: Dict[str, int] = {}
    for ev in events:
        if ev.event_type == "choice_made":
            ch = ev.payload.get("choice")
            if ch and ch != "burn":
                alts_count[ch] = alts_count.get(ch, 0) + 1

    # Quiz statistics
    pre_scores = [q.score for q in db.query(QuizAttemptRecord).filter(QuizAttemptRecord.session_id.in_(session_ids), QuizAttemptRecord.stage == "pre").all()]
    post_scores = [q.score for q in db.query(QuizAttemptRecord).filter(QuizAttemptRecord.session_id.in_(session_ids), QuizAttemptRecord.stage == "post").all()]

    avg_pre = round(sum(pre_scores) / len(pre_scores), 2) if pre_scores else 0.0
    avg_post = round(sum(post_scores) / len(post_scores), 2) if post_scores else 0.0
    avg_delta = round(avg_post - avg_pre, 2)

    # Rank distribution
    ranks = {"S": 0, "A": 0, "B": 0, "C": 0}
    for s in sessions:
        if s.rank in ranks:
            ranks[s.rank] += 1
        elif s.rank:
            ranks[s.rank] = ranks.get(s.rank, 0) + 1

    # Duration average
    durations = [s.session_duration_sec for s in sessions if s.session_duration_sec > 0]
    avg_duration = round(sum(durations) / len(durations), 1) if durations else 0.0

    return ClassDashboardResponse(
        class_code=code,
        name=cls.name,
        total_players=total_players,
        first_choice_burn_count=burn_count,
        first_choice_burn_percentage=burn_pct,
        alternatives_tried_counts=alts_count,
        avg_quiz_pre=avg_pre,
        avg_quiz_post=avg_post,
        avg_quiz_delta=avg_delta,
        rank_distribution=ranks,
        avg_session_time_sec=avg_duration
    )


def export_class_csv(db: Session, class_code: str, token: str) -> str:
    code = class_code.strip().upper()
    cls = db.query(ClassRecord).filter(ClassRecord.class_code == code).first()
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    if cls.teacher_token != token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid teacher management token")

    sessions = db.query(SessionRecord).filter(SessionRecord.class_code == code).all()
    session_ids = [s.session_id for s in sessions]

    # Pre-fetch quiz attempts
    quizzes = db.query(QuizAttemptRecord).filter(QuizAttemptRecord.session_id.in_(session_ids)).all()
    pre_map = {q.session_id: q.score for q in quizzes if q.stage == "pre"}
    post_map = {q.session_id: q.score for q in quizzes if q.stage == "post"}

    output = io.StringIO()
    writer = csv.writer(output)

    # Header (Notice: Strictly no personal names or emails per S12 privacy rule)
    writer.writerow([
        "Session ID",
        "Created At",
        "First Choice",
        "Rank",
        "Net Balance (Rupees)",
        "Pre-Quiz Score (out of 5)",
        "Post-Quiz Score (out of 5)",
        "Quiz Score Delta",
        "Duration (seconds)",
        "Device Class",
        "Quality Tier"
    ])

    for s in sessions:
        pre_s = pre_map.get(s.session_id, "")
        post_s = post_map.get(s.session_id, "")
        delta = (post_s - pre_s) if (isinstance(pre_s, int) and isinstance(post_s, int)) else ""
        writer.writerow([
            s.session_id,
            s.created_at.isoformat() if s.created_at else "",
            s.first_choice or "none",
            s.rank or "none",
            s.net_balance,
            pre_s,
            post_s,
            delta,
            round(s.session_duration_sec, 1),
            s.device_class,
            s.quality_tier
        ])

    return output.getvalue()


# ==========================================
# 3. LEGACY ADAPTERS (Maintained for existing frontend)
# ==========================================

def save_game_session(db: Session, req: SessionCreateRequest) -> SessionResponse:
    ts_val = datetime.now(timezone.utc)
    if req.ts:
        if isinstance(req.ts, datetime):
            ts_val = req.ts
        elif isinstance(req.ts, str):
            try:
                ts_val = datetime.fromisoformat(req.ts.replace("Z", "+00:00"))
            except Exception:
                pass

    record = GameSessionRecord(
        session_id=req.session_id,
        scenario=req.scenario,
        choice=req.choice,
        smoke_index=req.smoke_index,
        quiz_pre_json=json.dumps(req.quiz_pre),
        quiz_post_json=json.dumps(req.quiz_post),
        language=req.language,
        ts=ts_val,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return SessionResponse(status="recorded", session_id=record.session_id)


def compute_aggregate_stats(db: Session) -> StatsResponse:
    total_sessions = db.query(func.count(GameSessionRecord.id)).scalar() or 0
    scenario_rows = db.query(GameSessionRecord.scenario, func.count(GameSessionRecord.id)).group_by(GameSessionRecord.scenario).all()
    scenario_counts = {sc: count for sc, count in scenario_rows}

    choice_rows = db.query(GameSessionRecord.choice, func.count(GameSessionRecord.id)).group_by(GameSessionRecord.choice).all()
    choice_counts = {ch: count for ch, count in choice_rows}

    lang_rows = db.query(GameSessionRecord.language, func.count(GameSessionRecord.id)).group_by(GameSessionRecord.language).all()
    language_counts = {l: count for l, count in lang_rows}

    records_with_quiz = db.query(GameSessionRecord).filter(GameSessionRecord.quiz_pre_json != "[]", GameSessionRecord.quiz_post_json != "[]").all()
    improvements = []
    for rec in records_with_quiz:
        try:
            pre = json.loads(rec.quiz_pre_json)
            post = json.loads(rec.quiz_post_json)
            if isinstance(pre, list) and isinstance(post, list) and len(pre) > 0 and len(post) > 0:
                pre_score = sum(1 if item is True else (item if isinstance(item, (int, float)) else 0) for item in pre)
                post_score = sum(1 if item is True else (item if isinstance(item, (int, float)) else 0) for item in post)
                improvements.append(post_score - pre_score)
        except Exception:
            continue

    avg_improvement = round(float(sum(improvements) / len(improvements)), 2) if improvements else 0.0

    return StatsResponse(
        total_sessions=total_sessions,
        scenario_counts=scenario_counts,
        choice_counts=choice_counts,
        language_counts=language_counts,
        avg_quiz_improvement=avg_improvement,
    )
