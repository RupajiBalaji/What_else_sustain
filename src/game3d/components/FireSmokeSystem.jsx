import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { STRAW_PILES_DATA } from './StrawPiles'

const _particleDummy = new THREE.Object3D()

/**
 * Procedural Sprite Generators (Generated once on HTML5 canvas as CanvasTexture)
 */
function createParticleTexture(type) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = type === 'fire' ? 256 : 128
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (type === 'fire') {
    // Slender flame tongue with vivid orange core, amber body, golden-yellow tips, crimson edges (ZERO pure white)
    const grad = ctx.createLinearGradient(64, 250, 64, 10)
    grad.addColorStop(0, 'rgba(255, 109, 0, 0.95)') // Deep fiery orange core
    grad.addColorStop(0.25, 'rgba(255, 152, 0, 0.90)') // Amber fiery orange
    grad.addColorStop(0.65, 'rgba(255, 193, 7, 0.85)') // Pure golden yellow tips
    grad.addColorStop(0.90, 'rgba(216, 67, 21, 0.50)') // Crimson red-orange edges
    grad.addColorStop(1.0, 'rgba(191, 54, 12, 0.0)') // Tapered flickering tip

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(64, 10)
    ctx.bezierCurveTo(88, 75, 102, 160, 95, 245)
    ctx.quadraticCurveTo(64, 255, 33, 245)
    ctx.bezierCurveTo(26, 160, 40, 75, 64, 10)
    ctx.closePath()
    ctx.fill()

    // Inner warm amber flame core (strictly capped, no white stops)
    const coreGrad = ctx.createLinearGradient(64, 250, 64, 70)
    coreGrad.addColorStop(0, 'rgba(255, 140, 0, 0.92)')
    coreGrad.addColorStop(0.5, 'rgba(255, 179, 0, 0.80)')
    coreGrad.addColorStop(1.0, 'rgba(255, 193, 7, 0.0)')
    ctx.fillStyle = coreGrad
    ctx.beginPath()
    ctx.moveTo(64, 70)
    ctx.bezierCurveTo(76, 125, 84, 185, 80, 245)
    ctx.quadraticCurveTo(64, 252, 48, 245)
    ctx.bezierCurveTo(44, 185, 52, 125, 64, 70)
    ctx.closePath()
    ctx.fill()
  } else if (type === 'ember') {
    // Sharp glowing spark (orange-gold)
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 48)
    grad.addColorStop(0, 'rgba(255, 193, 7, 1.0)')
    grad.addColorStop(0.35, 'rgba(255, 140, 0, 0.85)')
    grad.addColorStop(0.7, 'rgba(230, 81, 0, 0.4)')
    grad.addColorStop(1.0, 'rgba(191, 54, 12, 0.0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(64, 64, 48, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // Soft turbulent smoke puff (dense dark charcoal core fading to dark umber)
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60)
    grad.addColorStop(0, 'rgba(20, 18, 17, 0.96)') // Dense dark charcoal
    grad.addColorStop(0.35, 'rgba(34, 30, 28, 0.88)') // Dark soot
    grad.addColorStop(0.7, 'rgba(52, 46, 42, 0.58)') // Smoky umber
    grad.addColorStop(1.0, 'rgba(52, 46, 42, 0.0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(64, 64, 60, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.generateMipmaps = true
  tex.needsUpdate = true
  return tex
}



