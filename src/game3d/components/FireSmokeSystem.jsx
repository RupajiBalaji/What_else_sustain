import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { STRAW_PILES_DATA } from './StrawPiles'

const MAX_FIRE_PARTICLES = 240
const MAX_SMOKE_PARTICLES = 300 // Total 540 particles <= 600 limit

export default function FireSmokeSystem() {
  const { burnState, burnProgress, windState, ignitedPiles, setIgnitedPiles, quality } = useGame3D()
  const isHigh = quality === 'high'

  const fireMeshRef = useRef(null)
  const smokeMeshRef = useRef(null)
  const lightRef = useRef(null)

  const isBurning = burnState === 'burning'

  // Initialize particle states
  const fireParticles = useMemo(() => {
    return Array.from({ length: MAX_FIRE_PARTICLES }, () => ({
      pileIndex: 0,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 1.5,
      vz: 0,
      scale: 1,
      life: Math.random(),
      maxLife: 0.8 + Math.random() * 0.6
    }))
  }, [])

  const smokeParticles = useMemo(() => {
    return Array.from({ length: MAX_SMOKE_PARTICLES }, () => ({
      pileIndex: 0,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 1.2,
      vz: 0,
      scale: 0.8,
      life: Math.random(),
      maxLife: 3.5 + Math.random() * 2.5
    }))
  }, [])

  // Spreading grid logic: ignite piles based on wind direction & speed
  useEffect(() => {
    if (!isBurning) return

    const initialPile = STRAW_PILES_DATA.find((p) => ignitedPiles?.includes(p.id)) || STRAW_PILES_DATA[0]
    const windRad = ((windState?.directionDeg ?? 75) * Math.PI) / 180
    const windVec = new THREE.Vector2(Math.sin(windRad), Math.cos(windRad)).normalize()
    const windSpeed = windState?.speedMs ?? 3.8

    // Calculate ignition delay for each straw pile based on downwind distance
    const timeouts = STRAW_PILES_DATA.map((pile) => {
      if (pile.id === initialPile.id) return null

      const dx = pile.x - initialPile.x
      const dz = pile.z - initialPile.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      const dot = (dx * windVec.x + dz * windVec.y) / (dist || 1)

      // Spreads faster downwind (dot > 0)
      const speedFactor = Math.max(0.35, 1.0 + dot * 0.65 * (windSpeed / 3.0))
      const delayMs = Math.min(13000, 1500 + (dist / (speedFactor * 3.2)) * 1000)

      return setTimeout(() => {
        setIgnitedPiles((prev) => (prev.includes(pile.id) ? prev : [...prev, pile.id]))
      }, delayMs)
    })

    return () => {
      timeouts.forEach((t) => t && clearTimeout(t))
    }
  }, [isBurning, windState, setIgnitedPiles])

  // Get positions of currently ignited piles
  const activePilePositions = useMemo(() => {
    if (!ignitedPiles || ignitedPiles.length === 0) {
      return [new THREE.Vector3(STRAW_PILES_DATA[0].x, 0.4, STRAW_PILES_DATA[0].z)]
    }
    return STRAW_PILES_DATA.filter((p) => ignitedPiles.includes(p.id)).map(
      (p) => new THREE.Vector3(p.x, 0.4, p.z)
    )
  }, [ignitedPiles])

  // Frame update for particle physics
  useFrame(({ clock }, delta) => {
    if (!isBurning) return
    const time = clock.getElapsedTime()

    // 1. Point Light Flicker
    if (lightRef.current && activePilePositions.length > 0) {
      const center = activePilePositions[0]
      lightRef.current.position.set(center.x, 2.2, center.z)
      const flicker = 1.9 + Math.sin(time * 18) * 0.6 + Math.cos(time * 28) * 0.35
      lightRef.current.intensity = Math.max(0.6, flicker)
    }

    const dummy = new THREE.Object3D()
    const windRad = ((windState?.directionDeg ?? 75) * Math.PI) / 180
    const windDirX = Math.sin(windRad)
    const windDirZ = Math.cos(windRad)
    const windSpeed = windState?.speedMs ?? 3.8

    // 2. Fire Particles Update
    if (fireMeshRef.current) {
      for (let i = 0; i < MAX_FIRE_PARTICLES; i++) {
        const p = fireParticles[i]
        p.life += delta

        if (p.life >= p.maxLife) {
          // Respawn at a random active pile
          const pile = activePilePositions[i % activePilePositions.length]
          p.x = pile.x + (Math.random() - 0.5) * 1.8
          p.y = 0.5 + Math.random() * 0.4
          p.z = pile.z + (Math.random() - 0.5) * 1.8
          p.vx = (Math.random() - 0.5) * 0.8 + windDirX * 0.4
          p.vy = 2.2 + Math.random() * 2.0
          p.vz = (Math.random() - 0.5) * 0.8 + windDirZ * 0.4
          p.life = 0
          p.scale = 0.5 + Math.random() * 0.5
        } else {
          p.x += p.vx * delta
          p.y += p.vy * delta
          p.z += p.vz * delta
          // Fire shrinks as it ascends
          const progress = p.life / p.maxLife
          const currentScale = Math.max(0.01, p.scale * (1.0 - progress))
          dummy.position.set(p.x, p.y, p.z)
          dummy.scale.set(currentScale, currentScale * 1.4, currentScale)
          dummy.updateMatrix()
          fireMeshRef.current.setMatrixAt(i, dummy.matrix)
        }
      }
      fireMeshRef.current.instanceMatrix.needsUpdate = true
    }

    // 3. Smoke Particles Update
    if (smokeMeshRef.current) {
      for (let i = 0; i < MAX_SMOKE_PARTICLES; i++) {
        const p = smokeParticles[i]
        p.life += delta

        if (p.life >= p.maxLife) {
          // Respawn at active pile base
          const pile = activePilePositions[i % activePilePositions.length]
          p.x = pile.x + (Math.random() - 0.5) * 2.2
          p.y = 1.0 + Math.random() * 0.8
          p.z = pile.z + (Math.random() - 0.5) * 2.2
          p.vx = windDirX * windSpeed * (0.6 + Math.random() * 0.5)
          p.vy = 1.4 + Math.random() * 1.2
          p.vz = windDirZ * windSpeed * (0.6 + Math.random() * 0.5)
          p.life = 0
          p.scale = 0.8 + Math.random() * 0.6
        } else {
          p.x += p.vx * delta
          p.y += p.vy * delta
          p.z += p.vz * delta

          // Smoke expands and rises as it blows towards village
          const progress = p.life / p.maxLife
          const currentScale = p.scale + progress * 3.2
          dummy.position.set(p.x, p.y, p.z)
          dummy.scale.set(currentScale, currentScale, currentScale)
          dummy.rotation.set(0, time * 0.5 + i, 0)
          dummy.updateMatrix()
          smokeMeshRef.current.setMatrixAt(i, dummy.matrix)
        }
      }
      smokeMeshRef.current.instanceMatrix.needsUpdate = true
    }
  })

  if (!isBurning) return null

  return (
    <group name="FireSmokeSystem">
      {/* Flickering orange fire point light */}
      <pointLight
        ref={lightRef}
        color="#FF6D00"
        intensity={2.2}
        distance={isHigh ? 38 : 24}
        decay={2}
      />

      {/* GPU-Friendly Instanced Fire Particles */}
      <instancedMesh
        ref={fireMeshRef}
        args={[undefined, undefined, MAX_FIRE_PARTICLES]}
        frustumCulled={false}
      >
        <coneGeometry args={[0.3, 0.6, 5]} />
        <meshBasicMaterial
          color="#FF5722"
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      {/* GPU-Friendly Instanced Dark Smoke Particles */}
      <instancedMesh
        ref={smokeMeshRef}
        args={[undefined, undefined, MAX_SMOKE_PARTICLES]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.6, 6, 6]} />
        <meshStandardMaterial
          color="#3E2723"
          roughness={0.95}
          transparent
          opacity={0.62}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  )
}
