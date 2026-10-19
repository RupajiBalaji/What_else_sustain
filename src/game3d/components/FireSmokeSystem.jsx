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
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 128, 128)

  if (type === 'fire') {
    // Soft glowing radial flame puff
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60)
    grad.addColorStop(0, 'rgba(255, 255, 240, 1.0)') // White-hot core
    grad.addColorStop(0.25, 'rgba(255, 183, 77, 0.85)') // Bright golden flame
    grad.addColorStop(0.6, 'rgba(230, 81, 0, 0.55)') // Deep orange
    grad.addColorStop(0.85, 'rgba(191, 54, 12, 0.25)') // Dark crimson tip
    grad.addColorStop(1.0, 'rgba(191, 54, 12, 0.0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(64, 64, 60, 0, Math.PI * 2)
    ctx.fill()
  } else if (type === 'ember') {
    // Sharp glowing spark
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 48)
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
    grad.addColorStop(0.35, 'rgba(255, 213, 79, 0.9)')
    grad.addColorStop(0.7, 'rgba(255, 112, 67, 0.4)')
    grad.addColorStop(1.0, 'rgba(255, 87, 34, 0.0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(64, 64, 48, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // Soft turbulent smoke puff (opaque dark charcoal core fading to dark umber)
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60)
    grad.addColorStop(0, 'rgba(22, 19, 18, 0.96)') // Dense dark charcoal
    grad.addColorStop(0.35, 'rgba(38, 33, 30, 0.88)') // Dark grey-brown
    grad.addColorStop(0.7, 'rgba(60, 52, 46, 0.55)') // Smoky umber
    grad.addColorStop(1.0, 'rgba(60, 52, 46, 0.0)')
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

/**
 * Heat Distortion Shimmer Plane directly above active fire
 * Cheap animated wave refraction plane (High tier only).
 */
function HeatShimmer({ visible = true, position = [0, 2.5, 0] }) {
  const meshRef = useRef(null)

  const shimmerMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.x += sin(pos.y * 5.0 + uTime * 12.0) * 0.06;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float wave = sin(vUv.y * 18.0 - uTime * 10.0) * 0.5 + 0.5;
          float mask = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
          mask *= smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
          gl_FragColor = vec4(1.0, 0.85, 0.6, mask * wave * 0.12);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
  }, [])

  useFrame(({ clock }) => {
    if (shimmerMaterial.uniforms) {
      shimmerMaterial.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  if (!visible) return null

  return (
    <mesh ref={meshRef} position={position} material={shimmerMaterial}>
      <planeGeometry args={[4.5, 3.5, 12, 12]} />
    </mesh>
  )
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

    // 1. Point Light Flicker
    if (lightRef.current && hasPiles) {
      if (isBurning) {
        const flicker = Math.sin(elapsed * 22) * 0.3 + Math.cos(elapsed * 37) * 0.2 + 1.2
        lightRef.current.intensity = flicker * (activePilesList.length * 1.8)
        const lead = activePilesList[0]
        lightRef.current.position.set(lead.x, 2.2, lead.z)
      } else {
        lightRef.current.intensity = 0
      }
    }

    // 2. Fire Particles (Core, Body, Tips)
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
            const rad = Math.random() * 0.75
            p.x = pile.x + Math.cos(angle) * rad
            p.y = 0.6 + Math.random() * 0.8
            p.z = pile.z + Math.sin(angle) * rad
            p.vx = (Math.random() - 0.5) * 0.45 + windX * 0.2
            p.vy = 2.0 + Math.random() * 1.8
            p.vz = (Math.random() - 0.5) * 0.45 + windZ * 0.2
          }

          p.x += p.vx * delta
          p.y += p.vy * delta
          p.z += p.vz * delta

          const progress = p.life / p.maxLife
          const size = Math.max(0.4, Math.sin(progress * Math.PI) * 1.6 + 0.45)

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
            p.x = pile.x + (Math.random() - 0.5) * 1.2
            p.y = 0.9 + Math.random() * 0.6
            p.z = pile.z + (Math.random() - 0.5) * 1.2
            p.vx = (Math.random() - 0.5) * 0.8 + windX * 0.8
            p.vy = 2.8 + Math.random() * 2.2
            p.vz = (Math.random() - 0.5) * 0.8 + windZ * 0.8
          }

          p.x += p.vx * delta + Math.sin(elapsed * 8 + i) * 0.02
          p.y += p.vy * delta
          p.z += p.vz * delta + Math.cos(elapsed * 8 + i) * 0.02

          const progress = p.life / p.maxLife
          const size = Math.max(0.12, (1.0 - progress) * 0.38 + 0.1)

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
            p.x = pile.x + (Math.random() - 0.5) * 1.5
            p.y = 1.3 + Math.random() * 0.7
            p.z = pile.z + (Math.random() - 0.5) * 1.5
            p.vx = (Math.random() - 0.5) * 0.4
            p.vy = 1.4 + Math.random() * 0.95
            p.vz = (Math.random() - 0.5) * 0.4
          }

          const progress = p.life / p.maxLife
          p.x += (p.vx + smokeDriftX * progress * 2.0) * delta
          p.y += (p.vy * 0.88 + Math.sin(progress * Math.PI) * 0.45) * delta
          p.z += (p.vz + smokeDriftZ * progress * 2.8) * delta

          // Expands naturally into thick billowing clouds drifting towards the village
          const size = Math.max(1.4, 1.6 + progress * 6.5)

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
      {/* 1. Flickering Point Light (rich orange flame illuminating surroundings) */}
      <pointLight
        ref={lightRef}
        color="#FF6D00"
        intensity={0}
        distance={24}
        decay={2}
      />

      {/* 2. Layered Fire Particles with Additive Blending and Billboarding */}
      <instancedMesh
        ref={fireMeshRef}
        args={[undefined, undefined, 320]}
        frustumCulled={false}
        depthWrite={false}
      >
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial
          map={fireTexture}
          transparent
          blending={THREE.AdditiveBlending}
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
        <planeGeometry args={[0.5, 0.5]} />
        <meshBasicMaterial
          map={emberTexture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* 4. Dense Smoky Plume with Normal Blending and Billboarding */}
      <instancedMesh
        ref={smokeMeshRef}
        args={[undefined, undefined, 320]}
        frustumCulled={false}
        depthWrite={false}
      >
        <planeGeometry args={[2.2, 2.2]} />
        <meshBasicMaterial
          map={smokeTexture}
          transparent
          blending={THREE.NormalBlending}
          opacity={0.86}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* 5. Heat Distortion Shimmer (High Tier Only) */}
      {isBurning && qualityConfig.heatShimmer && (
        <HeatShimmer
          position={[leadPile.x, 2.8, leadPile.z]}
          visible={Boolean(qualityConfig.heatShimmer)}
        />
      )}
    </group>
  )
}
