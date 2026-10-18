import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import ModelWithFallback from '../assets/ModelLoader'

function ProceduralTractorBody({ isHigh }) {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 1.1, 0.8]} castShadow={isHigh}>
        <boxGeometry args={[1.5, 1.1, 2.2]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.0, 1.91]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshStandardMaterial color="#212121" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.8, -0.7]} castShadow={isHigh}>
        <boxGeometry args={[1.6, 0.6, 1.6]} />
        <meshStandardMaterial color="#37474F" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.4, -0.9]} castShadow={isHigh}>
        <boxGeometry args={[0.9, 0.6, 0.8]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
      <mesh position={[0.65, 2.1, 1.2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.08, 0.08, 1.6, 6]} />
        <meshStandardMaterial color="#424242" metalness={0.8} />
      </mesh>
      <mesh position={[-1.0, 1.0, -0.8]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[1.0, 1.0, 0.6, 12]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.95} />
      </mesh>
      <mesh position={[1.0, 1.0, -0.8]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[1.0, 1.0, 0.6, 12]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.95} />
      </mesh>
      <mesh position={[-0.85, 0.55, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.55, 0.55, 0.4, 10]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.95} />
      </mesh>
      <mesh position={[0.85, 0.55, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.55, 0.55, 0.4, 10]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.95} />
      </mesh>
    </group>
  )
}

export default function HappySeederTractor() {
  const { activeAlternative, alternativeProgress, qualityConfig } = useGame3D()
  const tractorRef = useRef(null)

  const isHigh = qualityConfig.shadows
  const isActive = activeAlternative === 'happy_seeder'

  useFrame(() => {
    if (!tractorRef.current || !isActive) return

    const p = alternativeProgress
    let x = 6
    let z = 14
    let rotY = -Math.PI / 2

    if (p <= 0.33) {
      const subP = p / 0.33
      x = THREE.MathUtils.lerp(6, -22, subP)
      z = 14
      rotY = -Math.PI / 2
    } else if (p <= 0.40) {
      const subP = (p - 0.33) / 0.07
      x = -22 + Math.sin(subP * Math.PI) * 1.5
      z = THREE.MathUtils.lerp(14, 20, subP)
      rotY = THREE.MathUtils.lerp(-Math.PI / 2, Math.PI / 2, subP)
    } else if (p <= 0.70) {
      const subP = (p - 0.40) / 0.30
      x = THREE.MathUtils.lerp(-22, 4, subP)
      z = 20
      rotY = Math.PI / 2
    } else if (p <= 0.75) {
      const subP = (p - 0.70) / 0.05
      x = 4 + Math.sin(subP * Math.PI) * 1.5
      z = THREE.MathUtils.lerp(20, 26, subP)
      rotY = THREE.MathUtils.lerp(Math.PI / 2, -Math.PI / 2, subP)
    } else {
      const subP = (p - 0.75) / 0.25
      x = THREE.MathUtils.lerp(4, -20, subP)
      z = 26
      rotY = -Math.PI / 2
    }

    tractorRef.current.position.set(x, 0, z)
    tractorRef.current.rotation.y = rotY
  })

  if (!isActive) return null

  return (
    <group ref={tractorRef} name="HappySeederTractor">
      {/* 1. Working Tractor Body with Model Support */}
      <ModelWithFallback
        assetId="tractor"
        fallback={() => <ProceduralTractorBody isHigh={isHigh} />}
      />

      {/* 2. Rear-Hitch Mounted Happy Seeder Machine */}
      <group position={[0, 0, -2.4]} name="HappySeederImplement">
        <mesh position={[0, 0.5, 0.4]}>
          <boxGeometry args={[0.4, 0.15, 0.9]} />
          <meshStandardMaterial color="#424242" metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.0, 0]} castShadow={isHigh}>
          <boxGeometry args={[2.2, 0.7, 0.9]} />
          <meshStandardMaterial color="#D32F2F" roughness={0.5} />
        </mesh>
        {[-0.8, -0.4, 0, 0.4, 0.8].map((dx, idx) => (
          <group key={idx} position={[dx, 0.35, -0.2]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
              <cylinderGeometry args={[0.35, 0.35, 0.08, 10]} />
              <meshStandardMaterial color="#9E9E9E" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.25, -0.7]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
          <cylinderGeometry args={[0.25, 0.25, 2.0, 12]} />
          <meshStandardMaterial color="#212121" roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}
