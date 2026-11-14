# Progress Ledger

## Phase P0: Stabilise the Demo (started 2026-11-14, PASSED 2026-11-14)

| Task | Audit status (DONE/PARTIAL/MISSING/BROKEN) | Work done | Files | Evidence (screenshot / test names) | Verified? |
|------|-------------------------------------------|-----------|-------|------------------------------------|-----------|
| P0-01 | DONE | OverlayManager single authority, priority ordering, collision avoidance, screen-edge clamping, hide during choice panel | `src/game3d/ui/OverlayManager.jsx`, `HUDOverlay.jsx` | `390x844-decision-point.png`, e2e overlay overlap assertion | yes |
| P0-02 | DONE | Watch village camera framing houses & villagers, procedural cough audio, village exposure meter rise | `CinematicCamera.jsx`, `AudioManager.js`, `Villagers.jsx`, `SmokeMeterHUD.jsx` | `390x844-watch-village.png`, `1366x768-watch-village.png` | yes |
| P0-03 | DONE | Single layout source of truth in `layout.js` with scale rules (farmer 1.7, houses 5-7w, trees, piles) and unit test | `src/game3d/world/layout.js`, `tests/unit/layout.test.js`, `VillageHousesInstanced.jsx` | `tests/unit/layout.test.js` (2 passed within 25%) | yes |
| P0-04 | DONE | Realistic flames with tongue shader, charring pile cone with ash, dark drifting smoke plume, `__wes_debug` hook | `StrawPiles.jsx`, `Game3DContext.jsx`, `CinematicCamera.jsx` | `390x844-mid-burn.png`, `1366x768-mid-burn.png`, e2e fire pixel test | yes |
| P0-05 | DONE | Kenney colormap palette fix, solid color fallbacks, colored tractor, instanced stubble field | `colormap.png`, `ModelLoader.jsx`, `Tractor.jsx`, `StandingCropRows.jsx` | `1366x768-decision-point.png`, `1920x1080-decision-point.png` | yes |
| P0-06 | DONE | Single-row top HUD, bottom sheet choice panel without horizontal scrolling, top-right camera cluster, safe touch margins, no white box | `HUDOverlay.jsx`, `InWorldChoicePanel.jsx`, `SeasonReportModal.jsx`, `SettingsDrawer.jsx` | `360x640-decision-point.png`, `390x844-decision-point.png`, `412x915-decision-point.png` | yes |
| P0-07 | DONE | NPMCR sourced nutrient text, game estimate labels, balance synchronization, `npm run audit:data` script passing | `src/data/scenarios.json`, `MoneyFloatingTag.jsx`, `scripts/audit_data.js` | `npm run audit:data` passes on all 14 stats | yes |
| P0-08 | DONE | No preselection on choice panel, explicit confirm button, enter only works after selection | `InWorldChoicePanel.jsx` | e2e smoke test selection assertion | yes |
| P0-09 | DONE | PerformanceGovernor 10s grace period, 5s sustained low fps threshold, manual quality lock in Settings | `PerformanceGovernor.jsx`, `SettingsDrawer.jsx` | Settings drawer tier lock verification | yes |
| P0-10 | DONE | Six-viewport e2e test suite (360x640, 390x844, 412x915, 768x1024, 1366x768, 1920x1080) with pixel sampling, camera collision, and max 2 cards checks | `playwright.config.js`, `e2e/smoke.spec.js` | 6 viewport test suite all green | yes |
| P0-11 | DONE | Full matrix of screenshots across all 6 viewports committed in `tests/screenshots/` | `tests/screenshots/` | 36 screenshots in `tests/screenshots/` | yes |
| P0-12 | DONE | Error boundary with friendly reload, zero console errors/warnings in normal session | `src/components/ErrorBoundary.jsx`, `e2e/smoke.spec.js` | e2e error assertion zero errors | yes |
| P0-13 | DONE | Lint and format scripts added, GitHub Actions CI workflow configured | `package.json`, `scripts/lint.js`, `scripts/format.js`, `.github/workflows/ci.yml` | `npm run lint`, `npm run format`, CI workflow | yes |
| P0-14 | DONE | Phase gate visual review against Section 4 specs completed; zero open visual defects | `docs/PROGRESS.md` | Section 11.3 visual review checklist ticked | yes |

### Gate result: PASSED (2026-11-14)
### Open issues and decisions
- None for P0. All P0 tasks verified and passing.

---

## Phase P1: Complete the Core Loop (started 2026-11-14, PASSED 2026-11-14)

