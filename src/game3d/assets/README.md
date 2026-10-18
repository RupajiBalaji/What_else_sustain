# 3D Asset Guidelines & Model Specifications

This document defines the technical specifications, conventions, and guidelines for importing external 3D models (`.glb`) into **What Else Sustain**.

The game engine is designed to seamlessly detect if a `.glb` model exists in `public/models/`. If found, it renders the model with Draco decompression; if absent or still loading, it falls back gracefully to the procedural low-poly version with zero errors.

---

## 1. Expected File Names & Target Placement

All external 3D models must be placed in the `/public/models/` directory:

| Object | Expected File Name | Fallback Component | Default World Scale | Orientation / Forward Axis |
| :--- | :--- | :--- | :--- | :--- |
| **Farmer (Player)** | `farmer.glb` | Procedural Farmer | `1.0` (height ~1.75m) | $+Z$ is forward (faces $+Z$) |
| **Tractor** | `tractor.glb` | Procedural Tractor | `1.0` (~3.5m length, 2.2m height) | $+Z$ is forward |
| **Farmhouse** | `house.glb` | Procedural Farmhouse | `1.0` (~9.5m width, 7.5m depth, 4.8m height) | Entrance faces $-X$ (towards field) |
| **Neem / Banyan Tree** | `tree.glb` | Procedural Instanced Tree | `1.0` (~5.5m total height) | Trunk base at $Y = 0$, $+Y$ is up |

> [!NOTE]
> All asset files must be binary glTF (`.glb`). Do not use `.gltf` with separate `.bin` or texture files, to ensure single-request loading and avoid 404s.

---

## 2. Geometry & Polygon Budget

To ensure consistent 30–60 FPS performance on mid-range and budget mobile devices:
- **Triangle Limit**: Cap each individual model at **$\le$ 10,000 triangles** (target: 3,000 – 6,000 triangles).
- **Origin & Pivot Point**:
  - The model's origin $(0, 0, 0)$ must be positioned at the **ground contact point** (bottom center of the feet, tires, base of the house, or tree trunk base).
  - Do not offset origins far from mesh geometry.
- **Transforms**:
  - Apply all transforms in Blender/software prior to export (`Scale: [1, 1, 1]`, `Rotation: [0, 0, 0]`).

---

## 3. Texture Compression & Materials

- **Resolution**:
  - Maximum texture size: **1024 $\times$ 1024 px** (512 $\times$ 512 px preferred for props and trees).
  - Use single texture atlases or shared material color palettes where possible.
- **PBR Roughness / Metalness**:
  - Use standard `KHR_materials_pbrMetallicRoughness`.
  - Avoid excessive metalness on organic/rural assets.
- **Draco Compression**:
  - Models should be exported with **Draco mesh compression** (`KHR_draco_mesh_compression`).
  - Draco decoders are loaded via Google GStatic CDN (`https://www.gstatic.com/draco/versioned/decoders/1.5.5/`).
- **KTX2 / WebP Textures** (optional):
  - Supported if embedded inside `.glb`.

---

## 4. Visual Harmony & Color Palette

Assets must adhere to the warm, golden-hour Indian village visual style:
- **Sky & Atmosphere**: Warm golden glow (`#F6E2B3` to `#E5A65D`), soft amber sun (`#FFE082`).
- **Vegetation**: Rural neem/banyan tones (`#2E7D32`, `#388E3C`, `#558B2F`), avoid neon or hyper-saturated greens.
- **Buildings & Structures**: Terracotta red tile roofs (`#C0392B`, `#D35400`), lime-washed white/cream walls (`#FDFBF7`, `#F5F5DC`), untreated teak/bamboo wood (`#8D6E63`, `#5D4037`).
- **Machinery**: Classic rural farm green or deep red bodies with matte steel/iron exhaust pipes and dark rubber treaded tires.

---

## 5. Licensing & Attribution

All models placed in `public/models/` must be free of copyright restrictions (CC0 1.0 Universal or Public Domain preferred, or CC-BY with appropriate attribution).
Whenever a new model is introduced:
1. Verify the license terms.
2. Add the author name, model name, source URL, and license identifier to [CREDITS.md](../../../CREDITS.md).
