import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import ModelWithFallback from '../assets/ModelLoader'

function ProceduralTractorBody({ isHigh }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Engine Hood (Front) - Classic farm green */}
      <mesh position={[0, 1.1, 0.8]} castShadow={isHigh}>
        <boxGeometry args={[1.5, 1.1, 2.2]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Front Radiator Grille & Yellow Trim */}
      <mesh position={[0, 1.0, 1.91]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshStandardMaterial color="#212121" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.45, 1.91]}>
        <planeGeometry args={[1.3, 0.12]} />
        <meshStandardMaterial color="#FBC02D" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.66, 0.8]}>
        <boxGeometry args={[0.2, 0.02, 2.18]} />
        <meshStandardMaterial color="#FBC02D" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Driver Platform & Seat */}
      <mesh position={[0, 0.8, -0.7]} castShadow={isHigh}>
        <boxGeometry args={[1.6, 0.6, 1.6]} />
        <meshStandardMaterial color="#37474F" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.4, -0.9]} castShadow={isHigh}>
        <boxGeometry args={[0.9, 0.6, 0.8]} />
        <meshStandardMaterial color="#212121" roughness={0.9} />
      </mesh>

      {/* Exhaust Pipe */}
      <mesh position={[0.65, 2.1, 1.2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.08, 0.08, 1.6, 6]} />
        <meshStandardMaterial color="#424242" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Big Rear Wheels & Yellow Rims */}
      <mesh position={[-1.0, 1.0, -0.8]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[1.0, 1.0, 0.6, 12]} />
        <meshStandardMaterial color="#262626" roughness={0.95} />
      </mesh>
      <mesh position={[1.0, 1.0, -0.8]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[1.0, 1.0, 0.6, 12]} />
        <meshStandardMaterial color="#262626" roughness={0.95} />
      </mesh>
      <mesh position={[-1.05, 1.0, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.65, 8]} />
        <meshStandardMaterial color="#FBC02D" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[1.05, 1.0, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.65, 8]} />
        <meshStandardMaterial color="#FBC02D" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Smaller Front Wheels */}
      <mesh position={[-0.85, 0.55, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.55, 0.55, 0.4, 10]} />
        <meshStandardMaterial color="#262626" roughness={0.95} />
      </mesh>
      <mesh position={[0.85, 0.55, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.55, 0.55, 0.4, 10]} />
        <meshStandardMaterial color="#262626" roughness={0.95} />
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
    let x = 0.5
    let z = 13.0
    let rotY = -Math.PI / 2

    if (p <= 0.35) {
      const subP = p / 0.35
      x = THREE.MathUtils.lerp(0.5, -6.5, subP)
      z = 13.0
      rotY = -Math.PI / 2
    } else if (p <= 0.45) {
      const subP = (p - 0.35) / 0.10
      x = -6.5 - Math.sin(subP * Math.PI) * 0.6
      z = THREE.MathUtils.lerp(13.0, 15.5, subP)
      rotY = THREE.MathUtils.lerp(-Math.PI / 2, Math.PI / 2, subP)
    } else if (p <= 0.78) {
      const subP = (p - 0.45) / 0.33
      x = THREE.MathUtils.lerp(-6.5, 0.5, subP)
      z = 15.5
      rotY = Math.PI / 2
    } else if (p <= 0.84) {
      const subP = (p - 0.78) / 0.06
      x = 0.5 + Math.sin(subP * Math.PI) * 0.6
      z = THREE.MathUtils.lerp(15.5, 17.5, subP)
      rotY = THREE.MathUtils.lerp(Math.PI / 2, -Math.PI / 2, subP)
    } else {
      const subP = (p - 0.84) / 0.16
      x = THREE.MathUtils.lerp(0.5, -5.5, subP)
      z = 17.5
      rotY = -Math.PI / 2
    }

    tractorRef.current.position.set(x, 0, z)
    tractorRef.current.rotation.y = rotY
    if (typeof window !== 'undefined') {
      if (!window.__wes_alt_targets) window.__wes_alt_targets = {}
      window.__wes_alt_targets.happy_seeder = { x, y: 1.1, z, halfW: 1.6, halfH: 1.3, halfD: 2.2 }
    }
  })

  if (!isActive) return null

  return (
    <group name="HappySeederSystem">
      {/* Seed lines & straw mulch strip left behind by the Happy Seeder */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.03, 14]} receiveShadow={isHigh}>
        <planeGeometry args={[Math.max(1, Math.min(28, alternativeProgress * 84)), 2.4]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.95} />
      </mesh>
      {alternativeProgress > 0.38 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-9, 0.03, 20]} receiveShadow={isHigh}>
          <planeGeometry args={[Math.max(1, Math.min(26, (alternativeProgress - 0.38) * 84)), 2.4]} />
          <meshStandardMaterial color="#6D4C41" roughness={0.95} />
        </mesh>
      )}
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
    </group>
  )
}
