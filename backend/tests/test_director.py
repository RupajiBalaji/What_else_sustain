import pytest
from backend.app.services.director_service import (
    check_digit_leak,
    APPROVED_REASON_IDS,
    APPROVED_HINT_IDS,
    APPROVED_EVENT_IDS,
    APPROVED_OPTION_KEYS,
)


def test_scenario_director_endpoint(client):
    """Verifies POST /api/director/scenario returns schema-compliant output."""
    payload = {
        "state": "Punjab",
        "crop": "paddy",
        "acres": 5.0,
        "season": 1,
        "language": "en",
    }
    resp = client.post("/api/director/scenario", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "introStory" in data
    assert data["whyPeopleBurnHere"] in APPROVED_REASON_IDS
    assert data["localHint"] in APPROVED_HINT_IDS
    assert data["eventSuggestion"] in APPROVED_EVENT_IDS
    assert isinstance(data["featuredAlternatives"], list)
    assert len(data["featuredAlternatives"]) >= 2
    for alt in data["featuredAlternatives"]:
        assert alt in APPROVED_OPTION_KEYS
    assert data["villageName"] != ""
    assert data["source"] in ("offline", "gemini")


def test_scenario_director_regional_customization(client):
    """Verifies that Punjab and Telangana produce localized, distinct narratives."""
    resp_punjab = client.post(
        "/api/director/scenario",
        json={"state": "Punjab", "crop": "paddy", "acres": 5.0, "language": "en"},
    )
    resp_telangana = client.post(
        "/api/director/scenario",
        json={"state": "Telangana", "crop": "paddy", "acres": 5.0, "language": "en"},
    )

    data_punjab = resp_punjab.json()
    data_telangana = resp_telangana.json()

    assert data_punjab["villageName"] != data_telangana["villageName"]
    assert data_punjab["introStory"] != data_telangana["introStory"]
    assert "Punjab" in data_punjab["introStory"] or "punjab" in data_punjab["introStory"].lower()
    assert "Telangana" in data_telangana["introStory"] or "telangana" in data_telangana["introStory"].lower()


def test_digit_leak_filter_blocks_fabricated_digits():
    """Section 7.2 rule: director rejects any output containing digits not found in data files."""
    # Test case 1: Fabricated percentage
    fabricated_claim_1 = "Burning reduces costs by 94.7% for local farmers."
    assert check_digit_leak(fabricated_claim_1) is True

    # Test case 2: Fabricated monetary amount
    fabricated_claim_2 = "Earn extra ₹8750 by baling straw."
    assert check_digit_leak(fabricated_claim_2) is True

    # Test case 3: Fabricated yield statistic
    fabricated_claim_3 = "Wheat yield rises 43 quintals with this technique."
    assert check_digit_leak(fabricated_claim_3) is True


def test_digit_leak_filter_allows_verified_sourced_digits():
    """Verified numbers from data files (e.g. 5 acres, 20-25 days, ₹3000, 15-25%) pass safely."""
    verified_text = "Retains 20% soil moisture and saves fertilizer for your 5 acres."
    assert check_digit_leak(verified_text) is False

    text_no_digits = "Winter sowing looms across Haryana with queues at custom hiring centres."
    assert check_digit_leak(text_no_digits) is False
