from fastapi import APIRouter
from ..models.schemas import HealthResponse
from ..models.database import get_db_info

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health():
    """Health check endpoint reporting application and database connectivity status."""
    info = get_db_info()
    return HealthResponse(
        status="ok",
        db_type=info.get("db_type", "sqlite"),
        db_status=info.get("db_status", "connected"),
    )
