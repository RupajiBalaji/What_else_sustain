from fastapi import APIRouter, Request
from ..models.schemas import ScenarioDirectorRequest, ScenarioDirectorResponse
from ..services.director_service import direct_scenario, get_deterministic_offline_scenario
from ..services.advisor_service import check_rate_limit
from .advisor import get_secure_client_ip

router = APIRouter(prefix="/director", tags=["Scenario Director"])


@router.post("/scenario", response_model=ScenarioDirectorResponse)
async def post_scenario_director(req: ScenarioDirectorRequest, request: Request):
    """
    POST /api/director/scenario
    Section 7.2 AI Scenario Director endpoint with strict schema validation,
    approved reason and hint mappings, rate limiting, and digit-leak post-filter.
    """
    client_ip = get_secure_client_ip(request)
    if not check_rate_limit(client_ip, max_requests=20):
        # Graceful fallback to verified regional defaults if rate limit reached
        return get_deterministic_offline_scenario(req.state, req.crop, req.acres, req.language)

    return await direct_scenario(req)