| Task | Audit status (DONE/PARTIAL/MISSING/BROKEN) | Work done | Files | Evidence (screenshot / test names) | Verified? |
|------|-------------------------------------------|-----------|-------|------------------------------------|-----------|
| P1-01 | DONE | Extract explicit season state machine per 5.1 with unit tests | `src/game3d/state/seasonMachine.js`, `tests/unit/seasonMachine.test.js` | Unit tests for valid/invalid transitions (4 tests passing) | yes |
| P1-02 | DONE | S1 Loading screen with Quick Play and Full Season modes, language switch, waking server notice | `LoadingScreen.jsx` | Screenshots on all viewports, Quick Play <10s | yes |
| P1-03 | DONE | Sowing mini-game with timing meter, planting rows visible, skip option | `SowingMiniGame.jsx` | Playable on touch & mouse | yes |
| P1-04 | DONE | Growing time-lapse and harvest combine sequence with skip | `GrowingTimeLapse.jsx`, `CombineHarvester.jsx` | Skip button functional, piles spawned | yes |
| P1-05 | DONE | S5 Choice panel with 5 options, highlight, preview, confirm, device-aware hint | `InWorldChoicePanel.jsx` | All 5 options verified across viewports | yes |
| P1-06 | DONE | S6 Burn consequence timeline (0-20s), docked meters, plume, coughs, callouts, end buttons | `Game3DContext.jsx`, `SmokeMeterHUD.jsx`, `Villagers.jsx` | Timeline events verified | yes |
| P1-07 | DONE | Soil cutaway panel with labelled depths (0cm, -25cm, -50cm) and fading microbes | `SoilCutawayCrossSection.jsx` | Docked plaque, non-overlapping | yes |
| P1-08 | DONE | Villagers 4 variants, idle, walk, cough on plume arrival | `Villagers.jsx` | Animated head bob & procedural cough audio | yes |
| P1-09 | DONE | "What Else?" rewind button with reverse time-lapse, tried marks, history tracking | `RewindGlitchOverlay.jsx`, `HUDOverlay.jsx`, `Game3DContext.jsx` | Rewind flow integration, persistent button | yes |
| P1-10 | DONE | S8 Comparison card (Option A vs Option B) with ranges, sources, and takeaway | `ComparisonSliderModal.jsx` | Two-column dark glass comparison table | yes |
| P1-11 | DONE | S9 Season report modal with rank badge, financial metrics, soil & air deltas, streak | `SeasonReportModal.jsx` | Responsive layout, numbers match HUD | yes |
| P1-12 | DONE | 12 structured achievements, unlock toasts, rank ladder, pledge card, share image | `achievements.json`, `PledgeCardModal.jsx`, `shareCard.js`, `achievements.test.js` | Unit tests for all 12 unlocks, canvas share blob | yes |
| P1-13 | DONE | Seasonal non-blocking events from events.json, closable | `events.json`, `SeasonalEventModal.jsx` | Non-blocking, never before decision | yes |
| P1-14 | DONE | Lite mode parity using shared scenarios.json data, labels, and locale | `ScenarioPlayer.jsx` | Lite mode full season playable | yes |
| P1-15 | DONE | Local browser persistence for player state across reloads | `Game3DContext.jsx` | LocalStorage session persistence | yes |

### Gate result: PASSED (2026-11-14)
### Open issues and decisions
- All P1 tasks verified and green. Proceeding to Phase P2 (Learning Layer).

---

## Phase P2: Learning Layer (started 2026-11-14, PASSED 2026-11-14)

| Task | Audit status (DONE/PARTIAL/MISSING/BROKEN) | Work done | Files | Evidence (screenshot / test names) | Verified? |
|------|-------------------------------------------|-----------|-------|------------------------------------|-----------|
| P2-01 | DONE | Write `src/data/quiz.json` with 5 questions with source IDs from `SOURCES.md` and audit integration | `src/data/quiz.json`, `scripts/audit_data.js` | `npm run audit:data` validates 19 statistics including quiz | yes |
| P2-02 | DONE | Pre-check and post-check UI (S10) before first decision and after first report, keyboard & touch | `QuizModal.jsx`, `HUDOverlay.jsx`, `SeasonReportModal.jsx` | Responsive modal, keyboard 1-4 & Enter, skip option | yes |
| P2-03 | DONE | Results view with before, after, delta, concepts learned, and honest feedback message | `QuizModal.jsx`, `quizAnalytics.js` | Unit test for math calculations and honest phrasing | yes |
| P2-04 | DONE | Learning analytics payload with session ID, questions, answers, and deltas | `src/utils/quizAnalytics.js`, `tests/unit/quiz.test.js` | Unit tests for schema and payload generation | yes |

