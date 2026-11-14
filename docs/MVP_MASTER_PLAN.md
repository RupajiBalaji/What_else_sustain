# What Else Sustain: MVP Master Plan and Verification Spec

Tagline: **Make the mistake. Understand it. Choose what else.**
Owner: Balaji Rupaji, Founder, Urvah Dynamics Pvt Ltd
Repo: https://github.com/RupajiBalaji/What_else_sustain
Live: https://what-else-sustain.onrender.com (free Render plan, first load after idle can take 30 to 60 seconds)

> Put this file in the repo root as `docs/MVP_MASTER_PLAN.md`. Antigravity: read this whole file before doing anything, then follow Section 0.

---

## 0. HOW ANTIGRAVITY MUST USE THIS DOCUMENT (read first, follow always)

### 0.1 The loop
For every phase in Section 10, in order:

1. **AUDIT.** Before writing code, check the current repo against every task in the phase. For each task decide: `DONE`, `PARTIAL`, `MISSING`, or `BROKEN`. "Done" means you ran it and looked at it, not that code exists.
2. **LEDGER.** Write the audit into `docs/PROGRESS.md` (template in Appendix A). Never delete history; append.
3. **BUILD.** Fix and build only the tasks that are not `DONE`, in task-ID order. One commit per task. Commit message format: `type(scope): TASK-ID short description`, for example `fix(burn): P0-03 visible flames at every quality tier`.
4. **VERIFY.** Run the phase's verification list (Section 11) including automated tests and the screenshot matrix. Look at every screenshot. Compare it with the UI spec in Section 4.
5. **GATE.** A phase passes only if every task is `DONE` and every verification item is green. If anything fails, fix and re-verify. Do not start the next phase while a gate is open.
6. **REPORT.** Reply with the report in Appendix B. Push to `main`.

### 0.2 Non-negotiable rules
- **No claim without evidence.** Never mark a task `DONE` without a screenshot you have viewed and, where listed, a test that can fail. If you cannot verify something (for example real phone frame rate), say "NOT VERIFIED" and say why.
- **Tests must be able to fail.** A check that returns true on every path is a defect. When you write a check, deliberately break the feature once and confirm the check fails.
- **Do not remove or hide a feature to make a defect disappear.** Fix the cause.
- **Do not invent numbers.** Every figure shown to a player comes from `src/data/scenarios.json` with a source and a `verified` flag, or is labelled **"game estimate"**. If a number is a placeholder, it carries `verified: false` and the UI shows "game estimate" next to it.
- **Every feature must work on the Low graphics tier and on a phone.** Quality tiers may reduce particle counts, shadows, resolution and instance counts. They must never remove colour, flames, smoke, the choice panel, or any feature.
- **Do not leave dead code, disabled tests, or `TODO` that hides a missing feature.** If a task cannot be finished, mark it `PARTIAL` or `MISSING` in the ledger with the reason.
- **Ask nothing, decide and record.** If a detail is not specified here, choose the simplest option consistent with Section 1 and record the decision in `docs/DECISIONS.md` (date, decision, reason).
- **Founder's preferences:** features, gamification, graphics and smoothness first. No drift into scientific research. Data is supplied by the founder; mark gaps as `needs_data` and keep going. Serious, immersive tone; no colourful kids-app buttons or cards.

### 0.3 What "done" means for the whole MVP
All phases P0 to P9 pass their gates, Section 12 (MVP acceptance checklist) is fully ticked, and the founder can run a 3 minute live demo and a 10 minute classroom session without a crash, overlap, or unlabelled number.

---

## 1. PRODUCT DEFINITION

### 1.1 The problem
People harm the environment mostly not because they want to, but because they do not know the sustainable alternatives to their actions, or do not understand the effect of those actions. Survey evidence the founder has cited shows the gap is often **timely information, practical alternatives, and understanding of soil damage**, not simply "people don't know burning is harmful". The product must reflect this nuance: it is not preachy; it shows consequences and options.

### 1.2 The product
A gamified 3D web game that trains students and everyday citizens to choose sustainable alternatives. The player is a farmer standing in a real-looking field. They choose what to do with leftover straw **inside the world**. If they burn, it really burns in front of them and they watch smoke spread, villagers cough, soil life die and money drain. If they choose another option, they watch that option happen live. A **"What Else?"** rewind returns them to the moment of choice, then a **before-and-after comparison** shows both futures. The same engine later handles plastic waste and other everyday topics.

### 1.3 Audience
- Primary: school and college students (teacher-led sessions), age about 14 and above.
- Secondary: farmers and rural community members (simple language, regional languages, low-end phones).
- Tertiary: funders and partners watching a short demo (1M1B Young Innovators in Residence pitch).

### 1.4 Design principles
1. **The world is the interface.** Minimal menus. Choices are made in the scene.
2. **Cause and effect must be visible.** Anything that changes numbers must also change the world.
3. **Serious, calm, cinematic.** Dark glass panels, restrained colour, no cartoon buttons.
4. **Honest.** Simulated values are labelled. Sources are one tap away.
5. **Works everywhere.** Low-end Android phones included, with graceful degradation.
6. **Short loops.** First decision within 10 seconds of loading (Quick Play). One season within about 3 minutes.
7. **Never lecture.** Show, then explain briefly, then let the player choose again.

### 1.5 Non-goals for the MVP
- Photorealism or matching major studio graphics. Target: a stylised low-poly 3D world with strong cause and effect.
- User accounts, passwords, payments, leaderboards across the internet, chat.
- Native mobile apps. The MVP is a PWA.
- Real-time multiplayer.
- Any real survey data the founder has not supplied.

### 1.6 MVP feature list (the contract)
| # | Feature | Phase |
|---|---------|-------|
| 1 | Stable 3D farm world, desktop and phone, three quality tiers | P0, P8 |
| 2 | Quick Play and Full Season modes | P1 |
| 3 | Season loop (sowing, growing, harvest, decision, consequence, report, next season) | P1 |
| 4 | Five decisions: Burn, Happy Seeder, Bale and Sell, Mulch, Compost (bio-decomposer) | P1, P5 |
| 5 | Burn consequence: visible fire, smoke drift, exposure meters, coughing villagers, soil cutaway, money | P0, P1 |
| 6 | Alternative sequences, each fully animated | P5 |
| 7 | "What Else?" rewind and before-and-after comparison | P1 |
| 8 | Carry-over (soil, village health, money, reputation) visible in world | P5 |
| 9 | Points, XP, rank, achievements, pledge, share | P1 |
| 10 | Before-and-after learning quiz and results view | P2 |
| 11 | Persistent database (Postgres), anonymous sessions | P3 |
| 12 | Class code and teacher dashboard with CSV export | P3 |
| 13 | "Your Farm" screen and AI scenario director | P4 |
| 14 | "Ask What Else" AI advisor | P4 |
| 15 | Languages: English, Telugu, Hindi | P6 |
| 16 | Audio: ambience, effects, mute/volume | P7 |
| 17 | Accessibility: reduced motion, keyboard, colour-blind-safe meters, subtitles | P7 |
| 18 | Lite 2D mode fallback (includes plastic bottle scenario) | P1, P7 |
| 19 | PWA install and offline shell | P8 |
| 20 | Deployment, monitoring, privacy notice | P9 |
| 21 | Demo mode and pitch support (scripted 90 second demo, share image) | P10 |

---

## 2. TECHNICAL STACK (do not change without recording a decision)

- **Frontend:** React 19, Vite, Three.js via React Three Fiber and Drei, Framer Motion, Howler for audio. 3D code lives in `src/game3d/`. Lite 2D fallback remains.
- **Backend:** FastAPI (Python 3.11) in `backend/app/`. Routes: `/api/health`, `/api/advisor`, `/api/simulate/smoke`, `/api/sessions` (more are specified in Section 8).
- **Data:** `src/data/scenarios.json` (every figure has `source` and `verified`), `SOURCES.md`, `backend/app/smoke_params.json`.
- **AI:** Gemini via the Python backend only. API key never in the browser.
- **Hosting:** one Render web service serving the built frontend and the API, deployed from `main` via `render.yaml`. Persistent Postgres replaces SQLite.
- **Tests:** pytest for backend, Playwright for end-to-end (must run on software WebGL and accept a browser path from an environment variable).

---

## 3. GLOBAL STANDARDS

### 3.1 Device and viewport matrix (every screen must be checked on all)
| Name | Size | Notes |
|------|------|-------|
| Phone small | 360x640 | Low-end Android reference. Safe areas respected. |
| Phone | 390x844 | Common modern phone |
| Phone large | 412x915 | Android large |
| Tablet portrait | 768x1024 | Layout switches to desktop-like panels |
| Desktop | 1366x768 | Laptop reference |
| Desktop large | 1920x1080 | Full HD |

