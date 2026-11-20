from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .config.settings import settings
from .models.database import init_db
from .routers import (
    health_router,
    advisor_router,
    simulate_router,
    sessions_router,
    director_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    init_db()
    yield


# Check 10.3: Protect API docs in production mode
is_dev = settings.ENVIRONMENT.lower() == "development"

app = FastAPI(
    title="What Else Sustain API",
    description="Backend API for What Else Sustain educational simulation game",
    version="0.2.0",
    docs_url="/docs" if is_dev else None,
    redoc_url="/redoc" if is_dev else None,
    openapi_url="/openapi.json" if is_dev else None,
    lifespan=lifespan,
)

# Check 10.1: Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# Check 6.2: Restrict CORS to trusted origins, forbid wildcard with credentials
allowed_origins = settings.get_allowed_origins()
allow_creds = "*" not in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_creds,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

# API routes mounted with /api prefix
app.include_router(health_router, prefix="/api")
app.include_router(advisor_router, prefix="/api")
app.include_router(simulate_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(director_router, prefix="/api")

# Static frontend serving (dist/) in production if built
# Root is e:\What else sustain\
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DIST_DIR = ROOT_DIR / "dist"

if DIST_DIR.exists() and DIST_DIR.is_dir():
    # Mount assets folder if exists
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # SPA catch-all fallback with path traversal protection (Check 10.4)
    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"error": "Not found"})

        clean_path = full_path.strip("/")
        # Disallow dotfiles, traversal paths, and sensitive file extensions (Check 10.4)
        FORBIDDEN_EXTS = {".env", ".db", ".sqlite", ".sqlite3", ".sql", ".py", ".yml", ".yaml", ".log", ".bak"}
        if (
            ".." in clean_path
            or clean_path.startswith(".")
            or "/." in clean_path
            or "\\" in clean_path
            or Path(clean_path).suffix.lower() in FORBIDDEN_EXTS
        ):
            return JSONResponse(status_code=403, content={"error": "Forbidden"})

        if clean_path:
            dist_resolved = DIST_DIR.resolve()
            potential_file = (dist_resolved / clean_path).resolve()
            try:
                if potential_file.is_relative_to(dist_resolved) and potential_file.is_file():
                    return FileResponse(potential_file)
            except (ValueError, RuntimeError):
                return JSONResponse(status_code=403, content={"error": "Forbidden"})

        index_file = (DIST_DIR / "index.html").resolve()
        if index_file.exists() and index_file.is_file():
            return FileResponse(index_file)

        return JSONResponse(status_code=200, content={"status": "ok", "message": "What Else Sustain Backend Active"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=False,
    )
