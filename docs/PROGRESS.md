# Progress Ledger

## Phase P0: Stabilise the Demo (started 2026-11-14)

| Task | Audit status (DONE/PARTIAL/MISSING/BROKEN) | Work done | Files | Evidence (screenshot / test names) | Verified? |
|------|-------------------------------------------|-----------|-------|------------------------------------|-----------|
| P0-01 | DONE | OverlayManager single authority, priority ordering, collision avoidance, screen-edge clamping, hide during choice panel | `src/game3d/ui/OverlayManager.jsx`, `HUDOverlay.jsx` | `390x844-decision-point.png`, e2e overlay overlap assertion | yes |
| P0-02 | DONE | Watch village camera framing houses & villagers, procedural cough audio, village exposure meter rise | `CinematicCamera.jsx`, `AudioManager.js`, `Villagers.jsx`, `SmokeMeterHUD.jsx` | `390x844-watch-village.png`, `1366x768-watch-village.png` | yes |
| P0-03 | PARTIAL | Scale rules implemented in asset manifest; extract to `layout.js` single source of truth and add bounding box test | `src/game3d/world/layout.js`, `tests/unit/layout.test.js` | Unit test for bounding box targets within 25% | in progress |
| P0-04 | DONE | Realistic flames with tongue shader, charring pile cone with ash, dark drifting smoke plume, `__wes_debug` hook | `StrawPiles.jsx`, `Game3DContext.jsx`, `CinematicCamera.jsx` | `390x844-mid-burn.png`, `1366x768-mid-burn.png`, e2e fire pixel test | yes |
| P0-05 | DONE | Kenney colormap palette fix, solid color fallbacks, colored tractor, instanced stubble field | `colormap.png`, `ModelLoader.jsx`, `Tractor.jsx`, `StandingCropRows.jsx` | `1366x768-decision-point.png`, `1920x1080-decision-point.png` | yes |
| P0-06 | DONE | Single-row top HUD, bottom sheet choice panel without horizontal scrolling, top-right camera cluster, safe touch margins, no white box | `HUDOverlay.jsx`, `InWorldChoicePanel.jsx`, `SeasonReportModal.jsx`, `SettingsDrawer.jsx` | `360x640-decision-point.png`, `390x844-decision-point.png`, `412x915-decision-point.png` | yes |
| P0-07 | PARTIAL | NPMCR sourced nutrient text, game estimate labels, balance synchronization; add `npm run audit:data` script | `src/data/scenarios.json`, `MoneyFloatingTag.jsx`, `scripts/audit_data.js` | Data audit script run | in progress |
| P0-08 | DONE | No preselection on choice panel, explicit confirm button, enter only works after selection | `InWorldChoicePanel.jsx` | e2e smoke test selection assertion | yes |
| P0-09 | DONE | PerformanceGovernor 10s grace period, 5s sustained low fps threshold, manual quality lock in Settings | `PerformanceGovernor.jsx`, `SettingsDrawer.jsx` | Settings drawer tier lock verification | yes |
| P0-10 | PARTIAL | Multi-viewport e2e tests with negative controls, adding 6th viewport (768x1024 Tablet portrait) | `playwright.config.js`, `e2e/smoke.spec.js` | 6 viewport test suite | in progress |
| P0-11 | PARTIAL | Generate full matrix of screenshots across all 6 viewports and quality tiers | `tests/screenshots/` | Screenshots committed in `tests/screenshots/` | in progress |
| P0-12 | DONE | Error boundary with friendly reload, zero console errors/warnings in normal session | `src/components/ErrorBoundary.jsx`, `e2e/smoke.spec.js` | e2e error assertion zero errors | yes |
| P0-13 | MISSING | Add lint, format, and GitHub Actions CI workflow | `package.json`, `.github/workflows/ci.yml` | `npm run lint`, `npm run format`, CI workflow | in progress |
| P0-14 | PARTIAL | Phase gate visual review against Section 4 specs | `docs/PROGRESS.md` | Verification checklist | in progress |

### Gate result: OPEN
### Open issues and decisions
- Creating `src/game3d/world/layout.js` as single source of truth for scene coordinates and scales per P0-03.
- Implementing `scripts/audit_data.js` for automated verification of sources and verified flags per P0-07.
- Configuring 6th viewport `Tablet portrait (768x1024)` in `playwright.config.js` per P0-10 and Section 3.1.
- Setting up GitHub Actions CI workflow per P0-13.