Orientation: phone portrait is primary. Landscape must work and must not break layout (panels reposition, nothing off-screen).

### 3.2 Performance targets (engineering targets, measure and report, do not fake)
- Quick Play to decision visible: 10 seconds or less on the Low tier on a mid-range laptop. Report the measured value for each viewport.
- Frame rate targets: High tier 60 fps on a desktop GPU, Medium 45 fps or better, Low 30 fps or better on a mid-range Android. These are targets. In the headless test environment software rendering is slower, so the report must state results as "software GL, not representative" unless measured on hardware.
- Initial JS bundle: report size; lazy-load the 3D scene and heavy models after the loading screen.
- Total 3D asset size: report and keep as small as practical (compress textures, reuse models, instance repeated objects).
- Memory: no growth across 3 consecutive seasons (dispose geometries, materials, textures, particle buffers on phase change).

### 3.3 Quality tiers
- **High:** shadows on, full particle counts, post effects limited to subtle bloom (clamped so nothing blows out to white), full instance counts, 1.0 to 1.5 pixel ratio.
- **Medium:** reduced shadows, 60% particles, no bloom, pixel ratio 1.0.
- **Low:** no real-time shadows (blob shadows), 30% particles but flames and smoke still clearly visible, pixel ratio 0.75 to 1.0, reduced instance counts. **Colour, models and effects are never removed.**
- **Governor:** starts on the tier chosen by a quick device check; never downgrades in the first 10 seconds after the scene is interactive; downgrades only after sustained low frame rate (average under 24 fps for 5 consecutive seconds); can upgrade after 20 seconds of stable frames; the player can lock a tier in Settings. The current tier is shown in Settings, not as a permanent HUD chip.

### 3.4 Accessibility baseline
- Text contrast at least 4.5:1 on panels. Minimum tap target 44x44 px on touch.
- Every action works by keyboard on desktop (Tab order, Enter, Escape, number keys for choices, R reset camera).
- Reduced motion setting: disables camera shake, auto-orbits become cuts, particles reduced, parallax off.
- Meters never rely on colour alone (always numbers and labels, plus pattern or icon).
- Subtitles for key sound cues (cough, fire crackle, machine) shown as small captions when enabled.
- Screen reader labels on all buttons and panels (`aria-label`, roles) for the DOM UI.

### 3.5 Internationalisation baseline
- All user-facing strings live in locale files: `src/locales/en.json`, `te.json`, `hi.json`. No hard-coded strings in components.
- Each non-English string has a status `needs_review` or `reviewed`. Never present machine-written text as reviewed.
- Fonts: bundle or subset a font that renders Telugu and Devanagari; test on Low tier and phones.
- Numbers use the Indian grouping format (for example 1,00,000) where currency is shown; currency symbol is the rupee sign.

### 3.6 Privacy and safety baseline
- No personal data collected. Sessions are anonymous random IDs. No name, email, phone, precise location.
- Class codes are random short codes. Teachers see aggregates only.
- A one-screen privacy note in Settings and on the teacher page.
- Rate limiting on all AI routes. Input length limits. No user text is ever used to build file paths or SQL strings. All DB access parameterised.
- Content: the AI advisor refuses unrelated topics politely and never gives medical advice; for health questions it says it is a game model and suggests a local health worker.

### 3.6b Code quality baseline
- Lint and format pass on every commit. No console errors or warnings the project owns in a normal play session.
- Components under about 300 lines where possible; scene logic in hooks or context, not in render bodies.
- Every particle system, texture and geometry has a dispose path.
- Environment variables documented in `.env.example`. Secrets never committed.

---

## 4. UI / UX SPECIFICATION (how it must look and behave)

### 4.1 Visual language
**Mood:** dusk-lit Indian farmland, calm and slightly tense. Warm golden light on the field, hazy sky. Panels are dark frosted glass floating over the world. No bright primary-colour buttons.

**Colour tokens (CSS variables in one file `src/styles/tokens.css`):**
| Token | Value | Use |
|-------|-------|-----|
| `--bg-panel` | `rgba(20, 26, 32, 0.92)` | Panel background (with `backdrop-filter: blur(12px)`) |
| `--bg-panel-solid` | `#141A20` | Fallback where blur is unsupported |
| `--border-subtle` | `rgba(255,255,255,0.10)` | Panel borders |
| `--text-primary` | `#F2F5F3` | Main text |
| `--text-secondary` | `#B5C0BA` | Secondary text |
| `--accent-green` | `#4CAF50` | Positive, confirm, sustainable |
| `--accent-amber` | `#F2A93B` | Caution, money, estimate labels |
| `--accent-red` | `#E5533D` | Harm, smoke, loss |
| `--accent-blue` | `#4A90C2` | Information, wind |
| `--focus-ring` | `#FFFFFF` | Keyboard focus |

**Typography:** one humanist sans-serif UI font (bundled, with Telugu and Devanagari coverage) plus tabular numerals for meters. Sizes: 12 (caption), 14 (body), 16 (emphasis), 20 (panel title), 28 (report title). Never below 12 px.

**Shape and motion:** corner radius 12 px for panels, 8 px for buttons. Panel enter: 180 ms fade and 8 px rise. No bouncing or wobbling. Number counters tick up over 600 ms. Reduced-motion removes movement but keeps fades.

**Button styles (only three):**
1. *Primary:* solid `--accent-green` text dark, used once per panel (Confirm, Next Season).
2. *Secondary:* transparent with 1 px border, white text.
3. *Danger-context:* same as secondary but with red icon only (the Burn option is not styled as a red button; it is a neutral option so the player is not nudged).

**Do not use:** emoji as the main UI icons (use a consistent line-icon set), rainbow gradients, large rounded cartoon buttons, sticker-style badges in the HUD.

### 4.2 Layout system and the Overlay Manager
All on-screen labels, cards, chips and callouts are registered with a single **OverlayManager** (`src/game3d/ui/OverlayManager.jsx`). Rules it enforces:

1. **Priority order** (highest first): modal (report, quiz) > choice panel > consequence callout > smoke meter > prompts/buttons > status prop > decorative sign.
2. **At most 2 world-anchored cards visible at once.** Extra cards wait in a queue.
3. **Never overlap** each other, the HUD, the joystick, the look pad, the farmer's head region, or the ignited pile region. Collision avoidance nudges or queues.
4. **Never clipped** by any screen edge on any viewport. Clamp to safe area.
5. **Timed sequences:** consequence callouts appear one at a time, about 3 seconds each, in a fixed dock (left column on desktop; a compact strip above bottom controls on phone).
6. **While the choice panel is open,** hide the village sign, air-station label, straw label, and any chips.
7. Every overlay element carries `data-overlay-id` and a priority so tests can verify rules 1 to 6 on every overlay (cards, chips, meters, buttons), not just some.

### 4.3 Screen-by-screen spec

#### S1. Loading screen
- Dark background with the project name and tagline. A thin progress line (not a spinner), a short rotating tip line (sourced or clearly general, for example "Straw can be used instead of burned").
- Shows an honest message if the free server is waking: "Waking the server, this can take up to a minute".
- On finish: two choices as large but quiet cards:
  - **Quick Play** (primary): "Go straight to the straw decision".
  - **Full Season:** "Sowing, growing, harvest, then decide".
- Footer: language switch (EN / తెలుగు / हिन्दी), Settings, "Lite mode" link for old devices.
- If WebGL is unavailable or a context is lost: show a calm message and route to Lite mode automatically with a button to retry 3D.

#### S2. Your Farm (before the first season)
- Single card, three inputs: **State** (Andhra Pradesh, Telangana, Punjab, Haryana, Uttar Pradesh), **Crop** (Paddy, Wheat), **Acres** (1 to 20, stepper). A "Use defaults" option skips it.
- A one-line honest note: "Figures use the nearest sourced region and are labelled."
- "Start" button. In Quick Play this screen is shown once, compact, and remembered; the player can change it later in Settings.

#### S3. Top HUD (always visible in play)
- **One row**, never wraps. Left to right: Season/Phase pill ("S1 Decision"), Soil health, Village health, Money, Reputation, Wind speed and direction arrow, then Settings gear at the right.
- Phone: icons with short values only (for example soil 70, village 75, money 9k). Long labels appear in a tooltip or in the Settings drawer.
- Streak, Badges, Switch to Lite Mode, Quality, Language and Audio live in the **Settings drawer**.
- Smoke meter is **not** in the HUD row; it docks under it (see S6) and never covers HUD items.
- Safe-area insets respected on notched phones.

