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
import InWorldChoicePanel from './InWorldChoicePanel'
import MoneyFloatingTag from './MoneyFloatingTag'
import { audioManager } from '../audio/AudioManager'

// Module-level scratch vectors to prevent GC allocations in useFrame
const _scratchNextPos = new THREE.Vector3()
const _scratchCamTarget = new THREE.Vector3()
const _scratchPile = new THREE.Vector3()

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
    reducedMotion
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
  const camYawRef = useRef(0.08) // Slight offset so camera frames straw piles, tractor, and village
  const isMovingRef = useRef(false)
  const walkTimeRef = useRef(0)
  const lastNavUpdateRef = useRef(0)
  const lastTargetIdRef = useRef(null)

  const isHigh = quality === 'high'
  const hasFarmerModel = useModelAvailability('/models/farmer.glb')

  // Reset player position and rotation when rewinding
  useEffect(() => {
    if (playerResetTrigger > 0) {
      posRef.current.set(...initialPosition)
      yawRef.current = 0
      camYawRef.current = 0
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

  // Desktop Mouse Drag to Look
  useEffect(() => {
    let isMouseDown = false
    let lastX = 0

    const onMouseDown = (e) => {
      if (e.button === 0) {
        isMouseDown = true
        lastX = e.clientX
      }
    }

    const onMouseMove = (e) => {
      if (!isMouseDown) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      camYawRef.current -= dx * 0.005
    }

    const onMouseUp = () => {
      isMouseDown = false
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
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
  useFrame((_, delta) => {
    if (!playerRef.current) return

    // Apply look rotation from mobile look delta
    if (playerInput.lookDeltaX !== 0) {
      camYawRef.current -= playerInput.lookDeltaX * 0.04
      playerInput.lookDeltaX = 0
    }

    // Determine movement direction vector
    let moveZ = playerInput.backward - playerInput.forward
    let moveX = playerInput.right - playerInput.left

    // Blend in mobile virtual joystick
    if (Math.abs(playerInput.joystickY) > 0.05) {
      moveZ += playerInput.joystickY
    }
    if (Math.abs(playerInput.joystickX) > 0.05) {
      moveX += playerInput.joystickX
    }

    const inputMag = Math.sqrt(moveX * moveX + moveZ * moveZ)
    const hasInput = inputMag > 0.08

    if (hasInput) {
      const normX = moveX / Math.max(inputMag, 1)
      const normZ = moveZ / Math.max(inputMag, 1)
      const moveAngle = Math.atan2(normX, normZ) + camYawRef.current
      yawRef.current = moveAngle

      const targetSpeed = 5.5 * Math.min(inputMag, 1.0)
      targetVelRef.current.set(
        Math.sin(moveAngle) * targetSpeed,
        0,
        Math.cos(moveAngle) * targetSpeed
      )
      // Accelerate towards target velocity
      currentVelRef.current.lerp(targetVelRef.current, Math.min(1.0, delta * 14.0))
    } else {
      targetVelRef.current.set(0, 0, 0)
      // Decelerate smoothly to stop
      currentVelRef.current.lerp(targetVelRef.current, Math.min(1.0, delta * 16.0))
    }

    const currentSpeed = currentVelRef.current.length()
    const isMoving = currentSpeed > 0.15
    isMovingRef.current = isMoving

    if (isMoving) {
      const curPos = posRef.current
      const vx = currentVelRef.current.x * delta
      const vz = currentVelRef.current.z * delta

      // Separate X and Z sliding collisions using module scratch vector
      _scratchNextPos.set(curPos.x + vx, curPos.y, curPos.z)
      if (!checkCollisions(_scratchNextPos)) {
        curPos.x += vx
      }
      _scratchNextPos.set(curPos.x, curPos.y, curPos.z + vz)
      if (!checkCollisions(_scratchNextPos)) {
        curPos.z += vz
      }

      walkTimeRef.current += delta * (currentSpeed * 1.65)

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

    if (isAtPile && !isMoving) {
      const dx = nearestPile.x - posRef.current.x
      const dz = nearestPile.z - posRef.current.z
      const pileAngle = Math.atan2(dx, dz)
      yawRef.current = THREE.MathUtils.lerp(yawRef.current, pileAngle, 0.08)
    }

    // Report nearest pile navigation coordinates for HUD guidance arrow (throttled to ~12 Hz)
    if (_.clock.getElapsedTime() - lastNavUpdateRef.current > 0.08) {
      lastNavUpdateRef.current = _.clock.getElapsedTime()
      if (absoluteClosest) {
        const dx = absoluteClosest.x - posRef.current.x
        const dz = absoluteClosest.z - posRef.current.z
        const worldAngle = Math.atan2(dx, dz)
        const relAngleRad = worldAngle - camYawRef.current
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
    const elapsed = _.clock.getElapsedTime()

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
      // 2. Happy Seeder: Climbing into tractor animation
      if (torsoRef.current) {
        torsoRef.current.position.y = 1.26
        torsoRef.current.rotation.x = 0.18
        torsoRef.current.rotation.y = 0
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -2.1
        leftArmRef.current.rotation.z = -0.35
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -1.6
        rightArmRef.current.rotation.y = 0
        rightArmRef.current.rotation.z = 0.3
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = -1.15
        rightLegRef.current.position.y = 0.72
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = 0.2
        leftLegRef.current.position.y = 0.58
      }
    } else if (activeAlternative === 'bale_sell') {
      // 3. Bale & Sell: Waving to the baler / truck operator animation
      if (torsoRef.current) {
        torsoRef.current.position.y = 1.05
        torsoRef.current.rotation.x = -0.05
        torsoRef.current.rotation.y = 0
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -2.45
        rightArmRef.current.rotation.y = 0
        rightArmRef.current.rotation.z = Math.sin(elapsed * 7.0) * 0.4 + 0.3
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.45
        leftArmRef.current.rotation.z = -0.45
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
      // 4. Mulch: Bending down inspecting soil and spreading mulch
      if (torsoRef.current) {
        torsoRef.current.position.y = 0.8
        torsoRef.current.rotation.x = 0.52
        torsoRef.current.rotation.y = 0
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -1.35
        rightArmRef.current.rotation.y = Math.sin(elapsed * 3.0) * 0.25
        rightArmRef.current.rotation.z = 0.1
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0.35
        leftArmRef.current.rotation.z = 0.15
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = -0.4
        leftLegRef.current.position.y = 0.58
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = 0.3
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
      const idleTime = _.clock.getElapsedTime()
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

    // 3. 3rd Person Camera Smooth Follow with Bob & Collision Avoidance
    if (cinematicMode && cinematicMode !== 'normal') return

    // Footstep camera bob (disabled under reduced motion)
    const camBob = (!reducedMotion && isMoving)
      ? Math.sin(walkTimeRef.current * 1.8) * 0.06 * (currentSpeed / 5.5)
      : 0

    let targetCamX = 0
    let targetCamY = 0
    let targetCamZ = 0
    let targetLookX = 0
    let targetLookY = 0
    let targetLookZ = 0

    if (isAtPile && nearestPile) {
      // Decision Point Framing: Camera placed behind farmer's right shoulder, looking past
      // the farmer and the straw mound towards the northern village in the background.
      // Farmer is never inside or behind the pile.
      targetCamX = posRef.current.x + 1.85
      targetCamY = posRef.current.y + 2.2 + camBob
      targetCamZ = posRef.current.z - 3.8

      targetLookX = posRef.current.x * 0.4 + nearestPile.x * 0.6
      targetLookY = posRef.current.y + 1.35 + camBob
      targetLookZ = Math.max(posRef.current.z + 4.2, nearestPile.z + 2.8)
    } else {
      const camDistance = 5.8
      const camHeight = 3.2
      const behindX = -Math.sin(camYawRef.current) * camDistance
      const behindZ = -Math.cos(camYawRef.current) * camDistance

      targetCamX = posRef.current.x + behindX
      targetCamY = posRef.current.y + camHeight + camBob
      targetCamZ = posRef.current.z + behindZ

      targetLookX = posRef.current.x
      targetLookY = posRef.current.y + 1.4 + camBob
      targetLookZ = posRef.current.z
    }

    // Camera Collision Avoidance against Farmhouse, Tractor, and Village houses
    const colliders = [
      FARMHOUSE_COLLIDER,
      TRACTOR_COLLIDER,
      ...VILLAGE_COLLIDERS
    ]
    const camMargin = 0.85
    for (let c = 0; c < colliders.length; c++) {
      const col = colliders[c]
      if (
        targetCamX >= col.minX - camMargin &&
        targetCamX <= col.maxX + camMargin &&
        targetCamZ >= col.minZ - camMargin &&
        targetCamZ <= col.maxZ + camMargin
      ) {
        targetCamX = THREE.MathUtils.lerp(targetLookX, targetCamX, 0.45)
        targetCamZ = THREE.MathUtils.lerp(targetLookZ, targetCamZ, 0.45)
        targetCamY = THREE.MathUtils.lerp(targetLookY + 0.6, targetCamY, 0.45)
        break
      }
    }

    // Camera Collision Avoidance against Straw Piles
    for (let i = 0; i < STRAW_PILES_DATA.length; i++) {
      const pile = STRAW_PILES_DATA[i]
      const dx = targetCamX - pile.x
      const dz = targetCamZ - pile.z
      const distSq = dx * dx + dz * dz
      const minCamDist = 1.85
      if (distSq < minCamDist * minCamDist) {
        const dist = Math.sqrt(distSq) || 1
        targetCamX = pile.x + (dx / dist) * minCamDist
        targetCamZ = pile.z + (dz / dist) * minCamDist
        targetCamY = Math.max(targetCamY, 2.2)
      }
    }

    // Camera Collision Avoidance against Trees
    for (let i = 0; i < TREE_POSITIONS.length; i++) {
      const tree = TREE_POSITIONS[i]
      const dx = targetCamX - tree.x
      const dz = targetCamZ - tree.z
      const distSq = dx * dx + dz * dz
      const minCamDist = 1.5
      if (distSq < minCamDist * minCamDist) {
        const dist = Math.sqrt(distSq) || 1
        targetCamX = tree.x + (dx / dist) * minCamDist
        targetCamZ = tree.z + (dz / dist) * minCamDist
      }
    }

    _scratchCamTarget.set(targetCamX, targetCamY, targetCamZ)
    camera.position.lerp(_scratchCamTarget, isAtPile ? 0.08 : 0.12)
    camera.lookAt(targetLookX, targetLookY, targetLookZ)
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
            <mesh castShadow={isHigh} receiveShadow={isHigh}>
              <boxGeometry args={[0.52, 0.74, 0.32]} />
              <meshStandardMaterial color="#E0F2F1" roughness={0.8} /> {/* White cotton kurta */}
            </mesh>

            {/* Waist Sash (Gamcha) */}
            <mesh position={[0, -0.24, 0]}>
              <boxGeometry args={[0.55, 0.15, 0.35]} />
              <meshStandardMaterial color="#E65100" /> {/* Saffron gamcha */}
            </mesh>

            {/* Head */}
            <mesh position={[0, 0.62, 0]} castShadow={isHigh}>
              <sphereGeometry args={[0.21, 14, 14]} />
              <meshStandardMaterial color="#8D6E63" roughness={0.7} />
            </mesh>

            {/* Farmer Straw Hat / Turban - Proportionately sized */}
            <group position={[0, 0.76, 0]}>
              {/* Hat Crown */}
              <mesh castShadow={isHigh}>
                <cylinderGeometry args={[0.2, 0.23, 0.2, 10]} />
                <meshStandardMaterial color="#F57F17" roughness={0.85} />
              </mesh>
              {/* Subtle Brim */}
              <mesh position={[0, -0.05, 0]} castShadow={isHigh}>
                <cylinderGeometry args={[0.42, 0.42, 0.035, 14]} />
                <meshStandardMaterial color="#F9A825" roughness={0.85} />
              </mesh>
            </group>

            {/* Backpack spray tank for bio-decomposer */}
            {activeAlternative === 'compost' && (
              <mesh position={[0, 0, -0.26]} castShadow={isHigh}>
                <boxGeometry args={[0.42, 0.58, 0.18]} />
                <meshStandardMaterial color="#0288D1" roughness={0.5} />
              </mesh>
            )}
          </group>

          {/* 2. Left Arm */}
          <group ref={leftArmRef} position={[-0.34, 1.25, 0]}>
            <mesh position={[0, -0.28, 0]} castShadow={isHigh}>
              <cylinderGeometry args={[0.07, 0.06, 0.58, 6]} />
              <meshStandardMaterial color="#8D6E63" />
            </mesh>
          </group>

          {/* 3. Right Arm */}
          <group ref={rightArmRef} position={[0.34, 1.25, 0]}>
            <mesh position={[0, -0.28, 0]} castShadow={isHigh}>
              <cylinderGeometry args={[0.07, 0.06, 0.58, 6]} />
              <meshStandardMaterial color="#8D6E63" />
            </mesh>

            {/* Flaming Torch when lighting the pile */}
            {burnState === 'lighting' && (
              <group position={[0, -0.58, 0.15]} rotation={[0.4, 0, 0]}>
                {/* Torch wooden handle */}
                <mesh position={[0, -0.12, 0]}>
                  <cylinderGeometry args={[0.035, 0.035, 0.45, 6]} />
                  <meshStandardMaterial color="#4E342E" roughness={0.9} />
                </mesh>
                {/* Torch metal cup */}
                <mesh position={[0, 0.12, 0]}>
                  <cylinderGeometry args={[0.06, 0.045, 0.1, 8]} />
                  <meshStandardMaterial color="#212121" metalness={0.8} />
                </mesh>
                {/* Torch Flame */}
                <mesh position={[0, 0.22, 0]}>
                  <coneGeometry args={[0.07, 0.2, 6]} />
                  <meshBasicMaterial color="#FF5722" />
                </mesh>
              </group>
            )}

            {/* Sprayer wand when composting */}
            {activeAlternative === 'compost' && (
              <group position={[0, -0.5, 0.2]} rotation={[0.7, 0, 0]}>
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.7, 6]} />
                  <meshStandardMaterial color="#37474F" metalness={0.8} />
                </mesh>
                <mesh position={[0, 0.35, 0]}>
                  <coneGeometry args={[0.045, 0.08, 6]} />
                  <meshStandardMaterial color="#FFB300" />
                </mesh>
              </group>
            )}

            {/* Hand trowel / rake when mulching */}
            {activeAlternative === 'mulch' && (
              <group position={[0, -0.45, 0.15]} rotation={[0.6, 0, 0]}>
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
                  <meshStandardMaterial color="#5D4037" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.18, 0]}>
                  <boxGeometry args={[0.08, 0.12, 0.02]} />
                  <meshStandardMaterial color="#78909C" metalness={0.7} />
                </mesh>
              </group>
            )}

            {/* Tractor grab bar when climbing tractor */}
            {activeAlternative === 'happy_seeder' && (
              <group position={[-0.15, -0.2, 0.22]} rotation={[0, 0, 0.2]}>
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.6, 6]} />
                  <meshStandardMaterial color="#FFB300" metalness={0.8} />
                </mesh>
              </group>
            )}
          </group>

          {/* 4. Left Leg (Dhoti) */}
          <group ref={leftLegRef} position={[-0.15, 0.58, 0]}>
            <mesh position={[0, -0.28, 0]} castShadow={isHigh}>
              <cylinderGeometry args={[0.09, 0.075, 0.6, 6]} />
              <meshStandardMaterial color="#ECEFF1" roughness={0.8} />
            </mesh>
            {/* Foot */}
            <mesh position={[0, -0.58, 0.05]}>
              <boxGeometry args={[0.11, 0.08, 0.22]} />
              <meshStandardMaterial color="#3E2723" />
            </mesh>
          </group>

          {/* 5. Right Leg */}
          <group ref={rightLegRef} position={[0.15, 0.58, 0]}>
            <mesh position={[0, -0.28, 0]} castShadow={isHigh}>
              <cylinderGeometry args={[0.09, 0.075, 0.6, 6]} />
              <meshStandardMaterial color="#ECEFF1" roughness={0.8} />
            </mesh>
            {/* Foot */}
            <mesh position={[0, -0.58, 0.05]}>
              <boxGeometry args={[0.11, 0.08, 0.22]} />
              <meshStandardMaterial color="#3E2723" />
            </mesh>
          </group>
        </>
      )}

      {/* Floating In-World Choice Panel anchored to the farmer */}
      <InWorldChoicePanel />

      {/* Floating Money Outcome Badge above the farmer */}
      <MoneyFloatingTag position={[0, 2.35, 0]} />
    </group>
  )
}

function GLTFFarmerModel() {
  const { scene } = useGLTF('/models/farmer.glb', true)
  return <primitive object={scene} />
}
