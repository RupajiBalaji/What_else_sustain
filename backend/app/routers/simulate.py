from fastapi import APIRouter
from ..models.schemas import SmokeSimulationRequest, SmokeSimulationResponse
from ..services.smoke_service import simulate_smoke_dispersion

router = APIRouter(prefix="/simulate", tags=["Simulation"])


@router.post("/smoke", response_model=SmokeSimulationResponse)
async def post_smoke_simulation(body: SmokeSimulationRequest):
    """
    Gaussian plume smoke dispersion simulation endpoint.
    Computes player and village smoke exposure indices (0-100)
    and returns a 40x40 relative dispersion grid.
    """
    return simulate_smoke_dispersion(body)
