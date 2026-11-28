import React, { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { FARMHOUSE_COLLIDER } from './Farmhouse'
import { TRACTOR_COLLIDER } from './Tractor'
import { VILLAGE_COLLIDERS } from './VillageHousesInstanced'
import { STRAW_PILES_DATA } from './StrawPiles'
import { TREE_POSITIONS } from './TreesInstanced'
import { useModelAvailability } from '../assets/ModelLoader'
import { useGLTF } from '@react-three/drei'
import MoneyFloatingTag from './MoneyFloatingTag'
import { audioManager } from '../audio/AudioManager'
import { getMoveVector, getOldMoveVector, integratePlayerPosition } from '../utils/movement'

// Module-level scratch vectors to prevent GC allocations in useFrame
const _scratchNextPos = new THREE.Vector3()
const _scratchCamTarget = new THREE.Vector3()
const _scratchPile = new THREE.Vector3()
const _scratchCamDir = new THREE.Vector3()

// Static geometry singletons for procedural farmer to prevent re-allocation churn on season changes
const FP_TORSO_GEO = new THREE.BoxGeometry(0.52, 0.74, 0.32)
const FP_SASH_GEO = new THREE.BoxGeometry(0.55, 0.15, 0.35)
const FP_HEAD_GEO = new THREE.SphereGeometry(0.21, 14, 14)
const FP_HAT_CROWN_GEO = new THREE.CylinderGeometry(0.2, 0.23, 0.2, 10)
const FP_HAT_BRIM_GEO = new THREE.CylinderGeometry(0.42, 0.42, 0.035, 14)
const FP_BACKPACK_GEO = new THREE.BoxGeometry(0.42, 0.58, 0.18)
const FP_ARM_GEO = new THREE.CylinderGeometry(0.07, 0.06, 0.58, 6)
const FP_LEG_GEO = new THREE.CylinderGeometry(0.09, 0.075, 0.6, 6)
const FP_FOOT_GEO = new THREE.BoxGeometry(0.11, 0.08, 0.22)
const FP_TORCH_HANDLE_GEO = new THREE.CylinderGeometry(0.035, 0.035, 0.45, 6)
const FP_TORCH_CUP_GEO = new THREE.CylinderGeometry(0.06, 0.045, 0.1, 8)
const FP_TORCH_FLAME_GEO = new THREE.ConeGeometry(0.07, 0.2, 6)
const FP_SPRAYER_WAND_GEO = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6)
const FP_SPRAYER_NOZZLE_GEO = new THREE.ConeGeometry(0.045, 0.08, 6)
const FP_TROWEL_HANDLE_GEO = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6)
const FP_TROWEL_BLADE_GEO = new THREE.BoxGeometry(0.08, 0.12, 0.02)
const FP_TRACTOR_BAR_GEO = new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6)
;[
  FP_TORSO_GEO,
  FP_SASH_GEO,
  FP_HEAD_GEO,
  FP_HAT_CROWN_GEO,
  FP_HAT_BRIM_GEO,
  FP_BACKPACK_GEO,
  FP_ARM_GEO,
  FP_LEG_GEO,
  FP_FOOT_GEO,
  FP_TORCH_HANDLE_GEO,
  FP_TORCH_CUP_GEO,
  FP_TORCH_FLAME_GEO,
  FP_SPRAYER_WAND_GEO,
  FP_SPRAYER_NOZZLE_GEO,
  FP_TROWEL_HANDLE_GEO,
  FP_TROWEL_BLADE_GEO,
  FP_TRACTOR_BAR_GEO,
].forEach(g => {
  g.dispose = () => {}
})

// Global input state for desktop & mobile
export const playerInput = {
  forward: 0,
  backward: 0,
  left: 0,
  right: 0,
  // Virtual joystick (-1 to 1)
  joystickX: 0,
  joystickY: 0,
  // Look rotation delta
  lookDeltaX: 0,
  lookDeltaY: 0
}

/**
 * Reset all player movement inputs (keys & joystick).
 */
export function resetPlayerInput() {
  playerInput.forward = 0
  playerInput.backward = 0
  playerInput.left = 0
  playerInput.right = 0
  playerInput.joystickX = 0
  playerInput.joystickY = 0
  playerInput.lookDeltaX = 0
  playerInput.lookDeltaY = 0
}

