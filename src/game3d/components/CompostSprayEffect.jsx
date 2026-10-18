import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

const MIST_PARTICLE_COUNT = 80

export default function CompostSprayEffect() {
  const { activeAlternative, alternativeProgress, quality } = useGame3D()
  const mistMeshRef = useRef(null)

  const isActive = activeAlternative === 'compost'

  // Particles spraying from farmer hand towards nearby pile
  const mistParticles = useMemo(() => {
    return Array.from({ length: MIST_PARTICLE_COUNT }, () => ({
      x: 0,
      y: 1.2,
      z: 8.5,
      vx: (Math.random() - 0.5) * 0.8 - 0.3,
      vy: -1.4 - Math.random() * 0.8,
      vz: 1.5 + Math.random() * 1.2,
      life: Math.random(),
      maxLife: 0.7 + Math.random() * 0.3
    }))
  }, [])

  useFrame((_, delta) => {
    if (!mistMeshRef.current || !isActive) return
    const dummy = new THREE.Object3D()

    for (let i = 0; i < MIST_PARTICLE_COUNT; i++) {
      const p = mistParticles[i]
      p.life += delta

      if (p.life >= p.maxLife) {
        // Reset at player spray nozzle
        p.x = 0.45 + (Math.random() - 0.5) * 0.1
        p.y = 1.0 + (Math.random() - 0.5) * 0.1
        p.z = 8.4 + (Math.random() - 0.5) * 0.1
        p.vx = (Math.random() - 0.5) * 0.9 - 0.4
        p.vy = -1.2 - Math.random() * 0.6
        p.vz = 1.6 + Math.random() * 1.2
        p.life = 0
      } else {
        p.x += p.vx * delta
        p.y += p.vy * delta
        p.z += p.vz * delta

        const prog = p.life / p.maxLife
        const scale = 0.08 + prog * 0.2
        dummy.position.set(p.x, p.y, p.z)
        dummy.scale.set(scale, scale, scale)
        dummy.updateMatrix()
        mistMeshRef.current.setMatrixAt(i, dummy.matrix)
      }
    }
    mistMeshRef.current.instanceMatrix.needsUpdate = true
  })

  if (!isActive) return null

  return (
    <group name="CompostSpraySystem">
      {/* 1. Fine Decomposer Liquid Spray Mist */}
      <instancedMesh
        ref={mistMeshRef}
        args={[undefined, undefined, MIST_PARTICLE_COUNT]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.3, 6, 6]} />
        <meshBasicMaterial
          color="#81D4FA"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </instancedMesh>

      {/* 2. Organic Compost Pit Base */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-3.2, 0.03, 12.5]}
        receiveShadow={quality === 'high'}
      >
        <circleGeometry args={[2.5, 16]} />
        <meshStandardMaterial
          color="#2E1E11" // Dark rich decomposed compost
          roughness={0.98}
        />
      </mesh>
    </group>
  )
}
