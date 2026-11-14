import pytest


def test_session_lifecycle_and_events(client):
    # 1. Initialize Session
    res = client.post("/api/sessions", json={
        "device_class": "desktop",
        "quality_tier": "High",
        "scenario": "farm_crop_residue"
    })
    assert res.status_code == 201
    data = res.json()
    assert "session_id" in data
    sid = data["session_id"]

    # 2. Add Event 1: phase_change
    res_ev1 = client.post(f"/api/sessions/{sid}/events", json={
        "event_type": "phase_change",
        "payload": {"from": "sowing", "to": "harvest"}
    })
    assert res_ev1.status_code == 201
    assert res_ev1.json()["status"] == "recorded"

    # 3. Add Event 2: choice_made (burn)
    res_ev2 = client.post(f"/api/sessions/{sid}/events", json={
        "event_type": "choice_made",
        "payload": {"choice": "burn"}
    })
    assert res_ev2.status_code == 201

    # 4. Record Pre-Quiz
    res_quiz1 = client.post(f"/api/sessions/{sid}/quiz", json={
        "stage": "pre",
        "score": 2,
        "total": 5,
        "duration_ms": 12000,
        "answers": {"q1": "opt_a", "q2": "opt_b"}
    })
    assert res_quiz1.status_code == 201
    assert res_quiz1.json()["score"] == 2

    # 5. Add Event 3: rewind_triggered and choice_made (happy_seeder)
    client.post(f"/api/sessions/{sid}/events", json={
        "event_type": "rewind_triggered",
        "payload": {"from_phase": "consequence"}
    })
    client.post(f"/api/sessions/{sid}/events", json={
        "event_type": "choice_made",
        "payload": {"choice": "happy_seeder"}
    })

    # 6. Record Post-Quiz
    res_quiz2 = client.post(f"/api/sessions/{sid}/quiz", json={
        "stage": "post",
        "score": 5,
        "total": 5,
        "duration_ms": 10000,
        "answers": {"q1": "opt_a", "q2": "opt_c"}
    })
    assert res_quiz2.status_code == 201
    assert res_quiz2.json()["score"] == 5

    # 7. Add Season Completed Event
    client.post(f"/api/sessions/{sid}/events", json={
        "event_type": "season_completed",
        "payload": {"rank": "S", "net_balance": 28000, "duration_sec": 45.2}
    })

    # 8. Get Session Summary
    summary_res = client.get(f"/api/sessions/{sid}/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["session_id"] == sid
    assert summary["first_choice"] == "burn"
    assert "happy_seeder" in summary["alternatives_tried"]
    assert summary["pre_score"] == 2
    assert summary["post_score"] == 5
    assert summary["quiz_delta"] == 3
    assert summary["rank"] == "S"
    assert summary["net_balance"] == 28000
    assert summary["duration_sec"] == 45.2
    assert summary["events_count"] >= 4


def test_class_teacher_flow_and_csv_export(client):
    # 1. Create Class
    create_res = client.post("/api/classes", json={"name": "Class 10A Science"})
    assert create_res.status_code == 201
    class_data = create_res.json()
    code = class_data["class_code"]
    token = class_data["teacher_token"]
    assert len(code) == 6
    assert token

    # 2. Validate Class Code
    val_res = client.get(f"/api/classes/{code}")
    assert val_res.status_code == 200
    assert val_res.json()["valid"] is True
    assert val_res.json()["name"] == "Class 10A Science"

    # Validate Invalid Code
    val_bad = client.get("/api/classes/NONEXIST")
    assert val_bad.status_code == 200
    assert val_bad.json()["valid"] is False

    # 3. Simulate 2 student sessions in this class
    for choice, pre_s, post_s, rank in [("burn", 2, 4, "A"), ("happy_seeder", 3, 5, "S")]:
        s_res = client.post("/api/sessions", json={
            "class_code": code,
            "device_class": "tablet",
            "quality_tier": "Medium"
        })
        sid = s_res.json()["session_id"]

        client.post(f"/api/sessions/{sid}/events", json={
            "event_type": "choice_made",
            "payload": {"choice": choice}
        })
        client.post(f"/api/sessions/{sid}/quiz", json={
            "stage": "pre",
            "score": pre_s,
            "total": 5
        })
        client.post(f"/api/sessions/{sid}/quiz", json={
            "stage": "post",
            "score": post_s,
            "total": 5
        })
        client.post(f"/api/sessions/{sid}/events", json={
            "event_type": "season_completed",
            "payload": {"rank": rank, "net_balance": 21000, "duration_sec": 60.0}
        })

    # 4. Check Teacher Dashboard
    dash_res = client.get(f"/api/classes/{code}/dashboard?token={token}")
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["total_players"] == 2
    assert dash["first_choice_burn_count"] == 1
    assert dash["first_choice_burn_percentage"] == 50.0
    assert dash["avg_quiz_pre"] == 2.5
    assert dash["avg_quiz_post"] == 4.5
    assert dash["avg_quiz_delta"] == 2.0
    assert dash["rank_distribution"]["A"] == 1
    assert dash["rank_distribution"]["S"] == 1

    # Check Forbidden on bad token
    bad_token_res = client.get(f"/api/classes/{code}/dashboard?token=wrong_token")
    assert bad_token_res.status_code == 403

    # 5. Export CSV
    csv_res = client.get(f"/api/classes/{code}/export.csv?token={token}")
    assert csv_res.status_code == 200
    assert csv_res.headers["content-type"].startswith("text/csv")
    csv_text = csv_res.text
    assert "Session ID,Created At,First Choice,Rank" in csv_text
    assert "burn" in csv_text
    assert "happy_seeder" in csv_text
