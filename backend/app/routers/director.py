from fastapi import APIRouter
from ..models.schemas import ScenarioDirectorRequest, ScenarioDirectorResponse
from ..services.director_service import direct_scenario

router = APIRouter(prefix="/director", tags=["Scenario Director"])


@router.post("/scenario", response_model=ScenarioDirectorResponse)
async def post_scenario_director(req: ScenarioDirectorRequest):
    """
    POST /api/director/scenario
    Section 7.2 AI Scenario Director endpoint with strict schema validation,
    approved reason and hint mappings, and digit-leak post-filter.
    """
    return await direct_scenario(req)
