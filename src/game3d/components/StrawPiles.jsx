import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

// 8 Straw Piles arranged across the harvest fields
// Piles 1, 2, and 3 are positioned right in the initial camera view in front of player start [-1.2, 0, 10.0]
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

/**
 * Pulsing quest beacon ring rendered on the nearest straw pile
 */
function PulsingTargetRing({ isSelected }) {
  const outerRingRef = useRef(null)

  useFrame(({ clock }) => {
    if (!outerRingRef.current) return
    const t = clock.getElapsedTime()
    const pulse = 1.0 + Math.sin(t * 3.5) * 0.12
    outerRingRef.current.scale.set(pulse, pulse, 1)
  })

  return (
    <group position={[0, 0.05, 0]}>
      {/* Outer pulsating beacon ring */}
      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 3.2, 32]} />
        <meshBasicMaterial
          color={isSelected ? '#FFB300' : '#FFD54F'}
          transparent
          opacity={isSelected ? 0.85 : 0.6}
        />
      </mesh>
      {/* Inner beacon core ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.5, 32]} />
        <meshBasicMaterial
          color="#FFA000"
          transparent
          opacity={0.75}
        />
      </mesh>
    </group>
  )
}

export default function StrawPiles() {
  const {
    quality,
    interactionTarget,
    handleInteract,
    nearestPileInfo,
    isFieldBurnt,
    ignitedPiles,
    burnState,
    activeAlternative,
    alternativeProgress,
    harvestState,
    harvestProgress
  } = useGame3D()
  const isHigh = quality === 'high'

  // Straw mounds are created by the harvest cutter
  if (harvestState === 'standing') {
    return null
  }

  return (
    <group name="StrawPilesGroup">
      {STRAW_PILES_DATA.map((pile) => {
        const isSelected = interactionTarget?.id === pile.id
        const isNearest = nearestPileInfo?.id === pile.id
        const isIgnited = ignitedPiles?.includes(pile.id)
        const isBurnt = isFieldBurnt || (burnState === 'burning' && isIgnited)

        // Compost darkening
        const isComposting = activeAlternative === 'compost' && pile.id === 'straw_1'
        const isMulching = activeAlternative === 'mulch'

        // Scale factors during alternatives
        let heightScale = 1.0
        if (isMulching) {
          heightScale = Math.max(0.2, 1.0 - (alternativeProgress || 0) * 0.8)
        } else if (isComposting) {
          heightScale = Math.max(0.35, 1.0 - (alternativeProgress || 0) * 0.65)
        }

        // Palette: Rich golden straw normally, charred ash when burnt, dark brown when composting
        const topColor = isBurnt
          ? '#2C2523'
          : isComposting
          ? '#2E1E11'
          : isSelected
          ? '#FFE082'
          : '#F5B041'

        const baseColor = isBurnt
          ? '#1C1918'
          : isComposting
          ? '#23160D'
          : isSelected
          ? '#FFB74D'
          : '#E59866'

        // Hide original piles during Bale & Sell as they are replaced by round bales
        if (activeAlternative === 'bale_sell' && (alternativeProgress || 0) > 0.45) {
          return null
        }

        return (
          <group
            key={pile.id}
            position={[pile.x, 0, pile.z]}
            scale={[pile.scale, pile.scale * heightScale, pile.scale]}
            onClick={(e) => {
              e.stopPropagation()
              // Allow clicking or tapping a straw pile directly when within range
              if (isSelected && burnState === 'idle') {
                handleInteract()
              }
            }}
            onPointerOver={() => {
              if (isSelected && burnState === 'idle') {
                document.body.style.cursor = 'pointer'
              }
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default'
            }}
          >
            {/* Main straw mound (flattened cone) */}
            <mesh position={[0, 0.7, 0]} castShadow={isHigh} receiveShadow={isHigh}>
              <coneGeometry args={[1.65, 1.45, 8]} />
              <meshStandardMaterial
                color={topColor}
                roughness={isBurnt || isComposting ? 1.0 : 0.85}
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

            {/* Pulsing Target Beacon on Nearest Straw Pile */}
            {isNearest && burnState === 'idle' && !isBurnt && (
              <PulsingTargetRing isSelected={isSelected} />
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
