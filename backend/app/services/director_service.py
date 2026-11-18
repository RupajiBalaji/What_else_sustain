import json
import re
import time
from typing import Dict, List, Optional
import httpx

from ..config.settings import settings
from ..models.schemas import ScenarioDirectorRequest, ScenarioDirectorResponse
from .advisor_service import get_rotated_gemini_keys

APPROVED_REASON_IDS = [
    "short_window",
    "high_labor_cost",
    "no_machinery",
    "traditional_habit",
]

APPROVED_HINT_IDS = [
    "hint_soil_moisture",
    "hint_baling_income",
    "hint_decomposer_spray",
    "hint_happy_seeder",
]

APPROVED_EVENT_IDS = [
    "early_frost",
    "diesel_hike",
    "subsidy_active",
    "air_quality_alert",
]

APPROVED_OPTION_KEYS = [
    "happy_seeder",
    "bale_sell",
    "mulch",
    "bio_decomposer",
]

# Regional village names and localized hints based on sourced agronomic facts
REGIONAL_DEFAULTS = {
    "Punjab": {
        "villageName": "Rupnagar",
        "introStory": {
            "en": "Harvest across Punjab is complete. Heavy combine harvesters have left tall standing stubble across your field.",
            "te": "పంజాబ్ అంతటా పంట కోత పూర్తయింది. భారీ కంబైన్ హార్వెస్టర్ల వలన పొలంలో ఎత్తైన గడ్డి మొద్దులు మిగిలాయి.",
            "hi": "पंजाब भर में धान की कटाई पूरी हो चुकी है। कंबाइन हार्वेस्टर से खेत में खड़ी पराली बची है।"
        },
        "whyPeopleBurnHere": "short_window",
        "featuredAlternatives": ["happy_seeder", "bale_sell", "mulch", "bio_decomposer"],
        "localHint": "hint_happy_seeder",
        "eventSuggestion": "early_frost"
    },
    "Haryana": {
        "villageName": "Karnal",
        "introStory": {
            "en": "Winter sowing looms across Haryana. Custom hiring centres for seeders have waiting queues.",
            "te": "హర్యానాలో శీతాకాల పంటల విత్తే సమయం దగ్గరపడింది. సీడర్ యంత్రాల కేంద్రాల్లో రైతుల రద్దీ ఉంది.",
            "hi": "हरियाणा में रबी बुवाई का समय आ गया है। हैप्पी सीडर केंद्रों पर कतारें लगी हैं।"
        },
        "whyPeopleBurnHere": "no_machinery",
        "featuredAlternatives": ["happy_seeder", "bale_sell", "mulch", "bio_decomposer"],
        "localHint": "hint_baling_income",
        "eventSuggestion": "diesel_hike"
    },
    "Uttar Pradesh": {
        "villageName": "Meerut",
        "introStory": {
            "en": "Western Uttar Pradesh fields are dense with residue. The local biomass plant is actively contracting bales.",
            "te": "పశ్చిమ ఉత్తరప్రదేశ్‌లో గడ్డి వ్యర్థాలు పేరుకుపోయాయి. స్థానిక బయోమాస్ ప్లాంట్ గడ్డి కట్టలను కొనుగోలు చేస్తోంది.",
            "hi": "पश्चिमी उत्तर प्रदेश के खेतों में भारी अवशेष हैं। स्थानीय बायोमास प्लांट पराली खरीद रहा है।"
        },
        "whyPeopleBurnHere": "high_labor_cost",
        "featuredAlternatives": ["bale_sell", "bio_decomposer", "happy_seeder", "mulch"],
        "localHint": "hint_decomposer_spray",
        "eventSuggestion": "subsidy_active"
    },
    "UP": {
        "villageName": "Meerut",
        "introStory": {
            "en": "Western Uttar Pradesh fields are dense with residue. The local biomass plant is actively contracting bales.",
            "te": "పశ్చిమ ఉత్తరప్రదేశ్‌లో గడ్డి వ్యర్థాలు పేరుకుపోయాయి. స్థానిక బయోమాస్ ప్లాంట్ గడ్డి కట్టలను కొనుగోలు చేస్తోంది.",
            "hi": "पश्चिमी उत्तर प्रदेश के खेतों में भारी अवशेष हैं। स्थानीय बायोमास प्लांट पराली खरीद रहा है।"
        },
        "whyPeopleBurnHere": "high_labor_cost",
        "featuredAlternatives": ["bale_sell", "bio_decomposer", "happy_seeder", "mulch"],
        "localHint": "hint_decomposer_spray",
        "eventSuggestion": "subsidy_active"
    },
    "Telangana": {
        "villageName": "Warangal",
        "introStory": {
            "en": "Paddy harvest across Telangana has left extensive straw rows. Soil moisture retention is vital before the summer heat.",
            "te": "తెలంగాణలో వరి కోతల తర్వాత గడ్డి వరుసలు మిగిలాయి. వేసవి ఎండలకు ముందు నేలలో తేమను నిలపడం ఎంతో ముఖ్యం.",
            "hi": "तेलंगाना में धान की कटाई के बाद खेतों में पुआल फैला है। गर्मियों से पहले मिट्टी की नमी बचाना जरूरी है।"
        },
        "whyPeopleBurnHere": "traditional_habit",
        "featuredAlternatives": ["mulch", "bio_decomposer", "bale_sell", "happy_seeder"],
        "localHint": "hint_soil_moisture",
        "eventSuggestion": "air_quality_alert"
    },
    "Andhra Pradesh": {
        "villageName": "Tenali",
        "introStory": {
            "en": "Coastal Andhra delta fields have concluded harvest. Managing straw without smoke protects nearby aquaculture ponds.",
            "te": "కోస్తా ఆంధ్ర డెల్టా పొలాల్లో కోతలు పూర్తయ్యాయి. పొగ రాకుండా గడ్డిని నిర్వహించడం సమీపంలోని రొయ్యల చెరువులకు రక్షణ.",
            "hi": "तटीय आंध्र के डेल्टा खेतों में फसल कट चुकी है। बिना धुएं के पुआल प्रबंधन जलीय तालाबों की सुरक्षा करता है।"
        },
        "whyPeopleBurnHere": "short_window",
        "featuredAlternatives": ["mulch", "bale_sell", "bio_decomposer", "happy_seeder"],
        "localHint": "hint_soil_moisture",
        "eventSuggestion": "subsidy_active"
    }
}

