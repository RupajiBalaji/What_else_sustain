import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { STRAW_PILES_DATA } from '../config/strawData'
export { STRAW_PILES_DATA }

/**
 * Animated Layered Flames directly attached to burning piles.
 * Guarantees dynamic leaping tongues of fire on every quality tier,
 * strictly capped to orange core, yellow tips, and red-orange edges (zero pure white).
 * Tongues are distinct, tall, flickering, and narrower than the pile's width + 40%.
 */
function BurningPileFlames({ isBurning, burnProgress = 0 }) {
  const groupRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.__wes_debug) window.__wes_debug = {}
      window.__wes_debug.isFlameMeshMounted = () => Boolean(groupRef.current && isBurning)
    }
    return () => {
      if (typeof window !== 'undefined' && window.__wes_debug) {
        window.__wes_debug.isFlameMeshMounted = () => false
      }
    }
  }, [isBurning])

  const flameMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: burnProgress },
        uCoreColor: { value: new THREE.Color('#FF6D00') }, // Vivid deep fiery orange core (no white/cream)
        uFlameColor: { value: new THREE.Color('#FF9800') }, // Fiery amber-orange body
        uTipColor: { value: new THREE.Color('#FFC107') }, // Pure golden yellow tips
        uEdgeColor: { value: new THREE.Color('#D84315') } // Crimson red-orange edges
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          // Turbulent vertical wave flutter
          float wave = sin(pos.y * 7.0 - uTime * 17.0) * 0.12 * vUv.y;
          float sway = cos(pos.y * 5.0 - uTime * 12.0) * 0.09 * vUv.y;
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
        uniform vec3 uEdgeColor;
        varying vec2 vUv;

        void main() {
          // Flame tongue shape: organic teardrop tapering to zero at tips and edges
          float widthAtY = (1.0 - pow(vUv.y, 1.25)) * pow(max(0.01, vUv.y), 0.32) * 1.9;
          float distFromCenter = abs(vUv.x - 0.5) * 2.0;
          float flicker = sin(uTime * 19.0 + vUv.y * 15.0) * 0.08 * vUv.y;
          float flameShape = widthAtY + flicker - distFromCenter;
          float alpha = smoothstep(-0.02, 0.20, flameShape);

          if (alpha <= 0.01) discard;

          // Color gradient: deep orange core -> amber body -> yellow tips only
          vec3 col = mix(uCoreColor, uFlameColor, smoothstep(0.05, 0.40, vUv.y));
          col = mix(col, uTipColor, smoothstep(0.40, 0.88, vUv.y));

          // Edge rim with red-orange crimson
          float edgeFactor = smoothstep(0.12, 0.0, flameShape);
          col = mix(col, uEdgeColor, edgeFactor * 0.65);

          // Strictly clamp color values: zero pixels reach pure white (all channels capped <= 0.90)
          col = clamp(col, vec3(0.0), vec3(0.92, 0.72, 0.04));

          // Gradually subsides in the very last quarter as pile turns to ash
          float intensity = smoothstep(1.0, 0.80, uProgress) * 0.85 + 0.15;
          gl_FragColor = vec4(col, alpha * 0.92 * intensity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide
    })
  }, [])

  useFrame(({ clock }) => {
    if (typeof window !== 'undefined' && window.__wes_debug) {
      window.__wes_debug.isFlameMeshMounted = () => Boolean(groupRef.current && isBurning)
    }
    if (!groupRef.current || !isBurning) return
    const t = clock.getElapsedTime()
    flameMaterial.uniforms.uTime.value = t
    flameMaterial.uniforms.uProgress.value = burnProgress
    const pulse = 1.0 + Math.sin(t * 13.0) * 0.07
    const endFade = burnProgress > 0.8 ? Math.max(0.2, (1.0 - burnProgress) / 0.2) : 1.0
    groupRef.current.scale.set(pulse * endFade, pulse * 1.1 * endFade, pulse * endFade)
  })

  if (!isBurning) {
    if (typeof window !== 'undefined' && window.__wes_debug) {
      window.__wes_debug.isFlameMeshMounted = () => false
    }
    return null
  }

  // 5 distinct, tall, wider flame tongues positioned around the pile perimeter
  const TONGUE_POSITIONS = [
    { pos: [0.42, 0.52, 0.35], rotY: 0.35, scale: [0.95, 1.35, 0.95] },
    { pos: [-0.46, 0.48, 0.24], rotY: -0.65, scale: [0.90, 1.30, 0.90] },
    { pos: [0.15, 0.60, -0.45], rotY: 1.25, scale: [1.00, 1.45, 1.00] },
    { pos: [-0.35, 0.54, -0.34], rotY: 2.15, scale: [0.85, 1.25, 0.85] },
    { pos: [0.0, 0.65, 0.0], rotY: -1.45, scale: [1.10, 1.55, 1.10] }
  ]

  return (
    <group ref={groupRef} position={[0, 0.45, 0]}>
      {TONGUE_POSITIONS.map((tongue, idx) => (
        <group key={idx} position={tongue.pos} scale={tongue.scale} rotation={[0, tongue.rotY, 0]}>
          <mesh material={flameMaterial}>
            <planeGeometry args={[1.05, 2.75, 6, 8]} />
          </mesh>
          <mesh material={flameMaterial} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.95, 2.60, 6, 8]} />
          </mesh>
        </group>
      ))}

      {/* Warm gentle flickering ground fire light (clamped to prevent over-exposure) */}
      <pointLight
        color="#E65100"
        intensity={1.35 * Math.max(0.3, 1.0 - burnProgress * 0.4)}
        distance={8}
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

            // Glowing cracks early and mid-burn, fading as pile cools to ash (clamped to prevent white blowout)
            float crackVisibility = smoothstep(0.0, 0.2, uBurnProgress) * (1.0 - smoothstep(0.65, 0.95, uBurnProgress));
            vec3 crackColor = mix(vec3(0.95, 0.22, 0.0), vec3(1.0, 0.65, 0.08), crack) * pulse * 1.1;
            baseCol = mix(baseCol, crackColor, crack * crackVisibility);
          }

          // Strict cap: ensure no white pixels
          baseCol = clamp(baseCol, vec3(0.0), vec3(0.90, 0.70, 0.30));
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
        const centerV = new THREE.Vector3(leadPile.x, 1.3, leadPile.z)
        centerV.project(camera)
        const x = Math.round(((centerV.x + 1) * window.innerWidth) / 2)
        const y = Math.round(((-centerV.y + 1) * window.innerHeight) / 2)
        const inFrustum = centerV.z < 1.0 && centerV.x >= -1.05 && centerV.x <= 1.05 && centerV.y >= -1.05 && centerV.y <= 1.05

        // Bounding box enclosing the pile cone and flame tongues (radius ~ 1.35m, height ~ 2.6m)
        const corners = [
          new THREE.Vector3(leadPile.x - 1.3, 0.0, leadPile.z - 1.3),
          new THREE.Vector3(leadPile.x + 1.3, 0.0, leadPile.z - 1.3),
          new THREE.Vector3(leadPile.x - 1.3, 0.0, leadPile.z + 1.3),
          new THREE.Vector3(leadPile.x + 1.3, 0.0, leadPile.z + 1.3),
          new THREE.Vector3(leadPile.x - 1.1, 2.6, leadPile.z - 1.1),
          new THREE.Vector3(leadPile.x + 1.1, 2.6, leadPile.z - 1.1),
          new THREE.Vector3(leadPile.x - 1.1, 2.6, leadPile.z + 1.1),
          new THREE.Vector3(leadPile.x + 1.1, 2.6, leadPile.z + 1.1)
        ]
        let minX = Infinity, maxX = -Infinity
        let minY = Infinity, maxY = -Infinity
        corners.forEach((c) => {
          c.project(camera)
          const sx = ((c.x + 1) * window.innerWidth) / 2
          const sy = ((-c.y + 1) * window.innerHeight) / 2
          if (sx < minX) minX = sx
          if (sx > maxX) maxX = sx
          if (sy < minY) minY = sy
          if (sy > maxY) maxY = sy
        })

        return {
          x,
          y,
          inFrustum,
          pileId: leadPile.id,
          burnState,
          burnProgress,
          worldPos: { x: leadPile.x, y: 1.3, z: leadPile.z },
          boundingBox: {
            minX: Math.max(0, Math.floor(minX)),
            maxX: Math.min(window.innerWidth, Math.ceil(maxX)),
            minY: Math.max(0, Math.floor(minY)),
            maxY: Math.min(window.innerHeight, Math.ceil(maxY)),
            width: Math.max(20, Math.ceil(maxX - minX)),
            height: Math.max(20, Math.ceil(maxY - minY))
          }
        }
      }
      window.__wes_debug.getBurnProgress = () => burnProgress
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
