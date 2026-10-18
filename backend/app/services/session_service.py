import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.database import GameSessionRecord
from ..models.schemas import SessionCreateRequest, SessionResponse, StatsResponse


def save_game_session(db: Session, req: SessionCreateRequest) -> SessionResponse:
    """Store anonymous play data with no personal identifiers."""
    # Parse timestamp if provided
    ts_val = datetime.now(timezone.utc)
    if req.ts:
        if isinstance(req.ts, datetime):
            ts_val = req.ts
        elif isinstance(req.ts, str):
            try:
                ts_val = datetime.fromisoformat(req.ts.replace("Z", "+00:00"))
            except Exception:
                ts_val = datetime.now(timezone.utc)

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
    """
    Compute aggregate counts and average quiz improvement.
    Never exposes individual rows or sensitive details.
    """
    total_sessions = db.query(func.count(GameSessionRecord.id)).scalar() or 0

    # Scenario counts
    scenario_rows = (
        db.query(GameSessionRecord.scenario, func.count(GameSessionRecord.id))
        .group_by(GameSessionRecord.scenario)
        .all()
    )
    scenario_counts = {sc: count for sc, count in scenario_rows}

    # Choice counts
    choice_rows = (
        db.query(GameSessionRecord.choice, func.count(GameSessionRecord.id))
        .group_by(GameSessionRecord.choice)
        .all()
    )
    choice_counts = {ch: count for ch, count in choice_rows}

    # Language counts
    lang_rows = (
        db.query(GameSessionRecord.language, func.count(GameSessionRecord.id))
        .group_by(GameSessionRecord.language)
        .all()
    )
    language_counts = {l: count for l, count in lang_rows}

    # Average quiz improvement
    # Compares sum of correct answers or scores in post vs pre for sessions that have quiz data
    records_with_quiz = (
        db.query(GameSessionRecord)
        .filter(GameSessionRecord.quiz_pre_json != "[]")
        .filter(GameSessionRecord.quiz_post_json != "[]")
        .all()
    )

    improvements = []
    for rec in records_with_quiz:
        try:
            pre = json.loads(rec.quiz_pre_json)
            post = json.loads(rec.quiz_post_json)
            if isinstance(pre, list) and isinstance(post, list) and len(pre) > 0 and len(post) > 0:
                # Calculate numeric sum of answers or truth values
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
