import React, { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { FARMHOUSE_COLLIDER } from './Farmhouse'
import { TRACTOR_COLLIDER } from './Tractor'
import { VILLAGE_COLLIDERS } from './VillageHousesInstanced'
import { STRAW_PILES_DATA } from './StrawPiles'
import { TREE_POSITIONS } from './TreesInstanced'
import { playerInput } from './FarmerPlayer'

const POLE_COLLIDERS = [
  { id: 'air_sensor', minX: -13.5, maxX: -11.5, minZ: 31.0, maxZ: 33.0 },
  { id: 'swachh_sign', minX: -4.5, maxX: -2.5, minZ: 35.5, maxZ: 37.5 }
]

/**
 * Ray vs Axis-Aligned Bounding Box (AABB) slab intersection.
 * Returns entry distance t if ray hits box within maxDist, otherwise Infinity.
 */
function rayAABB(p0, dir, maxDist, box, margin = 0.45) {
  const minX = box.minX - margin
  const maxX = box.maxX + margin
  const minY = (box.minY ?? 0.0) - margin
  const maxY = (box.maxY ?? 5.5) + margin
  const minZ = box.minZ - margin
  const maxZ = box.maxZ + margin

  let tMin = 0
  let tMax = maxDist

  if (Math.abs(dir.x) < 1e-6) {
    if (p0.x < minX || p0.x > maxX) return Infinity
  } else {
    const invD = 1 / dir.x
    let t1 = (minX - p0.x) * invD
    let t2 = (maxX - p0.x) * invD
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
    tMin = Math.max(tMin, t1)
    tMax = Math.min(tMax, t2)
    if (tMin > tMax) return Infinity
  }

  if (Math.abs(dir.y) < 1e-6) {
    if (p0.y < minY || p0.y > maxY) return Infinity
  } else {
    const invD = 1 / dir.y
    let t1 = (minY - p0.y) * invD
    let t2 = (maxY - p0.y) * invD
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
    tMin = Math.max(tMin, t1)
    tMax = Math.min(tMax, t2)
    if (tMin > tMax) return Infinity
  }

  if (Math.abs(dir.z) < 1e-6) {
    if (p0.z < minZ || p0.z > maxZ) return Infinity
  } else {
    const invD = 1 / dir.z
    let t1 = (minZ - p0.z) * invD
    let t2 = (maxZ - p0.z) * invD
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
    tMin = Math.max(tMin, t1)
    tMax = Math.min(tMax, t2)
    if (tMin > tMax) return Infinity
  }

  return tMin > 0 ? tMin : (tMax > 0 ? 0.01 : Infinity)
}

/**
 * Ray vs vertical cylinder intersection.
 * Returns entry distance t if ray hits cylinder within maxDist, otherwise Infinity.
 */
function rayCylinder(p0, dir, maxDist, cx, cz, radius, minY = 0, maxY = 5.0) {
  const dx = p0.x - cx
  const dz = p0.z - cz
  const a = dir.x * dir.x + dir.z * dir.z
  if (a < 1e-6) return Infinity

  const b = dx * dir.x + dz * dir.z
  const c = dx * dx + dz * dz - radius * radius
  const disc = b * b - a * c
  if (disc < 0) return Infinity

  const sqrtDisc = Math.sqrt(disc)
  let t = (-b - sqrtDisc) / a
  if (t < 0) {
    t = (-b + sqrtDisc) / a
  }
  if (t < 0 || t > maxDist) return Infinity

  const hitY = p0.y + t * dir.y
  if (hitY < minY || hitY > maxY) return Infinity
  return t
}

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
  const { camera, size } = useThree()
  const {
    cinematicMode,
    isFlyoverActive,
    skipFlyover,
    burnState,
    ignitedPiles,
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
  const currentLookTargetRef = useRef(new THREE.Vector3(-1.2, 1.4, 10.0))
  const springArmDistRef = useRef(5.8)

  // Phase transition easing state (max 1.5s, canceled immediately by user input)
  const isEasingPhaseRef = useRef(false)
  const easingEndTimeRef = useRef(0)
  const lastPhaseRef = useRef(seasonPhase)
  const lastBurnStateRef = useRef(burnState)

  // "Watch the village" timer and state
  const watchVillageEndTimeRef = useRef(0)
  const isWatchingVillageRef = useRef(false)

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
    ...VILLAGE_COLLIDERS,
    ...POLE_COLLIDERS
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
        isWatchingVillageRef.current = false
        watchVillageEndTimeRef.current = 0
        targetYawRef.current = 0.0
        targetPitchRef.current = 0.32
        targetDistanceRef.current = 5.8
        springArmDistRef.current = 5.8
        const p = playerPositionRef?.current
        if (p) {
          currentLookTargetRef.current.set(p.x, p.y + 1.4, p.z)
        }
      },
      watchVillage: () => {
        isEasingPhaseRef.current = false
        isWatchingVillageRef.current = true
        watchVillageEndTimeRef.current = performance.now() + 6000
        const isPortrait = size.width < size.height
        const aspectVal = size.width / Math.max(1, size.height)
        // Farm-side western vantage (height ~7.5m, distance ~23.5m) framing plume and at least two houses & villagers
        targetYawRef.current = 0.51
        targetPitchRef.current = isPortrait ? 0.22 : 0.24
        const baseDist = 23.5
        targetDistanceRef.current = isPortrait ? baseDist * Math.min(1.15, 0.92 / Math.max(0.42, aspectVal)) : baseDist
        currentYawRef.current = targetYawRef.current
        currentPitchRef.current = targetPitchRef.current
        currentDistanceRef.current = targetDistanceRef.current
        springArmDistRef.current = targetDistanceRef.current
        currentLookTargetRef.current.set(-3.5, 2.0, 44.0)
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
      if (!window.__wes_debug) window.__wes_debug = {}
      window.__wes_debug.getCameraPose = () => ({
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [_lookTarget.x, _lookTarget.y, _lookTarget.z],
        distance: currentDistanceRef.current,
        yaw: currentYawRef.current,
        pitch: currentPitchRef.current
      })
      window.__wes_debug.setCameraPose = ({ yaw, pitch, distance }) => {
        if (yaw !== undefined) {
          targetYawRef.current = yaw
          currentYawRef.current = yaw
        }
        if (pitch !== undefined) {
          targetPitchRef.current = pitch
          currentPitchRef.current = pitch
        }
        if (distance !== undefined) {
          targetDistanceRef.current = distance
          currentDistanceRef.current = distance
        }
      }
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
      if (burnState === 'lighting' || burnState === 'burning') {
        isEasingPhaseRef.current = true
        easingEndTimeRef.current = performance.now() + 2000
        const isPortrait = size.width < size.height
        const aspectVal = size.width / Math.max(1, size.height)
        targetYawRef.current = 0.28
        targetPitchRef.current = isPortrait ? 0.20 : 0.24
        const baseDist = 5.8
        const distMult = isPortrait ? Math.min(1.75, 0.94 / Math.max(0.42, aspectVal)) : 1.0
        targetDistanceRef.current = baseDist * distMult
      }
    }
  }, [burnState, size.width, size.height])

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
      isEasingPhaseRef.current = false
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
        const p = playerPositionRef?.current
        if (p) {
          currentLookTargetRef.current.set(p.x, p.y + 1.4, p.z)
        }
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

    // Apply look delta from mobile look pad
    if (playerInput.lookDeltaX !== 0) {
      const invert = invertLook ? -1 : 1
      targetYawRef.current -= playerInput.lookDeltaX * 0.0055 * invert
      playerInput.lookDeltaX = 0
    }
    if (playerInput.lookDeltaY !== 0) {
      const invert = invertLook ? -1 : 1
      targetPitchRef.current = Math.max(-0.1745, Math.min(1.0472, targetPitchRef.current + playerInput.lookDeltaY * 0.0055 * invert))
      playerInput.lookDeltaY = 0
    }

    // Check if phase easing timer expired
    if (isEasingPhaseRef.current && now > easingEndTimeRef.current) {
      isEasingPhaseRef.current = false
    }

    // Check if "Watch the village" timer expired
    if (watchVillageEndTimeRef.current > 0 && now > watchVillageEndTimeRef.current) {
      watchVillageEndTimeRef.current = 0
    }

    // 2. SMOOTH ORBIT CAMERA DAMPING (Frame-rate independent damping)
    const clampedDelta = Math.min(delta, 0.05)
    const dampK = 9.5
    const alpha = 1 - Math.exp(-dampK * clampedDelta)
    currentYawRef.current = THREE.MathUtils.lerp(currentYawRef.current, targetYawRef.current, alpha)
    currentPitchRef.current = THREE.MathUtils.lerp(currentPitchRef.current, targetPitchRef.current, alpha)
    currentDistanceRef.current = THREE.MathUtils.lerp(currentDistanceRef.current, targetDistanceRef.current, alpha)

    const curYaw = currentYawRef.current
    const curPitch = currentPitchRef.current
    const curDist = currentDistanceRef.current

    // Look target tracks farmer upper chest / eyes normally
    // During burn, frame both farmer and the ignited pile
    // During watch village, frame village center (House 2, House 3, Villager 1, Villager 2)
    const isBurnActive = burnState === 'lighting' || burnState === 'burning'
    if (isWatchingVillageRef.current) {
      _lookTarget.set(-3.5, 2.0, 44.0)
    } else if (isBurnActive) {
      const leadPile = STRAW_PILES_DATA.find((p) => ignitedPiles?.includes(p.id)) || STRAW_PILES_DATA[0]
      const pileBias = 0.62
      _lookTarget.set(
        leadPile.x * pileBias + pPos.x * (1 - pileBias),
        1.3,
        leadPile.z * pileBias + pPos.z * (1 - pileBias)
      )
    } else {
      _lookTarget.set(pPos.x, pPos.y + 1.4, pPos.z)
    }

    // Smooth the look target (damped follow, ~0.1 s) so footstep bobbing and speed changes do not shake the view
    const lookK = 10.0 // time constant 1/10 = 0.1s
    const lookAlpha = 1 - Math.exp(-lookK * clampedDelta)
    currentLookTargetRef.current.lerp(_lookTarget, lookAlpha)
    _lookTarget.copy(currentLookTargetRef.current)

    // Compute spherical orbit offset around _lookTarget
    const cosPitch = Math.cos(curPitch)
    const sinPitch = Math.sin(curPitch)
    const sinYaw = Math.sin(curYaw)
    const cosYaw = Math.cos(curYaw)

    // 3. SPRING-ARM COLLISION AVOIDANCE
    // Direction vector pointing from _lookTarget towards the orbiting camera
    const rayDir = {
      x: -sinYaw * cosPitch,
      y: sinPitch,
      z: -cosYaw * cosPitch
    }

    let minHitDist = curDist

    // Ground clearance check (keep y >= 0.65)
    if (rayDir.y < -1e-4) {
      const tGround = (_lookTarget.y - 0.65) / (-rayDir.y)
      if (tGround > 0 && tGround < minHitDist) {
        minHitDist = Math.max(1.2, tGround)
      }
    }

    // Cast against Straw Piles (radius 1.25m + margin)
    for (let i = 0; i < STRAW_PILES_DATA.length; i++) {
      const pile = STRAW_PILES_DATA[i]
      const tHit = rayCylinder(_lookTarget, rayDir, curDist, pile.x, pile.z, 1.45, 0, 3.0)
      if (tHit < minHitDist) {
        minHitDist = Math.max(1.2, tHit - 0.25)
      }
    }

    // Cast against Trees (radius 1.5m + margin)
    for (let i = 0; i < TREE_POSITIONS.length; i++) {
      const tree = TREE_POSITIONS[i]
      const tHit = rayCylinder(_lookTarget, rayDir, curDist, tree.x, tree.z, 1.5, 0, 10.0)
      if (tHit < minHitDist) {
        minHitDist = Math.max(1.2, tHit - 0.25)
      }
    }

    // Cast against Farmhouse, Tractor, Village houses, and Poles
    for (let c = 0; c < colliders.length; c++) {
      const col = colliders[c]
      const tHit = rayAABB(_lookTarget, rayDir, curDist, col, 0.45)
      if (tHit < minHitDist) {
        minHitDist = Math.max(1.2, tHit - 0.3)
      }
    }

    let camX, camY, camZ

    // Support debug negative control to prove tests fail against old teleporting code
    if (typeof window !== 'undefined' && window.__wes_debug?.useOldCameraCollision) {
      camX = _lookTarget.x - sinYaw * cosPitch * curDist
      camY = _lookTarget.y + sinPitch * curDist
      camZ = _lookTarget.z - cosYaw * cosPitch * curDist
      if (camY < 0.65) camY = 0.65

      // Old hard snaps for piles
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

      // Old hard snaps for colliders
      const camMargin = 1.0
      for (let c = 0; c < colliders.length; c++) {
        const col = colliders[c]
        if (
          camX >= col.minX - camMargin &&
          camX <= col.maxX + camMargin &&
          camZ >= col.minZ - camMargin &&
          camZ <= col.maxZ + camMargin
        ) {
          const cx = (col.minX + col.maxX) / 2
          const cz = (col.minZ + col.maxZ) / 2
          const dx = camX - cx
          const dz = camZ - cz
          const halfW = (col.maxX - col.minX) / 2 + camMargin
          const halfD = (col.maxZ - col.minZ) / 2 + camMargin
          if (Math.abs(dx) / halfW > Math.abs(dz) / halfD) {
            camX = cx + Math.sign(dx || 1) * halfW
          } else {
            camZ = cz + Math.sign(dz || 1) * halfD
          }
          camY = Math.max(camY, 6.5)
          break
        }
      }
    } else {
      // Spring-arm damping: shorten arm quickly over ~0.15s, ease back out when clear over ~0.25s
      const targetArmDist = Math.min(curDist, minHitDist)
      if (targetArmDist < springArmDistRef.current) {
        const shortenAlpha = 1 - Math.exp(-12.0 * clampedDelta)
        springArmDistRef.current = THREE.MathUtils.lerp(springArmDistRef.current, targetArmDist, shortenAlpha)
      } else {
        const extendAlpha = 1 - Math.exp(-6.0 * clampedDelta)
        springArmDistRef.current = THREE.MathUtils.lerp(springArmDistRef.current, targetArmDist, extendAlpha)
      }

      const actualDist = springArmDistRef.current
      camX = _lookTarget.x + rayDir.x * actualDist
      camY = _lookTarget.y + rayDir.y * actualDist
      camZ = _lookTarget.z + rayDir.z * actualDist

      // Ground safety clamp: camera must never end inside ground (keep y >= 0.65)
      if (camY < 0.65) camY = 0.65
    }

    // Subtle camera shake during active fire
    if (burnState === 'burning' && !reducedMotion) {
      const shakeAmt = 0.02
      camX += Math.sin(elapsed * 34) * shakeAmt
      camY += Math.cos(elapsed * 28) * shakeAmt
      camZ += Math.sin(elapsed * 42) * shakeAmt * 0.5
    }

    // Apply final camera position and orientation
    camera.position.set(camX, camY, camZ)
    camera.lookAt(_lookTarget)
  })

  return null
}