#### S4. World controls
- **Desktop:** WASD or arrows to walk, mouse drag to orbit (360 degrees yaw, pitch clamped between -10 and +60 degrees), wheel to zoom (3 to 14 units), `R` or the Reset button to return to the default view, `E` or click to interact, `Esc` to close panels.
- **Phone:** left virtual joystick to move, right-side look pad to orbit, pinch to zoom, double-tap the look pad to reset. A small vertical camera cluster (rotate left, rotate right, zoom in, zoom out, reset) sits top-right, semi-transparent, 44 px targets. No duplicate big buttons.
- Camera collides with terrain, straw piles, houses, trees and poles. It never ends inside an object.
- Camera eases only for the first 1.5 seconds of a phase transition, and any player input interrupts easing immediately.

#### S5. Choice panel (the heart of the game)
- **Desktop:** fixed right-side card (right 20 px, about 380 px wide), vertically centred, never over the farmer or HUD. **Phone:** a bottom sheet that covers at most 45% of the screen height, drag handle, all five options visible **without horizontal scrolling**.
- Title: "What will you do with the straw?" with the small caption "Pick one. You can rewind and try another."
- Five rows, each showing: icon, name, upfront cost (or "paid by plant"), and effort (Low / Medium / High). Costs come from scenarios.json; placeholders show "(game estimate)".
  1. Burn Stubble
  2. Happy Seeder
  3. Bale and Sell
  4. Mulch into Soil
  5. Compost (bio-decomposer)
- Tap or click a row to **highlight** it and reveal a two-line preview ("What happens", "What it costs") plus a "Source" link if verified. A separate **Confirm** button commits. **No option is preselected.** Pressing 1 to 5 highlights; Enter commits only when something is highlighted. A stray Space or Enter does nothing.
- After confirming the panel disappears and the world takes over.

#### S6. Consequence view (Burn)
Timeline of about 20 seconds, driven by `burnProgress` from 0 to 1:
| Time | World | UI |
|------|-------|----|
| 0 to 2 s | Camera frames the pile and farmer; ignition at the pile base; ember sparks | Smoke meter docks (compact), exposure starts at 0 |
| 2 to 8 s | Tall flickering flame tongues (orange core, yellow tips, red edges), glowing cracks in the straw, ground firelight, wind bends flames | Callout 1: "Straw is burning" (no number) |
| 8 to 14 s | Pile shrinks and blackens, dark smoke plume rises then drifts along the wind toward the village; farmer coughs | Player exposure rises; callout 2 (soil) |
| 14 to 20 s | Embers die, grey ash, heat shimmer fades; plume keeps moving | Callout 3 (money); end prompts appear |
| 20 s | Control returns | Two buttons: **Watch the village**, **Continue** |

- **Watch the village:** camera auto-orbits to a framing that shows the plume reaching at least two houses and some villagers, then returns control after about 4.5 seconds. Villagers cough (animation plus a soft cough sound). The village exposure meter climbs from its arrival value to its end value while the plume arrives. The camera must never clip into a house.
- **Soil cutaway:** a compact panel (docked, not floating over the pile) shows a cross-section of topsoil, root zone and subsoil with microbes and worms fading as heat penetrates, with depth labels inside the panel.
- **Money:** the farm balance in the HUD updates immediately after the choice; callouts, HUD and report agree to the rupee.
- **Meters:** "Your exposure" and "Village exposure" are 0 to 100 **index** values labelled "Simulated smoke exposure (game model)". A "Why this number?" link opens the method note (emission factors and wind) with sources. Never present them as measured air quality.

#### S7. Alternative sequences (each about 12 to 18 seconds)
- **Happy Seeder:** tractor with a seeder drives across the field sowing seed directly through the straw; seed lines and a stubble mulch layer visible; clean air; soil panel shows microbes thriving.
- **Bale and Sell:** baler runs along rows making round bales; a truck loads bales and drives to a biomass plant on the horizon; a money callout shows a **net range** (income minus collection and transport costs), which can be small or negative. Do not show only gross income.
- **Mulch into Soil:** straw is spread evenly over the field; moisture shimmer; soil panel shows organic matter increasing.
- **Compost (bio-decomposer):** straw heaped, a decomposer solution sprayed, heap darkens and steams gently, finished compost spread; soil improves over later seasons.
Each ends with the same two buttons pattern: **Watch the result** (optional world focus) and **Continue**.

#### S8. "What Else?" rewind and comparison
- After any choice, a persistent quiet button "What else?" appears. Pressing it plays a short rewind effect (reverse time-lapse, 1.5 seconds), returns to S5 with the previous choice marked "tried", and the other options still available.
- **Comparison card** appears once at least two different options have been tried in the session. Two columns (Option A vs Option B) showing: money (range), soil health change, village health change, air exposure index, effort, time. Each figure carries a source marker or "game estimate". A one-sentence plain-language takeaway. Buttons: Try another, Keep this choice.

#### S9. Season report (modal)
- Title "Season 1 report". Rank badge sits in the header row beside the title and never covers it.
- Blocks: "What changed in the village" (one or two sentences); Financial results (crop sale, residue choice balance, net); three metric tiles (soil health with change, village air with change, fire-free streak); XP bar with level; achievements earned this season.
- Buttons: **Next Season** (primary, always reachable without scrolling on 360x640), Replay season, Share, Badges.
- A line "Figures marked game estimate are not measured data".

#### S10. Quiz and results
- **Pre-check** (before the first decision) and **Post-check** (after the first report). Five questions each, same questions in shuffled order. One question per screen, large readable options, no timer pressure, no score shown until the end.
- **Results card:** before score, after score, change, and a short list "You learned: ..." mapped to concepts. Honest wording when the score did not improve ("Nothing wrong here, try the comparison again").
- Anonymous storage per session. Teacher dashboard (S12) aggregates them.

#### S11. Pledge and share
- After the first season in which the player chooses a non-burn option: a pledge card ("I will choose an alternative to burning straw") with a single confirm tap. A share option creates an image (season result, rank, one sentence) with the site URL and a note "game results, not real data". Uses the Web Share API where available, else downloads the image.

#### S12. Class code and teacher dashboard
- **Student side:** at start, an optional "Class code" field (4 to 6 characters). Wrong code shows a friendly error and lets them play without a code.
- **Teacher side:** a separate page `/teacher`. "Create class" button returns a code and shows a manage link containing a token that is stored in the browser (no login). Dashboard shows, for the class: number of players, share who first chose burn, which alternatives were tried after the rewind, quiz before and after (average), average session time, a distribution of ranks. **CSV export** button. Visible privacy note: "No names or personal data are collected."
- Empty state when no players have joined yet.

#### S13. Settings drawer
Sections: Language, Audio (master, music, effects, mute), Graphics (tier lock, "Current tier", reduced motion), Controls (invert look, sensitivity), Accessibility (subtitles, colour-blind-safe meters, large text), Your Farm (change state, crop, acres), Lite mode switch, Privacy and sources, Reset progress (with a confirm dialog), About.

#### S14. Achievements and badges
Panel with locked and unlocked achievements, each with a plain description of the action that unlocks it (for example "First fire-free season", "Tried every alternative", "Improved soil health for 3 seasons", "Passed the learning check"). Unlock toast is small, top centre, 3 seconds, never covers the choice panel.

#### S15. Lite 2D mode
Retained as a fallback for low-end devices. Same decisions, simple illustrated scenes, scorecard, bilingual text, and the plastic-bottle scenario. It must use the same locale files, honesty labels and quiz.

#### S16. Error and empty states
Network error (advisor offline: show the offline answer set), server waking message, WebGL lost, save failed (play continues, retry silently), class code not found, no data yet on teacher page. Each state is calm, short, with one action.

### 4.4 Do and do not (quick reference)
| Do | Do not |
|----|--------|
| One primary button per panel | Many coloured buttons side by side |
| Docked cards, one callout at a time | Floating cards on top of the farmer |
| Numbers with units and labels | Bare numbers, unlabelled estimates |
| Short sentences, plain words | Long paragraphs in game panels |
| Show cause in the world, then explain | Explain first, show nothing |

---

## 5. GAME SYSTEMS SPECIFICATION

### 5.1 Season state machine
States and allowed transitions (implement as an explicit state machine in `Game3DContext.jsx` or a dedicated `seasonMachine.js`, with unit tests):

