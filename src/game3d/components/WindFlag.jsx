import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

export default function WindFlag({ position = [8, 0, -4] }) {
  const { windState, quality } = useGame3D()
  const flagPivotRef = useRef(null)
  const clothRef = useRef(null)

  const isHigh = quality === 'high'

  useFrame(({ clock }) => {
    if (!flagPivotRef.current) return
    const time = clock.getElapsedTime()

    // Rotate flag to point downwind (wind direction in degrees converted to radians)
    const targetAngle = THREE.MathUtils.degToRad(windState?.directionDeg || 75)
    flagPivotRef.current.rotation.y = targetAngle

    // Flap cloth
    if (clothRef.current) {
      const speed = windState?.speedMs || 3.5
      const wave = Math.sin(time * (speed * 2.2)) * 0.25
      clothRef.current.rotation.y = wave
    }
  })

  return (
    <group position={position} name="WindFlagPole">
      {/* Wooden Flagpole */}
      <mesh position={[0, 3.2, 0]} castShadow={isHigh} receiveShadow={isHigh}>
        <cylinderGeometry args={[0.08, 0.12, 6.4, 6]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.8} />
      </mesh>

      {/* Gold Cap */}
      <mesh position={[0, 6.45, 0]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial color="#FFD54F" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Flag Swivel Pivot */}
      <group ref={flagPivotRef} position={[0, 6.1, 0]}>
        <mesh
          ref={clothRef}
          position={[0.8, 0, 0]}
          castShadow={isHigh}
        >
          <planeGeometry args={[1.6, 0.9, 3, 2]} />
          <meshStandardMaterial
            color="#FF5722" // Vibrant rural saffron flag
            side={THREE.DoubleSide}
            roughness={0.6}
          />
        </mesh>
      </group>
    </group>
  )
}
