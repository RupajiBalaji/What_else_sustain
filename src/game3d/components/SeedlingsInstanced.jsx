import React, { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

const SEEDLING_COUNT = 160

export default function SeedlingsInstanced() {
  const { activeAlternative, alternativeProgress, isFieldBurnt, quality } = useGame3D()
  const meshRef = useRef(null)

  const isVisible =
    !isFieldBurnt &&
    (activeAlternative === 'happy_seeder' ||
      activeAlternative === 'mulch' ||
      activeAlternative === 'compost')

  useLayoutEffect(() => {
    if (!meshRef.current) return
    const dummy = new THREE.Object3D()
    let idx = 0

    // Rows matching the field in front of tractor path
    const rows = 10
    const cols = 16
    const xStart = -20
    const zStart = 8
    const xStep = 24 / rows
    const zStep = 22 / cols

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx >= SEEDLING_COUNT) break
        const x = xStart + r * xStep + (Math.sin(r + c * 2) * 0.15)
        const z = zStart + c * zStep + (Math.cos(r * 2 + c) * 0.15)
        const targetScale = 0.25 + (Math.sin(r * 3 + c) * 0.05)

        dummy.position.set(x, 0.15, z)
        dummy.scale.set(targetScale, targetScale * 1.5, targetScale)
        dummy.rotation.set(0, r * 0.5 + c * 0.3, 0)
        dummy.updateMatrix()

        meshRef.current.setMatrixAt(idx, dummy.matrix)
        idx++
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [])

  // Grow seedlings up as alternative progresses
  useFrame(() => {
    if (!meshRef.current || !isVisible) return
    const currentScale = Math.min(1.0, alternativeProgress * 1.3)
    meshRef.current.scale.set(1, currentScale, 1)
  })

  if (!isVisible) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, SEEDLING_COUNT]}
      castShadow={quality === 'high'}
      receiveShadow={false}
    >
      <coneGeometry args={[0.14, 0.45, 4]} />
      <meshStandardMaterial
        color="#4CAF50"
        roughness={0.6}
        metalness={0.1}
        emissive="#2E7D32"
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  )
}
