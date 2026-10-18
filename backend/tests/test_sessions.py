def test_create_session_and_get_stats(client):
    # Verify initial stats
    res_initial = client.get("/api/stats")
    assert res_initial.status_code == 200
    initial_stats = res_initial.json()
    assert initial_stats["total_sessions"] == 0

    # Record Session 1 (improvement = 3 - 1 = 2)
    session_1 = {
        "session_id": "sess-alpha-001",
        "scenario": "farm_crop_residue",
        "choice": "choice_mulch_soil",
        "smoke_index": 12.5,
        "quiz_pre": [1, 0, 0],
        "quiz_post": [1, 1, 1],
        "language": "en",
    }
    res1 = client.post("/api/sessions", json=session_1)
    assert res1.status_code == 201
    assert res1.json() == {"status": "recorded", "session_id": "sess-alpha-001"}

    # Record Session 2 (improvement = 2 - 0 = 2)
    session_2 = {
        "session_id": "sess-beta-002",
        "scenario": "home_plastic_bottle",
        "choice": "choice_reuse_home",
        "smoke_index": 5.0,
        "quiz_pre": [0, 0],
        "quiz_post": [1, 1],
        "language": "te",
    }
    res2 = client.post("/api/sessions", json=session_2)
    assert res2.status_code == 201

    # Check updated aggregate stats
    res_stats = client.get("/api/stats")
    assert res_stats.status_code == 200
    stats = res_stats.json()

    assert stats["total_sessions"] == 2
    assert stats["scenario_counts"]["farm_crop_residue"] == 1
    assert stats["scenario_counts"]["home_plastic_bottle"] == 1
    assert stats["choice_counts"]["choice_mulch_soil"] == 1
    assert stats["choice_counts"]["choice_reuse_home"] == 1
    assert stats["language_counts"]["en"] == 1
    assert stats["language_counts"]["te"] == 1
    assert stats["avg_quiz_improvement"] == 2.0


def test_create_session_validation(client):
    # Missing required field scenario
    invalid_session = {
        "session_id": "sess-invalid",
        "choice": "choice_burn_stubble"
    }
    res = client.post("/api/sessions", json=invalid_session)
    assert res.status_code == 422
