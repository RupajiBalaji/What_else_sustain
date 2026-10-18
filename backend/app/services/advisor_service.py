import time
from typing import Dict, List, Optional
import httpx
from ..config.settings import settings
from ..models.schemas import AdvisorResponse

# In-memory rate limiting: max 10 requests per minute per IP
RATE_LIMIT_WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 10
_rate_limit_map: Dict[str, List[float]] = {}
_key_rotation_index = 0


def get_rotated_gemini_keys() -> List[str]:
    """
    Returns the list of Gemini API keys starting from the current rotation index.
    If multiple free-tier keys are provided, this distributes requests across them
    and allows automatic failover if one key encounters a 429 quota exhaustion.
    """
    global _key_rotation_index
    keys = settings.get_gemini_keys()
    if not keys:
        return []
    
    n = len(keys)
    start = _key_rotation_index % n
    _key_rotation_index = (start + 1) % n
    
    # Return keys starting from current rotated key, followed by the rest
    return [keys[(start + i) % n] for i in range(n)]


def check_rate_limit(client_ip: str) -> bool:
    """Returns True if request is allowed, False if rate limit exceeded."""
    now = time.time()
    timestamps = _rate_limit_map.get(client_ip, [])
    # Filter out timestamps older than the window
    recent = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if len(recent) >= MAX_REQUESTS_PER_WINDOW:
        _rate_limit_map[client_ip] = recent
        return False
    recent.append(now)
    _rate_limit_map[client_ip] = recent
    return True


