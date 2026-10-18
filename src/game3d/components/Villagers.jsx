import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useGame3D } from '../context/Game3DContext'

const VILLAGERS_DATA = [
  { id: 'v1', x: -6, z: 42, rot: 0.1, kurtaColor: '#FFCC80', dhotiColor: '#FFFFFF' },
  { id: 'v2', x: 2, z: 44, rot: -0.3, kurtaColor: '#90CAF9', dhotiColor: '#ECEFF1' },
  { id: 'v3', x: 12, z: 43, rot: 0.4, kurtaColor: '#A5D6A7', dhotiColor: '#FAFAFA' },
  { id: 'v4', x: -14, z: 48, rot: 0.2, kurtaColor: '#FFE082', dhotiColor: '#ECEFF1' },
  { id: 'v5', x: 7, z: 49, rot: -0.2, kurtaColor: '#CE93D8', dhotiColor: '#FFFFFF' },
  { id: 'v6', x: 18, z: 46, rot: 0.15, kurtaColor: '#EF9A9A', dhotiColor: '#FAFAFA' }
]

function SingleVillager({ data, isCoughing, isWaving, quality }) {
  const torsoRef = useRef(null)
  const leftArmRef = useRef(null)
  const rightArmRef = useRef(null)
  const headRef = useRef(null)

  const isHigh = quality === 'high'

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + data.x
    if (isCoughing) {
      // Rapid coughing hunch animation with hands covering face
      const coughShake = Math.sin(t * 11) * 0.18 + 0.38
      if (torsoRef.current) torsoRef.current.rotation.x = coughShake
      if (headRef.current) headRef.current.rotation.x = coughShake * 0.6
      // Right arm raised over mouth and nose
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -1.9 + Math.sin(t * 11) * 0.12
        rightArmRef.current.rotation.z = -0.55
      }
      // Left arm bent coughing into elbow
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -1.6 + Math.sin(t * 11) * 0.12
        leftArmRef.current.rotation.z = 0.45
      }
    } else if (isWaving) {
      // Cheerful waving arm motion
      if (torsoRef.current) torsoRef.current.rotation.x = 0
      if (headRef.current) headRef.current.rotation.x = 0
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -2.4
        rightArmRef.current.rotation.z = Math.sin(t * 8) * 0.45 + 0.3
      }
    } else {
      // Gentle idle breathing
      const breath = Math.sin(t * 2) * 0.03
      if (torsoRef.current) {
        torsoRef.current.rotation.x = breath
        torsoRef.current.position.y = 0.95 + breath * 0.2
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0
        rightArmRef.current.rotation.z = 0
      }
    }
  })

  return (
    <group position={[data.x, 0, data.z]} rotation={[0, data.rot, 0]}>
      {/* Torso */}
      <group ref={torsoRef} position={[0, 0.95, 0]}>
        <mesh castShadow={isHigh} receiveShadow={isHigh}>
          <boxGeometry args={[0.55, 0.75, 0.35]} />
          <meshStandardMaterial color={data.kurtaColor} roughness={0.8} />
        </mesh>

        {/* Head */}
        <mesh ref={headRef} position={[0, 0.58, 0]} castShadow={isHigh}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#8D6E63" roughness={0.7} />
        </mesh>

        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.34, 0.25, 0]}>
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.07, 0.06, 0.5, 5]} />
            <meshStandardMaterial color="#8D6E63" />
          </mesh>
        </group>

        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.34, 0.25, 0]}>
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.07, 0.06, 0.5, 5]} />
            <meshStandardMaterial color="#8D6E63" />
          </mesh>
        </group>
      </group>

      {/* Legs (Dhoti) */}
      <mesh position={[-0.14, 0.35, 0]} castShadow={isHigh}>
        <cylinderGeometry args={[0.09, 0.08, 0.7, 5]} />
        <meshStandardMaterial color={data.dhotiColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.14, 0.35, 0]} castShadow={isHigh}>
        <cylinderGeometry args={[0.09, 0.08, 0.7, 5]} />
        <meshStandardMaterial color={data.dhotiColor} roughness={0.9} />
      </mesh>

      {/* Cough Emote Bubble with Cough Icon */}
      {isCoughing && (
        <Html position={[0, 2.2, 0]} center distanceFactor={28} zIndexRange={[10, 0]}>
          <div
            style={{
              backgroundColor: 'rgba(255, 235, 238, 0.96)',
              border: '2px solid #E53935',
              color: '#B71C1C',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
              animation: 'bounce 0.8s infinite',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>😷</span>
            <span>*Cough!*</span>
          </div>
        </Html>
      )}

      {/* Cheerful Waving Emote Bubble during Sustainable Alternatives */}
      {isWaving && (
        <Html position={[0, 2.2, 0]} center distanceFactor={28} zIndexRange={[10, 0]}>
          <div
            style={{
              backgroundColor: 'rgba(232, 245, 233, 0.95)',
              border: '2px solid #4CAF50',
              color: '#1B5E20',
              padding: '3px 9px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
              animation: 'bounce 1s infinite'
            }}
          >
            👋 Clean Air! 🌾
          </div>
        </Html>
      )}
    </group>
  )
}

export default function Villagers() {
  const { burnState, burnProgress, activeAlternative, quality } = useGame3D()

  // Smoke reaches village after ~6 seconds of burn (progress >= 0.3) or during consequence
  const isCoughing =
    !activeAlternative &&
    (burnState === 'consequence' || (burnState === 'burning' && burnProgress >= 0.3))

  const isWaving = Boolean(activeAlternative)

  return (
    <group name="VillagersGroup">
      {VILLAGERS_DATA.map((v) => (
        <SingleVillager
          key={v.id}
          data={v}
          isCoughing={isCoughing}
          isWaving={isWaving}
          quality={quality}
        />
      ))}
    </group>
  )
}
