import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

export default function FarmField() {
  const { quality } = useGame3D()
  const waterRef = useRef(null)

  // Gentle river surface shimmer
  useFrame(({ clock }) => {
    if (waterRef.current) {
      const t = clock.getElapsedTime()
      waterRef.current.position.y = -0.15 + Math.sin(t * 1.5) * 0.04
    }
  })

  const isHigh = quality === 'high'

  return (
    <group name="FarmFieldWorld">
      {/* 1. Main Harvested Ground Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow={isHigh}
      >
        <planeGeometry args={[140, 140, 4, 4]} />
        <meshStandardMaterial
          color="#C8963E" // Rich golden harvested loam
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* 2. Far Surrounding Green Plains */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow={false}
      >
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial
          color="#8BA858"
          roughness={1.0}
        />
      </mesh>

      {/* 3. Winding Dirt Road (Runs from Farmhouse at Z=-5 past field to Village at Z=40) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[6, 0.01, 15]}
        receiveShadow={isHigh}
      >
        <planeGeometry args={[6.5, 90]} />
        <meshStandardMaterial
          color="#9E784E"
          roughness={0.9}
        />
      </mesh>

      {/* Cross Path to River */}
      <mesh
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        position={[-18, 0.012, 10]}
        receiveShadow={isHigh}
      >
        <planeGeometry args={[4.5, 42]} />
        <meshStandardMaterial
          color="#A68257"
          roughness={0.9}
        />
      </mesh>

      {/* 4. Irrigation Canal / River at Edge (X = -42 to -50) */}
      <group position={[-44, 0, 0]}>
        {/* Riverbed Trench */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[12, 0.8, 140]} />
          <meshStandardMaterial color="#4E3629" roughness={1.0} />
        </mesh>

        {/* Shimmering River Water */}
        <mesh
          ref={waterRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.15, 0]}
        >
          <planeGeometry args={[11.5, 140]} />
          <meshStandardMaterial
            color="#29B6F6"
            transparent
            opacity={0.82}
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>
      </group>
    </group>
  )
}
