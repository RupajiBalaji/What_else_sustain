import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { STRAW_PILES_DATA } from './StrawPiles'
import ModelWithFallback from '../assets/ModelLoader'

function ProceduralRoundBale({ scale = 1.0, isHigh }) {
  return (
    <group scale={scale}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.65, 0]} castShadow={isHigh} receiveShadow={isHigh}>
        <cylinderGeometry args={[0.7, 0.7, 1.4, 12]} />
        <meshStandardMaterial color="#F5B041" roughness={0.9} />
      </mesh>
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

function RoundBale({ position, scale = 1.0, qualityConfig }) {
  const isHigh = qualityConfig.shadows
  return (
    <group position={position}>
      <ModelWithFallback
        assetId="hay_bale"
        scale={scale}
        fallback={() => <ProceduralRoundBale scale={scale} isHigh={isHigh} />}
      />
    </group>
  )
}

function ProceduralBaler({ isHigh }) {
  return (
    <>
      <mesh position={[0, 1.1, 0]} castShadow={isHigh}>
        <boxGeometry args={[2.0, 1.4, 2.8]} />
        <meshStandardMaterial color="#F57F17" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.45, 1.6]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.4, 0.4, 1.8, 10]} />
        <meshStandardMaterial color="#37474F" metalness={0.8} />
      </mesh>
      <mesh position={[-1.15, 0.65, -0.2]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.65, 0.65, 0.35, 10]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
      <mesh position={[1.15, 0.65, -0.2]} rotation={[0, 0, Math.PI / 2]} castShadow={isHigh}>
        <cylinderGeometry args={[0.65, 0.65, 0.35, 10]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
    </>
  )
}

function ProceduralTruck({ isHigh, qualityConfig }) {
  return (
    <>
      <mesh position={[0, 1.5, 2.2]} castShadow={isHigh}>
        <boxGeometry args={[2.2, 1.8, 1.8]} />
        <meshStandardMaterial color="#1565C0" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.7, 3.12]}>
        <planeGeometry args={[1.8, 0.8]} />
        <meshStandardMaterial color="#90CAF9" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.9, -1.2]} castShadow={isHigh}>
        <boxGeometry args={[2.4, 0.4, 4.6]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      <group position={[0, 1.3, -1.2]}>
        <RoundBale position={[-0.55, 0, -1.2]} scale={0.8} qualityConfig={qualityConfig} />
        <RoundBale position={[0.55, 0, -1.2]} scale={0.8} qualityConfig={qualityConfig} />
        <RoundBale position={[-0.55, 0, 0.2]} scale={0.8} qualityConfig={qualityConfig} />
        <RoundBale position={[0.55, 0, 0.2]} scale={0.8} qualityConfig={qualityConfig} />
        <RoundBale position={[0, 0.8, -0.5]} scale={0.8} qualityConfig={qualityConfig} />
      </group>
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
    </>
  )
}

export default function StrawBalerAndTruck() {
  const { activeAlternative, alternativeProgress, qualityConfig } = useGame3D()
  const balerRef = useRef(null)
  const truckRef = useRef(null)

  const isHigh = qualityConfig.shadows
  const isActive = activeAlternative === 'bale_sell'

  useFrame(() => {
    if (!isActive) return
    const p = alternativeProgress

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

    if (truckRef.current) {
      if (p >= 0.25) {
        const truckP = (p - 0.25) / 0.75
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
      {STRAW_PILES_DATA.slice(0, 6).map((pile) => (
        <RoundBale
          key={pile.id}
          position={[pile.x, 0, pile.z]}
          scale={pile.scale * 1.1}
          qualityConfig={qualityConfig}
        />
      ))}

      {/* 1. Agricultural Baler Machine */}
      <group ref={balerRef} position={[6, 0, 12]}>
        <ModelWithFallback
          assetId="baler"
          fallback={() => <ProceduralBaler isHigh={isHigh} />}
        />
      </group>

      {/* 2. Flatbed Biomass Transport Truck */}
      <group ref={truckRef} position={[6.5, 0, 10]}>
        <ModelWithFallback
          assetId="truck"
          fallback={() => <ProceduralTruck isHigh={isHigh} qualityConfig={qualityConfig} />}
        />
      </group>
    </group>
  )
}
