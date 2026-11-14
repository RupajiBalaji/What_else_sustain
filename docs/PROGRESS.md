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

## Phase P1: Complete the Core Loop (started 2026-11-14)

| Task | Audit status (DONE/PARTIAL/MISSING/BROKEN) | Work done | Files | Evidence (screenshot / test names) | Verified? |
|------|-------------------------------------------|-----------|-------|------------------------------------|-----------|
| P1-01 | MISSING | Extract explicit season state machine per 5.1 with unit tests | `src/game3d/state/seasonMachine.js`, `tests/unit/seasonMachine.test.js` | Unit tests for valid/invalid transitions | no |
| P1-02 | DONE | S1 Loading screen with Quick Play and Full Season modes, language switch, waking server notice | `LoadingScreen.jsx` | Screenshots on all viewports, Quick Play <10s | yes |
| P1-03 | DONE | Sowing mini-game with timing meter, planting rows visible, skip option | `SowingMiniGame.jsx` | Playable on touch & mouse | yes |
| P1-04 | DONE | Growing time-lapse and harvest combine sequence with skip | `GrowingTimeLapse.jsx`, `CombineHarvester.jsx` | Skip button functional, piles spawned | yes |
| P1-05 | DONE | S5 Choice panel with 5 options, highlight, preview, confirm, device-aware hint | `InWorldChoicePanel.jsx` | All 5 options verified across viewports | yes |
| P1-06 | DONE | S6 Burn consequence timeline (0-20s), docked meters, plume, coughs, callouts, end buttons | `Game3DContext.jsx`, `SmokeMeterHUD.jsx`, `Villagers.jsx` | Timeline events verified | yes |
| P1-07 | DONE | Soil cutaway panel with labelled depths (0cm, -25cm, -50cm) and fading microbes | `SoilCutawayCrossSection.jsx` | Docked plaque, non-overlapping | yes |
| P1-08 | DONE | Villagers 4 variants, idle, walk, cough on plume arrival | `Villagers.jsx` | Animated head bob & procedural cough audio | yes |
| P1-09 | PARTIAL | "What Else?" rewind button with reverse time-lapse, tried marks, history tracking | `RewindGlitchOverlay.jsx`, `Game3DContext.jsx` | Rewind flow integration | in progress |
| P1-10 | PARTIAL | S8 Comparison card (Option A vs Option B) with ranges, sources, and takeaway | `ComparisonSliderModal.jsx` | Two-column comparison after 2 choices | in progress |
| P1-11 | DONE | S9 Season report modal with rank badge, financial metrics, soil & air deltas, streak | `SeasonReportModal.jsx` | Responsive layout, numbers match HUD | yes |
| P1-12 | PARTIAL | 12 structured achievements, unlock toasts, rank ladder, pledge card, share image | `AchievementsPanel.jsx`, `gameBalance.js` | Achievements verified in tests | in progress |
| P1-13 | DONE | Seasonal non-blocking events from events.json, closable | `SeasonalEventModal.jsx` | Non-blocking, never before decision | yes |
| P1-14 | DONE | Lite mode parity using shared scenarios.json data, labels, and locale | `ScenarioPlayer.jsx` | Lite mode full season playable | yes |
| P1-15 | DONE | Local browser persistence for player state across reloads | `Game3DContext.jsx` | LocalStorage session persistence | yes |

### Gate result: OPEN