# Verified Offline Knowledge Base (matches frontend aiOfflineKnowledge.js)
OFFLINE_KNOWLEDGE = [
    {
        "keywords": ["straw", "paddy", "stubble", "harvest", "residue", "burn", "వరి", "గడ్డి", "మొద్దులు", "పొలం"],
        "en": (
            "Here are 3 practical, low-cost options for managing paddy straw without burning:\n\n"
            "1. 🚜 In-Situ Mulching (Happy Seeder)\n"
            "• Approx Cost: ~₹1,200 - ₹1,500 / acre (machine rental/diesel).\n"
            "• Effort: Medium.\n"
            "• Direct-sow the next crop directly through the stubble. Retains 20% soil moisture and saves fertilizer.\n\n"
            "2. 🪱 Bio-Decomposer Spray (Pusa Decomposer)\n"
            "• Approx Cost: ~₹300 - ₹500 / acre.\n"
            "• Effort: Low to Medium.\n"
            "• Dissolve capsules/liquid with jaggery and water. Spray over chopped straw to rot it into organic compost in 20-25 days.\n\n"
            "3. 💰 Sell to Biomass / Paper Mill Aggregator\n"
            "• Approx Cost: ₹0 (Buyer brings baler machine).\n"
            "• Effort: Low.\n"
            "• Earn ~₹1,500 - ₹2,500 / acre cash profit by supplying fuel pellets or eco-paper mills.\n\n"
            "*(Note: Exact costs and custom hiring rental rates vary by district).*"
        ),
        "te": (
            "వరి గడ్డిని కాల్చకుండా నిర్వహించడానికి 3 ఆచరణాత్మక, తక్కువ ఖర్చు మార్గాలు:\n\n"
            "1. 🚜 మల్చింగ్ & హ్యాపీ సీడర్ (నేరుగా విత్తడం)\n"
            "• సుమారు ఖర్చు: ~₹1,200 - ₹1,500 / ఎకరానికి (యంత్ర అద్దె).\n"
            "• శ్రమ: మధ్యస్థం.\n"
            "• గడ్డిని నరికి మట్టిలోనే కలపడం ద్వారా 20% సాగునీరు ఆదా అవుతుంది, తర్వాతి పంటకు ఎరువు ఖర్చు తగ్గుతుంది.\n\n"
            "2. 🪱 బయో-డీకంపోజర్ పిచికారీ (కంపోస్ట్ తయారీ)\n"
            "• సుమారు ఖర్చు: ~₹300 - ₹500 / ఎకరానికి.\n"
            "• శ్రమ: తక్కువ నుండి మధ్యస్థం.\n"
            "• బెల్లం, నీటితో ద్రావణాన్ని కలిపి గడ్డిపై పిచికారీ చేస్తే 20-25 రోజుల్లో నల్లటి సేంద్రీయ ఎరువుగా మారుతుంది.\n\n"
            "3. 💰 బయోమాస్ లేదా పేపర్ మిల్లులకు విక్రయం\n"
            "• సుమారు ఖర్చు: ₹0 (కొనుగోలుదారులే యంత్రం తెస్తారు).\n"
            "• శ్రమ: తక్కువ.\n"
            "• ఎకరానికి ~₹1,500 నుండి ₹2,500 వరకు నికర నగదు లాభం పొందవచ్చు.\n\n"
            "*(గమనిక: యంత్రాల అద్దెలు మరియు ధరలు ప్రాంతాన్ని బట్టి మారవచ్చు).*"
        ),
    },
    {
        "keywords": ["bottle", "plastic", "reuse", "pet", "waste", "బాటిల్", "ప్లాస్టిక్", "పునర్వినియోగం", "వ్యర్థాలు"],
        "en": (
            "Here are 3 low-cost ways to handle plastic bottles at home:\n\n"
            "1. 🌱 Self-Watering Balcony Planters\n"
            "• Approx Cost: ₹0 (Use home scissors & soil).\n"
            "• Effort: Low (5 minutes).\n"
            "• Cut bottle in half, invert top with a cotton wick cord. Grow fresh herbs without daily watering.\n\n"
            "2. ♻️ Flatten & Sell to Scrap Dealer (Kabadiwala)\n"
            "• Approx Cost: ₹0.\n"
            "• Effort: Low.\n"
            "• Rinse, step on bottles to crush flat, collect 1-2 kg in a sack. Earn ₹15 - ₹25 / kg from local recyclers.\n\n"
            "3. 🌾 Drip Irrigation Spikes for Garden / Trees\n"
            "• Approx Cost: ₹0.\n"
            "• Effort: Low.\n"
            "• Poke 2 tiny pinholes near the cap, fill with water, and bury upside down near tree roots for slow root-zone drip.\n\n"
            "*(Note: Scrap market prices depend on local recycling collection centers).*"
        ),
        "te": (
            "ఇంట్లో ప్లాస్టిక్ బాటిళ్లను ఉపయోగకరంగా మార్చడానికి 3 సులభమైన పద్ధతులు:\n\n"
            "1. 🌱 సెల్ఫ్-వాటరింగ్ మొక్కల కుండీలు\n"
            "• సుమారు ఖర్చు: ₹0 (ఇంట్లోని కత్తెర, మట్టి వాడండి).\n"
            "• శ్రమ: తక్కువ (5 నిమిషాలు).\n"
            "• బాటిల్‌ను సగానికి కట్ చేసి, కాటన్ దారంతో అమర్చండి. పుదీనా, కొత్తిమీర మొక్కలను తక్కువ నీటితో సులభంగా పెంచవచ్చు.\n\n"
            "2. ♻️ నలిపి స్క్రాప్ డీలర్‌కు అమ్మడం (కబాడీవాలా)\n"
            "• సుమారు ఖర్చు: ₹0.\n"
            "• శ్రమ: తక్కువ.\n"
            "• బాటిళ్లను కడిగి, తొక్కి చదును చేసి సంచిలో సేకరించండి. కిలోకు ₹15 - ₹25 వరకు నగదు లభిస్తుంది.\n\n"
            "3. 🌾 చెట్లకు బిందు సేద్యం (డ్రిప్ ఇరిగేషన్)\n"
            "• సుమారు ఖర్చు: ₹0.\n"
            "• శ్రమ: తక్కువ.\n"
            "• మూతకు చిన్న రంధ్రం చేసి, నీటితో నింపి చెట్ల వేర్ల వద్ద బోర్లించండి. కొద్దికొద్దిగా నీరు అందుతూ మొక్కలు ఎండకు ఎండిపోవు.\n\n"
            "*(గమనిక: స్క్రాప్ ధరలు స్థానిక మార్కెట్‌ను బట్టి మారవచ్చు).*"
        ),
    },
    {
        "keywords": ["compost", "kitchen", "wet waste", "కంపోస్ట్", "తడి చెత్త", "కూరగాయల వ్యర్థాలు"],
        "en": (
            "Here are 2 simple home composting methods:\n\n"
            "1. 🏺 Earthen Pot / Bucket Compost\n"
            "• Approx Cost: ₹0 - ₹150 (Old bucket or clay pot).\n"
            "• Effort: Low (5 mins daily).\n"
            "• Layer kitchen scraps with dry brown leaves. In 30 days, yields rich black organic plant food.\n\n"
            "2. 🪱 Trench Composting in Garden Bed\n"
            "• Approx Cost: ₹0.\n"
            "• Effort: Low.\n"
            "• Dig a 1-foot trench between plants, bury raw vegetable scraps with soil. Earthworms decompose it underground.\n\n"
            "*(Note: Avoid cooked oily food and meat to prevent odors).*"
        ),
        "te": (
            "ఇంటి వ్యర్థాలతో సులభంగా కంపోస్ట్ చేసే 2 మార్గాలు:\n\n"
            "1. 🏺 పాత బకెట్ లేదా కుండలో కంపోస్ట్\n"
            "• సుమారు ఖర్చు: ₹0 - ₹150.\n"
            "• శ్రమ: తక్కువ (రోజూ 5 నిమిషాలు).\n"
            "• కూరగాయల తొక్కలను, ఎండుటాకులతో పొరలుగా వేసి కొద్దిగా మజ్జిగ లేదా మట్టి చల్లండి. 30 రోజుల్లో నాణ్యమైన సేంద్రీయ ఎరువు తయారవుతుంది.\n\n"
            "2. 🪱 పెరట్లో గుంత కంపోస్టింగ్\n"
            "• సుమారు ఖర్చు: ₹0.\n"
            "• శ్రమ: తక్కువ.\n"
            "• మొక్కల మధ్య 1 అడుగు గుంత తవ్వి తడి చెత్తను వేసి మట్టి కప్పండి. వానపాములు భూమిలోనే సహజ ఎరువుగా మారుస్తాయి.\n\n"
            "*(గమనిక: వాసన రాకుండా ఉండటానికి నూనె పదార్థాలు వేయకండి).*"
        ),
    },
]


