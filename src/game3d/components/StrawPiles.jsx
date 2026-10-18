import React from 'react'
import { useGame3D } from '../context/Game3DContext'

// 8 Straw Piles arranged across the harvest fields
// Piles 1, 2, and 3 are positioned right in the initial camera view in front of player start [0, 0, 8]
export const STRAW_PILES_DATA = [
  { id: 'straw_1', x: -3.2, z: 12.5, scale: 1.5, label: 'Nearby Golden Straw Mound' },
  { id: 'straw_2', x: 3.8, z: 15.0, scale: 1.45, label: 'Roadside Stubble Pile' },
  { id: 'straw_3', x: -6.5, z: 18.0, scale: 1.55, label: 'Central Field Straw' },
  { id: 'straw_4', x: -14.0, z: 14.0, scale: 1.4, label: 'West Harvest Mound' },
  { id: 'straw_5', x: -4.5, z: 24.0, scale: 1.5, label: 'Midfield Straw Pile' },
  { id: 'straw_6', x: -16.0, z: 26.0, scale: 1.35, label: 'Canal-Border Straw' },
  { id: 'straw_7', x: -10.0, z: 32.0, scale: 1.4, label: 'Village-Edge Stubble' },
  { id: 'straw_8', x: 2.5, z: 26.0, scale: 1.35, label: 'North Field Straw' },
]

export default function StrawPiles() {
  const { quality, interactionTarget, isFieldBurnt, ignitedPiles, burnState } = useGame3D()
  const isHigh = quality === 'high'

  return (
    <group name="StrawPilesGroup">
      {STRAW_PILES_DATA.map((pile) => {
        const isSelected = interactionTarget?.id === pile.id
        const isIgnited = ignitedPiles?.includes(pile.id)
        const isBurnt = isFieldBurnt || (burnState === 'burning' && isIgnited)

        // Palette: Rich golden straw normally, charred ash when burnt
        const topColor = isBurnt
          ? '#2C2523'
          : isSelected
          ? '#FFE082'
          : '#F5B041'

        const baseColor = isBurnt
          ? '#1C1918'
          : isSelected
          ? '#FFB74D'
          : '#E59866'

        return (
          <group key={pile.id} position={[pile.x, 0, pile.z]} scale={pile.scale}>
            {/* Main straw mound (flattened cone) */}
            <mesh position={[0, 0.7, 0]} castShadow={isHigh} receiveShadow={isHigh}>
              <coneGeometry args={[1.65, 1.45, 8]} />
              <meshStandardMaterial
                color={topColor}
                roughness={isBurnt ? 1.0 : 0.85}
                metalness={0.05}
                emissive={isSelected && !isBurnt ? '#FF8F00' : isIgnited ? '#FF3D00' : '#000000'}
                emissiveIntensity={isSelected && !isBurnt ? 0.35 : isIgnited ? 0.8 : 0}
              />
            </mesh>

            {/* Base straw spread ring */}
            <mesh position={[0, 0.15, 0]} castShadow={isHigh} receiveShadow={isHigh}>
              <cylinderGeometry args={[2.0, 2.25, 0.3, 8]} />
              <meshStandardMaterial
                color={baseColor}
                roughness={0.95}
              />
            </mesh>

            {/* Proximity / Selection Glow Ring when player is near */}
            {isSelected && !isBurnt && (
              <group position={[0, 0.06, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[2.2, 2.7, 24]} />
                  <meshBasicMaterial color="#FFB300" transparent opacity={0.85} />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[2.7, 3.1, 24]} />
                  <meshBasicMaterial color="#FFE082" transparent opacity={0.35} />
                </mesh>
              </group>
            )}

            {/* Smoldering ember ring when burnt */}
            {isBurnt && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[2.0, 2.4, 16]} />
                <meshBasicMaterial color="#3E2723" transparent opacity={0.7} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}
