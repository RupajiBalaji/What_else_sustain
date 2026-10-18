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
    // Soft turbulent smoke puff
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60)
    grad.addColorStop(0, 'rgba(80, 70, 65, 0.75)')
    grad.addColorStop(0.4, 'rgba(60, 52, 48, 0.5)')
    grad.addColorStop(0.75, 'rgba(45, 40, 38, 0.2)')
    grad.addColorStop(1.0, 'rgba(40, 36, 35, 0.0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(64, 64, 60, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.generateMipmaps = true
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
    return Array.from({ length: 260 }, () => ({
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
  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime()
    const windRad = ((windState?.directionDeg ?? 75) * Math.PI) / 180
    const windSpeed = windState?.speedMs ?? 3.8
    const windX = Math.sin(windRad) * windSpeed * 0.35
    const windZ = Math.cos(windRad) * windSpeed * 0.35

    const activePilesList = STRAW_PILES_DATA.filter((p) => ignitedPiles.includes(p.id))
    const hasPiles = activePilesList.length > 0

    // 1. Point Light Flicker
    if (lightRef.current && hasPiles) {
      if (isBurning) {
        const flicker = Math.sin(elapsed * 22) * 0.3 + Math.cos(elapsed * 37) * 0.2 + 1.2
        lightRef.current.intensity = flicker * (activePilesList.length * 1.5)
        const lead = activePilesList[0]
        lightRef.current.position.set(lead.x, 1.8, lead.z)
      } else {
        lightRef.current.intensity = 0
      }
    }

    // 2. Fire Particles (Core, Body, Tips)
    if (fireMeshRef.current) {
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
            const rad = Math.random() * 0.8
            p.x = pile.x + Math.cos(angle) * rad
            p.y = 0.2 + Math.random() * 0.3
            p.z = pile.z + Math.sin(angle) * rad
            p.vx = (Math.random() - 0.5) * 0.4 + windX * 0.2
            p.vy = 2.0 + Math.random() * 1.8
            p.vz = (Math.random() - 0.5) * 0.4 + windZ * 0.2
          }

          p.x += p.vx * delta
          p.y += p.vy * delta
          p.z += p.vz * delta

          const progress = p.life / p.maxLife
          const size = Math.sin(progress * Math.PI) * 1.4 + 0.3

          _particleDummy.position.set(p.x, p.y, p.z)
          _particleDummy.scale.set(size, size, size)
          _particleDummy.rotation.set(0, 0, progress * Math.PI)
          _particleDummy.updateMatrix()
          fireMeshRef.current.setMatrixAt(i, _particleDummy.matrix)
        })
        fireMeshRef.current.instanceMatrix.needsUpdate = true
      }
    }

    // 3. Embers
    if (emberMeshRef.current) {
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
            p.y = 0.5 + Math.random() * 0.5
            p.z = pile.z + (Math.random() - 0.5) * 1.2
            p.vx = (Math.random() - 0.5) * 0.8 + windX * 0.8
            p.vy = 2.5 + Math.random() * 2.2
            p.vz = (Math.random() - 0.5) * 0.8 + windZ * 0.8
          }

          p.x += p.vx * delta + Math.sin(elapsed * 8 + i) * 0.02
          p.y += p.vy * delta
          p.z += p.vz * delta + Math.cos(elapsed * 8 + i) * 0.02

          const progress = p.life / p.maxLife
          const size = (1.0 - progress) * 0.35 + 0.08

          _particleDummy.position.set(p.x, p.y, p.z)
          _particleDummy.scale.set(size, size, size)
          _particleDummy.updateMatrix()
          emberMeshRef.current.setMatrixAt(i, _particleDummy.matrix)
        })
        emberMeshRef.current.instanceMatrix.needsUpdate = true
      }
    }

    // 4. Smoke Plume Particles (expanding, fading, bending toward village)
    if (smokeMeshRef.current) {
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
            p.x = pile.x + (Math.random() - 0.5) * 1.4
            p.y = 1.0 + Math.random() * 0.6
            p.z = pile.z + (Math.random() - 0.5) * 1.4
            p.vx = windX * 0.5 + (Math.random() - 0.5) * 0.3
            p.vy = 1.2 + Math.random() * 1.0
            p.vz = windZ * 0.5 + (Math.random() - 0.5) * 0.3
          }

          const progress = p.life / p.maxLife
          p.x += (p.vx + windX * progress * 1.5) * delta
          p.y += p.vy * delta
          p.z += (p.vz + windZ * progress * 1.5) * delta

          // Expands as it rises
          const size = 0.8 + progress * 4.2

          _particleDummy.position.set(p.x, p.y, p.z)
          _particleDummy.scale.set(size, size, size)
          _particleDummy.rotation.set(0, 0, p.life * 0.4)
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

      {/* 2. Layered Fire Particles with Additive Blending */}
      <instancedMesh
        ref={fireMeshRef}
        args={[undefined, undefined, maxFire]}
        depthWrite={false}
      >
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial
          map={fireTexture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* 3. High Embers */}
      <instancedMesh
        ref={emberMeshRef}
        args={[undefined, undefined, maxEmbers]}
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

      {/* 4. Dense Smoky Plume */}
      <instancedMesh
        ref={smokeMeshRef}
        args={[undefined, undefined, maxSmoke]}
        depthWrite={false}
      >
        <planeGeometry args={[2.0, 2.0]} />
        <meshBasicMaterial
          map={smokeTexture}
          transparent
          opacity={0.42}
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