def get_offline_fallback_answer(query: str, lang: str = "en") -> str:
    """Retrieve matched answer from offline knowledge base, or default fallback."""
    lower = query.lower()
    for item in OFFLINE_KNOWLEDGE:
        if any(kw.lower() in lower for kw in item["keywords"]):
            return item["te"] if lang == "te" else item["en"]

    if lang == "te":
        return (
            "ఈ ప్రశ్నకు సంబంధించి 2 ముఖ్యమైన సుస్థిర సూచనలు:\n\n"
            "1. 🌱 వ్యర్థాలను వర్గీకరించండి (తడి & పొడి చెత్త)\n"
            "• సుమారు ఖర్చు: ₹0.\n"
            "• శ్రమ: తక్కువ.\n"
            "• సేంద్రీయ వ్యర్థాలను కంపోస్ట్ చేయండి, ప్లాస్టిక్ & లోహాలను స్థానిక స్క్రాప్ డీలర్లకు విక్రయించండి.\n\n"
            "2. 💧 సహజ వనరుల పొదుపు\n"
            "• సుమారు ఖర్చు: ₹0.\n"
            "• శ్రమ: తక్కువ.\n"
            "• నీటి పునర్వినియోగం మరియు విద్యుత్ ఆదా ద్వారా ఖర్చులను తగ్గించుకోవచ్చు.\n\n"
            "*(నిర్దిష్ట వివరాల కోసం మరిన్ని వివరాలతో మీ ప్రశ్నను అడగండి).*"
        )

    return (
        "Here are 2 general low-cost sustainable recommendations:\n\n"
        "1. 🌱 Source Segregation (Wet & Dry Waste)\n"
        "• Approx Cost: ₹0.\n"
        "• Effort: Low.\n"
        "• Turn organic scraps into compost, and separate clean recyclables (PET, paper, glass) for local scrap centers.\n\n"
        "2. 💧 Resource Conservation\n"
        "• Approx Cost: ₹0.\n"
        "• Effort: Low.\n"
        "• Mulch garden soil to save irrigation water and switch to refillable products to avoid single-use packaging.\n\n"
        "*(For detailed guidance, try asking specifically about crop straw, plastic bottles, or composting).*"
    )


