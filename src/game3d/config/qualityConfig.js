/**
 * Central Quality Tier Configurations for What Else Sustain 3D Farm.
 * Controls shadow resolution, particle counts, shader complexity,
 * instance counts, pixel ratio caps, and post-processing features.
 */

export const QUALITY_TIERS = {
  low: {
    tier: 'low',
    label: 'Low',
    shadows: false,
    shadowMapSize: 0,
    maxPixelRatio: 1.0,
    // Particle caps
    fireParticles: 80,
    smokeParticles: 60,
    emberParticles: 20,
    // Instancing density
    cropRows: 8,
    cropCols: 8,
    grassTuftsCount: 70,
    treeCount: 15,
    // Visual effects
    lightShafts: false,
    heatShimmer: false,
    filmGrain: false,
    waterShader: 'simple',
    windVertexWave: false,
    fogDensityFactor: 0.8
  },
  medium: {
    tier: 'medium',
    label: 'Medium',
    shadows: true,
    shadowMapSize: 512,
    maxPixelRatio: 1.25,
    // Particle caps
    fireParticles: 180,
    smokeParticles: 140,
    emberParticles: 50,
    // Instancing density
    cropRows: 14,
    cropCols: 14,
    grassTuftsCount: 180,
    treeCount: 26,
    // Visual effects
    lightShafts: false,
    heatShimmer: false,
    filmGrain: false,
    waterShader: 'animated',
    windVertexWave: true,
    fogDensityFactor: 1.0
  },
  high: {
    tier: 'high',
    label: 'High',
    shadows: true,
    shadowMapSize: 1024,
    maxPixelRatio: 1.75,
    // Particle caps
    fireParticles: 320,
    smokeParticles: 240,
    emberParticles: 90,
    // Instancing density
    cropRows: 20,
    cropCols: 20,
    grassTuftsCount: 360,
    treeCount: 45,
    // Visual effects
    lightShafts: true,
    heatShimmer: true,
    filmGrain: true,
    waterShader: 'full',
    windVertexWave: true,
    fogDensityFactor: 1.0
  }
}

/**
 * Auto-detect the initial quality tier based on device hardware capabilities:
 * - RAM (navigator.deviceMemory)
 * - CPU Cores (navigator.hardwareConcurrency)
 * - Screen size / mobile viewport
 */
export function autoDetectQualityTier() {
  if (typeof window === 'undefined') return 'medium'

  try {
    const memory = navigator.deviceMemory || 4 // In GB
    const cores = navigator.hardwareConcurrency || 4
    const isMobile = window.innerWidth < 640 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    // Budget device or very low memory
    if (memory < 3 || cores < 4) {
      return 'low'
    }

    // Mid-range mobile or tablet
    if (isMobile) {
      return memory >= 6 && cores >= 6 ? 'medium' : 'low'
    }

    // Desktop
    if (memory >= 8 && cores >= 6) {
      return 'high'
    }

    return 'medium'
  } catch {
    return 'medium'
  }
}

export function getQualityConfig(tier) {
  return QUALITY_TIERS[tier] || QUALITY_TIERS.medium
}
