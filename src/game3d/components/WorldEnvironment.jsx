import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

/**
 * SkyDome with a clean Golden-Hour Gradient
 * Vertex shader + fragment shader with zero heavy post-processing overhead.
 * Smoothly interpolates from zenith warm evening amber (#D97724)
 * down to horizon golden mist (#F8D89D).
 */
function GoldenHourSkyDome({ burnProgress = 0 }) {
  const meshRef = useRef(null)

  const skyShader = useMemo(() => {
    return {
      uniforms: {
        topColor: { value: new THREE.Color('#D97724') }, // Deep warm evening sky
        bottomColor: { value: new THREE.Color('#FCE5B5') }, // Soft golden haze at horizon
        offset: { value: 10 },
        exponent: { value: 0.6 }
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
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `
    }
  }, [])

  // Smoothly lerp sky uniforms towards brown-grey smog as fire progresses
  useFrame(() => {
    if (!skyShader.uniforms) return
    const normalTop = new THREE.Color('#D97724')
    const normalBottom = new THREE.Color('#FCE5B5')
    const smogTop = new THREE.Color('#4E342E')
    const smogBottom = new THREE.Color('#796D61')

    skyShader.uniforms.topColor.value.lerpColors(normalTop, smogTop, burnProgress)
    skyShader.uniforms.bottomColor.value.lerpColors(normalBottom, smogBottom, burnProgress)
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[160, 24, 16]} />
      <shaderMaterial
        args={[skyShader]}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function WorldEnvironment() {
  const { quality, burnProgress, burnState } = useGame3D()
  const sunLightRef = useRef(null)
  const fogRef = useRef(null)

  const effectiveProgress = burnState === 'consequence' ? 1.0 : burnProgress || 0

  // Gentle day-night sun cycle and dimming during burn
  useFrame(({ clock }) => {
    if (!sunLightRef.current) return
    const elapsed = clock.getElapsedTime()
    // Slow day cycle: orbit around field
    const sunAngle = elapsed * 0.035
    const radius = 60
    sunLightRef.current.position.x = Math.cos(sunAngle) * radius
    sunLightRef.current.position.y = Math.max(14, Math.sin(sunAngle) * radius + 22)
    sunLightRef.current.position.z = Math.sin(sunAngle) * radius

    // Dim sun intensity and shift to smoky reddish tone as fire spreads
    const baseIntensity = 1.25 * (1.0 - effectiveProgress * 0.72) // Dims down to ~0.35
    sunLightRef.current.intensity = Math.max(0.35, baseIntensity)

    const normalSun = new THREE.Color('#FFF4CC')
    const smogSun = new THREE.Color('#FF8A65')
    sunLightRef.current.color.lerpColors(normalSun, smogSun, effectiveProgress)
  })

  const isHigh = quality === 'high'

  // Fog values: thicken and brown out with smoke
  const normalFogColor = new THREE.Color('#FCE5B5')
  const smogFogColor = new THREE.Color('#6D5D53')
  const currentFogColor = new THREE.Color().lerpColors(normalFogColor, smogFogColor, effectiveProgress)

  const fogNear = THREE.MathUtils.lerp(isHigh ? 35 : 20, isHigh ? 10 : 6, effectiveProgress)
  const fogFar = THREE.MathUtils.lerp(isHigh ? 130 : 80, isHigh ? 50 : 36, effectiveProgress)

  return (
    <>
      {/* Procedural Gradient Sky Dome */}
      <GoldenHourSkyDome burnProgress={effectiveProgress} />

      {/* Atmospheric Fog (thickens during fire) */}
      <fog ref={fogRef} attach="fog" args={[currentFogColor, fogNear, fogFar]} />

      {/* Ambient rural sky light */}
      <ambientLight
        intensity={THREE.MathUtils.lerp(isHigh ? 0.72 : 0.88, 0.45, effectiveProgress)}
        color={effectiveProgress > 0.4 ? '#EFEBE9' : '#FFF2DF'}
      />
      <hemisphereLight
        skyColor={effectiveProgress > 0.4 ? '#8D6E63' : '#FFCA7A'}
        groundColor={effectiveProgress > 0.4 ? '#3E2723' : '#8D6E63'}
        intensity={THREE.MathUtils.lerp(0.65, 0.4, effectiveProgress)}
      />

      {/* Moving Sun with soft low-res shadows */}
      <directionalLight
        ref={sunLightRef}
        position={[42, 38, 28]}
        intensity={1.25}
        color="#FFF4CC"
        castShadow={isHigh}
        shadow-mapSize-width={isHigh ? 1024 : 512}
        shadow-mapSize-height={isHigh ? 1024 : 512}
        shadow-camera-near={0.5}
        shadow-camera-far={150}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-bias={-0.0005}
      />
    </>
  )
}
