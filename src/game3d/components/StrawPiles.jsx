import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

/**
 * 8 Straw Piles calibrated to exact specifications:
 * - Scale: 2.5 units wide, ~2.16 units tall (~1.2x farmer's 1.8 height)
 * - Clear 3-metre walking radius around each pile
 */
export const STRAW_PILES_DATA = [
  { id: 'straw_1', x: -3.2, z: 12.5, scale: 1.0, label: 'Nearby Golden Straw Mound' },
  { id: 'straw_2', x: 3.8, z: 15.0, scale: 1.0, label: 'Roadside Stubble Pile' },
  { id: 'straw_3', x: -6.5, z: 18.0, scale: 1.0, label: 'Central Field Straw' },
  { id: 'straw_4', x: -14.0, z: 14.0, scale: 1.0, label: 'West Harvest Mound' },
  { id: 'straw_5', x: -4.5, z: 24.0, scale: 1.0, label: 'Midfield Straw Pile' },
  { id: 'straw_6', x: -16.0, z: 26.0, scale: 1.0, label: 'Canal-Border Straw' },
  { id: 'straw_7', x: -10.0, z: 32.0, scale: 1.0, label: 'Village-Edge Stubble' },
  { id: 'straw_8', x: 2.5, z: 26.0, scale: 1.0, label: 'North Field Straw' }
]

/**
 * Animated Layered Flames directly attached to burning piles.
 * Guarantees dynamic leaping tongues of fire on every quality tier,
 * not just a flat static orange cone.
 */
function BurningPileFlames({ isBurning }) {
  const meshRef = useRef(null)

  const flameMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCoreColor: { value: new THREE.Color('#FFFDE7') }, // White-hot core
        uFlameColor: { value: new THREE.Color('#FF9100') }, // Vivid flame orange
        uTipColor: { value: new THREE.Color('#D50000') } // Deep crimson tip
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          // Turbulent vertical wave flutter
          float wave = sin(pos.y * 5.0 - uTime * 14.0) * 0.12 * vUv.y;
          float sway = cos(pos.y * 3.5 - uTime * 9.0) * 0.08 * vUv.y;
          pos.x += wave;
          pos.z += sway;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCoreColor;
        uniform vec3 uFlameColor;
        uniform vec3 uTipColor;
        varying vec2 vUv;

        void main() {
          // Flame shape teardrop mask
          float distFromCenter = abs(vUv.x - 0.5) * 2.2;
          float flicker = sin(uTime * 18.0 + vUv.y * 10.0) * 0.1;
          float heightFactor = pow(1.0 - vUv.y, 1.4);
          float alpha = smoothstep(1.0 + flicker, 0.2, distFromCenter / (heightFactor + 0.05));

          if (alpha <= 0.02) discard;

          // Color gradient from white core to red tips
          vec3 col = mix(uCoreColor, uFlameColor, smoothstep(0.0, 0.45, vUv.y));
          col = mix(col, uTipColor, smoothstep(0.45, 1.0, vUv.y));

          gl_FragColor = vec4(col, alpha * 0.92);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current || !isBurning) return
    const t = clock.getElapsedTime()
    flameMaterial.uniforms.uTime.value = t
    const pulse = 1.0 + Math.sin(t * 12.0) * 0.08
    meshRef.current.scale.set(pulse, pulse * 1.1, pulse)
  })

  if (!isBurning) return null

  return (
    <group ref={meshRef} position={[0, 0.8, 0]}>
      {/* 3 Crossed Vertical Flame Cards */}
      <mesh material={flameMaterial}>
        <planeGeometry args={[2.0, 2.6, 6, 8]} />
      </mesh>
      <mesh material={flameMaterial} rotation={[0, Math.PI / 3, 0]}>
        <planeGeometry args={[1.9, 2.5, 6, 8]} />
      </mesh>
      <mesh material={flameMaterial} rotation={[0, (Math.PI * 2) / 3, 0]}>
        <planeGeometry args={[1.9, 2.4, 6, 8]} />
      </mesh>
    </group>
  )
}

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
    harvestState
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

        // Palette: Rich golden straw normally, charred ash when burnt (no neon orange cone)
        const topColor = isBurnt
          ? '#24201E'
          : isComposting
          ? '#2E1E11'
          : isSelected
          ? '#FFE082'
          : '#F5B041'

        const baseColor = isBurnt
          ? '#181514'
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
            {/* 1. Main straw mound (calibrated: 2.5 wide, ~2.16 tall) */}
            <mesh position={[0, 1.05, 0]} castShadow={isHigh} receiveShadow={isHigh}>
              <coneGeometry args={[1.25, 1.9, 10]} />
              <meshStandardMaterial
                color={topColor}
                roughness={isBurnt || isComposting ? 1.0 : 0.88}
                metalness={0.02}
                emissive={isSelected && !isBurnt ? '#FF8F00' : isIgnited ? '#D84315' : '#000000'}
                emissiveIntensity={isSelected && !isBurnt ? 0.35 : isIgnited ? 0.25 : 0}
              />
            </mesh>

            {/* 2. Base straw skirt ring */}
            <mesh position={[0, 0.13, 0]} castShadow={isHigh} receiveShadow={isHigh}>
              <cylinderGeometry args={[1.25, 1.35, 0.26, 10]} />
              <meshStandardMaterial
                color={baseColor}
                roughness={0.96}
              />
            </mesh>

            {/* 3. Layered Leaping Flames on Ignited Pile (On Every Tier) */}
            <BurningPileFlames isBurning={isIgnited && burnState === 'burning'} />

            {/* 4. Pulsing Target Beacon on Nearest Straw Pile */}
            {isNearest && burnState === 'idle' && !isBurnt && (
              <PulsingTargetRing isSelected={isSelected} />
            )}

            {/* 5. Smoldering ember ring when burnt */}
            {isBurnt && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[1.2, 1.6, 16]} />
                <meshBasicMaterial color="#3E2723" transparent opacity={0.8} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}
