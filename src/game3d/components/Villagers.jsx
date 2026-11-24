import React, { useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { ManagedOverlay } from '../ui/OverlayManager'
import ModelWithFallback from '../assets/ModelLoader'
import { audioManager } from '../audio/AudioManager'

const VILLAGERS_DATA = [
  { id: 'v1', assetId: 'villager_1', x: -6, z: 42, rot: 0.1, kurtaColor: '#FFCC80', dhotiColor: '#FFFFFF' },
  { id: 'v2', assetId: 'villager_2', x: 2, z: 44, rot: -0.3, kurtaColor: '#90CAF9', dhotiColor: '#ECEFF1' },
  { id: 'v3', assetId: 'villager_1', x: 12, z: 43, rot: 0.4, kurtaColor: '#A5D6A7', dhotiColor: '#FAFAFA' },
  { id: 'v4', assetId: 'villager_2', x: -14, z: 48, rot: 0.2, kurtaColor: '#FFE082', dhotiColor: '#ECEFF1' },
  { id: 'v5', assetId: 'villager_1', x: 7, z: 49, rot: -0.2, kurtaColor: '#CE93D8', dhotiColor: '#FFFFFF' },
  { id: 'v6', assetId: 'villager_2', x: 18, z: 46, rot: 0.15, kurtaColor: '#EF9A9A', dhotiColor: '#FAFAFA' }
]

// Reusable static geometries for procedural villager fallback
const VILLAGER_TORSO_GEO = new THREE.BoxGeometry(0.55, 0.75, 0.35)
const VILLAGER_HEAD_GEO = new THREE.SphereGeometry(0.22, 10, 10)
const VILLAGER_TURBAN_GEO = new THREE.CylinderGeometry(0.26, 0.25, 0.18, 8)
const VILLAGER_ARM_GEO = new THREE.BoxGeometry(0.16, 0.65, 0.16)
const VILLAGER_LEG_GEO = new THREE.BoxGeometry(0.24, 0.75, 0.3)
;[
  VILLAGER_TORSO_GEO,
  VILLAGER_HEAD_GEO,
  VILLAGER_TURBAN_GEO,
  VILLAGER_ARM_GEO,
  VILLAGER_LEG_GEO,
].forEach(g => {
  g.dispose = () => {}
})

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
        <mesh dispose={null} geometry={VILLAGER_TORSO_GEO} castShadow={isHigh} receiveShadow={isHigh}>
          <meshStandardMaterial color={data.kurtaColor} roughness={0.8} />
        </mesh>

        {/* Head */}
        <mesh dispose={null} ref={headRef} position={[0, 0.58, 0]} geometry={VILLAGER_HEAD_GEO} castShadow={isHigh}>
          <meshStandardMaterial color="#8D5524" roughness={0.7} />
        </mesh>

        {/* Traditional Turban (Pagri) */}
        <mesh dispose={null} position={[0, 0.72, 0]} geometry={VILLAGER_TURBAN_GEO} castShadow={isHigh}>
          <meshStandardMaterial color="#E65100" roughness={0.9} />
        </mesh>
      </group>

      {/* Arms */}
      <mesh dispose={null} ref={leftArmRef} position={[-0.38, 1.15, 0]} geometry={VILLAGER_ARM_GEO} castShadow={isHigh}>
        <meshStandardMaterial color={data.kurtaColor} roughness={0.8} />
      </mesh>
      <mesh dispose={null} ref={rightArmRef} position={[0.38, 1.15, 0]} geometry={VILLAGER_ARM_GEO} castShadow={isHigh}>
        <meshStandardMaterial color={data.kurtaColor} roughness={0.8} />
      </mesh>

      {/* Legs (Dhoti) */}
      <mesh dispose={null} position={[-0.16, 0.38, 0]} geometry={VILLAGER_LEG_GEO} castShadow={isHigh}>
        <meshStandardMaterial color={data.dhotiColor} roughness={0.9} />
      </mesh>
      <mesh dispose={null} position={[0.16, 0.38, 0]} geometry={VILLAGER_LEG_GEO} castShadow={isHigh}>
        <meshStandardMaterial color={data.dhotiColor} roughness={0.9} />
      </mesh>
    </group>
  )
}

function SingleVillager({ data, isCoughing, showCoughChip, isWaving, qualityConfig }) {
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

      {/* World-space Cough speech bubble (at most 2 rotating inside safe area) */}
      {showCoughChip && (
        <ManagedOverlay
          id={`villager_cough_${data.id}`}
          priority="cough_chip"
          position={[0, 2.3, 0]}
          icon="😷"
          collapsedBadge="Cough"
          center
          zIndexRange={[15, 0]}
        >
          <div
            data-testid="cough-chip"
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
        </ManagedOverlay>
      )}

      {/* World-space Cheerful greeting bubble */}
      {isWaving && (
        <ManagedOverlay
          id={`villager_wave_${data.id}`}
          priority="decorative_sign"
          position={[0, 2.3, 0]}
          icon="👋"
          collapsedBadge="Clean Air"
          center
          zIndexRange={[15, 0]}
        >
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
        </ManagedOverlay>
      )}
    </group>
  )
}

export default function Villagers() {
  const { burnState, burnProgress, activeAlternative, qualityConfig, persistentState, isWatchingVillage } = useGame3D()
  const lastCoughAudioRef = useRef(0)

  const villageHealth = persistentState?.villageHealth ?? 75

  // Coughing triggers strictly when the smoke plume reaches the village
  // (burnProgress >= 0.22, during consequence, or during "Watch the village")
  const isCoughing =
    !activeAlternative &&
    (isWatchingVillage ||
      burnState === 'consequence' ||
      (burnState === 'burning' && (burnProgress || 0) >= 0.22) ||
      (villageHealth < 45 && burnState !== 'lighting' && burnState !== 'burning'))

  const [coughRotationIndex, setCoughRotationIndex] = useState(0)

  // Play audio cough cue during the smoke plume arrival & rotate at most 2 cough chips
  useFrame(({ clock }) => {
    if (isCoughing) {
      const now = clock.getElapsedTime()
      if (now - lastCoughAudioRef.current > 3.6) {
        lastCoughAudioRef.current = now
        audioManager.playCoughSound()
      }
      const rot = Math.floor(now / 2.4) % VILLAGERS_DATA.length
      if (rot !== coughRotationIndex) {
        setCoughRotationIndex(rot)
      }
    }
  })

  // Waving triggers on sustainable choices OR high village health
  const isWaving =
    Boolean(activeAlternative) || (villageHealth >= 78 && burnState === 'idle')

  return (
    <group name="VillagersGroup">
      {VILLAGERS_DATA.map((v, idx) => {
        // Keep at most 1 cough chip active to guarantee max 2 world cards alongside village air station
        const showChip = isCoughing && (
          isWatchingVillage
            ? idx === ((coughRotationIndex % (VILLAGERS_DATA.length - 1)) + 1) // picks v2..v6, avoiding v1 right next to air station
            : idx === coughRotationIndex
        )
        return (
          <SingleVillager
            key={v.id}
            data={v}
            isCoughing={isCoughing}
            showCoughChip={showChip}
            isWaving={isWaving}
            qualityConfig={qualityConfig}
          />
        )
      })}
    </group>
  )
}
