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

- **Web Audio & Howler Advanced Audio Engine** (`src/game3d/audio/AudioManager.js`, `src/game/soundManager.js`)
  - **Type**: Real-time synthesized procedural Web Audio API nodes with stereo panning and dynamic filters.
  - **License**: Creative Commons Zero (CC0 1.0 Universal) / Public Domain.
  - **Dynamic Audio Systems**:
    - **Dynamic Wind Ambience**: Real-time pink noise generator with resonant bandpass filter modulated by live wind speed (`windState.speedMs`).
    - **Procedural Birdsong**: Pentatonic high-frequency sinusoidal chirps that attenuate and silence when smoke rises.
    - **Surface-Dependent Footsteps**: Differentiated acoustic transients for dirt (fields), grass (margins & canal), and road (gravel/stone).
    - **Spatial Audio Positioning**: Real-time Euclidean distance attenuation ($1 / (1 + 0.08d)$) and stereo panning for tractors, harvesters, balers, and fire.
    - **Layered Adaptive Music**: Continuous generative harmonic chords crossfading smoothly between **Calm** (C maj 9 pastoral), **Tense** (D min / F dim low pulsing tension during fire), and **Hopeful** (G maj / C maj crystalline resolution during sustainable alternatives).
    - **Sound FX**: Tap, pop, coin chime, crystalline success arpeggios, fire crackle, and rewind whooshes.
  - **Clean User-Gesture Unlock**: Audio context resumes exclusively on user interaction ("Tap to Start"), respecting mobile and modern browser autoplay policies. Master, SFX, and Music volume channels with global mute.
  - **Zero External MP3s**: Eliminates broken link risks, reduces initial network payload to 0 kB of audio files, and works completely offline.

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