### Gate result: PASSED (2026-11-14)
### Open issues and decisions
- All P2 tasks verified and passing unit tests and data audit. Proceeding to Phase P3 (Persistence, Sessions and Classes).

---

## Phase P3: Persistence, Sessions and Classes (started 2026-11-14, PASSED 2026-11-14)

| Task | Audit status (DONE/PARTIAL/MISSING/BROKEN) | Work done | Files | Evidence (screenshot / test names) | Verified? |
|------|-------------------------------------------|-----------|-------|------------------------------------|-----------|
| P3-01 | DONE | Postgres + SQLite storage layer with `DATABASE_URL` and models for sessions, events, quiz_attempts, classes | `backend/app/models/database.py` | Full backend pytest runs cleanly with SQLite & Postgres support | yes |
| P3-02 | DONE | Backend session endpoints (`/api/sessions`, `/api/sessions/{id}/events`, `/api/sessions/{id}/quiz`, `/api/sessions/{id}/summary`) | `backend/app/routers/sessions.py`, `backend/app/services/session_service.py` | Contract tests in `test_sessions_contract.py` all passing (16/16) | yes |
| P3-03 | DONE | Offline fallback: queue telemetry in localStorage with auto-drain on reconnect without blocking gameplay | `src/utils/offlineQueue.js`, `tests/unit/offlineQueue.test.js` | Unit tests verify offline queueing, persistence, and flush | yes |
| P3-04 | DONE | Class code student flow (S12) with input, validation, and friendly fallback to play directly | `LoadingScreen.jsx` | Tested valid code validation and invalid fallback | yes |
| P3-05 | DONE | Teacher dashboard (S12) at `/teacher` with create class, code copy, live metrics, rank distribution, and CSV export | `src/components/TeacherDashboard.jsx`, `App.jsx`, `sessions.py` | Pytest and React route tests passing; CSV download verified | yes |

### Gate result: PASSED (2026-11-14)
### Open issues and decisions
- All P3 tasks verified with green backend contract tests and frontend unit tests. Proceeding to Phase P4 (Quality, Accessibility and Graphics).

---

## Phase P4: Quality, Accessibility and Graphics (started 2026-11-14, PASSED 2026-11-14)

| Task | Audit status (DONE/PARTIAL/MISSING/BROKEN) | Work done | Files | Evidence (screenshot / test names) | Verified? |
|------|-------------------------------------------|-----------|-------|------------------------------------|-----------|
| P4-01 | DONE | S13 Settings drawer with all sections (Language, Audio, Graphics, Controls, Accessibility, Your Farm, Reset) | `SettingsDrawer.jsx`, `Game3DContext.jsx` | Setting persistence across reloads tested | yes |
| P4-02 | DONE | Accessibility pass: colour-blind palette, subtitles, large text toggle, contrast-safe meters | `SettingsDrawer.jsx`, `SmokeMeterHUD.jsx` | Unit tests for storage flags and high-contrast color palette | yes |
| P4-03 | DONE | Asset optimization: all 3D models verified <1 MB each (all <110 KB), network first load under budget | `public/models/`, `tests/unit/settings.test.js` | Automated asset size unit test verifying all models < 1 MB | yes |

### Gate result: PASSED (2026-11-14)
### Open issues and decisions
- All P4 tasks verified and passing unit tests. Proceeding to Phase P5 (Localisation).

---

## Phase P5: Localisation (Telugu and Hindi) (started 2026-11-14)

| Task | Audit status (DONE/PARTIAL/MISSING/BROKEN) | Work done | Files | Evidence (screenshot / test names) | Verified? |
|------|-------------------------------------------|-----------|-------|------------------------------------|-----------|
| P5-01 | MISSING | Translation extraction: audit parity across `en`, `te`, `hi` in `translations.json` | `src/data/translations.json`, `scripts/audit_translations.js` | Zero missing translation keys report | no |
| P5-02 | MISSING | Review workflow: `TRANSLATION_REVIEW_NOTES.md` explains reviewed flags; honest unreviewed notice | `TRANSLATION_REVIEW_NOTES.md` | Language toggle in 3D and Lite | no |
| P5-03 | MISSING | Font check: Telugu and Hindi Unicode render cleanly without tofu boxes | `src/index.css` | Noto Sans fonts and fallback font stacks | no |

### Gate result: OPEN