`LOADING -> MODE_SELECT -> (YOUR_FARM) -> PRECHECK_QUIZ -> SOWING -> GROWING -> HARVEST -> DECISION -> CONSEQUENCE -> REPORT -> POSTCHECK_QUIZ (first season only) -> NEXT_SEASON (back to SOWING)`

- **Quick Play** enters `DECISION` directly with a pre-generated harvest state, but still runs the pre-check and your-farm steps (compact).
- **Skip** is available for GROWING and HARVEST time-lapses.
- From `CONSEQUENCE` the player can trigger `REWIND` back to `DECISION` any number of times. Every attempt is logged (choice, time) for the comparison and for analytics.
- Seasonal events (see 5.7) can only open after the first decision has been made and never during an active sequence.
- Invalid transitions must be impossible by construction (test: attempt each invalid transition, expect it to be rejected).

### 5.2 Player state (persisted per session)
| Variable | Range | Meaning |
|----------|-------|---------|
| soilHealth | 0 to 100 | Soil life and organic matter index (game model) |
| villageHealth | 0 to 100 | Village air and wellbeing index (game model) |
| money | rupees | Farm balance, starts at the value in scenarios.json (currently 12,000) |
| reputation | 0 to 100 | Standing in the village |
| xp, level, rank | numbers | Progress |
| streak | seasons | Consecutive fire-free seasons |
| history | list | Each season's choice, consequences, tried alternatives |
| farmProfile | object | state, crop, acres, season |

Persist locally (browser) and, when a session exists, to the backend. Resume after refresh.

### 5.3 Decisions and consequences
**All effect sizes live in `scenarios.json` under `options.<key>.effects`, each with `source`, `verified`, and a `note`.** If an effect size is a placeholder, `verified` is false and the UI shows "game estimate". Do not hard-code effects in components.

For each option, the data file must define: `name`, `icon`, `upfrontCost` (or `paidByBuyer`), `effort`, `timeCost`, `soilDelta`, `villageDelta`, `moneyDeltaRange` (min and max), `reputationDelta`, `smokeIndex` (0 for non-burn), `xp`, `unlockHints`, `plainSummary` (en, te, hi), `source`, `verified`.

Known cost figures supplied by research (Punjab figures, **not** Andhra Pradesh or Telangana, so they must be labelled with their region):
- Happy Seeder custom hire about INR 1,992 per acre with a tractor; CRM subsidy 50% for individuals and 80% for custom hiring centres.
- Baled straw bought at about INR 1,800 to 2,200 per tonne; aggregation cost about INR 1,330 per tonne. Bale-and-sell can therefore be small or negative after collection costs; show a net range.
- Burning loses all organic carbon in the residue and roughly 5.5 kg nitrogen, 2.3 kg phosphorus, 25 kg potassium and 1.2 kg sulphur per tonne of stubble (NPMCR, via a 2021 review).
- Smoke emission factors for the game model: about 8.3 g PM2.5 per kg for field burning and 18.3 g per kg for pile burning, with a wide literature range.
- Other figures (burned residue about 92 million tonnes per year, plastic waste) are for pitch and "Learn more" cards only, with the range shown.

Anything not in this list that the game currently shows must be reviewed: add a source, or mark `verified: false` and label it "game estimate", or remove it.

**Option effects (design intent, tune values in data only):**
| Option | World consequence | Soil | Village | Money | Reputation |
|--------|-------------------|------|---------|-------|------------|
| Burn | Fire, smoke plume, coughing, soil microbes die, farmer exposure rises | large drop | large drop | upfront cost 0 but later fertiliser cost rises (range, estimate) | drops |
| Happy Seeder | Seeding through straw, mulch layer left | rises over seasons | neutral to rising | hire cost, partly offset by subsidy and yield (range) | rises |
| Bale and Sell | Baler, truck, biomass plant | neutral | rises | net range, may be negative | rises slightly |
| Mulch | Straw spread as cover | rises slowly | neutral | low cost | rises slightly |
| Compost | Decomposer spray, heap, finished compost | rises | neutral to rising | low to medium cost | rises |

### 5.4 Smoke model (backend `/api/simulate/smoke`)
- Input: pile mass proxy (from acres and crop), wind speed and direction, burn type, time.
- Output: **relative exposure indexes** for the player and the village (0 to 100) and a downwind grid for the smoke visual. It is a simplified plume model, not a regulatory air-quality model.
- Parameters in `smoke_params.json` with sources. Unit tests: more wind speed means faster drift and lower peak near the source; wind direction away from the village reduces village exposure; zero burn gives zero index.
- The UI label is always "Simulated smoke exposure (game model)". The "Why this number?" panel lists the parameters and sources.

### 5.5 Carry-over rules
- After the report, the next season starts from the new `soilHealth`, `villageHealth`, `money`, `reputation`.
- Soil health sets crop vigour and yield multiplier (design parameter in data, tunable) and the soil colour and worm count in the world.
- Village health sets sky clarity (haze), villager behaviour (healthy vs coughing, children playing vs indoors), and the village sign text.
- Reputation unlocks "village appreciation" moments (a villager thanks you) and can influence an event.
- Burning in consecutive seasons compounds the damage up to a floor (soil and village never below 5) so recovery is always possible.
- Sustainable choices improve metrics with diminishing returns near 100.

### 5.6 Rewards
- **Points and XP:** awarded per decision and per learning milestone. Non-burn options award more XP than burn; the first attempt at each alternative awards a "discovery" bonus. Numbers live in data.
- **Rank ladder** (names editable in locale files): Novice Cultivator, Field Learner, Soil Keeper, Village Guardian, Green Steward.
- **Achievements:** at least 12 at MVP: first fire-free season; tried every alternative; recovered soil after burning; three seasons in a row with soil rising; watched the village; used What Else; completed pre and post check; improved quiz score; shared the result; completed the pledge; finished three seasons; opened the sources panel.
- **Pledge** and **share** as in S11.

### 5.7 Seasonal events (non-blocking)
Small, non-modal cards with a close button, at most one per season, never before the first decision: for example "A neighbour offers to share a Happy Seeder", "Early rain", "Buyer asks for baled straw". Each event may offer a small gameplay modifier defined in data (clearly labelled "game scenario"). Events can be disabled in Settings.

### 5.8 Learning content
- Every option has a "Learn more" panel (opens from the comparison and from the report) with two or three plain sentences, a source link, and a verified or estimate tag.
- A short "Why people burn" note presents the evidence-based gap honestly (lack of timely information and practical alternatives, not lack of concern). Only use figures that exist in `SOURCES.md`; mark each with its source. Do not add survey numbers that are not in `SOURCES.md`.

---

## 6. 3D WORLD SPECIFICATION

### 6.1 Scene layout (all coordinates in `src/game3d/world/layout.js`, one source of truth)
- A single farm: a rectangular field with crop rows, a farmhouse and barn near the field edge, a dirt track, a few trees along the boundary, a power pole, and a **village of 6 to 10 houses** visible downwind at a believable distance (a short walk, roughly 40 to 60 metres in game units). Village houses form a small cluster with a lane, a well or tree square, and a sign "Swachh Gram" (text from locale).
- A weather vane or pennant shows wind direction. The HUD wind arrow matches it.
- Day and night cycle (about 3 minutes full cycle, disabled during consequence sequences so the look stays readable). Sky colour, sun position, fog and ambient light change smoothly.

### 6.2 Scale rules (fixes the "giant houses" defect)
- Farmer height is the unit reference (about 1.7 units).
- One-storey house: about 2.5 to 3 times farmer height tall and 5 to 7 units wide. Barn: about 4 times farmer height. Tractor: wheels about 0.7 times farmer height. Trees: about 3 to 5 times farmer height. Straw pile: about 1.2 times farmer height at full size.
- Put these in `layout.js` as named constants and write a test that fails if any model's bounding box deviates by more than 25% from its target.

### 6.3 Assets and materials
- Model source: Kenney low-poly packs for houses, trees, truck, barn, villager; procedural meshes for tractor, baler, seeder where Kenney lacks them. Respect licences and keep `ASSETS_LICENSES.md` updated.
- **Colour must always work.** Textures are applied with correct colour space and flip settings; if a texture fails to load, solid fallback materials apply (foliage green, trunks brown, walls warm off-white or clay, roofs terracotta, barn red, tractor green with yellow trim, tyres dark, villager clothing varied). A startup check logs an error if any model renders grey.
- Repeated objects (trees, houses, crop stalks, straw bundles) use instancing.
- **Crop:** instanced stalks (thin crossed blades), golden-green at harvest, green while growing, with wind sway tied to the wind speed. After harvest: stubble rows remain. Flat card quads are not acceptable.
- Farmer: readable low-poly character with a hat, simple walk and idle animation, cough animation. Villagers: at least four variants (adult, elder, child, woman with bundle), idle, walk, cough.

