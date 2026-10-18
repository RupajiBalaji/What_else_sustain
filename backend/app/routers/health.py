from fastapi import APIRouter
from ..models.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health():
    """Health check endpoint."""
    return HealthResponse(status="ok")
