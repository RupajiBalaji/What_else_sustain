import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

/**
 * PerformanceGovernor.jsx
 * Monitors rolling average frame time and dynamically scales quality
 * to guarantee smooth and responsive gameplay.
 * 
 * Rules:
 * - Target FPS: 30 on mobile, 50 on desktop.
 * - If FPS stays below target for 3 consecutive seconds:
 *     1. Step down dynamic resolution scale (dprScale: 1.0 -> 0.85 -> 0.72)
 *     2. Step down quality tier (high -> medium -> low)
 * - If FPS is stable above target for 10 consecutive seconds:
 *     1. Step up resolution scale / quality tier carefully
 * - Tasteful toast notification: "Adjusted graphics for smooth play"
 * - Respects tierLocked setting: no changes if user manually locked a tier.
 */
export default function PerformanceGovernor() {
  const {
    quality,
    setQuality,
    isTierLocked,
    dprScale,
    setDprScale,
    triggerToast,
    reportFps
  } = useGame3D()

  // Frame timing refs
  const frameTimesRef = useRef([])
  const lastTimeRef = useRef(performance.now())
  const belowTargetDurationRef = useRef(0)
  const aboveTargetDurationRef = useRef(0)

  // Target determination
  const isMobile = typeof window !== 'undefined' && (
    window.innerWidth < 768 ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0)
  )
  const targetFps = isMobile ? 30 : 50

  useFrame(() => {
    const now = performance.now()
    const deltaMs = now - lastTimeRef.current
    lastTimeRef.current = now

    // Rolling window of 60 frames
    const frameTimes = frameTimesRef.current
    frameTimes.push(deltaMs)
    if (frameTimes.length > 60) {
      frameTimes.shift()
    }

    // Calculate rolling average
    let sum = 0
    for (let i = 0; i < frameTimes.length; i++) {
      sum += frameTimes[i]
    }
    const avgFrameTime = sum / frameTimes.length
    const currentFps = Math.round(1000 / Math.max(avgFrameTime, 1))

    // Report to HUD and diagnostics every ~30 frames
    if (frameTimes.length % 30 === 0 && reportFps) {
      reportFps(currentFps, Math.round(avgFrameTime * 10) / 10)
    }

    // If player explicitly locked the quality tier in settings, do not auto-adjust
    if (isTierLocked) {
      belowTargetDurationRef.current = 0
      aboveTargetDurationRef.current = 0
      return
    }

    const deltaSec = deltaMs / 1000

    if (currentFps < targetFps && currentFps > 5) {
      belowTargetDurationRef.current += deltaSec
      aboveTargetDurationRef.current = 0

      // Stays below target for 3 consecutive seconds: step down
      if (belowTargetDurationRef.current >= 3.0) {
        belowTargetDurationRef.current = 0

        // Step 1: Dynamic resolution scaling first
        if (dprScale > 0.85) {
          setDprScale(0.85)
          triggerToast('Adjusted graphics for smooth play')
        } else if (dprScale > 0.72) {
          setDprScale(0.72)
          triggerToast('Adjusted graphics for smooth play')
        } else if (quality === 'high') {
          // Step 2: Step down quality tier
          setQuality('medium')
          setDprScale(1.0)
          triggerToast('Adjusted graphics for smooth play')
        } else if (quality === 'medium') {
          setQuality('low')
          setDprScale(1.0)
          triggerToast('Adjusted graphics for smooth play')
        }
      }
    } else if (currentFps >= targetFps + 6) {
      aboveTargetDurationRef.current += deltaSec
      belowTargetDurationRef.current = 0

      // Stable above target for 10 consecutive seconds: step up carefully
      if (aboveTargetDurationRef.current >= 10.0) {
        aboveTargetDurationRef.current = 0

        if (dprScale < 1.0) {
          setDprScale(Math.min(1.0, dprScale + 0.15))
        } else if (quality === 'low') {
          setQuality('medium')
          triggerToast('Adjusted graphics for smooth play')
        } else if (quality === 'medium') {
          setQuality('high')
          triggerToast('Adjusted graphics for smooth play')
        }
      }
    } else {
      // Within buffer zone: decay counters
      belowTargetDurationRef.current = Math.max(0, belowTargetDurationRef.current - deltaSec * 0.5)
      aboveTargetDurationRef.current = Math.max(0, aboveTargetDurationRef.current - deltaSec * 0.5)
    }
  })

  return null
}
