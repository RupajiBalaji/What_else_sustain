import React from 'react'
import { useGame3D } from '../context/Game3DContext'
import ModelWithFallback from '../assets/ModelLoader'

export const TRACTOR_COLLIDER = {
  minX: 6.5,
  maxX: 10.5,
  minZ: 12.5,
  maxZ: 16.5
}

/**
 * Procedural Tractor Fallback
 */
export function ProceduralTractor({ position = [8.5, 0, 14.5], rotation = [0, -0.6, 0], ...props }) {
  const { quality } = useGame3D()
  const isHigh = quality === 'high'

  return (
    <group position={position} rotation={rotation} {...props} name="ParkedTractor">
      {/* 1. Engine Hood (Front) */}
      <mesh position={[0, 1.1, 0.8]} castShadow={isHigh} receiveShadow={isHigh}>
        <boxGeometry args={[1.5, 1.1, 2.2]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.35} metalness={0.5} /> {/* Classic farm green */}
      </mesh>

      {/* Front Radiator Grille */}
      <mesh position={[0, 1.0, 1.91]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshStandardMaterial color="#212121" roughness={0.9} />
      </mesh>

      {/* 2. Driver Platform & Seat */}
      <mesh position={[0, 0.8, -0.7]} castShadow={isHigh} receiveShadow={isHigh}>
        <boxGeometry args={[1.6, 0.6, 1.6]} />
        <meshStandardMaterial color="#37474F" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.4, -0.9]} castShadow={isHigh}>
        <boxGeometry args={[0.9, 0.6, 0.8]} />
        <meshStandardMaterial color="#212121" roughness={0.9} />
      </mesh>

      {/* 3. Steering Wheel & Column */}
      <mesh position={[0, 1.6, -0.2]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.7]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
      <mesh position={[0, 1.9, -0.35]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.3, 0.05, 6, 12]} />
        <meshStandardMaterial color="#212121" />
      </mesh>

      {/* 4. Vertical Exhaust Pipe */}
      <mesh position={[0.65, 2.1, 1.2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.08, 0.08, 1.6, 6]} />
        <meshStandardMaterial color="#424242" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* 5. Big Rear Wheels */}
      <mesh position={[-1.0, 1.0, -0.8]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[1.0, 1.0, 0.6, 12]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.95} />
      </mesh>
      <mesh position={[1.0, 1.0, -0.8]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[1.0, 1.0, 0.6, 12]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.95} />
      </mesh>

      {/* Rear Yellow Rims */}
      <mesh position={[-1.05, 1.0, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.65, 8]} />
        <meshStandardMaterial color="#FBC02D" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[1.05, 1.0, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.65, 8]} />
        <meshStandardMaterial color="#FBC02D" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* 6. Smaller Front Wheels */}
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

/**
 * Tractor with .glb Model Support
 * Uses public/models/tractor.glb if present; otherwise renders ProceduralTractor.
 */
export default function Tractor(props) {
  return (
    <ModelWithFallback
      modelUrl="/models/tractor.glb"
      fallback={ProceduralTractor}
      position={[8.5, 0, 14.5]}
      rotation={[0, -0.6, 0]}
      {...props}
    />
  )
}
