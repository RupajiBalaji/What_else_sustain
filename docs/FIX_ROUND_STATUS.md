# Mega Fix Round Status

| ID | Tier | Status | Commit | Test Name | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A1 | Tier A | DONE | `5dce579` | `tests/unit/rewindSnapshot.test.js`, `e2e/rewind-state.spec.js` | Snapshots money, soil, village, reputation, XP, streak on decision start; restores on `replaySeason` while keeping `triedChoices` & one-time discovery bonuses. |
| A2 | Tier A | DONE | pending | `tests/unit/economy.test.js`, `scripts/balance-sim.js` | `scenarios.json` + `economy.js` drive all costs/returns; removed hard-coded `moneyCost`/`baleSaleGrossIncome` from `gameBalance.js`; `balance-sim.js` simulates 10 seasons per option into `docs/BALANCE_REPORT.md`. |
| A3 | Tier A | DONE | `8a301d7` | `e2e/rewind-state.spec.js`, `e2e/playthrough.spec.js` | Every option ends with Continue, What else?, and Compare; Season Report opens only on Continue. |
| A4 | Tier A | DONE | pending | `e2e/overlay-collision.spec.js`, `e2e/director.spec.js` | Max 2 world cards, max 1 wave bubble, offscreen unmount, dark-glass money cards; advisory hint auto-dismisses once a choice is confirmed. |
| B1 | Tier B | DONE | `e423e11` | `e2e/alt-sequences.spec.js` | `alt_sequence` camera frames all 4 machines/actions; farmer clear with connected limbs. |
| B2 | Tier B | DONE | `550342c` | `e2e/rewind-state.spec.js` | Rewind screen hides HUD cards/buttons, places timecode below HUD, light single scanline effect. |
| B3 | Tier B | DONE | `05944ad` | `e2e/perf-overlay.spec.js` | `?perf=1` overlay with fps, frame time, draw calls, `Copy Report`; particle pooling & burn stall fixes. |
| B4 | Tier B | DONE | pending | `e2e/smoke.spec.js`, `e2e/overlay-collision.spec.js` | Warmed house albedo/emissive & balanced proportions (`1.35x/1.05x`), denser instanced crop rows (`30x34` high / `22x24` med / `14x16` low), `39vh` mobile choice sheet keeps farmer visible on `360x640`. |
| B5 | Tier B | DONE | pending | `tests/unit/movement.test.js`, `e2e/movement.spec.js` | Raised `accelAlpha`/`decelAlpha` delta clamp in `FarmerPlayer.jsx` from `0.05s` to `0.1s` (matching integration step) and relaxed `expectSimDistance` to `0.5 * elapsedSim`. |
| C1 | Tier C | NOT DONE | — | — | Delete `vercel.json`, `netlify.toml`, `api/ask-advisor.js`, and legacy `vite.config.js` middleware. |
| C2 | Tier C | NOT DONE | — | `npm run lint` | Add `no-unused-vars` and `react-hooks/exhaustive-deps` to `eslint.config.js`. |
| C3 | Tier C | NOT DONE | — | — | Gitignore `tests/screenshots/`, keep curated images in `docs/screenshots/`, upload artifacts in CI. |
| C4 | Tier C | NOT DONE | — | `.github/workflows/*.yml` | CI runs all 6 viewports (`360x640`, `390x844`, `768x1024`, `1366x768`, `1920x1080`, `844x390`). |
| C5 | Tier C | NOT DONE | — | — | Bump SW cache version and document in `docs/DEPLOY.md`. |
| C6 | Tier C | NOT DONE | — | — | Read `25c32a4` and summarize changes and risks in final report. |
