def test_advisor_rejects_empty_prompt(client):
    # Empty string
    response = client.post("/api/advisor", json={"prompt": "", "lang": "en"})
    assert response.status_code == 200
    data = response.json()
    assert data["fallbackNeeded"] is True
    assert data["source"] == "offline"
    assert "Please ask a question" in data["message"]


def test_advisor_rejects_none_prompt(client):
    # None / null prompt
    response = client.post("/api/advisor", json={"prompt": None, "lang": "en"})
    assert response.status_code == 200
    data = response.json()
    assert data["fallbackNeeded"] is True
    assert data["source"] == "offline"


def test_advisor_rejects_overlong_prompt(client):
    # Prompt > 300 chars
    long_prompt = "a" * 301
    response = client.post("/api/advisor", json={"prompt": long_prompt, "lang": "en"})
    assert response.status_code == 200
    data = response.json()
    assert data["fallbackNeeded"] is True
    assert data["source"] == "offline"
    assert "300 characters" in data["message"]


def test_advisor_fallback_when_gemini_key_missing(client):
    # Valid question, but GEMINI_API_KEY is empty in test environment
    response = client.post(
        "/api/advisor",
        json={"prompt": "How to manage paddy straw without burning?", "lang": "en"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["fallbackNeeded"] is True
    assert data["source"] == "offline"
    assert "GEMINI_API_KEY is not configured" in data["message"]
    # Verify it returned relevant offline knowledge answer
    assert "Happy Seeder" in data["answer"]


def test_advisor_telugu_offline_answer(client):
    # Telugu question
    response = client.post(
        "/api/advisor",
        json={"prompt": "వరి గడ్డిని ఎలా నిర్వహించాలి?", "lang": "te"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["fallbackNeeded"] is True
    assert data["source"] == "offline"
    assert "హ్యాపీ సీడర్" in data["answer"]


def test_advisor_rate_limiting(client):
    # Make 10 requests from the same IP
    headers = {"X-Forwarded-For": "198.51.100.1"}
    for i in range(10):
        res = client.post(
            "/api/advisor",
            json={"prompt": f"Test question {i}", "lang": "en"},
            headers=headers
        )
        assert res.status_code == 200
        assert res.json()["fallbackNeeded"] is True
        # Under limit, it fails because key is missing, not because of rate limit
        assert "GEMINI_API_KEY is not configured" in res.json()["message"]

    # 11th request exceeds 10 req/min
    res_11 = client.post(
        "/api/advisor",
        json={"prompt": "11th question", "lang": "en"},
        headers=headers
    )
    assert res_11.status_code == 200
    data_11 = res_11.json()
    assert data_11["fallbackNeeded"] is True
    assert "Rate limit reached" in data_11["message"]
