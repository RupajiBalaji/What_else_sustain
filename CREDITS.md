# Credits & Attributions

All media assets, audio synthesis, and visual illustrations in **What Else Sustain** are open-source, Creative Commons Zero (CC0) / Public Domain, or custom-synthesized in code to ensure zero external dependency failures, zero tracking, and lightweight execution on low-cost devices.

---

## 1. 3D Models & Meshes (`public/models/`)

The 3D game engine supports optional external `.glb` models. When available, they replace procedural low-poly fallbacks. All imported models must be CC0 1.0 Universal or appropriately attributed under CC-BY.

| Asset | Target File | Source / Creator | License | Link / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Farmer (Player)** | `public/models/farmer.glb` | *Template: [Author Name]* | CC0 1.0 Universal / CC-BY 4.0 | *[Link to model repository / source]* (Cap $\le$ 10k tris, Draco compressed) |
| **Farm Tractor** | `public/models/tractor.glb` | *Template: [Author Name]* | CC0 1.0 Universal / CC-BY 4.0 | *[Link to model repository / source]* |
| **Rural Farmhouse** | `public/models/house.glb` | *Template: [Author Name]* | CC0 1.0 Universal / CC-BY 4.0 | *[Link to model repository / source]* |
| **Neem / Banyan Tree** | `public/models/tree.glb` | *Template: [Author Name]* | CC0 1.0 Universal / CC-BY 4.0 | *[Link to model repository / source]* |

*(Note: When adding CC0 or CC-BY models to `public/models/`, fill in the Author Name, License, and Source URL in this table).*

---

## 2. Sound & Audio Effects

- **Web Audio Procedural Sound Engine** (`src/game/soundManager.js`)
  - **Type**: Real-time synthesized procedural audio via Web Audio API oscillators and Howler.js.
  - **License**: Creative Commons Zero (CC0 1.0) / Public Domain.
  - **Sounds Synthesized**:
    - `playTap()`: Sine wave transient button click (600 Hz &rarr; 300 Hz).
    - `playPop()`: High-to-low bubble pop chirp (900 Hz &rarr; 350 Hz) for item sorting.
    - `playCoin()`: Dual-harmonic bell chime (B5 987.77 Hz & E6 1318.51 Hz).
    - `playSuccessChime()`: Pentatonic crystalline arpeggio (C5, E5, G5, C6).
    - `playWin()`: Four-tone brassy victory fanfare (C5, E5, G5, C6 triangle harmonics).
    - `playError()`: Low sawtooth warning bonk (160 Hz &rarr; 110 Hz).
    - `startFireCrackle()`: Stochastic white noise bandpass bursts (800–2000 Hz).
    - `playRewindWhoosh()`: Reverse sawtooth sweep with dynamic lowpass resonant filter sweep.
    - `playAmbient()`: Warm sub-harmonic rural village drone (146.83 Hz D3 triangle tone).
    - `startTractorEngine()`: Low diesel engine fundamental (54 Hz) with LFO rhythmic chug modulation.
    - `startBalerSound()`: Periodic mechanical compression and baling whoosh (180 Hz &rarr; 60 Hz).
  - **Zero External MP3s**: Audio requires no network downloads, avoids 404 broken link risks, and adheres to strict browser user-gesture policies (no autoplay without user interaction).

---

## 3. Mascot & Visual Graphics

- **"Sprout" Mascot Character & Expressions** (`src/game/SproutMascot.jsx`)
  - **Author**: Custom vector SVG created for the What Else Sustain educational project.
  - **License**: Creative Commons Zero (CC0 1.0 Universal).
  - **Expressions**: Happy, Worried, Cheering, Thinking.

- **Village Map, Farm, & River Illustrations** (`src/game/assets/VillageAssets.jsx`, `src/game/VillageMapHome.jsx`)
  - **Author**: Custom responsive SVG vector scenes.
  - **License**: Creative Commons Zero (CC0 1.0 Universal).
  - **Design Principles**: Bright friendly cartoon palette, rounded edges, high contrast, WCAG AAA compliant tap targets (&ge; 56px).

---

## 4. Libraries & Open Source Tools

- **React 19 & Vite 6**: MIT License.
- **Three.js & React Three Fiber (@react-three/fiber, @react-three/drei)**: MIT License (3D WebGL rendering engine and Draco loader helpers).
- **Framer Motion**: MIT License (Used for cartoon transitions and motion).
- **Howler.js**: MIT License (Audio management).
