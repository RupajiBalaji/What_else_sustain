import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import ModelWithFallback from '../assets/ModelLoader'

export function ProceduralHarvesterMesh({ isHigh, reelRef }) {
  return (
    <>
      {/* 1. Main Machine Body */}
      <mesh position={[0, 1.6, -0.2]} castShadow={isHigh} receiveShadow={isHigh}>
        <boxGeometry args={[2.4, 1.8, 3.8]} />
        <meshStandardMaterial color="#FFA000" roughness={0.4} metalness={0.4} />
      </mesh>

      {/* Driver Cabin */}
      <mesh position={[0.4, 2.7, 0.6]} castShadow={isHigh}>
        <boxGeometry args={[1.4, 1.2, 1.5]} />
        <meshStandardMaterial color="#37474F" roughness={0.6} />
      </mesh>
      {/* Cabin Glass Windshield */}
      <mesh position={[0.4, 2.7, 1.36]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#81D4FA" roughness={0.1} metalness={0.7} />
      </mesh>

      {/* 2. Front Wide Cutting Header */}
      <group position={[0, 0.45, 2.5]}>
        <mesh castShadow={isHigh} receiveShadow={isHigh}>
          <boxGeometry args={[3.8, 0.5, 1.2]} />
          <meshStandardMaterial color="#2E7D32" roughness={0.6} />
        </mesh>

        {/* Rotating Cylinder Reel */}
        <group ref={reelRef} position={[0, 0.35, 0.2]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.35, 3.6, 8]} />
            <meshStandardMaterial color="#EEEEEE" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[3.6, 0.05, 0.2]} />
            <meshStandardMaterial color="#C62828" />
          </mesh>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[3.6, 0.05, 0.2]} />
            <meshStandardMaterial color="#C62828" />
          </mesh>
        </group>
      </group>

      {/* 3. Grain Unloading Pipe (Auger) */}
      <mesh position={[-1.4, 2.8, -0.6]} rotation={[0.2, 0.5, -0.4]}>
        <cylinderGeometry args={[0.15, 0.15, 2.8, 6]} />
        <meshStandardMaterial color="#FFA000" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* 4. Large Front Wheels */}
      <mesh position={[-1.3, 0.9, 0.6]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.9, 0.9, 0.5, 10]} />
        <meshStandardMaterial color="#212121" roughness={0.9} />
      </mesh>
      <mesh position={[1.3, 0.9, 0.6]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.9, 0.9, 0.5, 10]} />
        <meshStandardMaterial color="#212121" roughness={0.9} />
      </mesh>

      {/* 5. Smaller Rear Steering Wheels */}
      <mesh position={[-1.2, 0.55, -1.8]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.55, 0.55, 0.4, 8]} />
        <meshStandardMaterial color="#212121" roughness={0.9} />
      </mesh>
      <mesh position={[1.2, 0.55, -1.8]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.55, 0.55, 0.4, 8]} />
        <meshStandardMaterial color="#212121" roughness={0.9} />
      </mesh>

      {/* 6. Straw Discharge Particle Glow at Rear */}
      <pointLight position={[0, 0.8, -2.4]} intensity={0.5} color="#FFD54F" distance={4} />
    </>
  )
}

export default function CombineHarvester() {
  const { harvestState, harvestProgress, qualityConfig } = useGame3D()
  const isHigh = qualityConfig.shadows
  const groupRef = useRef(null)
  const reelRef = useRef(null)

  // Move harvester along the field rows during the cut
  useFrame(({ clock }) => {
    if (!groupRef.current || harvestState !== 'harvesting') return
    const p = harvestProgress || 0

    // Sweep across field: starts at X = -25, Z = 10 -> moves diagonally to X = 0, Z = 30
    const x = -25 + p * 25
    const z = 10 + Math.sin(p * Math.PI * 2) * 8 + p * 18

    // Heading angle tangent to movement
    const nextP = Math.min(1.0, p + 0.02)
    const nextX = -25 + nextP * 25
    const nextZ = 10 + Math.sin(nextP * Math.PI * 2) * 8 + nextP * 18
    const angle = Math.atan2(nextX - x, nextZ - z)

    groupRef.current.position.set(x, 0, z)
    groupRef.current.rotation.y = angle

    // Rotate cutting reel
    if (reelRef.current) {
      reelRef.current.rotation.x = clock.getElapsedTime() * 12
    }
  })

  if (harvestState !== 'harvesting') {
    return null
  }

  return (
    <group ref={groupRef} name="CombineHarvester">
      <ModelWithFallback
        assetId="harvester"
        fallback={() => <ProceduralHarvesterMesh isHigh={isHigh} reelRef={reelRef} />}
      />
    </group>
  )
}