# In-memory cache for deterministic or AI generated scenario director responses
_director_cache: Dict[str, ScenarioDirectorResponse] = {}

# Sourced numbers permitted to be mentioned if present in data files
ALLOWED_VERIFIED_NUMBERS = {
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "15", "20", "25",
    "1200", "1500", "2500", "3000", "3500", "9000", "12000"
}


def check_digit_leak(text: str, allowed_numbers: Optional[set] = None) -> bool:
    """
    Scans text for any numeric digits.
    Returns True if an unauthorized/invented digit leak is detected, False if clean.
    Section 7.2 rule: The director never writes invented digits itself.
    """
    if not text:
        return False
    allowed = allowed_numbers if allowed_numbers is not None else ALLOWED_VERIFIED_NUMBERS
    found_digits = re.findall(r"\b\d+(?:\.\d+)?\b", text)
    for digit in found_digits:
        # Check integer or stripped float form
        clean_d = digit.rstrip("0").rstrip(".") if "." in digit else digit
        if digit not in allowed and clean_d not in allowed:
            return True  # Leak detected!
    return False


def get_deterministic_offline_scenario(
    state: str, crop: str, acres: float, language: str = "en"
) -> ScenarioDirectorResponse:
    """Generates schema-compliant, verified deterministic scenario without LLM."""
    reg_key = "Punjab"
    for k in REGIONAL_DEFAULTS.keys():
        if k.lower() in state.lower():
            reg_key = k
            break
    data = REGIONAL_DEFAULTS[reg_key]
    intro = data["introStory"].get(language, data["introStory"]["en"])

    return ScenarioDirectorResponse(
        introStory=intro,
        whyPeopleBurnHere=data["whyPeopleBurnHere"],
        featuredAlternatives=list(data["featuredAlternatives"]),
        localHint=data["localHint"],
        villageName=data["villageName"],
        eventSuggestion=data["eventSuggestion"],
        source="offline",
    )


