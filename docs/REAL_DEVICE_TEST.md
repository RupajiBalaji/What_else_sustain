# Real Device Test Protocol & Verification Checklist

**Status:** `FOUNDER_ACTION` (Per Section 0 & Task P8-04 of `docs/MVP_MASTER_PLAN.md`)  
**Product:** What Else Sustain (3D Farm Simulation)  
**Target Environments:** Low-end Android (2GB–3GB RAM) and Mid-range mobile devices (4GB–8GB RAM).

---

## 1. Overview & Objectives
Automated headless browser tests run under software WebGL. To ensure absolute real-world immersion, battery efficiency, and touch ergonomics for rural students and farmers, this checklist must be physically performed on real mobile hardware by the founder or pilot coordinator.

---

## 2. Test Device Matrix

| Tier | Target Specs | Example Devices | Purpose |
|------|-------------|-----------------|---------|
| **Low-End Android** | 2GB–3GB RAM, entry SoC (Helio G35/Snapdragon 400 series), Chrome Mobile | Redmi 9A, Realme C11, Galaxy A03 | Verify Low tier governor, 25+ FPS stability, zero OOM crashes |
| **Mid-Range Android** | 6GB–8GB RAM, Snapdragon 700 series / Dimensity 800+ | OnePlus Nord, Galaxy A53, Redmi Note 12 | Verify Medium/High tier, smooth 50+ FPS, rich flame & particle visuals |
| **iOS / Safari** | iOS 16+, A13+ Bionic | iPhone 11 / 13 / SE (3rd Gen) | Verify WebGL 2.0 WebKit compatibility, touch gestures, and safe area insets |

---

## 3. Step-by-Step Test Checklist

For each device, execute a complete continuous session through at least 3 seasons:

### Phase 1: Launch & Initialization
- [ ] **First Paint:** Screen renders within 3 seconds on 4G / WiFi.
- [ ] **WebGL Tier Detection:** Auto-detects `Low` tier on low-end device, `Medium`/`High` on mid-range device.
- [ ] **UI Scaling:** UI adapts cleanly to screen aspect ratio and avoids notch / home bar areas (`env(safe-area-inset)`).
- [ ] **Audio:** Tap sounds, ambient wind, and background music initialize properly after first interaction.

### Phase 2: Touch Controls & Ergonomics
- [ ] **Virtual Joystick:** Farmer responds cleanly to thumb drag on bottom-left pad without stutter.
- [ ] **Look Pad / 360 Orbit:** Dragging on right screen side orbits camera smoothly; pinch-to-zoom zooms between 3m and 14m.
- [ ] **Recenter:** Tapping "Reset view" or double-tapping recenters camera smoothly behind farmer.
- [ ] **Collision:** Camera never clips inside straw piles, farmhouses, trees, or village walls.

### Phase 3: The Straw Decision & 20s Burn
- [ ] **Reachability:** Tapping "Choose what to do with the straw" or walking to straw pile opens choice panel.
- [ ] **Choice Layout:** Panel docks cleanly to bottom sheet on phone, leaving farmer and village visible without overlap.
- [ ] **Pre-Check Quiz:** 2-question pre-check opens cleanly with large tap targets.
- [ ] **Flame & Smoke Rendering:**
  - Layered orange-yellow flames visible with flickering emissive core.
  - Rising embers visible against dark ground.
  - Charcoal texture on pile with glowing cracks.
  - Dark smoke plume rises, expands, and drifts downwind toward the village houses.
- [ ] **Village Exposure:** "Watch the village" camera smoothly pans and frames at least 2 houses, villagers coughing, and air sensor needle rising.

### Phase 4: Rewind & Alternative Futures
- [ ] **"What Else?" Rewind:** Tapping Rewind restores unburned straw piles and opens alternative choices.
- [ ] **Happy Seeder Execution:** Tractor drives across field, cutting residue and sowing green seedlings simultaneously.
- [ ] **Comparison Slider:** Before-and-after view splits cleanly with draggable center divider. All numbers carry sources or "game estimate" tags.
- [ ] **Post-Check Quiz & Results:** 3-question post-check calculates improvement gain without blaming player if no score increase.

### Phase 5: Multi-Season Soak & Memory
- [ ] Play through Season 1 ➔ Season 2 ➔ Season 3 without page refresh.
- [ ] Confirm no memory degradation, thermal throttling, or browser tab crash.

---

## 4. Founder Test Log Form

Copy and fill this section for each test run:

```markdown
### Test Log: [Device Name / Model]
- **Date & Time:** YYYY-MM-DD HH:MM
- **Tester:** [Founder / Team Member Name]
- **OS Version:** Android [X] / iOS [X]
- **Browser & Version:** Chrome Mobile [X] / Safari [X]
- **Auto-Detected Quality Tier:** [Low / Medium / High]
- **Framerate Observations:**
  - Walking in field: [  ] FPS
  - Burning phase: [  ] FPS
  - Village view: [  ] FPS
  - Season 3: [  ] FPS
- **Thermals / Battery:** [Cool / Warm / Hot] | Battery used in 10 mins: [  ]%
- **Issues Observed:** [None / Describe any glitches or overlaps]
- **Verdict:** [PASS / FAIL]
- **Signature:** FOUNDER_ACTION [Initials]
```
