# Deploying What Else Sustain via Render Blueprint (Infrastructure-as-Code)

Using a **Render Blueprint** (`render.yaml`) is the best approach for **What Else Sustain**. As you add new features (e.g. PostgreSQL, Redis, smoke plume simulations, background workers, or storage disks), everything is tracked as code and deploys automatically whenever you push to git.

---

## 1. What's Inside Your `render.yaml`

Your repository includes a configured [render.yaml](file:///e:/What%20else%20sustain/render.yaml):

```yaml
version: "1"

services:
  - type: web
    name: what-else-sustain
    runtime: python
    region: oregon
    plan: free
    autoDeploy: true
    healthCheckPath: /api/health
    buildCommand: "npm install && npm run build && cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PORT
        value: 10000
      - key: PYTHON_VERSION
        value: 3.11.9
      - key: NODE_VERSION
        value: 20.12.0
      - key: ALLOWED_ORIGINS
        value: "*"
      - key: DATABASE_URL
        value: "sqlite:///./local.db"
      - key: GEMINI_API_KEY
        sync: false
      - key: GEMINI_API_KEYS
        sync: false
```

### Highlights:
- **`autoDeploy: true`**: Every time you push changes to GitHub/GitLab, Render automatically builds and redeploys without manual clicking.
- **`healthCheckPath: /api/health`**: Zero-downtime health checking ensures the new release is verified healthy before switching live traffic.
- **`sync: false`**: Protects your Gemini API secrets so they are never stored in plain text in git.
- **Python + Node environment**: Builds both the Three.js 3D frontend (`npm run build`) and installs FastAPI backend packages in a single step.

---

## 2. Step-by-Step Blueprint Launch (Under 3 Minutes)

### Step 1: Commit and Push to Git
Push all project files (including `render.yaml`) to your GitHub or GitLab repository:
```bash
git add .
git commit -m "Configure Render Blueprint and rotational Gemini AI backend"
git push origin main
```

---

### Step 2: Open Render Blueprint Dashboard
1. Go to **[dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)** (or click **New +** &rarr; **Blueprint** at top right).
2. Connect your repository (`What Else Sustain`).
3. Name your Blueprint instance (e.g. `what-else-sustain-prod`).
4. Select the branch (e.g. `main`).

---

### Step 3: Enter Your Gemini Secrets
Render will scan `render.yaml` and prompt you for the `sync: false` environment variables:
- **`GEMINI_API_KEY`**: Paste your primary Google Gemini key (`AIzaSy...`).
- **`GEMINI_API_KEYS`** *(Optional)*: Paste additional backup free-tier keys separated by commas (e.g. `key1,key2,key3`) for automatic rotation and quota failover.

---

### Step 4: Click "Apply"
Render will automatically:
1. Parse the blueprint.
2. Provision the Web Service.
3. Build the Vite production bundle into `dist/`.
4. Install Python dependencies and launch Uvicorn.
5. Provide your live production URL: **`https://what-else-sustain.onrender.com`**.

---

## 3. Future-Proofing: How to Add Services to the Blueprint

As the project grows, you can add components directly into `render.yaml`:

### To add managed PostgreSQL:
```yaml
databases:
  - name: sustain-db
    plan: free
    region: oregon
```

### To add persistent disk storage for 3D model uploads:
```yaml
    disk:
      name: models-data
      mountPath: /data
      sizeGB: 1
```
Whenever you update `render.yaml` and push, Render automatically handles provisioning!
