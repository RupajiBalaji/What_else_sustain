/**
 * Central 3D Asset Manifest for What Else Sustain.
 * Maps model IDs to their expected .glb paths, scale, rotation, offset, and polygon budget.
 *
 * Each model must satisfy:
 * - Format: Binary glTF (.glb) with Draco mesh compression
 * - Triangle budget: <= 8,000 triangles per model
 * - Textures: 512x512 max (1024 for central machinery)
 * - Orientation: +Z is forward, origin (0,0,0) at ground contact
 */
export const ASSET_MANIFEST = {
  farmer: {
    id: 'farmer',
    modelUrl: '/models/farmer.glb',
    name: 'Player Farmer',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 6000,
    castShadow: true,
    receiveShadow: true,
    animations: ['idle', 'walk', 'torch_light', 'climb', 'wave', 'bend', 'spray']
  },
  villager_1: {
    id: 'villager_1',
    modelUrl: '/models/villager_1.glb',
    name: 'Villager Variant A (Elder/Farmer)',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 4500,
    castShadow: true,
    receiveShadow: true,
    animations: ['idle', 'walk', 'cough', 'wave']
  },
  villager_2: {
    id: 'villager_2',
    modelUrl: '/models/villager_2.glb',
    name: 'Villager Variant B (Youth/Resident)',
    scale: 0.95,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 4500,
    castShadow: true,
    receiveShadow: true,
    animations: ['idle', 'walk', 'cough', 'wave']
  },
  tractor: {
    id: 'tractor',
    modelUrl: '/models/tractor.glb',
    name: 'Farm Tractor',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 7500,
    castShadow: true,
    receiveShadow: true
  },
  harvester: {
    id: 'harvester',
    modelUrl: '/models/harvester.glb',
    name: 'Combine Harvester',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 8000,
    castShadow: true,
    receiveShadow: true
  },
  baler: {
    id: 'baler',
    modelUrl: '/models/baler.glb',
    name: 'Round Straw Baler',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 6500,
    castShadow: true,
    receiveShadow: true
  },
  truck: {
    id: 'truck',
    modelUrl: '/models/truck.glb',
    name: 'Biomass Transport Truck',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 7500,
    castShadow: true,
    receiveShadow: true
  },
  house_1: {
    id: 'house_1',
    modelUrl: '/models/house_1.glb',
    name: 'Village House (Terracotta Pitched)',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 3500,
    castShadow: true,
    receiveShadow: true
  },
  house_2: {
    id: 'house_2',
    modelUrl: '/models/house_2.glb',
    name: 'Village House (Flat Roof Terrace)',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 3200,
    castShadow: true,
    receiveShadow: true
  },
  house_3: {
    id: 'house_3',
    modelUrl: '/models/house_3.glb',
    name: 'Village House (Thatched/Veranda)',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 3800,
    castShadow: true,
    receiveShadow: true
  },
  tree_1: {
    id: 'tree_1',
    modelUrl: '/models/tree_1.glb',
    name: 'Neem Tree (Spreading Crown)',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 4200,
    castShadow: true,
    receiveShadow: false
  },
  tree_2: {
    id: 'tree_2',
    modelUrl: '/models/tree_2.glb',
    name: 'Acacia Tree (Slender Foliage)',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 3800,
    castShadow: true,
    receiveShadow: false
  },
  barn: {
    id: 'barn',
    modelUrl: '/models/barn.glb',
    name: 'Farmhouse Barn & Shed',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 5500,
    castShadow: true,
    receiveShadow: true
  },
  hay_bale: {
    id: 'hay_bale',
    modelUrl: '/models/hay_bale.glb',
    name: 'Round Hay/Straw Bale',
    scale: 1.0,
    positionOffset: [0, 0, 0],
    rotationOffset: [0, 0, 0],
    triangleBudget: 800,
    castShadow: true,
    receiveShadow: true
  }
}

export function getManifestEntry(assetId) {
  return ASSET_MANIFEST[assetId] || null
}
