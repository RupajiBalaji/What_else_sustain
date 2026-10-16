# What Else Sustain 🌿
> *"Make the mistake. Understand it. Choose what else."*
> *"తప్పు చేయండి. తెలుసుకోండి. ప్రత్యామ్నాయాన్ని ఎంచుకోండి."*

**What Else Sustain** is an interactive, mobile-first web prototype created for startup funding competitions. It educates students, everyday citizens, and rural farmers on practical sustainability through an experiential 4-step game loop:
1. **Make a Choice** (including common, tempting unsustainable mistakes).
2. **Simulate Real Impact** (dynamic animations showing soil, air, health, and economic loss).
3. **Discover "What Else?"** (low-cost, high-value ecological alternatives with cost, effort, and how-tos).
4. **Earn Rewards & Level Up** (points, badges, level tiers, and shareable scorecard summaries).

---

## ⚡ Pitch Day Quick Start: 45-Second Demo Mode
For a live startup pitch or jury presentation, click the **`▶️ Launch Demo`** banner at the top of the Home Screen.
- Automatically walks judges through Scenario 1 (The Farmer and the Leftover Straw) in **45 seconds**.
- Demonstrates: Field Dilemma $\to$ Stubble Burning Mistake $\to$ Smoky Impact & Health Drop $\to$ "What Else?" Alternatives $\to$ Happy Seeder Mulching Transformation $\to$ "Soil Saver" Badge & Scorecard.
- Includes a live narrator ticker and a **Pause/Resume** button so presenters can pause to answer jury questions.

---

## 📱 Mobile-First & Slow-3G Architecture
- **Zero Login / Zero Database**: Player progress, points, and badges sync automatically to browser `localStorage` with a robust fallback for restricted private browsing.
- **Ultra-lightweight Asset Footprint**: All visual scenarios and illustrations are built purely with lightweight **SVG and CSS keyframes** ($< 3\text{ kB}$ per illustration). No heavy bitmap images or external raster graphics.
- **Code-Splitting & Lazy Loading**: Secondary screens (`ScenarioPlayer`, `BadgeCollectionPage`, `FinalScoreScreen`, `AskAdvisorPanel`) are dynamically loaded via `React.lazy()` and `Suspense`, keeping the initial page payload fast on budget smartphones and 2G/3G networks.
- **Accessible & Tested**: Full responsive layout audited down to **360px** (budget Android), **412px** (standard smartphone), and wide desktop projection screens with WCAG AA contrast ratios and $\ge 44\text{px}$ touch targets.

---

## 🤖 "Ask What Else" AI Advisor (Gemini API + Offline Fallback)
The app includes an AI Advisor drawer where players can type or use voice recognition (`Web Speech API`) to ask questions like:
- *"I have 5 acres of paddy straw, what can I do?"*
- *"ఇంట్లో ప్లాస్టిక్ బాటిళ్లను ఎలా పునర్వినియోగించాలి?"*

### Security Architecture:
- The **Gemini API key is NEVER exposed in the client browser**.
- Requests are proxied through a secure backend serverless endpoint (`/api/ask-advisor`).
- **Offline Knowledge Shield**: If the device is offline or the Gemini API key is unset, the advisor automatically delivers structured, bilingual recommendations with approximate cost and effort levels from the local knowledge base ([`src/data/aiOfflineKnowledge.js`](file:///e:/What%20else%20sustain/src/data/aiOfflineKnowledge.js)).

---

## 🚀 Local Setup Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation
```bash
# Clone or navigate to the project directory
cd "What else sustain"

# Install lightweight dependencies
npm install

# (Optional) Copy environment template and add your Gemini API key
cp .env.example .env
# Edit .env and set: GEMINI_API_KEY=your_actual_key_here

# Start the local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser or mobile emulator.

---

## 🌐 Deployment Guide

### Option 1: Deploy to Vercel (Recommended)
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your repository. Vercel will auto-detect Vite:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **"Environment Variables"**:
   - Key: `GEMINI_API_KEY`
   - Value: *(your Google AI Studio Gemini API key)*
5. Click **"Deploy"**. The custom serverless function in [`api/ask-advisor.js`](file:///e:/What%20else%20sustain/api/ask-advisor.js) and [`vercel.json`](file:///e:/What%20else%20sustain/vercel.json) will be deployed automatically.

### Option 2: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com) and click **"Add new site" > "Import an existing project"**.
2. Select your repository. Configuration is read automatically from [`netlify.toml`](file:///e:/What%20else%20sustain/netlify.toml):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Under **Site Configuration > Environment Variables**, add:
   - Key: `GEMINI_API_KEY`
   - Value: *(your Google AI Studio Gemini API key)*
4. Click **"Deploy site"**.

---

## 📊 Scientific Data Integrity (`SOURCES.md`)
Per competition integrity rules, **no statistics are invented**.
- Every single metric shown across the impact cards is cataloged in [`SOURCES.md`](file:///e:/What%20else%20sustain/SOURCES.md) with an agency citation (ICAR, CPCB, FAO, US EPA, WHO, APR) and flagged `"verified": false`.
- Any unverified statistic displays an explicit warning label in the UI until confirmed by primary data.

---

## ⚠️ Known Prototype Limitations
As a funding competition prototype, the app prioritizes core gameplay loop verification, responsiveness, and bilingual storytelling. The following are deliberate architectural boundaries:
1. **Local-Only Storage**: Player progress is saved in `localStorage`. Progress does not synchronize across multiple devices (intentional for privacy and zero-login friction; cloud user profiles can be added in Phase 2).
2. **Scenario Data Expansion**: Scenarios live in a single JSON data file ([`src/data/scenarios.json`](file:///e:/What%20else%20sustain/src/data/scenarios.json)). Adding new scenarios requires adding an object to the JSON file rather than through a live CMS admin panel.
3. **Web Speech API Support**: Voice input uses standard browser speech recognition (`SpeechRecognition`), which requires microphone permission and is natively supported on Chromium-based browsers (Chrome, Edge, Samsung Internet, Android WebViews). Unsupported browsers gracefully hide the microphone button and provide standard text input.
4. **Approximate Regional Costs**: Agricultural machinery hiring rates (Happy Seeder rental, bio-decomposer kits) and scrap PET prices represent approximate state benchmarks; exact real-world figures vary by district.