### 6.4 Lighting and rendering
- One directional sun with soft shadows on High and Medium, blob shadows on Low. Hemisphere ambient light. Subtle fog tied to the village haze value.
- Bloom (if used) is clamped so flames and sun glare never wash the screen white; no white-yellow blobs over buildings.
- Tone mapping set once and checked in screenshots on all tiers.

### 6.5 Fire and smoke VFX (critical)
- **Flames:** several tall flickering tongue meshes or sprites per burning pile, orange core, yellow tips, red edges, emissive, moving with the wind, plus ember particles and a warm point light on the ground. Visible at every tier.
- **Pile progression:** straw gold turns to charred black, height shrinks, glowing cracks early, grey ash at the end, all driven by `burnProgress`.
- **Smoke:** layered soft particles, dark grey to brown near the source, lighter with distance, rising then drifting along the wind vector toward the village, widening with distance. A subtle screen haze is allowed only at high exposure.
- **Debug hook:** `window.__wes_debug` exposes `getIgnitedPileScreenPos()`, `getCameraPose()`, `getVisibleOverlays()`, `getQualityTier()`, `getFps()` for tests.

### 6.6 Camera system
- Modes: `follow` (default), `orbit` (manual), `burn_focus`, `watch_village`, `alt_sequence`, `rewind`.
- Collision: the camera pose is tested against all colliders each frame; if inside, push out along the view line.
- `burn_focus` frames the ignited pile and the farmer and the start of the plume, computed from real positions and the viewport aspect ratio (portrait and landscape give different distances).
- `watch_village` computes its pose from the plume front and the two nearest houses (see S6) and verifies no collision.
- All modes return control to the player at the end.

### 6.7 Audio
- Ambient: birds by day, crickets at night, wind scaled by wind speed. Effects: footsteps, fire crackle (louder with burn progress), cough, tractor and baler engines, truck, UI clicks. Music: optional soft ambient bed, off by default on phones.
- Audio unlocks on the first tap. Master, music and effects sliders plus a mute toggle persist. A captions option shows short text cues.

---

## 7. AI SPECIFICATION

### 7.1 "Ask What Else" advisor (exists, keep and extend)
- Backend route `/api/advisor` with Gemini. Constraints: 300-character input limit, rate limit per IP and per session, system prompt that forbids invented statistics and requires citing only facts present in the provided context pack (the current scenario data and SOURCES.md excerpts), refuses off-topic requests, never gives medical advice.
- Receives the farm profile and the player's current state as context so answers are specific ("with your 5 acres of paddy in Telangana...").
- Offline fallback: a curated answer set keyed by intent, shown when the AI is unavailable, clearly labelled "offline answer".
- Output length capped (about 120 words), plain language, language follows the UI language.

### 7.2 AI scenario director (new)
Purpose: build a personalised scenario from region, crop and acres, so the AI plays a concrete role the funder can see.
- **Input:** `{state, crop, acres, season, language, playerHistorySummary}`.
- **AI output (strict JSON, schema-validated):** `{introStory, whyPeopleBurnHere (selected from a list of approved reason IDs), featuredAlternatives (ordered list of option keys), localHint (selected from approved hint IDs), villageName, eventSuggestion (event ID)}`. The AI chooses wording and selection only.
- **All numbers come from the data files** for that region and crop. If a figure is missing for the chosen region, use the nearest sourced figure labelled with its region (for example "Punjab figure") or "game estimate". The director never writes digits itself.
- **Validation:** JSON schema check, length limits, allowed-ID check, and a post-filter that rejects any output containing digits not found in the data files (this is a unit test too). On any failure use the deterministic offline scenario built from the same schema.
- Rate limited; responses cached per (state, crop, language) so repeated sessions do not call the model.

### 7.3 Later (post-MVP, but design the hooks)
- Voice input and read-aloud in regional languages.
- Photo recognition of crop residue or plastic waste, returning suggested alternatives with the same honesty rules.
- Per-player adaptive hints based on mistakes.

---

## 8. BACKEND, DATA AND API SPECIFICATION

