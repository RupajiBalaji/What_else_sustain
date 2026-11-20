from fastapi import APIRouter, Request
from ..models.schemas import AdvisorRequest, AdvisorResponse
from ..services.advisor_service import ask_advisor

router = APIRouter(tags=["Advisor"])


def get_secure_client_ip(request: Request) -> str:
    """Safely extracts client IP, prioritizing connection socket host over spoofable headers."""
    if request.client and request.client.host:
        return request.client.host.strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[-1]
    return "127.0.0.1"


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
    client_ip = get_secure_client_ip(request)
    return await ask_advisor(body.prompt, lang=body.lang, client_ip=client_ip)
