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
function GoldenHourSkyDome() {
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
  const { quality } = useGame3D()
  const sunLightRef = useRef(null)

  // Gentle day-night sun cycle
  useFrame(({ clock }) => {
    if (!sunLightRef.current) return
    const elapsed = clock.getElapsedTime()
    // Slow day cycle: orbit around field
    const sunAngle = elapsed * 0.035
    const radius = 60
    sunLightRef.current.position.x = Math.cos(sunAngle) * radius
    sunLightRef.current.position.y = Math.max(14, Math.sin(sunAngle) * radius + 22)
    sunLightRef.current.position.z = Math.sin(sunAngle) * radius
  })

  const isHigh = quality === 'high'

  return (
    <>
      {/* Procedural Gradient Sky Dome */}
      <GoldenHourSkyDome />

      {/* Golden hour atmospheric fog */}
      <fog attach="fog" args={['#FCE5B5', isHigh ? 35 : 20, isHigh ? 130 : 80]} />

      {/* Ambient warm rural sky light */}
      <ambientLight intensity={isHigh ? 0.72 : 0.88} color="#FFF2DF" />
      <hemisphereLight
        skyColor="#FFCA7A"
        groundColor="#8D6E63"
        intensity={0.65}
      />

      {/* Moving Sun with soft low-res shadows (disabled on Low quality for performance) */}
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
