import React from 'react'
import { useGame3D } from '../context/Game3DContext'

// 7 Straw Piles arranged across the harvest fields
export const STRAW_PILES_DATA = [
  { id: 'straw_1', x: -14, z: -8, scale: 1.3, label: 'Field Straw Pile #1' },
  { id: 'straw_2', x: -22, z: -4, scale: 1.5, label: 'Field Straw Pile #2' },
  { id: 'straw_3', x: -16, z: 8, scale: 1.4, label: 'Central Straw Mound' },
  { id: 'straw_4', x: -26, z: 12, scale: 1.6, label: 'Large Harvest Pile' },
  { id: 'straw_5', x: -18, z: -16, scale: 1.2, label: 'North Field Stubble' },
  { id: 'straw_6', x: -30, z: -10, scale: 1.4, label: 'Canal-Side Straw' },
  { id: 'straw_7', x: -28, z: 2, scale: 1.3, label: 'West Field Straw' },
]

export default function StrawPiles() {
  const { quality, interactionTarget } = useGame3D()
  const isHigh = quality === 'high'

  return (
    <group name="StrawPilesGroup">
      {STRAW_PILES_DATA.map((pile) => {
        const isSelected = interactionTarget?.id === pile.id
        return (
          <group key={pile.id} position={[pile.x, 0, pile.z]} scale={pile.scale}>
            {/* Main straw mound (flattened cone) */}
            <mesh position={[0, 0.7, 0]} castShadow={isHigh} receiveShadow={isHigh}>
              <coneGeometry args={[1.6, 1.4, 7]} />
              <meshStandardMaterial
                color={isSelected ? '#FFE082' : '#F5B041'}
                roughness={0.9}
                metalness={0.05}
              />
            </mesh>

            {/* Base straw spread ring */}
            <mesh position={[0, 0.15, 0]} castShadow={isHigh} receiveShadow={isHigh}>
              <cylinderGeometry args={[2.0, 2.2, 0.3, 7]} />
              <meshStandardMaterial
                color="#E59866"
                roughness={0.95}
              />
            </mesh>

            {/* Proximity / Selection Glow Ring */}
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[2.2, 2.6, 16]} />
                <meshBasicMaterial color="#FFD54F" transparent opacity={0.8} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}
