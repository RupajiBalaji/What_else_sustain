import React, { useRef, useMemo, useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useGame3D } from '../context/Game3DContext'
import { ManagedOverlay } from '../ui/OverlayManager'

const _soilDummy = new THREE.Object3D()

/**
 * Cutaway cross-section of the field soil showing vertical layers,
 * instanced worms, microbes, and downward heat glow during fires.
 */
export default function SoilCutawayCrossSection({ position = [-4.0, 0, 8.2], rotation = [0, 0.25, 0] }) {
  const { quality, burnState, burnProgress, activeAlternative, persistentState, isAnyModalOpen } = useGame3D()
  const isHigh = quality === 'high'
  const soilHealth = persistentState?.soilHealth ?? 70

  const wormsRef = useRef(null)
  const microbesRef = useRef(null)
  const heatGlowRef = useRef(null)
  const topsoilRef = useRef(null)

  const isBurning = burnState === 'burning'
  const isBurnt = burnState === 'consequence'
  const isEnriched = activeAlternative === 'mulch' || activeAlternative === 'compost'

  // Progress of burn heat & destruction (0 to 1)
  const burnRatio = isBurnt ? 1.0 : isBurning ? burnProgress : 0

  // Worm instances count
  const wormCount = isHigh ? 14 : 7
  // Microbe instances count
  const microbeCount = isHigh ? 26 : 12

  // Generate fixed positions for worms within topsoil & root zone
  const wormData = useMemo(() => {
    const list = []
    for (let i = 0; i < 14; i++) {
      const u = (i / 13) * 2 - 1
      list.push({
        x: u * 0.9 + (Math.sin(i * 3.7) * 0.15),
        y: -0.15 - (i % 4) * 0.16 - Math.random() * 0.08,
        z: (Math.cos(i * 2.1) * 0.12),
        rotZ: (Math.sin(i * 1.5) * 0.4),
        speed: 1.5 + (i % 3) * 0.8
      })
    }
    return list
  }, [])

  // Generate fixed positions for microbes
  const microbeData = useMemo(() => {
    const list = []
    for (let i = 0; i < 26; i++) {
      list.push({
        x: (Math.sin(i * 2.9) * 0.95),
        y: -0.08 - (i % 5) * 0.14 - (i % 2) * 0.05,
        z: (Math.cos(i * 3.3) * 0.15),
        phase: i * 0.7
      })
    }
    return list
  }, [])

  // Initial layout for instanced meshes
  useLayoutEffect(() => {
    if (!wormsRef.current || !microbesRef.current) return
    const dummy = new THREE.Object3D()

    for (let i = 0; i < wormCount; i++) {
      const w = wormData[i]
      dummy.position.set(w.x, w.y, w.z)
      dummy.rotation.set(0, 0, w.rotZ)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      wormsRef.current.setMatrixAt(i, dummy.matrix)
    }
    wormsRef.current.instanceMatrix.needsUpdate = true

    for (let i = 0; i < microbeCount; i++) {
      const m = microbeData[i]
      dummy.position.set(m.x, m.y, m.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      microbesRef.current.setMatrixAt(i, dummy.matrix)
    }
    microbesRef.current.instanceMatrix.needsUpdate = true
  }, [wormCount, microbeCount, wormData, microbeData])

  // Frame update: animate heat glow, soil discoloration, worm squirming & dying
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // 1. Heat Glow downwards movement
    if (heatGlowRef.current) {
      if (burnRatio > 0.05) {
        heatGlowRef.current.visible = true
        // Moves from y = -0.02 down to y = -0.65 as fire burns deep
        heatGlowRef.current.position.y = -0.02 - burnRatio * 0.6
        heatGlowRef.current.scale.set(1.0 + Math.sin(t * 8) * 0.06, 1.0, 1.0)
      } else {
        heatGlowRef.current.visible = false
      }
    }

    // 2. Topsoil color lerp (Rich loam -> charred ash / deep humus)
    if (topsoilRef.current) {
      // Base healthy color is richer & darker when soilHealth is high
      const loamT = Math.max(0, Math.min(1, soilHealth / 100))
      const baseLoamColor = new THREE.Color().lerpColors(new THREE.Color('#6D4C41'), new THREE.Color('#3E2723'), loamT)
      const burntColor = new THREE.Color('#1B1615')    // Scorched soot
      const enrichedColor = new THREE.Color('#211510') // Dark humus

      if (burnRatio > 0) {
        topsoilRef.current.material.color.lerpColors(baseLoamColor, burntColor, burnRatio)
      } else if (isEnriched) {
        topsoilRef.current.material.color.lerp(enrichedColor, 0.05)
      } else {
        topsoilRef.current.material.color.lerp(baseLoamColor, 0.05)
      }
    }

    // 3. Animate worms using hoisted _soilDummy
    if (wormsRef.current) {
      // If soil health is depleted, fewer active worms survive
      const activeWormLimit = Math.max(2, Math.round(wormCount * (soilHealth / 100)))

      for (let i = 0; i < wormCount; i++) {
        const w = wormData[i]
        let scale = i < activeWormLimit ? 1.0 : 0.01
        let wiggle = Math.sin(t * w.speed) * 0.12

        if (burnRatio > 0.15) {
          scale = Math.max(0.01, 1.0 - burnRatio * 1.1)
          wiggle = 0
        } else if (isEnriched) {
          scale = 1.25 + Math.sin(t * 3 + i) * 0.1
          wiggle = Math.sin(t * w.speed * 2.2) * 0.22
        }

        _soilDummy.position.set(w.x, w.y, w.z)
        _soilDummy.rotation.set(0, 0, w.rotZ + wiggle)
        _soilDummy.scale.set(scale, scale, scale)
        _soilDummy.updateMatrix()
        wormsRef.current.setMatrixAt(i, _soilDummy.matrix)
      }
      wormsRef.current.instanceMatrix.needsUpdate = true
    }

    // 4. Animate microbes using hoisted _soilDummy
    if (microbesRef.current) {
      for (let i = 0; i < microbeCount; i++) {
        const m = microbeData[i]
        let scale = 1.0
        if (burnRatio > 0.1) {
          scale = Math.max(0.01, 1.0 - burnRatio * 1.2)
        } else if (isEnriched) {
          scale = 1.5 + Math.sin(t * 4 + m.phase) * 0.4
        } else {
          scale = 1.0 + Math.sin(t * 2 + m.phase) * 0.25
        }

        _soilDummy.position.set(m.x, m.y + Math.sin(t * 2 + m.phase) * 0.02, m.z)
        _soilDummy.scale.set(scale, scale, scale)
        _soilDummy.updateMatrix()
        microbesRef.current.setMatrixAt(i, _soilDummy.matrix)
      }
      microbesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group position={position} rotation={rotation} name="SoilCutawayCrossSection">
      {/* Soil Pit Trench Frame */}
      {/* 1. Topsoil Layer (0 to -0.45m) */}
      <mesh ref={topsoilRef} position={[0, -0.22, 0]} receiveShadow={isHigh}>
        <boxGeometry args={[2.2, 0.45, 0.55]} />
        <meshStandardMaterial color="#4E342E" roughness={0.9} />
      </mesh>

      {/* 2. Subsoil Layer (-0.45 to -1.05m) */}
      <mesh position={[0, -0.75, 0]} receiveShadow={isHigh}>
        <boxGeometry args={[2.2, 0.6, 0.55]} />
        <meshStandardMaterial color="#795548" roughness={0.85} />
      </mesh>

      {/* 3. Deep Bedrock / Clay Layer (-1.05 to -1.65m) */}
      <mesh position={[0, -1.35, 0]}>
        <boxGeometry args={[2.2, 0.6, 0.55]} />
        <meshStandardMaterial color="#A1887F" roughness={0.95} />
      </mesh>

      {/* Heat Glow Penetration Mesh (Downwards during burn) */}
      <mesh ref={heatGlowRef} position={[0, -0.05, 0.28]} visible={false}>
        <planeGeometry args={[2.18, 0.16]} />
        <meshBasicMaterial
          color="#FF3D00"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Retaining Side Stakes / Ruler Pillars */}
      <mesh position={[-1.12, -0.85, 0]}>
        <boxGeometry args={[0.06, 1.75, 0.58]} />
        <meshStandardMaterial color="#3E2723" roughness={0.7} />
      </mesh>
      <mesh position={[1.12, -0.85, 0]}>
        <boxGeometry args={[0.06, 1.75, 0.58]} />
        <meshStandardMaterial color="#3E2723" roughness={0.7} />
      </mesh>

      {/* Instanced Earthworms */}
      <instancedMesh
        ref={wormsRef}
        args={[undefined, undefined, wormCount]}
        position={[0, 0, 0.28]}
      >
        <cylinderGeometry args={[0.02, 0.02, 0.22, 5]} />
        <meshStandardMaterial
          color={isBurnt ? '#423B38' : '#D7827E'}
          roughness={0.6}
        />
      </instancedMesh>

      {/* Instanced Microbes / Bio-fungi */}
      <instancedMesh
        ref={microbesRef}
        args={[undefined, undefined, microbeCount]}
        position={[0, 0, 0.28]}
      >
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshBasicMaterial
          color={isEnriched ? '#81C784' : '#FFD54F'}
        />
      </instancedMesh>

      {/* Ruler depth captions attached directly to slice frame */}
      {!isAnyModalOpen && (
        <>
          <Html position={[-1.15, -0.05, 0.32]} center={false} distanceFactor={18} zIndexRange={[5, 0]}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#C8E6C9', textShadow: '0 1px 3px rgba(0,0,0,0.9)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              0cm Topsoil
            </div>
          </Html>

          <Html position={[-1.15, -0.55, 0.32]} center={false} distanceFactor={18} zIndexRange={[5, 0]}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#FFE0B2', textShadow: '0 1px 3px rgba(0,0,0,0.9)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              -25cm Root Zone
            </div>
          </Html>

          <Html position={[-1.15, -1.15, 0.32]} center={false} distanceFactor={18} zIndexRange={[5, 0]}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#D7CCC8', textShadow: '0 1px 3px rgba(0,0,0,0.9)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              -50cm Subsoil
            </div>
          </Html>
        </>
      )}

      {/* Cutaway Title Plaque: Clean 2-line title, clamped and managed by OverlayManager */}
      <ManagedOverlay
        id="soil_cutaway_plaque"
        priority="status_prop"
        position={[0, -0.18, 0.3]}
        icon="🔬"
        center
        zIndexRange={[15, 0]}
      >
        <div
          style={{
            backgroundColor: isBurnt
              ? 'rgba(183, 28, 28, 0.94)'
              : isEnriched
              ? 'rgba(46, 125, 50, 0.94)'
              : 'rgba(46, 56, 48, 0.92)',
            color: '#FFFFFF',
            padding: '4px 8px',
            borderRadius: '12px',
            border: '1.5px solid rgba(255,255,255,0.7)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '155px',
            boxSizing: 'border-box',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '145px' }}>
            {isBurnt ? '🔥 Burnt Soil Slice' : isEnriched ? '🌿 Regenerated Soil' : '🔬 Soil Cross-Section'}
          </span>
          <span style={{ fontSize: '9px', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '145px' }}>
            {isBurnt ? '(Worms Lost)' : isEnriched ? '(Microbes Multiplying)' : '(Living Microbes)'}
          </span>
        </div>
      </ManagedOverlay>
    </group>
  )
}
