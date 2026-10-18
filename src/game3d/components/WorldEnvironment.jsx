import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

/**
 * Procedural Gradient Sky Dome with Sun Disc & Atmospheric Halo
 */
function GoldenHourSkyDome({ burnProgress = 0, sunPosition, isPaused = false }) {
  const meshRef = useRef(null)

  const skyShader = useMemo(() => {
    return {
      uniforms: {
        topColor: { value: new THREE.Color('#D97724') }, // Deep warm evening sky
        bottomColor: { value: new THREE.Color('#FCE5B5') }, // Soft golden haze at horizon
        sunColor: { value: new THREE.Color('#FFF8E1') }, // Radiant sun disc
        sunHaloColor: { value: new THREE.Color('#FFB300') }, // Golden atmospheric halo
        sunDirection: { value: new THREE.Vector3(0.5, 0.4, 0.5).normalize() },
        offset: { value: 12.0 },
        exponent: { value: 0.65 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 sunColor;
        uniform vec3 sunHaloColor;
        uniform vec3 sunDirection;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float h = normalize(vWorldPosition + offset).y;
          vec3 sky = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));

          // Sun disc & golden halo calculation
          float sunDot = max(0.0, dot(dir, normalize(sunDirection)));
          float sunDisc = smoothstep(0.9985, 0.9996, sunDot);
          float sunHalo = pow(sunDot, 18.0) * 0.45;

          vec3 finalColor = sky + (sunHaloColor * sunHalo) + (sunColor * sunDisc * 2.2);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    }
  }, [])

  useFrame(() => {
    if (!skyShader.uniforms) return
    const normalTop = new THREE.Color('#D97724')
    const normalBottom = new THREE.Color('#FCE5B5')
    const smogTop = new THREE.Color('#4E342E')
    const smogBottom = new THREE.Color('#796D61')

    skyShader.uniforms.topColor.value.lerpColors(normalTop, smogTop, burnProgress)
    skyShader.uniforms.bottomColor.value.lerpColors(normalBottom, smogBottom, burnProgress)

    if (sunPosition) {
      skyShader.uniforms.sunDirection.value.copy(sunPosition).normalize()
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[170, 32, 20]} />
      <shaderMaterial
        args={[skyShader]}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

/**
 * Layered Soft Clouds billboard plane drifting with wind
 */
function SoftCloudLayer({ windState }) {
  const cloudsRef = useRef(null)

  // Generate procedural soft cloud texture on canvas
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, 512, 512)
    // Draw 14 overlapping soft puff circles
    for (let i = 0; i < 14; i++) {
      const cx = 120 + Math.sin(i * 1.7) * 160 + (i % 3) * 60
      const cy = 180 + Math.cos(i * 2.3) * 110 + (i % 2) * 50
      const r = 55 + (i % 4) * 25
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      grad.addColorStop(0, 'rgba(255, 248, 235, 0.45)')
      grad.addColorStop(0.5, 'rgba(255, 243, 224, 0.22)')
      grad.addColorStop(1, 'rgba(255, 243, 224, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(3, 3)
    return tex
  }, [])

  useFrame((_, delta) => {
    if (!cloudsRef.current) return
    const speed = (windState?.speedMs ?? 3.8) * 0.0018
    const windRad = ((windState?.directionDeg ?? 75) * Math.PI) / 180
    cloudsRef.current.position.x += Math.sin(windRad) * speed * 25
    cloudsRef.current.position.z += Math.cos(windRad) * speed * 25

    // Loop bounds
    if (cloudsRef.current.position.x > 80) cloudsRef.current.position.x = -80
    if (cloudsRef.current.position.z > 80) cloudsRef.current.position.z = -80
  })

  return (
    <mesh ref={cloudsRef} position={[0, 48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[260, 260]} />
      <meshBasicMaterial
        map={cloudTexture}
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </mesh>
  )
}

/**
 * Volumetric Light Shafts (God Rays)
 * Cheap additive cones/planes oriented from sun direction, visible through golden haze (High tier only).
 */
function LightShafts({ sunPosition, visible = true }) {
  const shaftsRef = useRef(null)

  useFrame(() => {
    if (!shaftsRef.current || !sunPosition) return
    shaftsRef.current.position.set(0, 0, 0)
    shaftsRef.current.lookAt(sunPosition.x, sunPosition.y, sunPosition.z)
  })

  if (!visible) return null

  return (
    <group ref={shaftsRef} name="LightShaftsGroup">
      {/* 3 Additive Light Beams */}
      <mesh position={[0, 25, 40]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[4, 18, 70, 12, 1, true]} />
        <meshBasicMaterial
          color="#FFE082"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[12, 28, 35]} rotation={[Math.PI / 2, 0.2, 0]}>
        <cylinderGeometry args={[2, 12, 65, 8, 1, true]} />
        <meshBasicMaterial
          color="#FFD54F"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default function WorldEnvironment() {
  const { qualityConfig, burnProgress, burnState, windState, isDayCyclePaused } = useGame3D()
  const sunLightRef = useRef(null)
  const sunPosRef = useRef(new THREE.Vector3(42, 38, 28))

  const effectiveProgress = burnState === 'consequence' ? 1.0 : burnProgress || 0

  // Day/night cycle: slow orbit around field (pausable via isDayCyclePaused)
  useFrame(({ clock }) => {
    if (!sunLightRef.current) return
    const elapsed = clock.getElapsedTime()

    if (!isDayCyclePaused) {
      const sunAngle = elapsed * 0.025
      const radius = 62
      const x = Math.cos(sunAngle) * radius
      const y = Math.max(14, Math.sin(sunAngle) * radius + 22)
      const z = Math.sin(sunAngle) * radius
      sunPosRef.current.set(x, y, z)
      sunLightRef.current.position.set(x, y, z)
    } else {
      sunPosRef.current.set(42, 36, 28)
      sunLightRef.current.position.set(42, 36, 28)
    }

    // Dim sun intensity and shift to smoky reddish tone as fire spreads
    const baseIntensity = 1.35 * (1.0 - effectiveProgress * 0.72)
    sunLightRef.current.intensity = Math.max(0.35, baseIntensity)

    const normalSun = new THREE.Color('#FFF4CC')
    const smogSun = new THREE.Color('#FF7043')
    sunLightRef.current.color.lerpColors(normalSun, smogSun, effectiveProgress)
  })

  // Distance fog: tinted to horizon golden mist, thickening and browning with fire
  const normalFogColor = new THREE.Color('#FCE5B5')
  const smogFogColor = new THREE.Color('#6D5D53')
  const currentFogColor = new THREE.Color().lerpColors(normalFogColor, smogFogColor, effectiveProgress)

  const fogNear = THREE.MathUtils.lerp(
    qualityConfig.shadows ? 35 : 22,
    qualityConfig.shadows ? 10 : 6,
    effectiveProgress
  )
  const fogFar = THREE.MathUtils.lerp(
    qualityConfig.shadows ? 140 : 85,
    qualityConfig.shadows ? 52 : 36,
    effectiveProgress
  )

  const shadowMapSize = qualityConfig.shadowMapSize || 512

  return (
    <>
      {/* 1. Procedural Gradient Sky Dome with Sun Disc */}
      <GoldenHourSkyDome
        burnProgress={effectiveProgress}
        sunPosition={sunPosRef.current}
        isPaused={isDayCyclePaused}
      />

      {/* 2. Soft Cloud Layer Moving with Wind */}
      <SoftCloudLayer windState={windState} />

      {/* 3. Volumetric God Ray Light Shafts (High Tier Only) */}
      <LightShafts
        sunPosition={sunPosRef.current}
        visible={Boolean(qualityConfig.lightShafts)}
      />

      {/* 4. Atmospheric Fog (dynamically colored & tuned) */}
      <fog attach="fog" args={[currentFogColor, fogNear, fogFar]} />

      {/* 5. Hemisphere Fill Light (Cool blue/purple sky fill vs warm earthy ground bounce) */}
      <hemisphereLight
        skyColor={effectiveProgress > 0.4 ? '#8D6E63' : '#FFE0B2'}
        groundColor={effectiveProgress > 0.4 ? '#3E2723' : '#4E342E'}
        intensity={THREE.MathUtils.lerp(0.68, 0.42, effectiveProgress)}
      />

      {/* 6. Subtle Ambient Fill Light */}
      <ambientLight
        intensity={THREE.MathUtils.lerp(0.65, 0.4, effectiveProgress)}
        color={effectiveProgress > 0.4 ? '#EFEBE9' : '#FFF3E0'}
      />

      {/* 7. Golden-Hour Directional Sun with Soft PCF Shadows */}
      <directionalLight
        ref={sunLightRef}
        position={[42, 38, 28]}
        intensity={1.35}
        color="#FFF4CC"
        castShadow={qualityConfig.shadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={150}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-bias={-0.0004}
      />
    </>
  )
}
