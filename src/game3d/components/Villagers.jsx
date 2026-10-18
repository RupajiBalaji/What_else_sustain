import React, { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useGame3D } from '../context/Game3DContext'
import ModelWithFallback from '../assets/ModelLoader'

const VILLAGERS_DATA = [
  { id: 'v1', assetId: 'villager_1', x: -6, z: 42, rot: 0.1, kurtaColor: '#FFCC80', dhotiColor: '#FFFFFF' },
  { id: 'v2', assetId: 'villager_2', x: 2, z: 44, rot: -0.3, kurtaColor: '#90CAF9', dhotiColor: '#ECEFF1' },
  { id: 'v3', assetId: 'villager_1', x: 12, z: 43, rot: 0.4, kurtaColor: '#A5D6A7', dhotiColor: '#FAFAFA' },
  { id: 'v4', assetId: 'villager_2', x: -14, z: 48, rot: 0.2, kurtaColor: '#FFE082', dhotiColor: '#ECEFF1' },
  { id: 'v5', assetId: 'villager_1', x: 7, z: 49, rot: -0.2, kurtaColor: '#CE93D8', dhotiColor: '#FFFFFF' },
  { id: 'v6', assetId: 'villager_2', x: 18, z: 46, rot: 0.15, kurtaColor: '#EF9A9A', dhotiColor: '#FAFAFA' }
]

function ProceduralVillager({ data, isCoughing, isWaving, isHigh }) {
  const { camera } = useThree()
  const torsoRef = useRef(null)
  const leftArmRef = useRef(null)
  const rightArmRef = useRef(null)
  const headRef = useRef(null)
  const frameTickRef = useRef(0)

  useFrame(({ clock }) => {
    // Distance LOD: throttle animation ticks if camera is far (> 28m)
    const dx = camera.position.x - data.x
    const dz = camera.position.z - data.z
    const distSq = dx * dx + dz * dz
    if (distSq > 784) { // > 28m away
      frameTickRef.current++
      if (frameTickRef.current % 3 !== 0) return
    }

    const t = clock.getElapsedTime() + data.x
    if (isCoughing) {
      const coughShake = Math.sin(t * 11) * 0.18 + 0.38
      if (torsoRef.current) torsoRef.current.rotation.x = coughShake
      if (headRef.current) headRef.current.rotation.x = coughShake * 0.6
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -1.9 + Math.sin(t * 11) * 0.12
        rightArmRef.current.rotation.z = -0.55
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -1.6 + Math.sin(t * 11) * 0.12
        leftArmRef.current.rotation.z = 0.45
      }
    } else if (isWaving) {
      if (torsoRef.current) torsoRef.current.rotation.x = 0
      if (headRef.current) headRef.current.rotation.x = 0
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -2.4
        rightArmRef.current.rotation.z = Math.sin(t * 8) * 0.45 + 0.3
      }
    } else {
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
    <group position={[0, 0, 0]}>
      {/* Torso */}
      <group ref={torsoRef} position={[0, 0.95, 0]}>
        <mesh castShadow={isHigh} receiveShadow={isHigh}>
          <boxGeometry args={[0.55, 0.75, 0.35]} />
          <meshStandardMaterial color={data.kurtaColor} roughness={0.8} />
        </mesh>

        {/* Head */}
        <mesh ref={headRef} position={[0, 0.58, 0]} castShadow={isHigh}>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshStandardMaterial color="#8D5524" roughness={0.7} />
        </mesh>

        {/* Traditional Turban (Pagri) */}
        <mesh position={[0, 0.72, 0]} castShadow={isHigh}>
          <cylinderGeometry args={[0.26, 0.25, 0.18, 8]} />
          <meshStandardMaterial color="#E65100" roughness={0.9} />
        </mesh>
      </group>

      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.38, 1.15, 0]} castShadow={isHigh}>
        <boxGeometry args={[0.16, 0.65, 0.16]} />
        <meshStandardMaterial color={data.kurtaColor} roughness={0.8} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.38, 1.15, 0]} castShadow={isHigh}>
        <boxGeometry args={[0.16, 0.65, 0.16]} />
        <meshStandardMaterial color={data.kurtaColor} roughness={0.8} />
      </mesh>

      {/* Legs (Dhoti) */}
      <mesh position={[-0.16, 0.38, 0]} castShadow={isHigh}>
        <boxGeometry args={[0.24, 0.75, 0.3]} />
        <meshStandardMaterial color={data.dhotiColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.16, 0.38, 0]} castShadow={isHigh}>
        <boxGeometry args={[0.24, 0.75, 0.3]} />
        <meshStandardMaterial color={data.dhotiColor} roughness={0.9} />
      </mesh>
    </group>
  )
}

function SingleVillager({ data, isCoughing, isWaving, qualityConfig }) {
  const isHigh = qualityConfig.shadows
  const currentAnim = isCoughing ? 'cough' : isWaving ? 'wave' : 'idle'

  return (
    <group position={[data.x, 0, data.z]} rotation={[0, data.rot, 0]}>
      {/* 3D Villager Model with Procedural Fallback */}
      <ModelWithFallback
        assetId={data.assetId}
        fallback={(props) => (
          <ProceduralVillager
            data={data}
            isCoughing={isCoughing}
            isWaving={isWaving}
            isHigh={isHigh}
            {...props}
          />
        )}
        currentAnimation={currentAnim}
      />

      {/* World-space Cough speech bubble */}
      {isCoughing && (
        <Html position={[0, 2.3, 0]} distanceFactor={22} center zIndexRange={[15, 0]}>
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid #D32F2F',
              color: '#B71C1C',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              pointerEvents: 'none',
              animation: 'pulse 1s infinite'
            }}
          >
            😷 Cough! Smog...
          </div>
        </Html>
      )}

      {/* World-space Cheerful greeting bubble */}
      {isWaving && (
        <Html position={[0, 2.3, 0]} distanceFactor={22} center zIndexRange={[15, 0]}>
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  const { burnState, burnProgress, activeAlternative, qualityConfig, persistentState } = useGame3D()

  const villageHealth = persistentState?.villageHealth ?? 75

  // Coughing triggers if actively burning/burnt, OR if persistent village health has deteriorated
  const isCoughing =
    !activeAlternative &&
    (burnState === 'consequence' ||
      (burnState === 'burning' && burnProgress >= 0.3) ||
      (villageHealth < 50 && burnState !== 'lighting'))

  // Waving triggers on sustainable choices OR high village health
  const isWaving =
    Boolean(activeAlternative) || (villageHealth >= 78 && burnState === 'idle')

  return (
    <group name="VillagersGroup">
      {VILLAGERS_DATA.map((v) => (
        <SingleVillager
          key={v.id}
          data={v}
          isCoughing={isCoughing}
          isWaving={isWaving}
          qualityConfig={qualityConfig}
        />
      ))}
    </group>
  )
}
