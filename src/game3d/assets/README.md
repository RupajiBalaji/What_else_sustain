# 3D Asset Guidelines & Model Pipeline Specifications

This document defines the technical specifications, conventions, and guidelines for importing external 3D models (`.glb`) into **What Else Sustain**.

The game engine is designed to seamlessly detect if a `.glb` model exists in `/public/models/`. If found, it renders the model using local Draco decompression (`/draco/`) and matches scales/offsets from [`assetManifest.js`](./assetManifest.js); if absent or still loading, it falls back gracefully to the procedural version with zero errors and no 404/405 network traffic.

---

## 1. Expected File Names & Target Placement

All external 3D models must be placed in the `/public/models/` directory:

| Asset ID | Expected File Name | Fallback Component | Target World Scale | Orientation / Forward Axis | Triangle Budget |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`farmer`** | `farmer.glb` | Procedural Farmer | `1.0` (height ~1.75m) | $+Z$ is forward (faces $+Z$) | $\le$ 6,000 |
| **`villager_1`** | `villager_1.glb` | Procedural Villager A | `1.0` (height ~1.72m) | $+Z$ is forward | $\le$ 4,500 |
| **`villager_2`** | `villager_2.glb` | Procedural Villager B | `0.95` (height ~1.65m) | $+Z$ is forward | $\le$ 4,500 |
| **`tractor`** | `tractor.glb` | Procedural Tractor | `1.0` (~3.5m length, 2.2m height) | $+Z$ is forward | $\le$ 7,500 |
| **`harvester`** | `harvester.glb` | Procedural Harvester | `1.0` (~4.5m length, 3.2m height) | $+Z$ is forward | $\le$ 8,000 |
| **`baler`** | `baler.glb` | Procedural Baler | `1.0` (~3.0m length, 2.0m height) | $+Z$ is forward | $\le$ 6,500 |
| **`truck`** | `truck.glb` | Procedural Truck | `1.0` (~6.2m length, 2.8m height) | $+Z$ is forward | $\le$ 7,500 |
| **`house_1`** | `house_1.glb` | Procedural Village House 1 | `1.0` (~5.5m width, 4.0m height) | Entrance faces $-Z$ or $-X$ | $\le$ 3,500 |
| **`house_2`** | `house_2.glb` | Procedural Village House 2 | `1.0` (~6.0m width, 4.2m height) | Entrance faces $-Z$ | $\le$ 3,200 |
| **`house_3`** | `house_3.glb` | Procedural Village House 3 | `1.0` (~5.2m width, 3.8m height) | Entrance faces $-Z$ | $\le$ 3,800 |
| **`tree_1`** | `tree_1.glb` | Procedural Neem Tree | `1.0` (~5.5m total height) | Trunk base at $Y=0$, $+Y$ is up | $\le$ 4,200 |
| **`tree_2`** | `tree_2.glb` | Procedural Acacia Tree | `1.0` (~5.0m total height) | Trunk base at $Y=0$, $+Y$ is up | $\le$ 3,800 |
| **`barn`** | `barn.glb` | Procedural Farmhouse/Barn | `1.0` (~9.5m width, 4.8m height) | Entrance faces $-X$ | $\le$ 5,500 |
| **`hay_bale`** | `hay_bale.glb` | Procedural Round Straw Bale | `1.0` (~1.4m diameter) | Cylindrical axis horizontal | $\le$ 800 |

> [!NOTE]
> All asset files must be binary glTF (`.glb`). Do not use `.gltf` with separate `.bin` or texture files, to ensure single-request loading and clean asset delivery.

---

## 2. Geometry & Polygon Budget

To guarantee a steady 30–60 FPS on mobile and budget hardware:
- **Triangle Limit**: Every model must be **strictly under 8,000 triangles** (target: 2,500 – 5,500 triangles).
- **Origin & Pivot Point**:
  - The model's origin $(0, 0, 0)$ must be positioned at the **ground contact point** (bottom center of the feet, tires, base of the house, or tree trunk base).
  - Do not offset origins far from mesh geometry.
- **Transforms**:
  - Apply all transforms in Blender/software prior to export (`Scale: [1, 1, 1]`, `Rotation: [0, 0, 0]`).

---

## 3. Compression with gltf-transform

All models should be compressed using `gltf-transform` to ensure small bundle size and fast loading:

### Step 1: Install or Run gltf-transform
```bash
npx @gltf-transform/cli --help
```

### Step 2: Draco Mesh Compression & Texture Resize
Resize textures to a maximum of 512x512 (or 1024x1024 for central vehicles) and apply Draco compression:
```bash
# 1. Resize all embedded textures to 512x512 max
npx @gltf-transform/cli resize input.glb intermediate.glb --width 512 --height 512

# 2. Compress textures to WebP/AVIF and compress geometry with Draco
npx @gltf-transform/cli optimize intermediate.glb public/models/target.glb \
  --draco.mode edgebreaker \
  --texture-compress webp
```

Or run the all-in-one command:
```bash
npx @gltf-transform/cli optimize input.glb public/models/tractor.glb \
  --draco.mode edgebreaker \
  --texture-compress webp \
  --texture-resize 512
```

---

## 4. Local Draco Decoder

DRACOLoader decodes compressed models locally using WebAssembly. The decoder files are served directly from:
```
/public/draco/
  ├── draco_decoder.js
  ├── draco_decoder.wasm
  └── draco_wasm_wrapper.js
```
`ModelLoader.jsx` automatically sets:
```javascript
useGLTF.setDecoderPath('/draco/')
```
This guarantees 100% offline operation without connecting to external Google CDN domains.

---

## 5. Animations

If animations are embedded in character `.glb` models:
- **Farmer**: name clips `idle`, `walk`, `torch_light`, `climb`, `wave`, `bend`, `spray`.
- **Villager**: name clips `idle`, `walk`, `cough`, `wave`.

`ModelLoader.jsx` uses `@react-three/drei`'s `useAnimations`. If animation clips are present in the model, they automatically cross-fade and play; if not present, the system defaults to smooth procedural limb swaying.
