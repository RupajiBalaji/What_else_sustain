# What Else Sustain 🌿

An experiential, bilingual (English & Telugu) web game that teaches students, everyday citizens, and farmers sustainable choices by simulating real-world cause and effect.

> *"Make the mistake. Understand it. Choose what else."*
> *"తప్పు చేయండి. తెలుసుకోండి. ప్రత్యామ్నాయాన్ని ఎంచుకోండి."*

🔗 **Live Prototype**: [LIVE_URL_HERE](LIVE_URL_HERE)

---

## 📸 Screenshots

| 1. Dilemma & Choice | 2. Mistake Impact Simulation |
| :---: | :---: |
| ![Scenario Choice](/docs/screenshots/01-scenario-choice.png) | ![Mistake Impact](/docs/screenshots/02-mistake-impact.png) |

| 3. "What Else?" Alternatives | 4. Pledge & Final Scorecard |
| :---: | :---: |
| ![What Else Alternatives](/docs/screenshots/03-what-else-alternatives.png) | ![Pledge & Final Scorecard](/docs/screenshots/04-pledge-scorecard.png) |

---

## 🕹️ How It Works (The 4-Step Learning Loop)

1. **Make a Choice**: The player steps into a real-world dilemma (e.g., leftover paddy straw after harvest, empty plastic bottles at home) and picks an action—including tempting, common mistakes like burning or dumping.
2. **Understand the Real Impact**: Dynamic animations show the consequences of that choice on Nature Health, toxic air smog, soil microbiome destruction, and hidden household financial loss.
3. **Discover "What Else?"**: Unlocks practical, low-cost alternatives (such as Happy Seeder in-situ mulching, bio-decomposer spray, or scrap dealer recycling) with estimated costs, effort levels, and actionable how-tos.
4. **Pledge, Level Up & Share**: Players take a real-world personal sustainability pledge, earn reward points, unlock badges (like "Soil Saver" and "Pledge Keeper"), advance through level tiers (Seedling $\to$ Forest), and generate shareable eco-scorecards.

---

## ⚡ Pitch Day Quick Start: 45-Second Demo Mode

For a live startup competition pitch or jury demonstration, click the **`▶️ Launch Demo`** banner at the top of the Home Screen:
- **Guided 45-Second Run**: Walks judges through Scenario 1 (The Farmer and the Leftover Straw).
- **Core Loop Progression**: Field Dilemma $\to$ Stubble Burning Mistake $\to$ Toxic Smog Impact $\to$ "What Else?" Alternatives $\to$ Mulching Choice $\to$ Scenario Rewards $\to$ Personal Pledge $\to$ Final Scorecard.
- **Presenter Controls**: Includes an active progress bar, bilingual narration ticker, a working **Pause / Resume** button for answering jury questions, and a visible **Skip Demo ⏭️** button to jump directly to the score.

---

## 📱 Mobile-First Architecture

- **Zero Login / Zero Database**: Player progress, points, and badges sync automatically to browser `localStorage` using a safe storage fallback layer (`safeStorage.js`) for private browsing windows.
- **Lightweight Asset Footprint**: All scenario graphics and character scenes are built purely with lightweight **SVG and CSS keyframes** ($< 3\text{ kB}$ each)—no heavy raster graphics or external video files.
- **Code-Splitting & Lazy Loading**: Secondary screens (`ScenarioPlayer`, `BadgeCollectionPage`, `FinalScoreScreen`, `AskAdvisorPanel`) are loaded dynamically via `React.lazy()` and `Suspense` for snappy first loads on mobile connections.
- **Mobile-First Responsive Design**: Designed for viewports starting from 360px budget Android phones up to desktop presentation monitors, with high-contrast color palettes and minimum 44px tap targets.

---

## 🤖 "Ask What Else" AI Advisor (Gemini API + Offline Shield)

The app features an interactive AI Advisor drawer where players can type or speak questions (e.g., *"I have 5 acres of paddy straw, what can I do?"* or *"ఇంట్లో ప్లాస్టిక్ బాటిళ్లను ఎలా పునర్వినియోగించాలి?"*).

