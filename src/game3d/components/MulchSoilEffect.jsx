import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

const WORMS_DATA = [
  { id: 'w1', x: -4, z: 12, rot: 0.4 },
  { id: 'w2', x: 2, z: 14, rot: -0.2 },
  { id: 'w3', x: -8, z: 16, rot: 0.8 },
  { id: 'w4', x: -1, z: 18, rot: -0.6 },
  { id: 'w5', x: -12, z: 15, rot: 0.1 },
  { id: 'w6', x: -6, z: 22, rot: 0.5 }
]

function WigglingEarthworm({ data, progress, quality }) {
  const wormRef = useRef(null)

  useFrame(({ clock }) => {
    if (!wormRef.current) return
    const t = clock.getElapsedTime() * 7 + data.x
    // S-curve wiggling motion
    wormRef.current.rotation.y = data.rot + Math.sin(t) * 0.35
    wormRef.current.position.y = 0.08 + Math.abs(Math.sin(t)) * 0.04
  })

  // Emerge from soil as time-lapse advances
  const scale = Math.min(1.0, Math.max(0.01, (progress - 0.3) * 2.5))

  return (
    <group
      ref={wormRef}
      position={[data.x, 0.08, data.z]}
      scale={[scale, scale, scale]}
      rotation={[0, data.rot, 0]}
    >
      {/* Segmented earthworm body (warm pink/rose) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow={quality === 'high'}>
        <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
        <meshStandardMaterial color="#F48FB1" roughness={0.7} />
      </mesh>
      {/* Worm head */}
      <mesh position={[0, 0, 0.38]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#EC407A" roughness={0.6} />
      </mesh>
    </group>
  )
}

export default function MulchSoilEffect() {
  const { activeAlternative, alternativeProgress, quality } = useGame3D()
  const mulchPlaneRef = useRef(null)

  const isActive = activeAlternative === 'mulch'
  const isHigh = quality === 'high'

  useFrame(() => {
    if (!mulchPlaneRef.current || !isActive) return
    // Mulch spreads out across soil
    const opacity = Math.min(0.92, alternativeProgress * 1.5)
    mulchPlaneRef.current.material.opacity = opacity
  })

  if (!isActive) return null

  return (
    <group name="MulchSoilSystem">
      {/* 1. Shredded Straw Mulch Cover Layer */}
      <mesh
        ref={mulchPlaneRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-8, 0.02, 18]}
        receiveShadow={isHigh}
      >
        <planeGeometry args={[36, 32]} />
        <meshStandardMaterial
          color="#D4A359"
          roughness={0.96}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 2. Earthworms emerging during time-lapse (p >= 0.3) */}
      {alternativeProgress >= 0.3 &&
        WORMS_DATA.map((w) => (
          <WigglingEarthworm
            key={w.id}
            data={w}
            progress={alternativeProgress}
            quality={quality}
          />
        ))}
    </group>
  )
}
