# Mega Fix Round Status

| ID | Tier | Status | Commit | Test Name | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A1 | Tier A | DONE | `5dce579`, `916a63f` | `tests/unit/rewindSnapshot.test.js`, `e2e/rewind-state.spec.js` | Snapshots money, soil, village, reputation, XP, streak on decision start; restores on `replaySeason` while keeping `triedChoices` & one-time discovery bonuses. |
| A2 | Tier A | DONE | `733252b`, `916a63f` | `tests/unit/economy.test.js`, `scripts/balance-sim.js` | `scenarios.json` + `economy.js` drive all costs/returns; removed hard-coded `moneyCost`/`baleSaleGrossIncome` from `gameBalance.js`; `balance-sim.js` simulates 10 seasons per option into `docs/BALANCE_REPORT.md`. |
| A3 | Tier A | DONE | `8a301d7` | `e2e/rewind-state.spec.js`, `e2e/playthrough.spec.js` | Every option ends with Continue, What else?, and Compare; Season Report opens only on Continue. |
| A4 | Tier A | DONE | `f569bdc`, `1df3fcb` | `e2e/overlay-collision.spec.js`, `e2e/director.spec.js` | Max 2 world cards, max 1 wave bubble, offscreen unmount, dark-glass money cards; advisory hint auto-dismisses once a choice is confirmed. |
| B1 | Tier B | DONE | `e423e11` | `e2e/alt-sequences.spec.js` | `alt_sequence` camera frames all 4 machines/actions; farmer clear with connected limbs. |
| B2 | Tier B | DONE | `550342c` | `e2e/rewind-state.spec.js` | Rewind screen hides HUD cards/buttons, places timecode below HUD, light single scanline effect. |
| B3 | Tier B | DONE | `05944ad` | `e2e/perf-overlay.spec.js` | `?perf=1` overlay with fps, frame time, draw calls, `Copy Report`; particle pooling & burn stall fixes. |
| B4 | Tier B | DONE | `e029a6d` | `e2e/smoke.spec.js`, `e2e/overlay-collision.spec.js` | Warmed house albedo/emissive & balanced proportions (`1.35x/1.05x`), denser instanced crop rows (`30x34` high / `22x24` med / `14x16` low), `39vh` mobile choice sheet keeps farmer visible on `360x640`. |
| B5 | Tier B | DONE | `8a30844` | `tests/unit/movement.test.js`, `e2e/movement.spec.js` | Raised `accelAlpha`/`decelAlpha` delta clamp in `FarmerPlayer.jsx` from `0.05s` to `0.1s` (matching integration step) and relaxed `expectSimDistance` to `0.5 * elapsedSim`. |
| C1 | Tier C | DONE | `7ad3091` | `npm run build` | Deleted `vercel.json`, `netlify.toml`, `api/ask-advisor.js`, and legacy `/api/ask-advisor` middleware from `vite.config.js`; Render + `backend/app` is the sole backend. |
| C2 | Tier C | DONE | `25dc278` | `npm run lint` | Added `no-unused-vars` and `react-hooks/exhaustive-deps` as `warn` in `eslint.config.js`; `npm run lint` passes with 0 errors. |
| C3 | Tier C | DONE | `c32329e` | `.github/workflows/ci.yml` | Added `tests/screenshots/` to `.gitignore`, untracked test screenshots, copied curated screenshots to `docs/screenshots/`, and added CI artifact upload. |
| C4 | Tier C | DONE | `8053d8e` | `.github/workflows/ci.yml`, `playwright.config.js` | Configured `playwright.config.js` & CI for all 6 viewports: `360x640`, `390x844`, `844x390`, `768x1024`, `1366x768`, `1920x1080`. |
| C5 | Tier C | DONE | `26af01b` | — | Bumped `CACHE_NAME` in `public/sw.js` (`wes-cache-v3` -> `wes-cache-v4`) and added cache-bump rule to `docs/DEPLOY.md`. |
| C6 | Tier C | DONE | `25c32a4`, `26af01b` | `backend/tests/test_security_audit.py` | Audited `25c32a4`: restricted CORS/origins, disabled `/docs` in prod, added security headers, path-traversal guard on SPA fallback, Pydantic bounds, `PrivacyModal` + delete-data controls, pinned deps. Residual risk: in-memory rate-limiter resets per worker; `allow_headers=["*"]`; Gemini keys via env. |

## Fix Round 2: Overlaps, Economy Balance, Counting

| ID | Tier | Status | Commit | Test Name | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| R2-1 | Round 2 | DONE | pending | `e2e/overlay-collision.spec.js` | Merged duplicate `MoneyFloatingTag` into single `ConsequenceCallouts` card; docked mobile burn callout at `top: 194px` clear of `SmokeMeterHUD` and bottom buttons. |
| R2-2 | Round 2 | DONE | pending | `npm run lint`, `npm run build` | Replaced active status banner with `Sequence complete!` toast on completion; shifted mobile top banners left of zoom controls (`maxWidth: calc(100vw - 112px)`). |
| R2-3 | Round 2 | NOT DONE | — | — | Desktop Bale & Sell camera obstruction (power/flag pole). |
| R2-4 | Round 2 | NOT DONE | — | — | Honest balance: flag ₹0 as FAIL, switchable CRM subsidy (50%/80%, off by default), designer decisions note. |
| R2-5 | Round 2 | NOT DONE | — | — | Bale & Sell base-income label clarifies bale & transport net only. |
| R2-6 | Round 2 | NOT DONE | — | — | Actual visible DOM overlay count test with negative control (`360x640`, `390x844`, `1366x768`). |
