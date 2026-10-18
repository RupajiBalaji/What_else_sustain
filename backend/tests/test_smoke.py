def test_smoke_simulation_output_structure(client):
    payload = {
        "acres": 5.0,
        "wind_speed_ms": 3.0,
        "wind_dir_deg": 90.0,
        "distance_to_village_m": 500.0,
        "burn_minutes": 45.0,
    }
    response = client.post("/api/simulate/smoke", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "player_smoke_index" in data
    assert "village_smoke_index" in data
    assert "grid" in data
    assert data["disclaimer"] == "Modelled game estimate, not a measured air-quality reading."
    assert data["all_params_verified"] is False

    # Check grid dimensions (40x40)
    grid = data["grid"]
    assert len(grid) == 40
    assert all(len(row) == 40 for row in grid)

    # Check bounds (all values 0.0 to 1.0)
    for row in grid:
        for val in row:
            assert 0.0 <= val <= 1.0


def test_smoke_simulation_deterministic(client):
    payload = {
        "acres": 4.0,
        "wind_speed_ms": 2.5,
        "wind_dir_deg": 45.0,
        "distance_to_village_m": 800.0,
        "burn_minutes": 30.0,
    }
    res1 = client.post("/api/simulate/smoke", json=payload).json()
    res2 = client.post("/api/simulate/smoke", json=payload).json()

    assert res1["player_smoke_index"] == res2["player_smoke_index"]
    assert res1["village_smoke_index"] == res2["village_smoke_index"]
    assert res1["grid"] == res2["grid"]


def test_smoke_simulation_more_acres_gives_higher_index(client):
    base_payload = {
        "acres": 2.0,
        "wind_speed_ms": 3.0,
        "wind_dir_deg": 0.0,
        "distance_to_village_m": 400.0,
        "burn_minutes": 30.0,
    }
    high_acres_payload = {**base_payload, "acres": 8.0}

    res_base = client.post("/api/simulate/smoke", json=base_payload).json()
    res_high = client.post("/api/simulate/smoke", json=high_acres_payload).json()

    assert res_high["player_smoke_index"] > res_base["player_smoke_index"]
    assert res_high["village_smoke_index"] > res_base["village_smoke_index"]


def test_smoke_simulation_lower_wind_gives_higher_index(client):
    base_payload = {
        "acres": 3.0,
        "wind_speed_ms": 5.0,
        "wind_dir_deg": 0.0,
        "distance_to_village_m": 400.0,
        "burn_minutes": 30.0,
    }
    low_wind_payload = {**base_payload, "wind_speed_ms": 1.0}

    res_base = client.post("/api/simulate/smoke", json=base_payload).json()
    res_low = client.post("/api/simulate/smoke", json=low_wind_payload).json()

    assert res_low["player_smoke_index"] > res_base["player_smoke_index"]
    assert res_low["village_smoke_index"] > res_base["village_smoke_index"]


def test_smoke_simulation_invalid_inputs(client):
    # Negative acres
    res = client.post("/api/simulate/smoke", json={
        "acres": -1.0,
        "wind_speed_ms": 3.0,
        "wind_dir_deg": 90.0,
        "distance_to_village_m": 500.0,
        "burn_minutes": 45.0,
    })
    assert res.status_code == 422
