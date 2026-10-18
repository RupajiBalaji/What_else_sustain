import React, { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { FARMHOUSE_COLLIDER } from './Farmhouse'
import { TRACTOR_COLLIDER } from './Tractor'
import { VILLAGE_COLLIDERS } from './VillageHousesInstanced'
import { STRAW_PILES_DATA } from './StrawPiles'
import { useModelAvailability } from '../assets/ModelLoader'
import { useGLTF } from '@react-three/drei'

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

export default function FarmerPlayer({ initialPosition = [0, 0, 8] }) {
  const { quality, setInteractionTarget, burnState, activePile, playerResetTrigger, activeAlternative } = useGame3D()
  const { camera } = useThree()

  // Character group ref and body limb refs
  const playerRef = useRef(null)
  const leftLegRef = useRef(null)
  const rightLegRef = useRef(null)
  const leftArmRef = useRef(null)
  const rightArmRef = useRef(null)
  const torsoRef = useRef(null)

  // Player state
  const posRef = useRef(new THREE.Vector3(...initialPosition))
  const yawRef = useRef(0) // Player orientation angle
  const camYawRef = useRef(0)
  const isMovingRef = useRef(false)
  const walkTimeRef = useRef(0)

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
    const isMoving = inputMag > 0.08
    isMovingRef.current = isMoving

    if (isMoving) {
      // Normalize input vector
      const normX = moveX / Math.max(inputMag, 1)
      const normZ = moveZ / Math.max(inputMag, 1)

      // Calculate desired movement direction relative to camera yaw
      const moveAngle = Math.atan2(normX, normZ) + camYawRef.current
      yawRef.current = moveAngle

      // Player speed: ~5.5 m/s
      const speed = 5.5 * Math.min(inputMag, 1.0)
      const dx = Math.sin(moveAngle) * speed * delta
      const dz = Math.cos(moveAngle) * speed * delta

      // Attempt movement with separate X and Z collision handling (smooth sliding against walls)
      const curPos = posRef.current
      const nextPosX = new THREE.Vector3(curPos.x + dx, curPos.y, curPos.z)
      if (!checkCollisions(nextPosX)) {
        curPos.x += dx
      }

      const nextPosZ = new THREE.Vector3(curPos.x, curPos.y, curPos.z + dz)
      if (!checkCollisions(nextPosZ)) {
        curPos.z += dz
      }

      walkTimeRef.current += delta * 9.0
    }

    // Update player mesh position and rotation
    playerRef.current.position.copy(posRef.current)
    playerRef.current.rotation.y = yawRef.current

    // Procedural walk, idle, and lighting animation
    const t = walkTimeRef.current
    if (burnState === 'lighting') {
      // Lighting animation: pause walking, lean torso forward, extend torch arm down
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
    } else if (isMoving) {
      if (torsoRef.current) torsoRef.current.rotation.x = 0
      const swing = Math.sin(t) * 0.65
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.7
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.7
      if (torsoRef.current) torsoRef.current.position.y = 1.05 + Math.abs(Math.sin(t)) * 0.08
    } else {
      // Idle breathing
      if (torsoRef.current) torsoRef.current.rotation.x = 0
      const idleTime = _.clock.getElapsedTime()
      const breath = Math.sin(idleTime * 2.5) * 0.02
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0
      if (torsoRef.current) torsoRef.current.position.y = 1.05 + breath
    }

    // 3rd Person Camera Smooth Follow with Damping
    const camDistance = 5.8
    const camHeight = 3.2
    const targetCamX = posRef.current.x - Math.sin(camYawRef.current) * camDistance
    const targetCamZ = posRef.current.z - Math.cos(camYawRef.current) * camDistance
    const targetCamY = posRef.current.y + camHeight

    camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.12)
    camera.lookAt(posRef.current.x, posRef.current.y + 1.4, posRef.current.z)

    // Proximity check against straw piles
    let nearestPile = null
    let minDist = 3.5 // 3.5m interaction radius
    for (const pile of STRAW_PILES_DATA) {
      const dist = posRef.current.distanceTo(new THREE.Vector3(pile.x, 0, pile.z))
      if (dist < minDist) {
        minDist = dist
        nearestPile = pile
      }
    }
    setInteractionTarget(nearestPile)
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
    </group>
  )
}

function GLTFFarmerModel() {
  const { scene } = useGLTF('/models/farmer.glb', true)
  return <primitive object={scene} />
}
