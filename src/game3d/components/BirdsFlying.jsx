import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

const BIRDS_DATA = [
  { id: 'b1', radius: 45, speed: 0.45, y: 22, phase: 0 },
  { id: 'b2', radius: 48, speed: 0.42, y: 24, phase: 0.5 },
  { id: 'b3', radius: 42, speed: 0.48, y: 21, phase: 1.1 },
  { id: 'b4', radius: 52, speed: 0.38, y: 25, phase: 1.8 },
  { id: 'b5', radius: 46, speed: 0.44, y: 23, phase: 2.5 }
]

function SingleBird({ config }) {
  const birdRef = useRef(null)
  const leftWingRef = useRef(null)
  const rightWingRef = useRef(null)

  useFrame(({ clock }) => {
    if (!birdRef.current) return
    const t = clock.getElapsedTime() * config.speed + config.phase
    const x = Math.cos(t) * config.radius
    const z = Math.sin(t) * config.radius + 15
    const y = config.y + Math.sin(t * 2) * 1.2

    birdRef.current.position.set(x, y, z)
    // Rotate to face trajectory tangent
    birdRef.current.rotation.y = -t + Math.PI / 2

    // Flapping wings
    const flap = Math.sin(clock.getElapsedTime() * 12 + config.phase) * 0.55
    if (leftWingRef.current) leftWingRef.current.rotation.z = flap
    if (rightWingRef.current) rightWingRef.current.rotation.z = -flap
  })

  return (
    <group ref={birdRef}>
      {/* Bird Body */}
      <mesh>
        <coneGeometry args={[0.16, 0.7, 4]} />
        <meshStandardMaterial color="#37474F" roughness={0.8} />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.1, 0, 0]}>
        <mesh position={[-0.45, 0, 0]}>
          <boxGeometry args={[0.8, 0.04, 0.35]} />
          <meshStandardMaterial color="#455A64" roughness={0.8} />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.1, 0, 0]}>
        <mesh position={[0.45, 0, 0]}>
          <boxGeometry args={[0.8, 0.04, 0.35]} />
          <meshStandardMaterial color="#455A64" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

export default function BirdsFlying() {
  const { burnState, burnProgress } = useGame3D()

  // Birds fly away when fire breaks out; return during healthy state and alternatives
  const isSmoky = burnState === 'consequence' || (burnState === 'burning' && burnProgress > 0.15)
  if (isSmoky) return null

  return (
    <group name="BirdsFlock">
      {BIRDS_DATA.map((b) => (
        <SingleBird key={b.id} config={b} />
      ))}
    </group>
  )
}
