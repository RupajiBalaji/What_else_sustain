# Deployment & Persistence Guide: What Else Sustain

## 1. Overview & Architecture
*What Else Sustain* runs as a decoupled architecture:
- **Frontend**: React 19 + Three.js (React Three Fiber / Drei) single-page application built with Vite.
- **Backend API**: Python 3.12 + FastAPI with asynchronous endpoints for simulation, scenario directing, telemetry ingestion, and quiz analytics.
- **Persistent Database**: Managed PostgreSQL via SQLAlchemy ORM with asyncpg / psycopg2-binary drivers.

---

## 2. Render Platform Deployment Target

### Service Configuration
| Component | Render Service Type | Environment / Runtime | Build / Start Command |
| --- | --- | --- | --- |
| Frontend | Static Site | Node 20 / Vite | Build: `npm run build`<br>Publish directory: `dist` |
| Backend API | Web Service | Python 3.12 | Build: `pip install -r backend/requirements.txt`<br>Start: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT` |
| Database | PostgreSQL | Managed PostgreSQL 16 | Managed Instance |

### Essential Environment Variables
- `DATABASE_URL`: `postgresql://user:password@hostname:5432/dbname?sslmode=require`
- `ENVIRONMENT`: `production`
- `CORS_ORIGINS`: `https://what-else-sustain.onrender.com`
- `VITE_API_URL`: Backend web service URL

---

## 3. Render Free Tier Lifecycle, Ephemeral Storage & Upgrade Path

> [!WARNING]
> **Free Tier Spin-Down & Ephemeral Storage Constraints**
> - **Inactivity Spin-Down**: Render free web services automatically spin down after **15 minutes of inactivity**. Incoming requests after spin-down trigger a cold start delay of **30–60 seconds**.
> - **Ephemeral Filesystem**: The container filesystem on free web instances is **ephemeral**. Any SQLite database (`.db` / `.sqlite`), uploaded log, or locally written file is **completely destroyed** whenever the instance spins down or restarts.
> - **Free Postgres Expiry**: Render's free managed PostgreSQL instances expire and are deleted **30 days** after creation.
> - **Persistence Guarantee**: Student sessions, quiz pre/post comparison deltas, classroom teacher codes, and telemetry logs **ONLY survive restarts** if backed by an external or paid managed PostgreSQL instance.

### Recommended Upgrade Path for Classroom / Production Deployments
1. **Web Service**: Upgrade from *Free* to **Starter ($7/month)**
   - Eliminates the 15-minute inactivity spin-down and cold-start latency.
   - Ensures continuous availability during school hours for synchronous classroom sessions.
2. **Database**: Upgrade from *Free* to **Managed PostgreSQL Starter ($7/month)**
   - Removes the 30-day automatic deletion timer.
   - Provides automated daily backups, 1 GB RAM, and persistent high-availability NVMe storage.
3. **Persistent Disk (Optional)**: If local file caches or offline model checkpoints are retained on the backend, attach a 10 GB Persistent Disk ($2.50/month) mounted at `/var/data`.

---

## 4. Step-by-Step Connection & Session Persistence Verification Protocol

To verify that data survives process crashes, redeployments, and host restarts, execute the following protocol:

### Step 1: Initialize Database Connection
Ensure the backend connects to PostgreSQL using the provided connection string:
```bash
export DATABASE_URL="postgresql://wes_admin:secret@dpg-xxxx.render.com:5432/wes_db?sslmode=require"
python -c "
from backend.app.database import engine
with engine.connect() as conn:
    print('✅ Database connection verified successfully')
"
```

### Step 2: Create a Baseline Student Session & Quiz Records
Create a session and record initial pre-quiz results:
```bash
# 1. Create student session
SESSION_RESP=$(curl -s -X POST https://your-backend.onrender.com/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"state": "Punjab", "crop": "paddy", "acres": 4, "class_code": "PUNJAB9"}')
SESSION_ID=$(echo $SESSION_RESP | jq -r '.session_id')
echo "Created Session ID: $SESSION_ID"

# 2. Record Pre-Quiz (Score: 2/5)
curl -s -X POST "https://your-backend.onrender.com/api/sessions/$SESSION_ID/quiz" \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "pre",
    "score": 2,
    "total": 5,
    "duration_ms": 14000,
    "answers": {"quiz_q1_soil_microbes": "opt_a", "quiz_q2_happy_seeder": "opt_b"}
  }'
```

### Step 3: Record Post-Quiz and Season Outcome
```bash
# 3. Record Post-Quiz (Score: 5/5, Delta: +3)
curl -s -X POST "https://your-backend.onrender.com/api/sessions/$SESSION_ID/quiz" \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "post",
    "score": 5,
    "total": 5,
    "duration_ms": 11000,
    "answers": {
      "quiz_q1_soil_microbes": "opt_a",
      "quiz_q2_happy_seeder": "opt_b",
      "quiz_q3_bio_decomposer": "opt_c",
      "quiz_q4_pm25_health": "opt_a",
      "quiz_q5_biomass_economy": "opt_b"
    }
  }'

# 4. Record Season Outcome Event
curl -s -X POST "https://your-backend.onrender.com/api/sessions/$SESSION_ID/events" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "season_completed",
    "payload": {"rank": "A", "net_balance": 34000, "duration_sec": 42.0}
  }'
```

### Step 4: Simulate Process Crash & Restart
In the Render dashboard, click **Manual Deploy > Restart Service**, or execute via CLI / Docker:
```bash
# Terminate and restart the uvicorn worker process
pkill -f uvicorn
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
sleep 3
```

### Step 5: Verify Data Survival Across Restart
Query the session summary from the restarted backend:
```bash
SUMMARY=$(curl -s "https://your-backend.onrender.com/api/sessions/$SESSION_ID/summary")
echo "Persisted Summary after restart:"
echo $SUMMARY | jq .

# Verification Assertions:
# 1. Session ID must match
# 2. pre_score must equal 2
# 3. post_score must equal 5
# 4. quiz_delta must equal +3
# 5. rank must equal "A"
```
If the summary returns the pre/post scores and delta after a process restart, session persistence on managed PostgreSQL is formally verified.

---

## 5. Service Worker Asset Cache Busting
- `public/sw.js` caches `.glb` models, Draco decoders, icons, and textures under `CACHE_NAME` (currently `wes-cache-v4`).
- **Rule**: Whenever any 3D model (`.glb`) or texture (`.png`, `.jpg`, `.webp`) in `public/` changes, **bump `CACHE_NAME`** (e.g., `wes-cache-v4` -> `wes-cache-v5`) before deploying so returning clients evict stale assets on activate.
