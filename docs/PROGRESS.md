# What Else Sustain — Verification & Fix Progress Ledger

**Baseline**: `0ad527c` -> Current Fix Round (Items 1–8)
**Last Updated**: 2026-11-28

## Fix Round Status

| Item | Description | Status | Key Files |
| :--- | :--- | :--- | :--- |
| 1 | Rewind state snapshot & restoration | DONE | `src/game3d/state/rewindSnapshot.js`, `src/game3d/context/Game3DContext.jsx`, `e2e/rewind-state.spec.js` |
| 2 | Economy from `scenarios.json`, Punjab bale range, 12-season balance | DONE | `src/data/scenarios.json`, `src/game3d/config/economy.js`, `scripts/simulate_balance.js`, `docs/BALANCE_REPORT.md` |
| 3 | Overlay caps (max 2 world cards, 1 wave bubble, 0 collisions) | DONE | `src/game3d/ui/OverlayManager.jsx`, `src/game3d/components/Villagers.jsx`, `e2e/overlay-collision.spec.js` |
| 4 | Rewind screen cleanup & timecode below HUD | DONE | `src/game3d/ui/RewindGlitchOverlay.jsx`, `src/game3d/ui/HUDOverlay.jsx` |
| 5 | Alternative sequence `alt_sequence` camera & connected farmer pose | DONE | `src/game3d/components/CinematicCamera.jsx`, `src/game3d/components/FarmerPlayer.jsx`, `e2e/alt-sequences.spec.js` |
| 6 | Consistent end-of-sequence flow (no auto-opened report) | DONE | `src/game3d/context/Game3DContext.jsx`, `src/game3d/ui/HUDOverlay.jsx`, `src/game3d/ui/RupeeCounterHUD.jsx` |
| 7 | `?perf=1` readout with Copy Report, particle pooling, 0 Clock warnings | DONE | `src/game3d/perf/MemoryStatsOverlay.jsx`, `src/game3d/components/FireSmokeSystem.jsx`, `src/main.jsx`, `e2e/perf-overlay.spec.js` |
| 8 | 5-option playthrough E2E + fresh-clone full suite verification | DONE | `e2e/playthrough.spec.js`, `docs/PROGRESS.md` |

## Not Verified
- Physical mobile devices (Android/iOS touchscreens)
- Hardware GPU / real mobile Safari & Chrome (all E2E runs use headless Chromium with SwiftShader software WebGL)
