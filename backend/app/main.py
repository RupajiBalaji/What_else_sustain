from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config.settings import settings
from .models.database import init_db
from .routers import (
    health_router,
    advisor_router,
    simulate_router,
    sessions_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    init_db()
    yield


app = FastAPI(
    title="What Else Sustain API",
    description="Backend API for What Else Sustain educational simulation game",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes mounted with /api prefix
app.include_router(health_router, prefix="/api")
app.include_router(advisor_router, prefix="/api")
app.include_router(simulate_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")

# Static frontend serving (dist/) in production if built
# Root is e:\What else sustain\
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DIST_DIR = ROOT_DIR / "dist"

if DIST_DIR.exists() and DIST_DIR.is_dir():
    # Mount assets folder if exists
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # SPA catch-all fallback for non-API routes
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith("api/"):
            return {"error": "Not found"}

        potential_file = DIST_DIR / full_path
        if potential_file.exists() and potential_file.is_file():
            return FileResponse(potential_file)

        index_file = DIST_DIR / "index.html"
        if index_file.exists():
            return FileResponse(index_file)

        return {"status": "ok", "message": "What Else Sustain Backend Active"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=False,
    )
