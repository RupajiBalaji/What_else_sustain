import React, { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { FARMHOUSE_COLLIDER } from './Farmhouse'
import { TRACTOR_COLLIDER } from './Tractor'
import { VILLAGE_COLLIDERS } from './VillageHousesInstanced'
import { STRAW_PILES_DATA } from './StrawPiles'
import { TREE_POSITIONS } from './TreesInstanced'

/**
 * 360-Degree Free Orbit Camera Controller around the Farmer.
 * 
 * Features:
 * 1. Unlimited 360 yaw rotation via mouse/touch drag.
 * 2. Clamped pitch (-10 to 60 degrees).
 * 3. Mouse wheel & pinch zoom (3.0 to 14.0 units).
 * 4. Smooth damping.
 * 5. Camera collision avoidance against terrain, straw piles, farmhouse, tractor, village houses, and trees.
 * 6. Phase easing: gentle 1.5s ease on phase start, then gives control back. No auto-snap, never turns farmer.
 * 7. "Watch the village": auto-orbits to view the smoke plume drifting to houses, then returns control.
 * 8. On-screen button triggers and R-key reset.
 */
export default function CinematicCamera() {
  const { camera } = useThree()
  const {
    cinematicMode,
    isFlyoverActive,
    skipFlyover,
    burnState,
    seasonPhase,
    activeAlternative,
    playerPositionRef,
    registerCameraControls,
    invertLook,
    reducedMotion
  } = useGame3D()

  // Camera Orbit Targets
  const targetYawRef = useRef(0.0)
  const targetPitchRef = useRef(0.32) // ~18.3° looking down at farmer
  const targetDistanceRef = useRef(5.8)

  // Current interpolated values for smooth damping
  const currentYawRef = useRef(0.0)
  const currentPitchRef = useRef(0.32)
  const currentDistanceRef = useRef(5.8)

  // Phase transition easing state (max 1.5s, canceled immediately by user input)
  const isEasingPhaseRef = useRef(false)
  const easingEndTimeRef = useRef(0)
  const lastPhaseRef = useRef(seasonPhase)
  const lastBurnStateRef = useRef(burnState)

  // "Watch the village" timer
  const watchVillageEndTimeRef = useRef(0)

  // Input drag tracking
  const isDraggingRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const initialPinchDistRef = useRef(null)

  // Opening flyover start time
  const flyoverStartTimeRef = useRef(null)

  // Static scratch vectors to prevent GC allocations
  const _camTarget = useMemo(() => new THREE.Vector3(), [])
  const _lookTarget = useMemo(() => new THREE.Vector3(), [])

  // Colliders list
  const colliders = useMemo(() => [
    FARMHOUSE_COLLIDER,
    TRACTOR_COLLIDER,
    ...VILLAGE_COLLIDERS
  ], [])

  // Register controls to Game3DContext and window for HUD buttons and Playwright testing
  useEffect(() => {
    const controls = {
      rotate: (deltaYaw) => {
        isEasingPhaseRef.current = false
        watchVillageEndTimeRef.current = 0
        targetYawRef.current += deltaYaw
      },
      pitch: (deltaPitch) => {
        isEasingPhaseRef.current = false
        watchVillageEndTimeRef.current = 0
        targetPitchRef.current = Math.max(-0.1745, Math.min(1.0472, targetPitchRef.current + deltaPitch))
      },
      zoom: (deltaDist) => {
        targetDistanceRef.current = Math.max(3.0, Math.min(14.0, targetDistanceRef.current + deltaDist))
      },
      reset: () => {
        isEasingPhaseRef.current = false
        watchVillageEndTimeRef.current = 0
        targetYawRef.current = 0.0
        targetPitchRef.current = 0.32
        targetDistanceRef.current = 5.8
      },
      watchVillage: () => {
        isEasingPhaseRef.current = false
        watchVillageEndTimeRef.current = performance.now() + 4500
        targetYawRef.current = Math.PI // 180° facing north toward village
        targetPitchRef.current = 0.16
        targetDistanceRef.current = 8.5
      },
      getYaw: () => currentYawRef.current,
      getPitch: () => currentPitchRef.current,
      getDistance: () => currentDistanceRef.current
    }

    if (registerCameraControls) {
      registerCameraControls(controls)
    }

    if (typeof window !== 'undefined') {
      window.__wes_camera = controls
    }

    return () => {
      if (typeof window !== 'undefined' && window.__wes_camera === controls) {
        delete window.__wes_camera
      }
    }
  }, [registerCameraControls])

  // Phase transition detector: Ease camera to gentle framing angle during first 1.5s only
  useEffect(() => {
    if (seasonPhase !== lastPhaseRef.current) {
      lastPhaseRef.current = seasonPhase
      if (seasonPhase === 'decision') {
        isEasingPhaseRef.current = true
        easingEndTimeRef.current = performance.now() + 1500
        targetYawRef.current = 0.22
        targetPitchRef.current = 0.28
        targetDistanceRef.current = 5.2
      }
    }
  }, [seasonPhase])

  useEffect(() => {
    if (burnState !== lastBurnStateRef.current) {
      lastBurnStateRef.current = burnState
      if (burnState === 'lighting') {
        isEasingPhaseRef.current = true
        easingEndTimeRef.current = performance.now() + 1500
        targetYawRef.current = 0.35
        targetPitchRef.current = 0.24
        targetDistanceRef.current = 4.8
      }
    }
  }, [burnState])

  // Mouse drag, wheel zoom, touch drag, and R-key listener
  useEffect(() => {
    const handlePointerDown = (e) => {
      // Don't capture pointer on HUD buttons, drawers, or interactive overlays
      if (e.target && e.target.closest('button, input, select, textarea, [data-interactive="true"]')) {
        return
      }

      isDraggingRef.current = true
      lastPointerRef.current = { x: e.clientX, y: e.clientY }
      // User manual interaction cancels any active auto-easing
      isEasingPhaseRef.current = false
      watchVillageEndTimeRef.current = 0
    }

    const handlePointerMove = (e) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - lastPointerRef.current.x
      const dy = e.clientY - lastPointerRef.current.y
      lastPointerRef.current = { x: e.clientX, y: e.clientY }

      const invert = invertLook ? -1 : 1
      targetYawRef.current -= dx * 0.0055 * invert
      // Pitch clamp: -10° (-0.1745 rad) to +60° (+1.0472 rad)
      targetPitchRef.current = Math.max(-0.1745, Math.min(1.0472, targetPitchRef.current + dy * 0.0055))
    }

    const handlePointerUp = () => {
      isDraggingRef.current = false
    }

    const handleWheel = (e) => {
      // Allow wheel zoom unless scrolling inside an open modal
      if (e.target && e.target.closest('[data-scrollable="true"]')) {
        return
      }
      targetDistanceRef.current = Math.max(3.0, Math.min(14.0, targetDistanceRef.current + e.deltaY * 0.006))
    }

    // Touch pinch-to-zoom on mobile
    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.hypot(dx, dy)
        if (initialPinchDistRef.current !== null) {
          const delta = initialPinchDistRef.current - dist
          targetDistanceRef.current = Math.max(3.0, Math.min(14.0, targetDistanceRef.current + delta * 0.02))
        }
        initialPinchDistRef.current = dist
      }
    }

    const handleTouchEnd = () => {
      initialPinchDistRef.current = null
    }

    const handleKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return
      if (e.code === 'KeyR') {
        isEasingPhaseRef.current = false
        watchVillageEndTimeRef.current = 0
        targetYawRef.current = 0.0
        targetPitchRef.current = 0.32
        targetDistanceRef.current = 5.8
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [invertLook])

  // Listen for skip inputs during opening flyover
  useEffect(() => {
    if (!isFlyoverActive) return

    const handleSkip = (e) => {
      if (e.type === 'keydown') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape' || e.code === 'KeyE') {
          skipFlyover()
        }
      } else if (e.type === 'pointerdown' || e.type === 'touchstart') {
        skipFlyover()
      }
    }

    window.addEventListener('keydown', handleSkip)
    window.addEventListener('pointerdown', handleSkip)
    return () => {
      window.removeEventListener('keydown', handleSkip)
      window.removeEventListener('pointerdown', handleSkip)
    }
  }, [isFlyoverActive, skipFlyover])

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime()
    const now = performance.now()
    const pPos = playerPositionRef?.current || new THREE.Vector3(-1.2, 0, 10.0)

    // 1. OPENING FLYOVER (Skippable 6-second intro sweep)
    if (isFlyoverActive && cinematicMode === 'flyover') {
      if (flyoverStartTimeRef.current === null) {
        flyoverStartTimeRef.current = elapsed
      }
      const t = elapsed - flyoverStartTimeRef.current
      const duration = 6.0
      const prog = Math.min(1.0, t / duration)

      const ease = prog < 0.5 ? 4 * prog * prog * prog : 1 - Math.pow(-2 * prog + 2, 3) / 2
      const startCam = new THREE.Vector3(5.0, 24.0, 58.0)
      const midCam = new THREE.Vector3(-15.0, 12.0, 28.0)
      const endCam = new THREE.Vector3(pPos.x - 0.4, pPos.y + 3.2, pPos.z - 5.5)

      _camTarget.x = (1 - ease) * (1 - ease) * startCam.x + 2 * (1 - ease) * ease * midCam.x + ease * ease * endCam.x
      _camTarget.y = (1 - ease) * (1 - ease) * startCam.y + 2 * (1 - ease) * ease * midCam.y + ease * ease * endCam.y
      _camTarget.z = (1 - ease) * (1 - ease) * startCam.z + 2 * (1 - ease) * ease * midCam.z + ease * ease * endCam.z

      const startLook = new THREE.Vector3(0, 2.0, 40.0)
      const endLook = new THREE.Vector3(pPos.x, pPos.y + 1.4, pPos.z)
      _lookTarget.lerpVectors(startLook, endLook, ease)

      camera.position.copy(_camTarget)
      camera.lookAt(_lookTarget)

      if (prog >= 1.0) {
        skipFlyover()
      }
      return
    }

    // Check if phase easing timer expired
    if (isEasingPhaseRef.current && now > easingEndTimeRef.current) {
      isEasingPhaseRef.current = false
    }

    // Check if "Watch the village" timer expired
    if (watchVillageEndTimeRef.current > 0 && now > watchVillageEndTimeRef.current) {
      watchVillageEndTimeRef.current = 0
    }

    // 2. SMOOTH ORBIT CAMERA DAMPING
    const dampSpeed = Math.min(1.0, delta * 9.5)
    currentYawRef.current = THREE.MathUtils.lerp(currentYawRef.current, targetYawRef.current, dampSpeed)
    currentPitchRef.current = THREE.MathUtils.lerp(currentPitchRef.current, targetPitchRef.current, dampSpeed)
    currentDistanceRef.current = THREE.MathUtils.lerp(currentDistanceRef.current, targetDistanceRef.current, dampSpeed)

    const curYaw = currentYawRef.current
    const curPitch = currentPitchRef.current
    const curDist = currentDistanceRef.current

    // Look target tracks farmer upper chest / eyes
    _lookTarget.set(pPos.x, pPos.y + 1.4, pPos.z)

    // Compute spherical orbit offset
    const cosPitch = Math.cos(curPitch)
    const sinPitch = Math.sin(curPitch)
    const sinYaw = Math.sin(curYaw)
    const cosYaw = Math.cos(curYaw)

    let camX = pPos.x - sinYaw * cosPitch * curDist
    let camY = pPos.y + 1.4 + sinPitch * curDist
    let camZ = pPos.z - cosYaw * cosPitch * curDist

    // Subtle camera shake during active fire
    if (burnState === 'burning' && !reducedMotion) {
      const shakeAmt = 0.02
      camX += Math.sin(elapsed * 34) * shakeAmt
      camY += Math.cos(elapsed * 28) * shakeAmt
      camZ += Math.sin(elapsed * 42) * shakeAmt * 0.5
    }

    // 3. COLLISION AVOIDANCE
    // Floor clamp
    if (camY < 0.65) camY = 0.65

    // Collision against Straw Piles (radius 1.25m, minCamDist 2.45m ensures zero clipping)
    for (let i = 0; i < STRAW_PILES_DATA.length; i++) {
      const pile = STRAW_PILES_DATA[i]
      const dx = camX - pile.x
      const dz = camZ - pile.z
      const distSq = dx * dx + dz * dz
      const minCamDist = 2.45
      if (distSq < minCamDist * minCamDist) {
        const dist = Math.sqrt(distSq) || 1
        camX = pile.x + (dx / dist) * minCamDist
        camZ = pile.z + (dz / dist) * minCamDist
        camY = Math.max(camY, 2.3)
      }
    }

    // Collision against Trees
    for (let i = 0; i < TREE_POSITIONS.length; i++) {
      const tree = TREE_POSITIONS[i]
      const dx = camX - tree.x
      const dz = camZ - tree.z
      const distSq = dx * dx + dz * dz
      const minCamDist = 1.6
      if (distSq < minCamDist * minCamDist) {
        const dist = Math.sqrt(distSq) || 1
        camX = tree.x + (dx / dist) * minCamDist
        camZ = tree.z + (dz / dist) * minCamDist
      }
    }

    // Collision against Farmhouse, Tractor, and Village houses
    const camMargin = 0.9
    for (let c = 0; c < colliders.length; c++) {
      const col = colliders[c]
      if (
        camX >= col.minX - camMargin &&
        camX <= col.maxX + camMargin &&
        camZ >= col.minZ - camMargin &&
        camZ <= col.maxZ + camMargin
      ) {
        camX = THREE.MathUtils.lerp(_lookTarget.x, camX, 0.45)
        camZ = THREE.MathUtils.lerp(_lookTarget.z, camZ, 0.45)
        camY = THREE.MathUtils.lerp(_lookTarget.y + 0.6, camY, 0.45)
        break
      }
    }

    // Apply final camera position and orientation
    camera.position.set(camX, camY, camZ)
    camera.lookAt(_lookTarget)
  })

  return null
}