async def direct_scenario(req: ScenarioDirectorRequest) -> ScenarioDirectorResponse:
    """
    Director endpoint implementation per Section 7.2.
    Builds a personalised scenario from region, crop, acres and language.
    Validates with digit-leak post-filter and falls back to offline knowledge safely.
    """
    cache_key = f"{req.state}_{req.crop}_{req.language}_{round(req.acres, 1)}"
    if cache_key in _director_cache:
        return _director_cache[cache_key]

    keys = get_rotated_gemini_keys()
    if not keys:
        res = get_deterministic_offline_scenario(req.state, req.crop, req.acres, req.language)
        _director_cache[cache_key] = res
        return res

    system_instruction = (
        "You are the AI Scenario Director for What Else Sustain, an educational simulation.\n"
        "Your task: Return a strict JSON object configuring the local farm scenario.\n"
        "RULES:\n"
        "1. DO NOT invent any numbers, percentages or statistics. The director never writes unverified digits.\n"
        "2. whyPeopleBurnHere MUST be one of: 'short_window', 'high_labor_cost', 'no_machinery', 'traditional_habit'.\n"
        "3. featuredAlternatives MUST be an ordered array of: ['happy_seeder', 'bale_sell', 'mulch', 'bio_decomposer'].\n"
        "4. localHint MUST be one of: 'hint_soil_moisture', 'hint_baling_income', 'hint_decomposer_spray', 'hint_happy_seeder'.\n"
        "5. eventSuggestion MUST be one of: 'early_frost', 'diesel_hike', 'subsidy_active', 'air_quality_alert'.\n"
        "6. Return ONLY raw JSON without markdown code fences."
    )

    user_prompt = (
        f"Region: {req.state}, Crop: {req.crop}, Acres: {req.acres}, Language: {req.language}.\n"
        "JSON format: {\"introStory\": \"...\", \"whyPeopleBurnHere\": \"...\", \"featuredAlternatives\": [...], "
        "\"localHint\": \"...\", \"villageName\": \"...\", \"eventSuggestion\": \"...\"}"
    )

    for api_key in keys:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": user_prompt}]}],
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 300,
                "responseMimeType": "application/json",
            },
        }

        try:
            async with httpx.AsyncClient(timeout=4.5) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = json.loads(raw_text)

                        # Validate approved IDs
                        if (
                            parsed.get("whyPeopleBurnHere") in APPROVED_REASON_IDS
                            and parsed.get("localHint") in APPROVED_HINT_IDS
                            and parsed.get("eventSuggestion") in APPROVED_EVENT_IDS
                            and isinstance(parsed.get("featuredAlternatives"), list)
                        ):
                            # Digit-leak post-filter check on freeform fields
                            intro = parsed.get("introStory", "")
                            v_name = parsed.get("villageName", "")
                            if not check_digit_leak(intro) and not check_digit_leak(v_name):
                                res = ScenarioDirectorResponse(
                                    introStory=intro[:280],
                                    whyPeopleBurnHere=parsed["whyPeopleBurnHere"],
                                    featuredAlternatives=[
                                        k for k in parsed["featuredAlternatives"] if k in APPROVED_OPTION_KEYS
                                    ] or ["happy_seeder", "bale_sell", "mulch", "bio_decomposer"],
                                    localHint=parsed["localHint"],
                                    villageName=v_name[:64] or "Kalyanpur",
                                    eventSuggestion=parsed["eventSuggestion"],
                                    source="gemini",
                                )
                                _director_cache[cache_key] = res
                                return res
        except Exception:
            continue

    # Fallback to deterministic offline scenario
    res = get_deterministic_offline_scenario(req.state, req.crop, req.acres, req.language)
    _director_cache[cache_key] = res
    return res