### 8.1 Routes
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/health` | Health, version, DB status |
| POST | `/api/advisor` | Ask What Else advisor |
| POST | `/api/director/scenario` | AI scenario director (7.2) |
| POST | `/api/simulate/smoke` | Smoke exposure model |
| POST | `/api/sessions` | Create anonymous session (optional class code) |
| POST | `/api/sessions/{id}/events` | Log a game event (choice, rewind, comparison viewed, season finished) |
| POST | `/api/sessions/{id}/quiz` | Submit pre or post quiz answers |
| GET | `/api/sessions/{id}/summary` | Player's own results summary |
| POST | `/api/classes` | Create class, returns code and manage token |
| GET | `/api/classes/{code}/summary` | Aggregated results (requires manage token) |
| GET | `/api/classes/{code}/export.csv` | CSV export (requires manage token) |
| GET | `/api/content/{lang}` | Optional: serve locale and scenario content versions |

All routes: input validation (pydantic), length limits, rate limits, consistent error format `{error: {code, message}}`, CORS locked to the site origin.

### 8.2 Database (Postgres in production via `DATABASE_URL`, SQLite for local development)
Use migrations (Alembic or a small versioned SQL runner). Tables:
- `sessions(id, created_at, class_code NULL, language, farm_state, farm_crop, acres, client_version)`
- `events(id, session_id, ts, type, payload_json)` where `type` is one of: `season_start`, `decision`, `rewind`, `comparison_viewed`, `season_end`, `pledge`, `share`
- `quiz_attempts(id, session_id, kind PRE|POST, answers_json, score, ts)`
- `classes(code, created_at, manage_token_hash, label NULL)`
- No personal data columns. Hash the manage token. Index on `(class_code)`, `(session_id, ts)`.
- Retention note in README: anonymous data kept for research and improvement; provide a delete-by-session endpoint if the player asks.

### 8.3 Data files (all editable by the founder)
- `src/data/scenarios.json`: options, effects, costs, sources, verified flags (see 5.3).
- `src/data/regions.json`: per-state and per-crop figures with `region` tags and `needs_data` markers.
- `src/data/quiz.json`: 5 questions with options, correct answer, concept tag, explanation, source ID. Answers must be supported by `SOURCES.md`.
- `src/data/achievements.json`, `src/data/events.json`.
- `SOURCES.md`: numbered sources with title, publisher, year, URL, and the exact figure used. Every `source` field in data points to an ID here.
- A **data audit script** (`npm run audit:data`) fails the build if any shown figure lacks a source ID or `verified` flag, or if any figure with `verified: false` lacks the "game estimate" label key.

### 8.4 Analytics (anonymous, minimal)
Count: sessions, first choices, alternatives tried, rewinds, comparison views, quiz scores, time to first decision, season completion rate, device class (phone or desktop), quality tier used. No IP stored beyond rate limiting, no fingerprinting. Shown to teachers per class and to the founder in an admin summary endpoint protected by a secret header.

---

## 9. CONTENT AND LOCALISATION TASK RULES
- English is the source language. Telugu and Hindi are added by locale files; native-speaker review status tracked per string; `TRANSLATION_REVIEW_NOTES.md` explains how a reviewer marks strings `reviewed`.
- Keep sentences short. Avoid idioms. Use the same term for the same concept everywhere (a small glossary in `docs/GLOSSARY.md`: straw, stubble, residue, Happy Seeder, mulch, compost, exposure index).
- AI-generated text follows the UI language but is never marked `reviewed`.

---

## 10. PHASED TASK LIST

Format: **ID. Title.** What to do. *Acceptance* = how you prove it. Tick the box in `docs/PROGRESS.md` only after verification.
Phases must be completed in order. Inside a phase, do tasks in ID order.

### PHASE P0: STABILISE THE DEMO (fix everything known to be broken)
Goal: the burn demo is flawless on every viewport and every quality tier.

**P0-01. Overlay Manager is the single authority.** Register every card, chip, meter, callout, prompt and button with OverlayManager; implement priorities, queueing, collision avoidance and screen-edge clamping per 4.2. *Acceptance:* at every phase on every viewport, no two overlay elements overlap by more than 2 px, nothing is clipped by a screen edge, at most 2 world cards are visible at once. The automated check covers all elements with `data-overlay-id` and is verified to fail when a card is deliberately moved onto another.

**P0-02. Watch the village camera.** Implement `watch_village` per S6 and 6.6: compute pose from real plume and house positions, collide against all colliders, end on a view that shows the plume reaching at least two houses and villagers. *Acceptance:* screenshots on all six viewports show houses, villagers and plume; the camera pose is never inside a collider (test using `getCameraPose()`); control returns to the player.

**P0-03. Village and prop scale.** Apply 6.2 scale rules via `layout.js`; re-place the village. *Acceptance:* bounding-box test within 25% of targets; a screenshot shows farmer and a house with believable proportions.

**P0-04. Fire that reads as fire.** Implement flames, embers, firelight, pile progression and a dark drifting smoke plume per 6.5; clamp bloom. *Acceptance:* mid-burn screenshot (about 6 s) on every viewport and on the Low tier shows tall orange-yellow flame tongues at the pile and a dark plume heading toward the village, with no white blow-out. The pixel test samples the region around `getIgnitedPileScreenPos()` for flame colours and downwind region for dark smoke, and is verified to fail when the fire is disabled.

**P0-05. Models, colour, crop.** Fix colour-space and flip settings; ensure fallbacks work; tractor green with yellow trim and dark tyres; instanced crop stalks and stubble after harvest. *Acceptance:* decision-point screenshots on High, Medium and Low show green trees, coloured houses, coloured tractor and stalk crop; startup check reports zero grey models.

**P0-06. Phone layout pass.** Single-row HUD, bottom-sheet choice panel with all five options visible, camera cluster top-right, action buttons clear of joystick and look pad, season report with the badge not covering the title, safe-area insets. *Acceptance:* at 360x640, 390x844, 412x915: no horizontal scroll (`scrollWidth <= innerWidth`), no clipped HUD, every button at least 44 px, Next Season reachable without scrolling.

**P0-07. Honest numbers.** Run the data audit; every shown figure has a source or "game estimate"; remove "100% nitrogen lost"; ensure HUD money, callouts and report agree to the rupee; label option five "Compost (bio-decomposer)" with key `compost`. *Acceptance:* `npm run audit:data` passes; a test compares HUD money, callout amounts and report total after a burn.

**P0-08. Interaction safety.** No preselected option; Confirm required; Enter works only after highlighting; Space and Enter alone do nothing. *Acceptance:* test presses Enter and Space at the decision point and confirms no decision is made.

**P0-09. Performance governor.** 10 second grace, sustained-low rule, manual lock, tier visible in Settings only. *Acceptance:* test with a throttled frame rate shows no downgrade before 10 seconds and one downgrade after 5 sustained seconds; Settings shows the tier.

**P0-10. Test suite that can fail.** Rewrite e2e so each check has a negative control; run on all six viewports as independent projects; browser path from an environment variable; single generous timeout; flaky parallel runs must not fail others. Add: flame pixels, smoke pixels, overflow, HUD clipping, overlay overlap and clipping (all overlays, all phases), camera collision, max-2-cards, no console errors. *Acceptance:* a deliberate regression for each check makes the test fail; all green on a clean run.

**P0-11. Screenshot matrix.** Generate screenshots for decision, mid-burn (6 s), end of burn, watch village, season report, rewind, comparison, quiz, settings, on all six viewports and three quality tiers (reduced set for tiers: decision and mid-burn). Commit them in `tests/screenshots/`. *Acceptance:* files exist, named `<viewport>-<tier>-<screen>.png`; the report lists any screen that still looks wrong.

**P0-12. Console and error hygiene.** No errors in console during a full play session; deprecation warnings from owned code resolved; add an error boundary with a friendly reload. *Acceptance:* test asserts zero console errors and zero page errors for a full run.

**P0-13. Lint, format, CI.** Add lint and format scripts; GitHub Actions workflow running backend tests, build and e2e on push. *Acceptance:* CI green on `main`.

**P0-14. Phase gate review.** Antigravity reviews every screenshot against Section 4 and lists any remaining visual defect in `PROGRESS.md`; fix them. *Acceptance:* zero open visual defects, or each listed with a reason and ticket ID.

### PHASE P1: COMPLETE THE CORE LOOP
Goal: one full season plus rewind plus comparison plays end to end with polish.

**P1-01. Season state machine.** Extract an explicit machine per 5.1 with unit tests for valid and invalid transitions. *Acceptance:* tests pass; invalid transitions rejected.

**P1-02. Loading screen and mode select.** Implement S1 including waking-server message, language switch and Lite link. *Acceptance:* screenshots on all viewports; Quick Play reaches the decision in 10 seconds or less on the Low tier (report the measured number).

**P1-03. Sowing mini-game.** Short, skippable sowing interaction (tap or drag along rows) that visibly plants the field; feeds yield multiplier. *Acceptance:* playable on touch and mouse, skip works, planted rows visible.

**P1-04. Growing and harvest time-lapses.** Smooth time-lapse of crop growth and combine harvest; both skippable; leaves straw piles. *Acceptance:* piles appear where the choice will act; skip works at any moment.

**P1-05. Choice panel (S5).** Highlight, preview, confirm, source link, keyboard support. *Acceptance:* the five options with costs and effort; preview text for each; keyboard and touch flows tested.

**P1-06. Burn consequence timeline (S6).** Implement the timed table including docked meters, callout queue, soil cutaway panel and end buttons. *Acceptance:* timeline events fire at the specified times (within 1 s) in a test using the debug hook.

**P1-07. Soil cutaway panel.** Docked panel with labelled depths, microbes fading with heat. *Acceptance:* labels inside the panel; never overlaps other overlays.

**P1-08. Villagers.** Four variants, idle, walk, cough, reaction to plume arrival, and healthy behaviour when air is clean. *Acceptance:* cough animation and sound trigger on plume arrival; villagers move normally when no smoke.

**P1-09. Rewind and "What Else?".** Rewind effect, tried marks, repeat attempts logged. *Acceptance:* player can rewind three times and try three different options; history shows all attempts.

**P1-10. Comparison card (S8).** Two-column comparison with ranges and labels. *Acceptance:* appears after two different options tried; every figure has a source marker or "game estimate"; handles negative net money correctly.

**P1-11. Season report (S9).** Full layout and counters, share and replay buttons. *Acceptance:* matches S9 on all viewports; numbers agree with HUD.

**P1-12. Points, XP, rank, achievements, pledge, share (5.6, S11, S14).** Data-driven achievements (at least 12), unlock toasts, rank ladder, pledge card, share image. *Acceptance:* each achievement unlock is covered by a unit test; share image generated and downloadable.

**P1-13. Seasonal events (5.7).** Non-blocking event cards from `events.json`. *Acceptance:* never before the first decision, never during a sequence, closable, can be disabled.

**P1-14. Lite mode parity.** Lite 2D uses the same data, labels and locale; plastic-bottle scenario kept. *Acceptance:* Lite plays a full season; strings come from locale files.

**P1-15. Persistence (local).** Save and resume player state in the browser. *Acceptance:* refresh in any phase restores state or restarts the phase safely.

### PHASE P2: LEARNING LAYER (evidence for the pitch)
**P2-01. Quiz content.** Write `quiz.json` with 5 questions that test awareness of alternatives, soil effects and information gaps, each with a source ID; no invented statistics. *Acceptance:* data audit confirms every question has a source ID and an explanation.

**P2-02. Pre-check and post-check UI (S10).** Pre before the first decision; post after the first report; same questions shuffled. *Acceptance:* flows on all viewports, keyboard and touch; cannot skip accidentally; a "skip for now" exists but is logged.

**P2-03. Results view.** Before, after, change, concepts learned, honest message when no improvement. *Acceptance:* screenshots; correct maths verified by tests.

**P2-04. Quiz storage.** Local first, backend when session exists (see P3). *Acceptance:* attempts retrievable via `/api/sessions/{id}/summary` once P3 is done.

### PHASE P3: PERSISTENCE, SESSIONS AND CLASSES
**P3-01. Postgres.** Add `DATABASE_URL` support, SQLite fallback, migrations, connection pooling, health check shows DB type. Update `render.yaml` and the deploy guide to use a persistent database. *Acceptance:* backend tests run against both SQLite and Postgres (use a test container or CI service); redeploy does not wipe data.

**P3-02. Sessions and events API.** Implement `/api/sessions`, `/events`, `/quiz`, `/summary` with validation and rate limits. *Acceptance:* tests for valid, invalid, oversized and repeated requests; no personal data stored.

**P3-03. Client sync.** Queue events locally and send in the background; play never blocks on the network. *Acceptance:* with the network off, a full season plays and events sync later without duplicates.

**P3-04. Class code (student side).** Optional code field, validation, friendly errors. *Acceptance:* wrong code lets the player continue; right code tags the session.

**P3-05. Teacher dashboard (S12).** Create class, manage link, aggregated results, empty state, CSV export, privacy note. *Acceptance:* tests with synthetic sessions confirm aggregates; token required for summary and export; no individual-identifying data in the export.

**P3-06. Admin summary.** Protected summary endpoint for the founder (secret header). *Acceptance:* returns overall counts; rejects without the header.

### PHASE P4: AI FEATURES
**P4-01. Advisor hardening.** Context pack, rate limits, length limits, offline fallback, language-aware answers, refusals. *Acceptance:* tests for prompt injection ("ignore your rules"), off-topic requests, over-length input and no-key offline mode.

**P4-02. Your Farm screen (S2).** State, crop, acres, defaults, remember in Settings. *Acceptance:* screenshots; values feed the scenario.

**P4-03. Region data.** Create `regions.json` with figures per state and crop, `region` tags, and `needs_data` placeholders where the founder has not supplied data. *Acceptance:* audit shows every figure labelled with its region or "game estimate".

**P4-04. Scenario director backend.** Implement 7.2 with schema validation, approved ID lists, digit-leak filter, caching, rate limit, deterministic offline fallback. *Acceptance:* unit tests including the digit-leak test (inject a fabricated number and confirm rejection) and the offline fallback.

**P4-05. Scenario director in the game.** Intro story, village name, featured alternatives, local hint and event suggestion appear in the world and in the choice panel. *Acceptance:* two different farm profiles produce visibly different, correctly labelled scenarios; offline mode still works.

**P4-06. Advisor UI.** "Ask What Else" opens as a compact side card (desktop) or bottom sheet (phone), with three suggested questions, a clear "AI answer, check the sources" label. *Acceptance:* does not overlap the choice panel or HUD; 300-character counter.

### PHASE P5: ALTERNATIVES AND CARRY-OVER
**P5-01. Happy Seeder sequence.** Tractor and seeder model, driving path across the field, seed lines, mulch layer, clean air. *Acceptance:* 12 to 18 second sequence, visible on Low tier, screenshots at start, mid and end.

**P5-02. Bale and Sell sequence.** Baler, bales, truck, biomass plant on the horizon, net range callout including collection cost. *Acceptance:* sequence plays; money shown as a range that can be negative; sources shown.

**P5-03. Mulch sequence.** Spreading animation and soil panel increase. *Acceptance:* visible spreading; soil panel updates.

**P5-04. Compost sequence.** Spray, heap, steam, spreading. *Acceptance:* visible and distinct from mulch.

**P5-05. Carry-over visuals (5.5).** Soil colour, worm count, sky haze, villager state, village sign reflect state over seasons. *Acceptance:* a three-season test (burn, burn, Happy Seeder) shows clear world differences in screenshots and correct recovery; floors respected.

**P5-06. Season 2 and 3 balance.** Tune data so each option has a distinct trade-off; no dominant option without a trade-off. *Acceptance:* a simulation script plays all option sequences for 3 seasons and prints results in a table in `docs/BALANCE_REPORT.md`; no negative infinite loops; recovery possible.

### PHASE P6: LANGUAGES
**P6-01. Locale layer.** Move every string to locale files; ban hard-coded strings with a lint rule or test. *Acceptance:* test fails if a component renders a literal user-facing string.

**P6-02. Telugu and Hindi.** Add `te.json` and `hi.json`, status flags, fonts, layout tested for longer strings. *Acceptance:* screenshots in all three languages on phone and desktop with no clipping; each string has a status; `TRANSLATION_REVIEW_NOTES.md` explains the review workflow.

**P6-03. AI language.** Advisor and director respond in the UI language; fallback content exists in all three languages. *Acceptance:* tests for each language.

### PHASE P7: AUDIO, ACCESSIBILITY, STABILITY
**P7-01. Soundscape (6.7).** Ambient, effects, music, unlock on first tap, sliders, mute, persistence. *Acceptance:* audio manager tests; Settings controls work; no audio before first tap.

**P7-02. Captions.** Short caption cues for key sounds when enabled. *Acceptance:* captions never overlap the choice panel or callouts.

**P7-03. Reduced motion and colour-blind-safe meters.** Implement per 3.4. *Acceptance:* screenshots with each setting; reduced motion removes camera shake and orbit sweeps.

**P7-04. Keyboard and screen-reader pass.** Tab order, focus ring, labels, escape handling. *Acceptance:* keyboard-only test completes a full season; automated accessibility scan reports no critical issues.

**P7-05. WebGL loss and low-end fallback.** Handle context loss; offer retry or Lite mode; detect very low-end devices and recommend Lite. *Acceptance:* simulated context loss shows the fallback; Lite loads.

### PHASE P8: PERFORMANCE, PHONES, PWA
**P8-01. Asset diet.** Compress textures, reuse materials, instance repeated objects, lazy-load heavy models after the loading screen, report bundle and asset sizes in `docs/PERFORMANCE.md`. *Acceptance:* report committed with numbers; Quick Play budget met.

**P8-02. Memory and disposal.** Dispose geometries, materials, textures and particle buffers on every phase change. *Acceptance:* three-season soak test shows no steady growth in heap or GPU resources (use renderer.info counters).

**P8-03. Quality-tier verification.** Run decision and burn on High, Medium and Low; confirm nothing is stripped on Low. *Acceptance:* screenshots; flame and smoke pixel tests pass on Low.

**P8-04. Real-device test protocol.** Write `docs/REAL_DEVICE_TEST.md`: a checklist the founder runs on at least one low-end Android and one mid-range phone, with a form to record fps, tier chosen, and issues. Antigravity cannot run this; mark it `FOUNDER_ACTION`. *Acceptance:* document exists and is clear.

**P8-05. PWA.** Manifest, icons, offline shell, update flow that never serves a stale build, install prompt in Settings. *Acceptance:* Lighthouse PWA check passes the installable criteria; update test shows the new version loads.

### PHASE P9: DEPLOYMENT, PRIVACY, DOCS
**P9-01. Render config.** `render.yaml` with Postgres, environment variables, health check; `.env.example` complete; free-plan wake-up handling. *Acceptance:* a fresh deploy from the repo works following the guide.

**P9-02. Monitoring.** Basic logging, error counters, a status page route. *Acceptance:* errors appear in logs with request IDs.

**P9-03. Privacy and sources pages.** Privacy note, data retention statement, a Sources page listing every `SOURCES.md` entry with the figure used and where it appears. *Acceptance:* every in-game figure links to a source entry or is labelled "game estimate".

**P9-04. README and docs.** README with quick start, architecture diagram, test commands, deployment, data editing guide for the founder (how to change a cost, add a source, add a language string). *Acceptance:* a new developer can run the project in 10 minutes using only the README.

**P9-05. Licences.** `ASSETS_LICENSES.md` for models, fonts and sounds. *Acceptance:* each asset family listed with licence and URL.

### PHASE P10: PITCH SUPPORT FEATURES
**P10-01. Demo mode.** A hidden URL flag (`?demo=1`) that runs a scripted 90 second demonstration (start at decision, burn, watch village, rewind, Happy Seeder, comparison) with on-screen chapter captions and no failure paths. *Acceptance:* runs unattended and repeatably; screenshots for each chapter.

**P10-02. Press-kit capture.** A script that records the screenshot set and short clips for the deck and video (`npm run capture`). *Acceptance:* outputs saved in `press/` with consistent names.

**P10-03. One-page results summary.** From class data, produce a printable summary (players, quiz change) for pilot reports. *Acceptance:* generated from synthetic data in tests; clearly labelled "pilot data" when real, "sample data" when synthetic.

### PHASE P11: POST-MVP BACKLOG (do not start before P0 to P10 pass)
- 3D plastic waste scenario on the same engine.
- Photo mode and photo recognition of residue or plastic.
- Voice input and read-aloud in regional languages.
- AR and VR feasibility notes (research document only).
- More crops, regions and everyday-choice scenarios (energy, water, food).
- Better character models and a licensed music bed.
- Teacher lesson plan export.

---

## 11. VERIFICATION PROTOCOL (run at every gate)

### 11.1 Automated checks (all must be green)
1. Backend: `python -m pytest` (all tests, SQLite and Postgres modes once P3 is done).
2. Frontend: lint, format check, unit tests, `npm run build`.
3. Data audit: `npm run audit:data` (sources, verified flags, estimate labels, locale keys).
4. End-to-end: Playwright on all six viewports, independent projects, software-GL friendly, browser path from `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
5. Every e2e check has a negative control that was proven to fail once.

