import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
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
function BurningPileFlames({ isBurning, burnProgress = 0 }) {
  const meshRef = useRef(null)

  const flameMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: burnProgress },
        uCoreColor: { value: new THREE.Color('#FFFDE7') }, // Incandescent white-yellow core
        uFlameColor: { value: new THREE.Color('#FF6D00') }, // Vivid fiery orange
        uTipColor: { value: new THREE.Color('#D50000') } // Crimson tips
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          // Turbulent vertical wave flutter
          float wave = sin(pos.y * 6.0 - uTime * 16.0) * 0.16 * vUv.y;
          float sway = cos(pos.y * 4.0 - uTime * 11.0) * 0.12 * vUv.y;
          pos.x += wave;
          pos.z += sway;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform vec3 uCoreColor;
        uniform vec3 uFlameColor;
        uniform vec3 uTipColor;
        varying vec2 vUv;

        void main() {
          // Flame tongue shape mask
          float distFromCenter = abs(vUv.x - 0.5) * 2.3;
          float flicker = sin(uTime * 20.0 + vUv.y * 12.0) * 0.14;
          float heightFactor = pow(max(0.0, 1.0 - vUv.y), 1.3);
          float alpha = smoothstep(1.0 + flicker, 0.15, distFromCenter / (heightFactor + 0.05));

          if (alpha <= 0.03) discard;

          // Color gradient from white core to red tips
          vec3 col = mix(uCoreColor, uFlameColor, smoothstep(0.0, 0.4, vUv.y));
          col = mix(col, uTipColor, smoothstep(0.4, 0.95, vUv.y));

          // Gradually subsides in the very last quarter as pile turns to ash
          float intensity = smoothstep(1.0, 0.78, uProgress) * 0.85 + 0.15;
          gl_FragColor = vec4(col * 1.3, alpha * 0.95 * intensity);
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
    flameMaterial.uniforms.uProgress.value = burnProgress
    const pulse = 1.0 + Math.sin(t * 14.0) * 0.09
    const endFade = burnProgress > 0.8 ? Math.max(0.2, (1.0 - burnProgress) / 0.2) : 1.0
    meshRef.current.scale.set(pulse * endFade, pulse * 1.15 * endFade, pulse * endFade)
  })

  if (!isBurning) return null

  return (
    <group ref={meshRef} position={[0, 0.7, 0]}>
      {/* 3 Crossed Vertical Flame Cards (6-directional coverage) */}
      <mesh material={flameMaterial}>
        <planeGeometry args={[2.2, 2.8, 8, 10]} />
      </mesh>
      <mesh material={flameMaterial} rotation={[0, Math.PI / 3, 0]}>
        <planeGeometry args={[2.0, 2.7, 8, 10]} />
      </mesh>
      <mesh material={flameMaterial} rotation={[0, (Math.PI * 2) / 3, 0]}>
        <planeGeometry args={[2.1, 2.6, 8, 10]} />
      </mesh>
      {/* Bright flickering ground fire light */}
      <pointLight
        color="#FF6D00"
        intensity={3.2 * Math.max(0.3, 1.0 - burnProgress * 0.4)}
        distance={10}
        decay={2}
        position={[0, 0.5, 0]}
      />
    </group>
  )
}

/**
 * Charring Burning Pile Cone with animated incandescent glowing cracks and ash progression
 * Driven directly by burnProgress over 20s (straw -> black char -> glowing cracks -> powdery grey ash)
 */
