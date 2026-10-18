import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { STRAW_PILES_DATA } from './StrawPiles'

function RoundBale({ position, scale = 1.0, quality }) {
  const isHigh = quality === 'high'
  return (
    <group position={position} scale={scale}>
      {/* Cylindrical Straw Roll */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.65, 0]} castShadow={isHigh} receiveShadow={isHigh}>
        <cylinderGeometry args={[0.7, 0.7, 1.4, 12]} />
        <meshStandardMaterial color="#F5B041" roughness={0.9} />
      </mesh>
      {/* Twine / Strapping Rings */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.35, 0.65, 0]}>
        <torusGeometry args={[0.71, 0.02, 6, 16]} />
        <meshBasicMaterial color="#212121" />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.35, 0.65, 0]}>
        <torusGeometry args={[0.71, 0.02, 6, 16]} />
        <meshBasicMaterial color="#212121" />
      </mesh>
    </group>
  )
}

export default function StrawBalerAndTruck() {
  const { activeAlternative, alternativeProgress, quality } = useGame3D()
  const balerRef = useRef(null)
  const truckRef = useRef(null)

  const isHigh = quality === 'high'
  const isActive = activeAlternative === 'bale_sell'

  // Animate Baler & Truck
  useFrame(() => {
    if (!isActive) return
    const p = alternativeProgress

    // 1. Baler collects across field mounds (0.0 -> 0.5)
    if (balerRef.current) {
      if (p <= 0.5) {
        const balerP = p / 0.5
        const x = THREE.MathUtils.lerp(6, -18, balerP)
        const z = THREE.MathUtils.lerp(12, 26, balerP)
        balerRef.current.position.set(x, 0, z)
        balerRef.current.visible = true
      } else {
        balerRef.current.visible = false
      }
    }

    // 2. Biomass Truck drives down dirt road towards biomass plant (0.3 -> 1.0)
    if (truckRef.current) {
      if (p >= 0.25) {
        const truckP = (p - 0.25) / 0.75
        // Drives along dirt road at X=6.5, from Z=10 up to Z=65 (distance)
        const z = THREE.MathUtils.lerp(10, 68, truckP)
        truckRef.current.position.set(6.5, 0, z)
        truckRef.current.visible = true
      } else {
        truckRef.current.visible = false
      }
    }
  })

  if (!isActive) return null

  return (
    <group name="BalerAndBiomassTruckGroup">
      {/* Round Bales appearing at straw mounds */}
      {STRAW_PILES_DATA.slice(0, 6).map((pile, idx) => (
        <RoundBale
          key={pile.id}
          position={[pile.x, 0, pile.z]}
          scale={pile.scale * 1.1}
          quality={quality}
        />
      ))}

      {/* 1. Agricultural Baler Machine */}
      <group ref={balerRef} position={[6, 0, 12]}>
        {/* Baler Body (Yellow/Orange) */}
        <mesh position={[0, 1.1, 0]} castShadow={isHigh}>
          <boxGeometry args={[2.0, 1.4, 2.8]} />
          <meshStandardMaterial color="#F57F17" roughness={0.4} />
        </mesh>
        {/* Baler Pick-up Reel (Front) */}
        <mesh position={[0, 0.45, 1.6]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
          <cylinderGeometry args={[0.4, 0.4, 1.8, 10]} />
          <meshStandardMaterial color="#37474F" metalness={0.8} />
        </mesh>
        {/* Wheels */}
        <mesh position={[-1.15, 0.65, -0.2]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
          <cylinderGeometry args={[0.65, 0.65, 0.35, 10]} />
          <meshStandardMaterial color="#212121" />
        </mesh>
        <mesh position={[1.15, 0.65, -0.2]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
          <cylinderGeometry args={[0.65, 0.65, 0.35, 10]} />
          <meshStandardMaterial color="#212121" />
        </mesh>
      </group>

      {/* 2. Flatbed Biomass Transport Truck */}
      <group ref={truckRef} position={[6.5, 0, 10]}>
        {/* Truck Driver Cabin */}
        <mesh position={[0, 1.5, 2.2]} castShadow={isHigh}>
          <boxGeometry args={[2.2, 1.8, 1.8]} />
          <meshStandardMaterial color="#1565C0" roughness={0.4} />
        </mesh>
        {/* Windshield */}
        <mesh position={[0, 1.7, 3.12]}>
          <planeGeometry args={[1.8, 0.8]} />
          <meshStandardMaterial color="#90CAF9" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Flatbed Cargo Base */}
        <mesh position={[0, 0.9, -1.2]} castShadow={isHigh}>
          <boxGeometry args={[2.4, 0.4, 4.6]} />
          <meshStandardMaterial color="#5D4037" roughness={0.9} />
        </mesh>
        {/* Loaded Round Bales stacked on truck bed */}
        <group position={[0, 1.3, -1.2]}>
          <RoundBale position={[-0.55, 0, -1.2]} scale={0.8} quality={quality} />
          <RoundBale position={[0.55, 0, -1.2]} scale={0.8} quality={quality} />
          <RoundBale position={[-0.55, 0, 0.2]} scale={0.8} quality={quality} />
          <RoundBale position={[0.55, 0, 0.2]} scale={0.8} quality={quality} />
          <RoundBale position={[0, 0.8, -0.5]} scale={0.8} quality={quality} />
        </group>
        {/* Truck Wheels */}
        {[-2.5, -0.5, 1.8].map((zPos, idx) => (
          <group key={idx}>
            <mesh position={[-1.25, 0.5, zPos]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
              <cylinderGeometry args={[0.5, 0.5, 0.4, 10]} />
              <meshStandardMaterial color="#212121" />
            </mesh>
            <mesh position={[1.25, 0.5, zPos]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
              <cylinderGeometry args={[0.5, 0.5, 0.4, 10]} />
              <meshStandardMaterial color="#212121" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