### 11.2 End-to-end flow (must pass on every viewport)
Load, choose Quick Play, (Your Farm), pre-check, reach the decision, orbit and zoom and reset the camera, highlight and confirm Burn, watch the 20 second burn with flame and smoke pixels, Watch the village, Continue, season report, Next Season, rewind and try Happy Seeder, open the comparison, post-check and results, open Settings and change language, switch to Lite mode and back. Zero console errors, zero page errors.

### 11.3 Visual review checklist (look at the screenshots, do not just run tests)
For each screenshot in the matrix, tick:
- [ ] No two overlay elements overlap
- [ ] Nothing is clipped at a screen edge
- [ ] The farmer's head and the pile are never covered
- [ ] HUD in one row, nothing wrapped or cut off
- [ ] Flames clearly visible; smoke dark and drifting toward the village; no white blow-out
- [ ] Trees green, houses coloured, tractor coloured, crop is stalks not cards
- [ ] House and prop scale believable next to the farmer
- [ ] Every number has a unit and either a source or "game estimate"
- [ ] Buttons at least 44 px on phone and clear of the joystick and look pad
- [ ] Text readable (contrast, size, no truncation) in all three languages
- [ ] The panel style matches Section 4.1 (dark glass, no cartoon buttons)

### 11.4 Manual and founder checks (Antigravity cannot do these; record them as FOUNDER_ACTION)
- Run `docs/REAL_DEVICE_TEST.md` on real phones, including a low-end Android.
- Native-speaker review of Telugu and Hindi.
- Supply verified Andhra Pradesh and Telangana data for costs and practices.
- Run at least 15 to 20 playtests and one class pilot.