function CharringPileCone({ isBurning, burnProgress = 0 }) {
  const materialRef = useRef(null)

  const charShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIsBurning: { value: isBurning ? 1.0 : 0.0 },
        uBurnProgress: { value: burnProgress }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIsBurning;
        uniform float uBurnProgress;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          // Color stages driven by uBurnProgress:
          // 0.0: golden straw/char transition
          // 0.2 - 0.6: deep charred black with hot glowing fissures
          // 0.7 - 1.0: cooling into grey ash
          vec3 strawStart = vec3(0.55, 0.38, 0.16);
          vec3 deepChar = vec3(0.08, 0.07, 0.06);
          vec3 greyAsh = vec3(0.38, 0.36, 0.35);

          // Char transition early, then ash transition late
          vec3 baseCol = mix(strawStart, deepChar, clamp(uBurnProgress * 3.5, 0.0, 1.0));
          baseCol = mix(baseCol, greyAsh, smoothstep(0.55, 0.95, uBurnProgress));

          if (uIsBurning > 0.5) {
            float noise1 = sin(vPos.x * 14.0 + sin(vPos.y * 18.0));
            float noise2 = cos(vPos.z * 14.0 + cos(vPos.y * 10.0));
            float crack = smoothstep(0.60, 0.88, abs(noise1 * noise2));
            float pulse = sin(uTime * 11.0 + vPos.y * 9.0) * 0.25 + 0.75;

            // Glowing cracks early and mid-burn, fading as pile cools to ash
            float crackVisibility = smoothstep(0.0, 0.2, uBurnProgress) * (1.0 - smoothstep(0.65, 0.95, uBurnProgress));
            vec3 crackColor = mix(vec3(1.0, 0.25, 0.0), vec3(1.0, 0.85, 0.2), crack) * pulse * 2.5;
            baseCol = mix(baseCol, crackColor, crack * crackVisibility);
          }

          gl_FragColor = vec4(baseCol, 1.0);
        }
      `
    })
  }, [])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      materialRef.current.uniforms.uIsBurning.value = isBurning ? 1.0 : 0.0
      materialRef.current.uniforms.uBurnProgress.value = burnProgress
    }
  })

  // Mound visibly shrinks vertically and spreads slightly as it burns down to ash
  const shrinkHeight = Math.max(0.32, 1.0 - burnProgress * 0.68)
  const spreadWidth = 1.0 + burnProgress * 0.15

  return (
    <mesh position={[0, 1.05 * shrinkHeight, 0]} scale={[spreadWidth, shrinkHeight, spreadWidth]}>
      <coneGeometry args={[1.25, 1.9, 14]} />
      <primitive object={charShader} ref={materialRef} attach="material" />
    </mesh>
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
    burnProgress = 0,
    activeAlternative,
    alternativeProgress,
    harvestState,
    seasonPhase
  } = useGame3D()
  const { camera } = useThree()
  const isHigh = quality === 'high'

  // Expose debug hook for E2E tests to sample screen position of the ignited pile
  useFrame(() => {
    if (typeof window !== 'undefined') {
      if (!window.__wes_debug) window.__wes_debug = {}
      const leadPile = STRAW_PILES_DATA.find((p) => ignitedPiles?.includes(p.id)) || STRAW_PILES_DATA[0]
      window.__wes_debug.getIgnitedPileScreenPos = () => {
        const v = new THREE.Vector3(leadPile.x, 0.9, leadPile.z)
        v.project(camera)
        const x = Math.round(((v.x + 1) * window.innerWidth) / 2)
        const y = Math.round(((-v.y + 1) * window.innerHeight) / 2)
        const inFrustum = v.z < 1.0 && v.x >= -1.05 && v.x <= 1.05 && v.y >= -1.05 && v.y <= 1.05
        return {
          x,
          y,
          inFrustum,
          pileId: leadPile.id,
          burnState,
          burnProgress,
          worldPos: { x: leadPile.x, y: 0.9, z: leadPile.z }
        }
      }
    }
  })

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.__wes_debug) {
        delete window.__wes_debug.getIgnitedPileScreenPos
      }
    }
  }, [])

  // Straw mounds are created only after the harvest sequence completes
  if (
    harvestState === 'standing' ||
    harvestState === 'harvesting' ||
    seasonPhase === 'sowing' ||
    seasonPhase === 'growing'
  ) {
    return null
  }

  return (
    <group name="StrawPilesGroup">
      {STRAW_PILES_DATA.map((pile) => {
        const isSelected = interactionTarget?.id === pile.id
        const isNearest = nearestPileInfo?.id === pile.id
        const isIgnited = ignitedPiles?.length
          ? ignitedPiles.includes(pile.id)
          : (burnState === 'burning' || burnState === 'lighting') && pile.id === 'straw_1'
        const isBurnt = isFieldBurnt || ((burnState === 'burning' || burnState === 'consequence') && isIgnited)

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
          ? (burnProgress > 0.6 ? '#424242' : '#24201E')
          : isComposting
          ? '#2E1E11'
          : isSelected
          ? '#FFE082'
          : '#F5B041'

        const baseColor = isBurnt
          ? (burnProgress > 0.6 ? '#303030' : '#181514')
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
            {/* 1. Main straw mound: Charring with glowing cracks and ash progression during burn */}
            {isBurnt ? (
              <CharringPileCone
                isBurning={(burnState === 'burning' || burnState === 'lighting') && isIgnited}
                burnProgress={burnProgress}
              />
            ) : (
              <mesh position={[0, 1.05, 0]} castShadow={isHigh} receiveShadow={isHigh}>
                <coneGeometry args={[1.25, 1.9, 10]} />
                <meshStandardMaterial
                  color={topColor}
                  roughness={isComposting ? 1.0 : 0.88}
                  metalness={0.02}
                  emissive={isSelected ? '#FF8F00' : '#000000'}
                  emissiveIntensity={isSelected ? 0.35 : 0}
                />
              </mesh>
            )}

            {/* 2. Base straw skirt ring: shrinks with ash */}
            <mesh
              position={[0, 0.13 * (isBurnt ? Math.max(0.35, 1.0 - burnProgress * 0.65) : 1.0), 0]}
              scale={[
                isBurnt ? 1.0 + burnProgress * 0.1 : 1.0,
                isBurnt ? Math.max(0.35, 1.0 - burnProgress * 0.65) : 1.0,
                isBurnt ? 1.0 + burnProgress * 0.1 : 1.0
              ]}
              castShadow={isHigh}
              receiveShadow={isHigh}
            >
              <cylinderGeometry args={[1.25, 1.35, 0.26, 10]} />
              <meshStandardMaterial
                color={baseColor}
                roughness={0.96}
              />
            </mesh>

            {/* 3. Layered Leaping Flames on Ignited Pile (On Every Tier) */}
            <BurningPileFlames
              isBurning={isIgnited && (burnState === 'burning' || burnState === 'lighting')}
              burnProgress={burnProgress}
            />

            {/* 4. Pulsing Target Beacon on Nearest Straw Pile */}
            {isNearest && burnState === 'idle' && !isBurnt && (
              <PulsingTargetRing isSelected={isSelected} />
            )}

            {/* 5. Smoldering ember ring when burnt */}
            {isBurnt && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[1.2, 1.6, 16]} />
                <meshBasicMaterial color={burnProgress > 0.6 ? '#424242' : '#3E2723'} transparent opacity={0.8} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}