async def ask_advisor(prompt: Optional[str], lang: str = "en", client_ip: str = "unknown") -> AdvisorResponse:
    """
    Process question using Gemini server-side or graceful offline fallback.
    Strictly preserves:
    - 300 char validation
    - In-memory rate limiting (max 10 req/min)
    - Zero API key or upstream error leakage
    - System prompt rules
    - English & Telugu support
    """
    # 1. Validation
    if not prompt or not isinstance(prompt, str) or len(prompt.strip()) == 0:
        return AdvisorResponse(
            fallbackNeeded=True,
            source="offline",
            message="Please ask a question about sustainability or waste management.",
            answer=get_offline_fallback_answer("", lang),
        )

    clean_prompt = prompt.strip()
    if len(clean_prompt) > 300:
        return AdvisorResponse(
            fallbackNeeded=True,
            source="offline",
            message="Question exceeds maximum limit of 300 characters. Please shorten it.",
            answer=get_offline_fallback_answer(clean_prompt, lang),
        )

    # 2. Rate limit check
    if not check_rate_limit(client_ip):
        return AdvisorResponse(
            fallbackNeeded=True,
            source="offline",
            message="Rate limit reached (max 10 requests per minute). Serving offline advice.",
            answer=get_offline_fallback_answer(clean_prompt, lang),
        )

    # 3. Check API keys (supports rotational free keys)
    available_keys = get_rotated_gemini_keys()
    if not available_keys:
        return AdvisorResponse(
            fallbackNeeded=True,
            source="offline",
            message="GEMINI_API_KEY is not configured in environment.",
            answer=get_offline_fallback_answer(clean_prompt, "en"),
        )

    # 4. English-only system prompt with rigorous practical sustainability guidance
    system_instruction = (
        'You are "What Else Sustain AI Advisor", an expert assistant helping students, farmers, '
        'and families adopt practical, low-cost sustainable alternatives.\n'
        'RULES:\n'
        '1. Respond strictly in clear, encouraging, friendly English.\n'
        '2. Provide 2 to 3 practical, low-cost options.\n'
        '3. For each option, clearly state:\n'
        '   - Title with an emoji\n'
        '   - Approximate Cost\n'
        '   - Effort Level (Low/Medium/High)\n'
        '   - Brief practical action step\n'
        '4. DATA INTEGRITY: Do NOT invent statistics or exact numbers. Admit uncertainty and label numbers as regional approximations.\n'
        '5. Keep response under 180 words with clean bullet points.'
    )

    payload = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": [
            {"role": "user", "parts": [{"text": f"Question: {clean_prompt}"}]}
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 600,
        },
    }

    # Attempt call with key rotation & automatic failover across free tier keys
    last_error_message = "AI advisor is temporarily unavailable; using offline knowledge base."
    
    for api_key in available_keys:
        gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    gemini_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )

            # If quota exceeded (429) or temporary rate limit, rotate to next key immediately
            if resp.status_code == 429:
                last_error_message = "Free quota exceeded on active key; rotating to backup key..."
                continue

            if resp.status_code != 200:
                continue

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                continue

            parts = candidates[0].get("content", {}).get("parts", [])
            text_response = parts[0].get("text", "") if parts else ""

            if text_response.strip():
                return AdvisorResponse(
                    answer=text_response.strip(),
                    source="gemini",
                    fallbackNeeded=False,
                )

        except Exception:
            # Network timeout or failure with this key; try next key in pool
            continue

    # Fallback if all keys fail or quota exhausted across all keys
    return AdvisorResponse(
        fallbackNeeded=True,
        source="offline",
        message=last_error_message,
        answer=get_offline_fallback_answer(clean_prompt, "en"),
    )
