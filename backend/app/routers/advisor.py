from fastapi import APIRouter, Request
from ..models.schemas import AdvisorRequest, AdvisorResponse
from ..services.advisor_service import ask_advisor

router = APIRouter(tags=["Advisor"])


@router.post("/advisor", response_model=AdvisorResponse)
async def post_advisor(request: Request, body: AdvisorRequest):
    """
    Ask What Else AI Advisor endpoint.
    Ports and preserves logic from api/ask-advisor.js:
    - Rejects empty, non-string, or >300-char prompts with fallbackNeeded=True
    - Enforces 10 requests/min per IP rate limiting
    - Calls Gemini with server-side env key
    - Never exposes API keys or raw upstream error details
    - Falls back gracefully to verified offline knowledge base
    """
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = (
        (forwarded.split(",")[0] if forwarded else None)
        or request.headers.get("x-real-ip")
        or (request.client.host if request.client else "unknown")
    ).strip()

    return await ask_advisor(body.prompt, lang=body.lang, client_ip=client_ip)