export default function FarmerPlayer({ initialPosition = [-1.2, 0, 10.0] }) {
  const {
    quality,
    setInteractionTarget,
    setNearestPileInfo,
    harvestState,
    hasMadeChoice,
    burnState,
    activePile,
    playerResetTrigger,
    activeAlternative,
    cinematicMode,
    reducedMotion,
    playerPositionRef,
    isAnyModalOpen,
    isChoicePanelOpen
  } = useGame3D()
  const { camera } = useThree()

  // Character group ref and body limb refs
  const playerRef = useRef(null)
  const leftLegRef = useRef(null)
  const rightLegRef = useRef(null)
  const leftArmRef = useRef(null)
  const rightArmRef = useRef(null)
  const torsoRef = useRef(null)

  // Player state & smooth velocity lerp (acceleration / deceleration)
  const posRef = useRef(new THREE.Vector3(...initialPosition))
  const currentVelRef = useRef(new THREE.Vector3(0, 0, 0))
  const targetVelRef = useRef(new THREE.Vector3(0, 0, 0))
  const yawRef = useRef(0) // Player orientation angle
  const lastHeadingYawRef = useRef(0) // Camera heading angle
  const isMovingRef = useRef(false)
  const walkTimeRef = useRef(0)
  const lastNavUpdateRef = useRef(0)
  const simTimeRef = useRef(0)
  const lastTargetIdRef = useRef(null)

  const isHigh = quality === 'high'
  const hasFarmerModel = useModelAvailability('/models/farmer.glb')

  // Register debug hooks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.__wes_debug) window.__wes_debug = {}
      window.__wes_debug.getPlayerPos = () => [posRef.current.x, posRef.current.y, posRef.current.z]
      window.__wes_debug.setPlayerPos = (pos) => {
        posRef.current.set(...pos)
        if (playerRef.current) playerRef.current.position.set(...pos)
      }
      window.__wes_debug.getCameraHeading = () => lastHeadingYawRef.current
      window.__wes_debug.getSimTime = () => simTimeRef.current
      window.__wes_debug.driveJoystick = (normX, normY) => {
        playerInput.joystickX = normX
        playerInput.joystickY = normY
      }
      window.__wes_debug.playerInput = playerInput
      window.__wes_debug.resetPlayerInput = resetPlayerInput
      window.__wes_debug.getFarmerPoseHealth = () => {
        const torsoY = torsoRef.current?.position.y ?? 1.05
        const leftLegY = leftLegRef.current?.position.y ?? 0.58
        const rightLegY = rightLegRef.current?.position.y ?? 0.58
        const detached = Math.abs(torsoY - 1.05) > 0.12 || Math.abs(leftLegY - 0.58) > 0.1 || Math.abs(rightLegY - 0.58) > 0.1
        const insidePile = STRAW_PILES_DATA.some(
          (p) => Math.hypot(posRef.current.x - p.x, posRef.current.z - p.z) < 1.35
        )
        return { detached, insidePile, torsoY, leftLegY, rightLegY }
      }
      window.__wes_debug.getFarmerScreenPos = () => {
        const v = new THREE.Vector3(posRef.current.x, posRef.current.y + 1.0, posRef.current.z)
        v.project(camera)
        const inFrustum = v.z >= -1 && v.z <= 1 && v.x >= -0.98 && v.x <= 0.98 && v.y >= -0.98 && v.y <= 0.98
        return {
          x: Math.round(((v.x + 1) / 2) * window.innerWidth),
          y: Math.round(((-v.y + 1) / 2) * window.innerHeight),
          inFrustum
        }
      }
      window.__wes_debug.stepMovement = (simDelta) => {
        const curPos = posRef.current
        return integratePlayerPosition(
          curPos,
          currentVelRef.current,
          simDelta,
          (testPos) => {
            _scratchNextPos.set(testPos.x, testPos.y, testPos.z)
            return checkCollisions(_scratchNextPos)
          },
          0.1,
          4
        )
      }
      window.__wes_debug.checkCollisions = (pos) => {
        _scratchNextPos.set(pos[0], pos[1] || 0, pos[2])
        return checkCollisions(_scratchNextPos)
      }
      window.__wes_debug.isFarmerInView = () => {
        const p = posRef.current
        const v = new THREE.Vector3(p.x, p.y + 1.0, p.z)
        v.project(camera)
        return v.z < 1.0 && Math.abs(v.x) <= 0.98 && Math.abs(v.y) <= 0.98
      }

      return () => {
        if (typeof window !== 'undefined' && window.__wes_debug) {
          delete window.__wes_debug.isFarmerInView
        }
      }
    }
  }, [camera])

  // Position farmer clear of straw piles & facing the action when an alternative sequence starts
  useEffect(() => {
    if (!activeAlternative) return
    posRef.current.set(-1.2, 0, 8.5)
    if (playerRef.current) {
      playerRef.current.position.set(-1.2, 0, 8.5)
    }
    currentVelRef.current.set(0, 0, 0)
    targetVelRef.current.set(0, 0, 0)
    if (activeAlternative === 'bale_sell') yawRef.current = 0.35
    else if (activeAlternative === 'compost') yawRef.current = -0.45
    else yawRef.current = -0.35
  }, [activeAlternative])

  // Reset all movement inputs on blur, visibilitychange (document.hidden), or when modals / choice panel open
  useEffect(() => {
    if (isAnyModalOpen || isChoicePanelOpen) {
      resetPlayerInput()
    }
  }, [isAnyModalOpen, isChoicePanelOpen])

  useEffect(() => {
    const handleBlur = () => {
      resetPlayerInput()
    }
    const handleVisibilityChange = () => {
      if (document.hidden) {
        resetPlayerInput()
      }
    }
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Reset player position and rotation when rewinding
  useEffect(() => {
    if (playerResetTrigger > 0) {
      posRef.current.set(...initialPosition)
      yawRef.current = 0
      lastHeadingYawRef.current = 0
      resetPlayerInput()
      if (playerRef.current) {
        playerRef.current.position.set(...initialPosition)
        playerRef.current.rotation.y = 0
      }
    }
  }, [playerResetTrigger, initialPosition])

  // Desktop keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Prevent page scrolling on Arrow keys and Space when game is active
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }

      if (isAnyModalOpen) return

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          playerInput.forward = 1
          break
        case 'KeyS':
        case 'ArrowDown':
          playerInput.backward = 1
          break
        case 'KeyA':
        case 'ArrowLeft':
          playerInput.left = 1
          break
        case 'KeyD':
        case 'ArrowRight':
          playerInput.right = 1
          break
        default:
          break
      }
    }

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          playerInput.forward = 0
          break
        case 'KeyS':
        case 'ArrowDown':
          playerInput.backward = 0
          break
        case 'KeyA':
        case 'ArrowLeft':
          playerInput.left = 0
          break
        case 'KeyD':
        case 'ArrowRight':
          playerInput.right = 0
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Collision detection helper
  const checkCollisions = (testPos) => {
    // 1. River boundary: player cannot enter river (X < -37.5)
    if (testPos.x < -37.5) return true

    // 2. World perimeter boundaries
    if (testPos.x > 48 || testPos.z < -42 || testPos.z > 62) return true

    // 3. Farmhouse
    if (
      testPos.x >= FARMHOUSE_COLLIDER.minX &&
      testPos.x <= FARMHOUSE_COLLIDER.maxX &&
      testPos.z >= FARMHOUSE_COLLIDER.minZ &&
      testPos.z <= FARMHOUSE_COLLIDER.maxZ
    ) {
      return true
    }

    // 4. Tractor
    if (
      testPos.x >= TRACTOR_COLLIDER.minX &&
      testPos.x <= TRACTOR_COLLIDER.maxX &&
      testPos.z >= TRACTOR_COLLIDER.minZ &&
      testPos.z <= TRACTOR_COLLIDER.maxZ
    ) {
      return true
    }

    // 5. Village houses
    for (const v of VILLAGE_COLLIDERS) {
      if (
        testPos.x >= v.minX &&
        testPos.x <= v.maxX &&
        testPos.z >= v.minZ &&
        testPos.z <= v.maxZ
      ) {
        return true
      }
    }

    // 6. Straw pile physical base core (radius 1.25m, leaving 3m clear walking perimeter)
    for (let i = 0; i < STRAW_PILES_DATA.length; i++) {
      const p = STRAW_PILES_DATA[i]
      const dx = testPos.x - p.x
      const dz = testPos.z - p.z
      if (dx * dx + dz * dz < 1.35 * 1.35) {
        return true
      }
    }

    return false
  }

  // Frame update loop
  useFrame(({ clock }, delta) => {
    if (!playerRef.current) return
    simTimeRef.current += Math.min(delta, 0.1)

    // Derive camera heading yaw directly from camera world direction (projected onto ground plane)
    camera.getWorldDirection(_scratchCamDir)
    const horizontalMag = Math.hypot(_scratchCamDir.x, _scratchCamDir.z)
    let headingYaw = lastHeadingYawRef.current
    if (horizontalMag > 0.05) {
      headingYaw = Math.atan2(_scratchCamDir.x, _scratchCamDir.z)
      lastHeadingYawRef.current = headingYaw
    }

    // Compute user input: forward (+1 for W/ArrowUp), right (+1 for D/ArrowRight)
    let inputForward = playerInput.forward - playerInput.backward
    let inputRight = playerInput.right - playerInput.left

    // Blend in mobile virtual joystick (joystick up has negative screen Y, so -joystickY is forward)
    if (Math.abs(playerInput.joystickY) > 0.05) {
      inputForward -= playerInput.joystickY
    }
    if (Math.abs(playerInput.joystickX) > 0.05) {
      inputRight += playerInput.joystickX
    }

    // Single source of truth for camera-relative movement (supports debug negative control)
    const moveVec = (typeof window !== 'undefined' && window.__wes_debug?.useOldMovement)
      ? getOldMoveVector(headingYaw, inputForward, inputRight)
      : getMoveVector(headingYaw, inputForward, inputRight)
    const hasInput = moveVec.magnitude > 0.08

    if (hasInput) {
      // Body faces movement direction
      yawRef.current = Math.atan2(moveVec.x, moveVec.z)

      const targetSpeed = 5.5 * moveVec.magnitude
      targetVelRef.current.set(
        moveVec.x * targetSpeed,
        0,
        moveVec.z * targetSpeed
      )
      // Accelerate towards target velocity with frame-rate independent damping
      const accelAlpha = 1 - Math.exp(-14.0 * Math.min(delta, 0.05))
      currentVelRef.current.lerp(targetVelRef.current, accelAlpha)
    } else {
      targetVelRef.current.set(0, 0, 0)
      // Decelerate smoothly to stop with frame-rate independent damping
      const decelAlpha = 1 - Math.exp(-16.0 * Math.min(delta, 0.05))
      currentVelRef.current.lerp(targetVelRef.current, decelAlpha)
    }

    const currentSpeed = currentVelRef.current.length()
    const isMoving = currentSpeed > 0.15
    isMovingRef.current = isMoving

    if (isMoving) {
      const curPos = posRef.current
      // Clamp delta used for position integration (Math.min(delta, 0.05)) and sub-step collision checks
      integratePlayerPosition(
        curPos,
        currentVelRef.current,
        delta,
        (testPos) => {
          _scratchNextPos.set(testPos.x, testPos.y, testPos.z)
          return checkCollisions(_scratchNextPos)
        },
        0.1,
        4
      )

      walkTimeRef.current += Math.min(delta, 0.1) * (currentSpeed * 1.65)

      // Surface detection for footsteps: dirt (field), grass (border/canal), road (gravel/stone)
      let surface = 'dirt'
      if (curPos.x >= -2 && curPos.x <= 5 && curPos.z >= 0 && curPos.z <= 50) {
        surface = 'road'
      } else if (curPos.x <= -28 || curPos.z < -5 || curPos.z > 35) {
        surface = 'grass'
      }
      const stepPhase = Math.sin(walkTimeRef.current)
      if (Math.abs(stepPhase) < 0.18) {
        audioManager.playFootstep(surface)
      }
    }

    // Update player mesh position and rotation
    playerRef.current.position.copy(posRef.current)
    playerRef.current.rotation.y = yawRef.current

    // 1. Proximity check against straw piles (zero object allocations)
    let nearestPile = null
    let minDist = 5.0 // Increased interaction radius to 5.0m
    let absoluteClosest = null
    let absoluteMinDist = Infinity

    for (let i = 0; i < STRAW_PILES_DATA.length; i++) {
      const pile = STRAW_PILES_DATA[i]
      _scratchPile.set(pile.x, 0, pile.z)
      const dist = posRef.current.distanceTo(_scratchPile)
      if (dist < absoluteMinDist) {
        absoluteMinDist = dist
        absoluteClosest = pile
      }
      if (dist < minDist) {
        minDist = dist
        nearestPile = pile
      }
    }

    // Throttled target update: avoid re-rendering context consumers every frame
    if (lastTargetIdRef.current !== (nearestPile ? nearestPile.id : null)) {
      lastTargetIdRef.current = nearestPile ? nearestPile.id : null
      setInteractionTarget(nearestPile)
    }

    const isAtPile =
      Boolean(nearestPile) &&
      harvestState === 'harvested' &&
      burnState === 'idle' &&
      !activeAlternative &&
      !hasMadeChoice

    // Note: Do NOT auto-snap or turn the farmer during decision (Item 1 requirement)

    // Report nearest pile navigation coordinates for HUD guidance arrow (throttled to ~12 Hz)
    if (clock.getElapsedTime() - lastNavUpdateRef.current > 0.08) {
      lastNavUpdateRef.current = clock.getElapsedTime()
      if (absoluteClosest) {
        const dx = absoluteClosest.x - posRef.current.x
        const dz = absoluteClosest.z - posRef.current.z
        const worldAngle = Math.atan2(dx, dz)
        const relAngleRad = worldAngle - lastHeadingYawRef.current
        const relAngleDeg = (relAngleRad * 180) / Math.PI
        setNearestPileInfo({
          id: absoluteClosest.id,
          distance: absoluteMinDist,
          angleDeg: relAngleDeg
        })
      }
    }

    // 2. Procedural walk, idle, and matching choice animations
    const t = walkTimeRef.current
    const elapsed = clock.getElapsedTime()

    if (burnState === 'lighting') {
      // 1. Burn: Torch lighting animation (lean forward, extend torch arm down to pile)
      if (activePile) {
        const dx = activePile.x - posRef.current.x
        const dz = activePile.z - posRef.current.z
        yawRef.current = Math.atan2(dx, dz)
      }
      if (torsoRef.current) torsoRef.current.rotation.x = 0.32
      if (rightArmRef.current) rightArmRef.current.rotation.x = -1.25
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0.2
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0
    } else if (activeAlternative === 'happy_seeder') {
      // 2. Happy Seeder: Standing clear watching tractor & gesturing (connected limbs)
      if (torsoRef.current) {
        torsoRef.current.position.y = 1.05
        torsoRef.current.rotation.x = 0.04
        torsoRef.current.rotation.y = Math.sin(elapsed * 1.5) * 0.08
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.15
        leftArmRef.current.rotation.z = -0.15
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.75 + Math.sin(elapsed * 2.5) * 0.12
        rightArmRef.current.rotation.y = 0
        rightArmRef.current.rotation.z = 0.2
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = 0
        rightLegRef.current.position.y = 0.58
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = 0
        leftLegRef.current.position.y = 0.58
      }
    } else if (activeAlternative === 'bale_sell') {
      // 3. Bale & Sell: Waving to the baler / truck operator animation
      if (torsoRef.current) {
        torsoRef.current.position.y = 1.05
        torsoRef.current.rotation.x = -0.04
        torsoRef.current.rotation.y = 0
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -2.2
        rightArmRef.current.rotation.y = 0
        rightArmRef.current.rotation.z = Math.sin(elapsed * 6.0) * 0.35 + 0.25
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.2
        leftArmRef.current.rotation.z = -0.2
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = 0
        leftLegRef.current.position.y = 0.58
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = 0
        rightLegRef.current.position.y = 0.58
      }
    } else if (activeAlternative === 'mulch') {
      // 4. Mulch: Standing clear observing mulch spread (connected limbs)
      if (torsoRef.current) {
        torsoRef.current.position.y = 1.05
        torsoRef.current.rotation.x = 0.14
        torsoRef.current.rotation.y = Math.sin(elapsed * 1.8) * 0.1
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.85 + Math.sin(elapsed * 2.8) * 0.18
        rightArmRef.current.rotation.y = 0.15
        rightArmRef.current.rotation.z = 0.1
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0.15
        leftArmRef.current.rotation.z = -0.1
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = 0
        leftLegRef.current.position.y = 0.58
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = 0
        rightLegRef.current.position.y = 0.58
      }
    } else if (activeAlternative === 'compost') {
      // 5. Compost: Spraying bio-decomposer wand sweep
      if (torsoRef.current) {
        torsoRef.current.position.y = 1.05
        torsoRef.current.rotation.x = 0.18
        torsoRef.current.rotation.y = Math.sin(elapsed * 3.5) * 0.15
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.9 + Math.sin(elapsed * 3.5) * 0.2
        rightArmRef.current.rotation.y = Math.cos(elapsed * 3.5) * 0.35
        rightArmRef.current.rotation.z = 0
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0.2
        leftArmRef.current.rotation.z = 0.1
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = 0
        leftLegRef.current.position.y = 0.58
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = 0
        rightLegRef.current.position.y = 0.58
      }
    } else if (isMoving) {
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0
        torsoRef.current.rotation.y = 0
        torsoRef.current.position.y = 1.05 + Math.abs(Math.sin(t)) * 0.08
      }
      const swing = Math.sin(t) * 0.65
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = swing
        leftLegRef.current.position.y = 0.58
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = -swing
        rightLegRef.current.position.y = 0.58
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -swing * 0.7
        leftArmRef.current.rotation.z = 0
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = swing * 0.7
        rightArmRef.current.rotation.y = 0
        rightArmRef.current.rotation.z = 0
      }
    } else {
      // Idle breathing
      if (torsoRef.current) {
        torsoRef.current.rotation.x = 0
        torsoRef.current.rotation.y = 0
      }
      const idleTime = clock.getElapsedTime()
      const breath = Math.sin(idleTime * 2.5) * 0.02
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = 0
        leftLegRef.current.position.y = 0.58
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = 0
        rightLegRef.current.position.y = 0.58
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0
        leftArmRef.current.rotation.z = 0
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0
        rightArmRef.current.rotation.y = 0
        rightArmRef.current.rotation.z = 0
      }
      if (torsoRef.current) torsoRef.current.position.y = 1.05 + breath
    }

    // Update player position ref for centralized OrbitCameraController
    if (playerPositionRef && playerPositionRef.current) {
      playerPositionRef.current.copy(posRef.current)
    }
  })

  return (
    <group ref={playerRef} name="FarmerPlayer">
      {hasFarmerModel ? (
        <React.Suspense fallback={null}>
          <GLTFFarmerModel />
        </React.Suspense>
      ) : (
        <>
          {/* 1. Torso (Kurta) - Slimmer & Natural */}
          <group ref={torsoRef} position={[0, 1.0, 0]}>
            <mesh dispose={null} geometry={FP_TORSO_GEO} castShadow={isHigh} receiveShadow={isHigh}>
              <meshStandardMaterial color="#E0F2F1" roughness={0.8} /> {/* White cotton kurta */}
            </mesh>

            {/* Waist Sash (Gamcha) */}
            <mesh dispose={null} position={[0, -0.24, 0]} geometry={FP_SASH_GEO}>
              <meshStandardMaterial color="#E65100" /> {/* Saffron gamcha */}
            </mesh>

            {/* Head */}
            <mesh dispose={null} position={[0, 0.62, 0]} geometry={FP_HEAD_GEO} castShadow={isHigh}>
              <meshStandardMaterial color="#8D6E63" roughness={0.7} />
            </mesh>

            {/* Farmer Straw Hat / Turban - Proportionately sized */}
            <group position={[0, 0.76, 0]}>
              {/* Hat Crown */}
              <mesh dispose={null} geometry={FP_HAT_CROWN_GEO} castShadow={isHigh}>
                <meshStandardMaterial color="#F57F17" roughness={0.85} />
              </mesh>
              {/* Subtle Brim */}
              <mesh dispose={null} position={[0, -0.05, 0]} geometry={FP_HAT_BRIM_GEO} castShadow={isHigh}>
                <meshStandardMaterial color="#F9A825" roughness={0.85} />
              </mesh>
            </group>

            {/* Backpack spray tank for bio-decomposer */}
            {activeAlternative === 'compost' && (
              <mesh dispose={null} position={[0, 0, -0.26]} geometry={FP_BACKPACK_GEO} castShadow={isHigh}>
                <meshStandardMaterial color="#0288D1" roughness={0.5} />
              </mesh>
            )}
          </group>

          {/* 2. Left Arm */}
          <group ref={leftArmRef} position={[-0.34, 1.25, 0]}>
            <mesh dispose={null} position={[0, -0.28, 0]} geometry={FP_ARM_GEO} castShadow={isHigh}>
              <meshStandardMaterial color="#8D6E63" />
            </mesh>
          </group>

          {/* 3. Right Arm */}
          <group ref={rightArmRef} position={[0.34, 1.25, 0]}>
            <mesh dispose={null} position={[0, -0.28, 0]} geometry={FP_ARM_GEO} castShadow={isHigh}>
              <meshStandardMaterial color="#8D6E63" />
            </mesh>

            {/* Flaming Torch when lighting the pile */}
            {burnState === 'lighting' && (
              <group position={[0, -0.58, 0.15]} rotation={[0.4, 0, 0]}>
                {/* Torch wooden handle */}
                <mesh dispose={null} position={[0, -0.12, 0]} geometry={FP_TORCH_HANDLE_GEO}>
                  <meshStandardMaterial color="#4E342E" roughness={0.9} />
                </mesh>
                {/* Torch metal cup */}
                <mesh dispose={null} position={[0, 0.12, 0]} geometry={FP_TORCH_CUP_GEO}>
                  <meshStandardMaterial color="#212121" metalness={0.8} />
                </mesh>
                {/* Torch Flame */}
                <mesh dispose={null} position={[0, 0.22, 0]} geometry={FP_TORCH_FLAME_GEO}>
                  <meshBasicMaterial color="#FF5722" />
                </mesh>
              </group>
            )}

            {/* Sprayer wand when composting */}
            {activeAlternative === 'compost' && (
              <group position={[0, -0.5, 0.2]} rotation={[0.7, 0, 0]}>
                <mesh dispose={null} position={[0, 0, 0]} geometry={FP_SPRAYER_WAND_GEO}>
                  <meshStandardMaterial color="#37474F" metalness={0.8} />
                </mesh>
                <mesh dispose={null} position={[0, 0.35, 0]} geometry={FP_SPRAYER_NOZZLE_GEO}>
                  <meshStandardMaterial color="#FFB300" />
                </mesh>
              </group>
            )}

            {/* Hand trowel / rake when mulching */}
            {activeAlternative === 'mulch' && (
              <group position={[0, -0.45, 0.15]} rotation={[0.6, 0, 0]}>
                <mesh dispose={null} position={[0, 0, 0]} geometry={FP_TROWEL_HANDLE_GEO}>
                  <meshStandardMaterial color="#5D4037" roughness={0.8} />
                </mesh>
                <mesh dispose={null} position={[0, 0.18, 0]} geometry={FP_TROWEL_BLADE_GEO}>
                  <meshStandardMaterial color="#78909C" metalness={0.7} />
                </mesh>
              </group>
            )}

            {/* Tractor grab bar when climbing tractor */}
            {activeAlternative === 'happy_seeder' && (
              <group position={[-0.15, -0.2, 0.22]} rotation={[0, 0, 0.2]}>
                <mesh dispose={null} position={[0, 0, 0]} geometry={FP_TRACTOR_BAR_GEO}>
                  <meshStandardMaterial color="#FFB300" metalness={0.8} />
                </mesh>
              </group>
            )}
          </group>

          {/* 4. Left Leg (Dhoti) */}
          <group ref={leftLegRef} position={[-0.15, 0.58, 0]}>
            <mesh dispose={null} position={[0, -0.28, 0]} geometry={FP_LEG_GEO} castShadow={isHigh}>
              <meshStandardMaterial color="#ECEFF1" roughness={0.8} />
            </mesh>
            {/* Foot */}
            <mesh dispose={null} position={[0, -0.58, 0.05]} geometry={FP_FOOT_GEO}>
              <meshStandardMaterial color="#3E2723" />
            </mesh>
          </group>

          {/* 5. Right Leg */}
          <group ref={rightLegRef} position={[0.15, 0.58, 0]}>
            <mesh dispose={null} position={[0, -0.28, 0]} geometry={FP_LEG_GEO} castShadow={isHigh}>
              <meshStandardMaterial color="#ECEFF1" roughness={0.8} />
            </mesh>
            {/* Foot */}
            <mesh dispose={null} position={[0, -0.58, 0.05]} geometry={FP_FOOT_GEO}>
              <meshStandardMaterial color="#3E2723" />
            </mesh>
          </group>
        </>
      )}

      {/* Floating Money Outcome Badge above the farmer */}
      <MoneyFloatingTag position={[0, 2.35, 0]} />
    </group>
  )
}

function GLTFFarmerModel() {
  const { scene } = useGLTF('/models/farmer.glb', true)
  return <primitive object={scene} />
}
