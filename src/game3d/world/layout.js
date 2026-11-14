/**
 * src/game3d/world/layout.js
 * Single source of truth for all 3D scene coordinates and scale standards
 * as specified in Section 6.1 and 6.2 of WES_MVP_MASTER_PLAN.md
 */

// ==========================================
// 6.2 SCALE RULES & TARGET CONSTANTS
// ==========================================
export const SCALES = {
  // Farmer height is the unit reference
  FARMER_HEIGHT: 1.7,

  // One-storey house: 2.5 to 3x farmer height tall, 5 to 7 units wide
  HOUSE_HEIGHT_MIN: 1.7 * 2.5, // 4.25
  HOUSE_HEIGHT_MAX: 1.7 * 3.0, // 5.1
  HOUSE_TARGET_HEIGHT: 4.65,
  HOUSE_WIDTH_MIN: 5.0,
  HOUSE_WIDTH_MAX: 7.0,
  HOUSE_TARGET_WIDTH: 6.0,

  // Barn: about 4x farmer height
  BARN_HEIGHT_MIN: 1.7 * 3.5, // 5.95
  BARN_HEIGHT_MAX: 1.7 * 4.5, // 7.65
  BARN_TARGET_HEIGHT: 6.8,

  // Tractor: wheels about 0.7x farmer height, body ~2.5x farmer
  TRACTOR_WHEEL_TARGET: 1.7 * 0.7, // 1.19
  TRACTOR_BODY_TARGET: 1.7 * 2.2, // 3.74

  // Trees: about 3 to 5x farmer height
  TREE_HEIGHT_MIN: 1.7 * 3.0, // 5.1
  TREE_HEIGHT_MAX: 1.7 * 5.0, // 8.5
  TREE_TARGET_HEIGHT: 6.8,

  // Straw pile: about 1.2x farmer height at full size, ~2.5 units wide
  STRAW_PILE_HEIGHT_TARGET: 1.7 * 1.2, // 2.04
  STRAW_PILE_WIDTH_TARGET: 2.5
}

// ==========================================
// 6.1 SCENE LAYOUT COORDINATES
// ==========================================
export const FARM_FIELD = {
  minX: -16,
  maxX: 16,
  minZ: -8,
  maxZ: 28,
  centerX: 0,
  centerZ: 10,
  width: 32,
  length: 36
}

export const FARMER_START_POS = {
  x: -1.2,
  y: 0,
  z: 10.0
}

export const FARMHOUSE_POS = {
  x: -16.5,
  y: 0,
  z: 6.0,
  rotY: 0.35
}

export const BARN_POS = {
  x: -18.0,
  y: 0,
  z: 18.0,
  rotY: 0.15
}

export const TRACTOR_PARK_POS = {
  x: -14.0,
  y: 0,
  z: 22.0,
  rotY: -0.2
}

export const WEATHER_VANE_POS = {
  x: -11.0,
  y: 0,
  z: -4.0
}

export const AIR_SENSOR_POLE_POS = {
  x: -12.5,
  y: 0,
  z: 32.0
}

export const SWACHH_GRAM_SIGN_POS = {
  x: -3.5,
  y: 0,
  z: 36.5
}

export const STRAW_PILES_LAYOUT = [
  { id: 'pile_center', x: -3.2, z: 12.5, scale: 1.0, isLead: true },
  { id: 'pile_east', x: 4.8, z: 15.0, scale: 0.95 },
  { id: 'pile_north', x: -0.5, z: 22.0, scale: 1.0 },
  { id: 'pile_west', x: -8.0, z: 16.5, scale: 0.9 }
]

// 10 Village houses clustered downwind along north edge (40-60m distance)
export const VILLAGE_HOUSES_LAYOUT = [
  { id: 'h1', variant: 1, x: -15, z: 42, rot: 0.2, s: 1.6, wallColor: '#E0D7C6', roofColor: '#D35400' },
  { id: 'h2', variant: 2, x: -8, z: 46, rot: -0.1, s: 1.65, wallColor: '#F5EEF8', roofColor: '#78909C' },
  { id: 'h3', variant: 3, x: 0, z: 43, rot: 0.4, s: 1.55, wallColor: '#FEF9E7', roofColor: '#D4AC0D' },
  { id: 'h4', variant: 1, x: 8, z: 48, rot: -0.3, s: 1.7, wallColor: '#EBF5FB', roofColor: '#C0392B' },
  { id: 'h5', variant: 2, x: 16, z: 44, rot: 0.1, s: 1.6, wallColor: '#EAFAF1', roofColor: '#607D8B' },
  { id: 'h6', variant: 3, x: 24, z: 47, rot: -0.2, s: 1.65, wallColor: '#FDFEFE', roofColor: '#B7950B' },
  { id: 'h7', variant: 1, x: -18, z: 52, rot: 0.3, s: 1.65, wallColor: '#FDEDEC', roofColor: '#E65100' },
  { id: 'h8', variant: 2, x: -4, z: 54, rot: -0.15, s: 1.6, wallColor: '#F4F6F6', roofColor: '#546E7A' },
  { id: 'h9', variant: 3, x: 10, z: 55, rot: 0.25, s: 1.7, wallColor: '#F9EBEA', roofColor: '#D4AC0D' },
  { id: 'h10', variant: 1, x: 20, z: 56, rot: -0.4, s: 1.6, wallColor: '#E8F8F5', roofColor: '#C0392B' }
]

export const VILLAGE_COLLIDERS_LAYOUT = VILLAGE_HOUSES_LAYOUT.map((h) => ({
  id: h.id,
  minX: h.x - 3.8,
  maxX: h.x + 3.8,
  minZ: h.z - 3.2,
  maxZ: h.z + 3.2
}))

/**
 * Validates a model's measured dimensions against target scale within allowed 25% deviation.
 * @param {string} modelType - 'farmer' | 'house' | 'barn' | 'tractor' | 'tree' | 'straw_pile'
 * @param {{ width?: number, height: number, depth?: number }} actual
 * @returns {{ valid: boolean, deviation: number, target: number, actual: number }}
 */
export function verifyModelScale(modelType, actual) {
  let target = 0
  let measured = actual.height

  switch (modelType) {
    case 'farmer':
      target = SCALES.FARMER_HEIGHT
      break
    case 'house':
      target = actual.width ? SCALES.HOUSE_TARGET_WIDTH : SCALES.HOUSE_TARGET_HEIGHT
      measured = actual.width ? actual.width : actual.height
      break
    case 'barn':
      target = SCALES.BARN_TARGET_HEIGHT
      break
    case 'tractor':
      target = SCALES.TRACTOR_BODY_TARGET
      break
    case 'tree':
      target = SCALES.TREE_TARGET_HEIGHT
      break
    case 'straw_pile':
      target = SCALES.STRAW_PILE_HEIGHT_TARGET
      break
    default:
      throw new Error(`Unknown modelType: ${modelType}`)
  }

  const deviation = Math.abs(measured - target) / target
  return {
    valid: deviation <= 0.25,
    deviation,
    target,
    actual: measured
  }
}
