import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

export default function FarmField() {
  const { quality, isFieldBurnt } = useGame3D()
  const waterRef = useRef(null)

  // Gentle river surface shimmer
  useFrame(({ clock }) => {
    if (waterRef.current) {
      const t = clock.getElapsedTime()
      waterRef.current.position.y = -0.15 + Math.sin(t * 1.5) * 0.04
    }
  })

  const isHigh = quality === 'high'

  // Subdivided ground geometry with procedural vertex colors (Zero large image textures)
  const groundGeometry = useMemo(() => {
    // 36x36 segments on 140x140 gives 1,369 vertices (~16KB buffer), ultra mobile-friendly
    const geo = new THREE.PlaneGeometry(140, 140, 36, 36)
    const count = geo.attributes.position.count
    const colors = new Float32Array(count * 3)
    const pos = geo.attributes.position

    const c1 = new THREE.Color()
    const c2 = new THREE.Color()
    const finalColor = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i) // In PlaneGeometry (XY) before -PI/2 X-rotation

      // Natural multi-frequency soil variation
      const n1 = Math.sin(x * 0.14) * Math.cos(y * 0.16)
      const n2 = Math.sin(x * 0.045 + y * 0.055) * 0.5
      const n3 = Math.cos(x * 0.28 - y * 0.22) * 0.25
      const t = THREE.MathUtils.clamp((n1 + n2 + n3 + 1.0) * 0.5, 0, 1)

      if (isFieldBurnt) {
        // Burnt field: deep soot, charred earth, and ash-grey patches
        c1.set('#1E1B1A') // Deep soot
        c2.set('#423B38') // Ash grey
      } else {
        // Warm golden harvest loam: rich agricultural soil & sunlit straw tones
        c1.set('#B58434') // Warm rich loam
        c2.set('#DBA952') // Golden sun-baked earth
      }

      finalColor.lerpColors(c1, c2, t)

      // Micro-grain variation for authentic tactile ground feel
      const jitter = ((i % 7) - 3) * 0.012
      colors[i * 3] = THREE.MathUtils.clamp(finalColor.r + jitter, 0, 1)
      colors[i * 3 + 1] = THREE.MathUtils.clamp(finalColor.g + jitter, 0, 1)
      colors[i * 3 + 2] = THREE.MathUtils.clamp(finalColor.b + jitter, 0, 1)
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [isFieldBurnt])

  // Far surrounding plains with subtle pastoral gradient
  const plainsGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(260, 260, 16, 16)
    const count = geo.attributes.position.count
    const colors = new Float32Array(count * 3)
    const pos = geo.attributes.position

    const c1 = new THREE.Color('#7E9848') // Warm harvest meadow
    const c2 = new THREE.Color('#94B056') // Sunlit grassy knolls
    const finalColor = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const t = THREE.MathUtils.clamp((Math.sin(x * 0.03) * Math.cos(y * 0.03) + 1.0) * 0.5, 0, 1)
      finalColor.lerpColors(c1, c2, t)

      colors[i * 3] = finalColor.r
      colors[i * 3 + 1] = finalColor.g
      colors[i * 3 + 2] = finalColor.b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  return (
    <group name="FarmFieldWorld">
      {/* 1. Main Harvested Ground Plane with Vertex Colors */}
      <mesh
        geometry={groundGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow={isHigh}
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      {/* 2. Far Surrounding Green Plains with Subtle Vertex Tonal Variation */}
      <mesh
        geometry={plainsGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow={false}
      >
        <meshStandardMaterial
          vertexColors
          roughness={1.0}
        />
      </mesh>

      {/* 3. Winding Dirt Road (Runs from Farmhouse at Z=-5 past field to Village at Z=40) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[6, 0.01, 15]}
        receiveShadow={isHigh}
      >
        <planeGeometry args={[6.5, 90]} />
        <meshStandardMaterial
          color="#9E784E"
          roughness={0.9}
        />
      </mesh>

      {/* Cross Path to River */}
      <mesh
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        position={[-18, 0.012, 10]}
        receiveShadow={isHigh}
      >
        <planeGeometry args={[4.5, 42]} />
        <meshStandardMaterial
          color="#A68257"
          roughness={0.9}
        />
      </mesh>

      {/* 4. Irrigation Canal / River at Edge (X = -42 to -50) */}
      <group position={[-44, 0, 0]}>
        {/* Riverbed Trench */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[12, 0.8, 140]} />
          <meshStandardMaterial color="#4E3629" roughness={1.0} />
        </mesh>

        {/* Shimmering River Water */}
        <mesh
          ref={waterRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.15, 0]}
        >
          <planeGeometry args={[11.5, 140]} />
          <meshStandardMaterial
            color="#29B6F6"
            transparent
            opacity={0.82}
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>
      </group>
    </group>
  )
}