export default function FireSmokeSystem() {
  const {
    burnState,
    windState,
    ignitedPiles,
    setIgnitedPiles,
    qualityConfig
  } = useGame3D()

  const fireMeshRef = useRef(null)
  const emberMeshRef = useRef(null)
  const smokeMeshRef = useRef(null)
  const lightRef = useRef(null)

  const isBurning = burnState === 'burning'
  const isConsequence = burnState === 'consequence'
  const isSmokeActive = isBurning || isConsequence

  // Particle caps from qualityConfig
  const maxFire = qualityConfig.fireParticles || 180
  const maxSmoke = qualityConfig.smokeParticles || 140
  const maxEmbers = qualityConfig.emberParticles || 50

  const fireTexture = useMemo(() => createParticleTexture('fire'), [])
  const smokeTexture = useMemo(() => createParticleTexture('smoke'), [])
  const emberTexture = useMemo(() => createParticleTexture('ember'), [])

  // Initialize particle states
  const fireParticles = useMemo(() => {
    return Array.from({ length: 320 }, () => ({
      pileIndex: 0,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 1.8,
      vz: 0,
      scale: 1,
      life: Math.random(),
      maxLife: 0.7 + Math.random() * 0.5
    }))
  }, [])

  const emberParticles = useMemo(() => {
    return Array.from({ length: 100 }, () => ({
      pileIndex: 0,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 2.8,
      vz: 0,
      scale: 0.4,
      life: Math.random(),
      maxLife: 1.4 + Math.random() * 0.9
    }))
  }, [])

  const smokeParticles = useMemo(() => {
    return Array.from({ length: 320 }, () => ({
      pileIndex: 0,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 1.2,
      vz: 0,
      scale: 1.0,
      life: Math.random(),
      maxLife: 5.2 + Math.random() * 4.2
    }))
  }, [])

  // Spreading grid logic: ignite piles based on wind direction & speed
  useEffect(() => {
    if (!isBurning) return

    const initialPile = STRAW_PILES_DATA.find((p) => ignitedPiles?.includes(p.id)) || STRAW_PILES_DATA[0]
    const windRad = ((windState?.directionDeg ?? 75) * Math.PI) / 180
    const windVec = new THREE.Vector2(Math.sin(windRad), Math.cos(windRad)).normalize()
    const windSpeed = windState?.speedMs ?? 3.8

    const timeouts = STRAW_PILES_DATA.map((pile) => {
      if (pile.id === initialPile.id) return null

      const dx = pile.x - initialPile.x
      const dz = pile.z - initialPile.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      const dot = (dx * windVec.x + dz * windVec.y) / (dist || 1)

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

  // Frame update: animate fire, embers, smoke, and flickering point light
  useFrame(({ clock, camera }, delta) => {
    const elapsed = clock.getElapsedTime()
    const windRad = ((windState?.directionDeg ?? 75) * Math.PI) / 180
    const windSpeed = windState?.speedMs ?? 3.8
    const windX = Math.sin(windRad) * windSpeed * 0.35
    const windZ = Math.cos(windRad) * windSpeed * 0.35
    // Smoke drift explicitly oriented toward the northern village (+Z) with wind deflection
    const smokeDriftZ = Math.max(0.7, Math.cos(windRad)) * windSpeed * 0.5 + 0.45
    const smokeDriftX = Math.sin(windRad) * windSpeed * 0.4

    const activePilesList = STRAW_PILES_DATA.filter((p) => ignitedPiles.includes(p.id))
    if (activePilesList.length === 0 && (isBurning || isSmokeActive)) {
      activePilesList.push(STRAW_PILES_DATA[0])
    }
    const hasPiles = activePilesList.length > 0

    // 1. Point Light Flicker (clamped warm amber firelight)
    if (lightRef.current && hasPiles) {
      if (isBurning) {
        const flicker = Math.sin(elapsed * 22) * 0.15 + 0.95
        lightRef.current.intensity = flicker * 1.15
        const lead = activePilesList[0]
        lightRef.current.position.set(lead.x, 1.4, lead.z)
      } else {
        lightRef.current.intensity = 0
      }
    }

    // 2. Fire Particles (Core, Body, Tips - slender, normal-blended licks)
    if (fireMeshRef.current) {
      fireMeshRef.current.count = maxFire
      if (!isBurning || !hasPiles) {
        _particleDummy.scale.set(0, 0, 0)
        _particleDummy.updateMatrix()
        for (let i = 0; i < maxFire; i++) {
          fireMeshRef.current.setMatrixAt(i, _particleDummy.matrix)
        }
        fireMeshRef.current.instanceMatrix.needsUpdate = true
      } else {
        fireParticles.slice(0, maxFire).forEach((p, i) => {
          p.life += delta
          if (p.life >= p.maxLife) {
            p.life = 0
            p.pileIndex = i % activePilesList.length
            const pile = activePilesList[p.pileIndex]
            const angle = Math.random() * Math.PI * 2
            const rad = Math.random() * 0.45
            p.x = pile.x + Math.cos(angle) * rad
            p.y = 0.5 + Math.random() * 0.6
            p.z = pile.z + Math.sin(angle) * rad
            p.vx = (Math.random() - 0.5) * 0.25 + windX * 0.15
            p.vy = 1.6 + Math.random() * 1.2
            p.vz = (Math.random() - 0.5) * 0.25 + windZ * 0.15
          }

          p.x += p.vx * delta
          p.y += p.vy * delta
          p.z += p.vz * delta

          const progress = p.life / p.maxLife
          const size = Math.max(0.35, Math.sin(progress * Math.PI) * 0.85 + 0.35)

          _particleDummy.position.set(p.x, p.y, p.z)
          _particleDummy.quaternion.copy(camera.quaternion)
          _particleDummy.scale.set(size, size, size)
          _particleDummy.updateMatrix()
          fireMeshRef.current.setMatrixAt(i, _particleDummy.matrix)
        })
        fireMeshRef.current.instanceMatrix.needsUpdate = true
      }
    }

    // 3. Embers
    if (emberMeshRef.current) {
      emberMeshRef.current.count = maxEmbers
      if (!isBurning || !hasPiles) {
        _particleDummy.scale.set(0, 0, 0)
        _particleDummy.updateMatrix()
        for (let i = 0; i < maxEmbers; i++) {
          emberMeshRef.current.setMatrixAt(i, _particleDummy.matrix)
        }
        emberMeshRef.current.instanceMatrix.needsUpdate = true
      } else {
        emberParticles.slice(0, maxEmbers).forEach((p, i) => {
          p.life += delta
          if (p.life >= p.maxLife) {
            p.life = 0
            p.pileIndex = i % activePilesList.length
            const pile = activePilesList[p.pileIndex]
            p.x = pile.x + (Math.random() - 0.5) * 0.8
            p.y = 0.8 + Math.random() * 0.5
            p.z = pile.z + (Math.random() - 0.5) * 0.8
            p.vx = (Math.random() - 0.5) * 0.6 + windX * 0.6
            p.vy = 2.4 + Math.random() * 1.8
            p.vz = (Math.random() - 0.5) * 0.6 + windZ * 0.6
          }

          p.x += p.vx * delta + Math.sin(elapsed * 8 + i) * 0.015
          p.y += p.vy * delta
          p.z += p.vz * delta + Math.cos(elapsed * 8 + i) * 0.015

          const progress = p.life / p.maxLife
          const size = Math.max(0.08, (1.0 - progress) * 0.28 + 0.08)

          _particleDummy.position.set(p.x, p.y, p.z)
          _particleDummy.quaternion.copy(camera.quaternion)
          _particleDummy.scale.set(size, size, size)
          _particleDummy.updateMatrix()
          emberMeshRef.current.setMatrixAt(i, _particleDummy.matrix)
        })
        emberMeshRef.current.instanceMatrix.needsUpdate = true
      }
    }

    // 4. Smoke Plume Particles (dark, expanding, billowing toward northern village)
    if (smokeMeshRef.current) {
      smokeMeshRef.current.count = maxSmoke
      if (!isSmokeActive || !hasPiles) {
        _particleDummy.scale.set(0, 0, 0)
        _particleDummy.updateMatrix()
        for (let i = 0; i < maxSmoke; i++) {
          smokeMeshRef.current.setMatrixAt(i, _particleDummy.matrix)
        }
        smokeMeshRef.current.instanceMatrix.needsUpdate = true
      } else {
        smokeParticles.slice(0, maxSmoke).forEach((p, i) => {
          p.life += delta
          if (p.life >= p.maxLife) {
            p.life = 0
            p.pileIndex = i % activePilesList.length
            const pile = activePilesList[p.pileIndex]
            p.x = pile.x + (Math.random() - 0.5) * 1.0
            p.y = 1.1 + Math.random() * 0.5
            p.z = pile.z + (Math.random() - 0.5) * 1.0
            p.vx = (Math.random() - 0.5) * 0.35
            p.vy = 1.6 + Math.random() * 0.8
            p.vz = (Math.random() - 0.5) * 0.35
          }

          const progress = p.life / p.maxLife
          p.x += (p.vx + smokeDriftX * progress * 2.2) * delta
          p.y += (p.vy * 0.90 + Math.sin(progress * Math.PI) * 0.35) * delta
          p.z += (p.vz + smokeDriftZ * progress * 3.0) * delta

          // Expands naturally into billowing dark smoke puffs drifting towards the village
          const size = Math.max(1.1, 1.4 + progress * 4.2)

          _particleDummy.position.set(p.x, p.y, p.z)
          _particleDummy.quaternion.copy(camera.quaternion)
          _particleDummy.scale.set(size, size, size)
          _particleDummy.updateMatrix()
          smokeMeshRef.current.setMatrixAt(i, _particleDummy.matrix)
        })
        smokeMeshRef.current.instanceMatrix.needsUpdate = true
      }
    }
  })

  // Texture cleanup on unmount
  useEffect(() => {
    return () => {
      fireTexture.dispose()
      smokeTexture.dispose()
      emberTexture.dispose()
    }
  }, [fireTexture, smokeTexture, emberTexture])

  const leadPile = STRAW_PILES_DATA.find((p) => ignitedPiles.includes(p.id)) || STRAW_PILES_DATA[0]

  return (
    <group name="FireSmokeSystemGroup">
      {/* 1. Flickering Point Light (rich warm amber flame illuminating surroundings) */}
      <pointLight
        ref={lightRef}
        color="#E65100"
        intensity={0}
        distance={12}
        decay={2}
      />

      {/* 2. Layered Fire Particles with Billboarding and Normal Blending (No Additive Blowout) */}
      <instancedMesh
        ref={fireMeshRef}
        args={[undefined, undefined, 320]}
        frustumCulled={false}
        depthWrite={false}
      >
        <planeGeometry args={[0.55, 1.25]} />
        <meshBasicMaterial
          map={fireTexture}
          transparent
          blending={THREE.NormalBlending}
          opacity={0.82}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* 3. High Embers with Billboarding */}
      <instancedMesh
        ref={emberMeshRef}
        args={[undefined, undefined, 120]}
        frustumCulled={false}
        depthWrite={false}
      >
        <planeGeometry args={[0.25, 0.25]} />
        <meshBasicMaterial
          map={emberTexture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* 4. Dense Smoky Plume with Normal Blending, prominent renderOrder */}
      <instancedMesh
        ref={smokeMeshRef}
        args={[undefined, undefined, 320]}
        frustumCulled={false}
        depthWrite={false}
        renderOrder={15}
      >
        <planeGeometry args={[2.0, 2.0]} />
        <meshBasicMaterial
          map={smokeTexture}
          transparent
          blending={THREE.NormalBlending}
          opacity={0.82}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  )
}