- **API Key Security**: The Gemini API key is never exposed to the client browser. Requests are routed through a serverless backend function (`/api/ask-advisor`).
- **Input Hardening**: Rejects empty prompts, non-string data, or prompts exceeding 300 characters, protected by in-memory rate limiting (max 10 req/min per IP).
- **Offline Knowledge Shield**: If the device is offline, in airplane mode, or if the API endpoint is unreachable, the advisor seamlessly delivers pre-written bilingual guidance from the local knowledge base ([`src/data/aiOfflineKnowledge.js`](file:///e:/What%20else%20sustain/src/data/aiOfflineKnowledge.js)).

---

## 🚀 Local Setup Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation
```bash
# Clone or navigate to the project directory
cd "What else sustain"

# Install dependencies
npm install

# (Optional) Copy environment template and configure your Gemini API key
cp .env.example .env
# Edit .env and set: GEMINI_API_KEY=your_actual_key_here

# Start the local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser or mobile device.

---

## 🌐 Deployment Guide

### Deploy to Vercel (Recommended)
1. Push repository to GitHub or GitLab.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import the repository. Vercel auto-detects Vite:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **"Environment Variables"**, add:
   - `GEMINI_API_KEY`: *(your Google AI Studio Gemini API key)*
5. Click **"Deploy"**. The serverless function in `api/ask-advisor.js` and SPA rewrites in `vercel.json` are deployed automatically.

### Deploy to Netlify
1. Import repository at [netlify.com](https://netlify.com).
2. Settings are pre-configured in `netlify.toml` (`npm run build` $\to$ `dist`).
3. Under **Site Configuration > Environment Variables**, add `GEMINI_API_KEY`.
4. Click **"Deploy site"**.

---

## 📊 Scientific Data Integrity (`SOURCES.md`)

Per competition integrity rules, **no statistics are invented**.
- Every single metric shown across impact screens is cataloged in [`SOURCES.md`](file:///e:/What%20else%20sustain/SOURCES.md) with an agency citation and flagged `"verified": false` until verified against primary research literature.
- Unverified statistics display an explicit warning badge in the UI.

### How to Verify a Number
When you confirm a real statistic with primary literature or official agency reports:
1. Open [`src/data/scenarios.json`](file:///e:/What%20else%20sustain/src/data/scenarios.json) and locate the metric under `impact.threeCards` or `impact.metrics`.
2. Update the `value` field with the verified figure (either a single string like `"65 kg PM2.5 / acre"` or a localized object `{ "en": "...", "te": "..." }`).
3. Set the `source` field to the specific study or official report citation (e.g., `"CPCB Field Survey 2023, Table 4.2"`).
4. Change `"verified": false` to `"verified": true`.
5. Update the corresponding entry in [`SOURCES.md`](file:///e:/What%20else%20sustain/SOURCES.md).

Once `"verified": true` is set, the UI automatically transitions from the `⚠️ Unverified` warning badge to a green verification indicator displaying `✓ <Source Name>` directly on the card.

---

## 🗺️ Future Roadmap

> [!NOTE]
> The items below represent planned post-competition extensions and future milestones, not current prototype deliverables.

- **Expanded Scenarios (Phase 2)**:
  - *Food Waste & Kitchen Scrap Composting*: Diverting urban organic waste to vermicompost and black soldier fly larvae feed.
  - *Water Conservation & Drip Irrigation*: Rainwater harvesting and precision micro-irrigation for drought-prone farming.
  - *Clean Energy & Biogas*: Household dung and agro-residue mini-biogas plants displacing LPG and firewood.
- **Institutional Partnerships**:
  - School and college environmental curriculum integration with student leaderboards.
  - Farmer Producer Organizations (FPOs), Krishi Vigyan Kendras (KVKs), and NGO field extension programs.
- **Multilingual Expansion**:
  - Localization into additional regional languages: Hindi, Tamil, Kannada, Marathi, and Bengali.
- **Educator & Community Leader Dashboard**:
  - Web portal for teachers and community organizers to view collective student pledges, impact points, and estimated community emissions averted.

---

## ⚠️ Known Prototype Limitations

As a funding competition prototype, the app prioritizes core gameplay loop verification, responsiveness, and bilingual storytelling. The following are intentional architectural boundaries:
1. **Local-Only Storage**: Player progress is saved in `localStorage` with `safeStorage` fallback. Progress does not synchronize across multiple devices (intentional for privacy and zero-login friction; cloud accounts planned for Phase 2).
2. **Scenario Data Expansion**: Scenarios live in a single JSON data file ([`src/data/scenarios.json`](file:///e:/What%20else%20sustain/src/data/scenarios.json)). Adding new scenarios requires adding an object to the JSON file rather than through a live CMS admin panel.
3. **Web Speech API Support**: Voice input uses standard browser speech recognition (`SpeechRecognition`), supported in Chromium-based browsers (Chrome, Edge, Samsung Internet, Android WebViews). Unsupported browsers gracefully provide standard text input.
4. **Approximate Regional Costs**: Machinery hiring rates and scrap prices represent regional benchmarks; real-world figures vary by district.

---

## 📄 License

This project is licensed under the [MIT License](file:///e:/What%20else%20sustain/LICENSE).
