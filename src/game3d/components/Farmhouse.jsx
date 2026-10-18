import React from 'react'
import { useGame3D } from '../context/Game3DContext'
import ModelWithFallback from '../assets/ModelLoader'

export const FARMHOUSE_COLLIDER = {
  minX: 12.5,
  maxX: 23.5,
  minZ: -16.5,
  maxZ: -7.5
}

/**
 * Procedural Farmhouse Fallback
 */
export function ProceduralFarmhouse({ position = [18, 0, -12], ...props }) {
  const { quality } = useGame3D()
  const isHigh = quality === 'high'

  return (
    <group position={position} {...props} name="Farmhouse">
      {/* 1. Main House Base / Lime-washed walls */}
      <mesh position={[0, 2.0, 0]} castShadow={isHigh} receiveShadow={isHigh}>
        <boxGeometry args={[9.5, 4.0, 7.5]} />
        <meshStandardMaterial color="#FDFBF7" roughness={0.85} />
      </mesh>

      {/* 2. Terracotta Pitched Roof */}
      <mesh position={[0, 4.8, 0]} castShadow={isHigh}>
        <coneGeometry args={[6.8, 2.4, 4]} rotation={[0, Math.PI / 4, 0]} />
        <meshStandardMaterial color="#C0392B" roughness={0.7} />
      </mesh>

      {/* 3. Veranda / Porch Floor */}
      <mesh position={[-5.2, 0.2, 0]} receiveShadow={isHigh}>
        <boxGeometry args={[2.5, 0.4, 7.5]} />
        <meshStandardMaterial color="#A1887F" roughness={0.9} />
      </mesh>

      {/* Veranda Pillars */}
      <mesh position={[-6.2, 1.8, -3.2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.15, 0.15, 3.2, 6]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
      <mesh position={[-6.2, 1.8, 0]} castShadow={isHigh}>
        <cylinderGeometry args={[0.15, 0.15, 3.2, 6]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
      <mesh position={[-6.2, 1.8, 3.2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.15, 0.15, 3.2, 6]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>

      {/* Veranda Overhang Roof */}
      <mesh position={[-5.2, 3.5, 0]} rotation={[0, 0, 0.15]} castShadow={isHigh}>
        <boxGeometry args={[3.0, 0.2, 7.8]} />
        <meshStandardMaterial color="#A93226" />
      </mesh>

      {/* 4. Wooden Entrance Door */}
      <mesh position={[-4.76, 1.3, 0]}>
        <planeGeometry args={[1.5, 2.6]} rotation={[0, -Math.PI / 2, 0]} />
        <meshStandardMaterial color="#4A235A" roughness={0.8} />
      </mesh>

      {/* 5. Windows */}
      <mesh position={[-4.76, 2.0, -2.2]}>
        <planeGeometry args={[1.2, 1.2]} rotation={[0, -Math.PI / 2, 0]} />
        <meshStandardMaterial color="#37474F" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[-4.76, 2.0, 2.2]}>
        <planeGeometry args={[1.2, 1.2]} rotation={[0, -Math.PI / 2, 0]} />
        <meshStandardMaterial color="#37474F" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  )
}

/**
 * Farmhouse with .glb Model Support
 * Uses public/models/house.glb if present; otherwise renders ProceduralFarmhouse.
 */
export default function Farmhouse(props) {
  return (
    <ModelWithFallback
      assetId="barn"
      modelUrl="/models/barn.glb"
      fallback={ProceduralFarmhouse}
      position={[18, 0, -12]}
      {...props}
    />
  )
}