### 11.5 Regression rule
After every phase, re-run the complete earlier suites. A phase that breaks an earlier phase fails its gate.

---

## 12. MVP ACCEPTANCE CHECKLIST (the finish line)
- [ ] 3 minute live demo runs with no crash, overlap, clipped element or unlabelled number, on desktop and phone.
- [ ] A 10 minute classroom session works with a class code, with quiz before and after, and the teacher sees anonymous results and can export CSV.
- [ ] All five options play a complete, visible, distinct sequence.
- [ ] Burn shows real flames, a drifting smoke plume, coughing villagers, soil cutaway and money loss, on the Low tier too.
- [ ] Rewind and comparison work and show ranges with sources or estimate labels.
- [ ] Carry-over visibly changes the world across three seasons.
- [ ] Your Farm and the AI scenario director produce different scenarios for different farms, with all numbers from data files.
- [ ] Advisor is safe, rate limited, offline-capable.
- [ ] English, Telugu and Hindi complete, with review status recorded.
- [ ] Postgres persists data across redeploys.
- [ ] Accessibility baseline met (3.4).
- [ ] PWA installs and updates without serving a stale build.
- [ ] Data audit, backend tests, build and e2e on six viewports are green in CI.
- [ ] Sources page and privacy note live.
- [ ] Demo mode and press-kit capture work.
- [ ] README lets a new developer run everything in 10 minutes.

---

## 13. KNOWN DEFECT REGISTER (from independent reviews up to commit 4be0ccb)
Antigravity: re-test each item. Mark `FIXED` only with a screenshot or test. These map to the P0 tasks.

| ID | Defect | Seen on | Task |
|----|--------|---------|------|
| D1 | Watch-the-village camera ends against or inside a house wall; village not shown | desktop and phone | P0-02 |
| D2 | Houses far too large compared with the farmer | desktop | P0-03 |
| D3 | More than 2 world cards visible at once during consequence; cards overlap each other and the smoke meter | desktop and phone | P0-01 |
| D4 | Air-station card clipped at the right edge; buttons overlap callout and joystick | phone | P0-01, P0-06 |
| D5 | Flames are a thin red spike at the pile; white-yellow glare blob over background houses | desktop | P0-04 |
| D6 | No clearly visible dark smoke plume during the burn | desktop and phone | P0-04 |
| D7 | Smoke meter overlaps the Settings button and camera cluster; soil card overlaps the look pad | phone | P0-01 |
| D8 | Tractor renders black; crop looks like flat green cards | desktop | P0-05 |
| D9 | The existing overlap test passes while overlaps exist (it only checks elements with a specific attribute at one moment) | tests | P0-10 |
| D10 | A parallel run of two browsers on software GL caused a 25 second wait to time out | tests | P0-10 |
| D11 | SQLite on Render is wiped on redeploy | backend | P3-01 |
| D12 | Telugu removed from game UI | frontend | P6-02 |
| D13 | Placeholder figures marked `verified: false` need labels or sources | data | P0-07 |

Already fixed and confirmed in review (keep them working): 360-degree orbit and zoom, Quick Play to the decision, choice panel on the right on desktop, no auto-opened report, camera cluster size and position, single-row HUD on phone, white box removed, trees green and houses coloured, burn camera frames the pile, balance updates to 9k after a burn, "game estimate" labels on the money callouts.

---

## 14. DATA THE FOUNDER MUST SUPPLY (mark as `needs_data`, never invent)
1. Verified costs and practices for Andhra Pradesh and Telangana (Happy Seeder hire, baler and transport, mulching, bio-decomposer cost, yields).
2. Local timing and rules (burning bans, penalties) if the game will mention them; otherwise omit.
3. Any survey data the founder collects (none exists yet; the game and pitch must not state survey numbers that are not in `SOURCES.md`).
4. Native-speaker reviewers for Telugu and Hindi.
5. Company details for the About page: incorporation year, location, team size, contact.
6. Pitch deadline, funding amount and use of funds (for the pitch material, not the game).

Figures already researched and cited (recheck before a live pitch): crop residue burned in India about 92 million tonnes per year (NPMCR 2019; other estimates about 87 to 116 million); plastic waste about 3.47 million tonnes generated in 2019 to 20 with about 1.58 million tonnes recycled (CPCB; estimates vary, show the range); the awareness-gap survey results (CEEW Punjab; RGICS) quoted exactly as in `SOURCES.md`.

---

## 15. RISK REGISTER
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Low-end phones cannot run the 3D scene | Demo fails for rural users | Quality tiers that never strip essentials, Lite mode fallback, real-device protocol |
| Free Render plan sleeps | First load slow in demo | Waking message, keep-alive ping before demos, paid plan for pilots |
| AI gives wrong or invented facts | Credibility damage | Context-pack only, digit filter, schema validation, offline fallback |
| Unsourced or placeholder numbers | Funder or teacher distrust | Data audit gate, "game estimate" labels |
| Scope creep | MVP never finishes | Phase gates, P11 backlog frozen until P10 passes |
| Tests that cannot fail | False confidence | Negative controls required by P0-10 |
| Translation errors | Offence or confusion | Review status, native reviewers, AI text never marked reviewed |
| Student data privacy | Legal and trust risk | Anonymous sessions, aggregates only, privacy note, delete endpoint |

---

## APPENDIX A: `docs/PROGRESS.md` TEMPLATE
```
# Progress ledger
## Phase P0   (started YYYY-MM-DD)
| Task | Audit status (DONE/PARTIAL/MISSING/BROKEN) | Work done | Files | Evidence (screenshot / test names) | Verified? |
|------|-------------------------------------------|-----------|-------|------------------------------------|-----------|
| P0-01 | BROKEN | ... | ... | ... | no |
### Gate result: OPEN / PASSED (date)
### Open issues and decisions
```

## APPENDIX B: PHASE REPORT FORMAT (reply to the founder after each phase)
1. One-line result: gate PASSED or OPEN.
2. Table: task, status (DONE / PARTIAL / NOT DONE), files changed, evidence.
3. Test results: counts for backend, unit, e2e per viewport, data audit.
4. Screenshot list and any screen that still looks wrong.
5. Things you could not verify (for example real-phone frame rate) and why.
6. Founder actions needed.
7. Commit list pushed to `main`.

## APPENDIX C: COMMIT MESSAGE EXAMPLES
`fix(overlay): P0-01 queue world cards and clamp to safe area`
`feat(quiz): P2-02 pre and post check flows`
`test(e2e): P0-10 add negative controls for flame and overlap checks`
`chore(db): P3-01 postgres with migrations and sqlite fallback`

## APPENDIX D: GLOSSARY
Straw / stubble / residue: leftover plant material after harvest. Happy Seeder: a tractor-mounted machine that sows seed directly through residue. Bale and Sell: collecting straw in bales for sale, for example to a biomass plant. Mulch: spreading residue on the soil as cover. Compost (bio-decomposer): breaking residue down with a decomposer solution. Exposure index: a 0 to 100 game-model value for simulated smoke exposure, not a measured air-quality reading. Game estimate: a figure that is not from a verified source.
