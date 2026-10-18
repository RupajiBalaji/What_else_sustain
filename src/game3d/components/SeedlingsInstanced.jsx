import React, { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

export default function SeedlingsInstanced() {
  const { activeAlternative, alternativeProgress, isFieldBurnt, quality, showComparison } = useGame3D()
  const meshRef = useRef(null)
  const isHigh = quality === 'high'
  const count = isHigh ? 160 : 90

  // Visible after ANY sustainable alternative or during before/after comparison
  const isVisible =
    !isFieldBurnt &&
    (activeAlternative !== null || showComparison)

  useLayoutEffect(() => {
    if (!meshRef.current) return
    const dummy = new THREE.Object3D()
    let idx = 0

    // Rows matching the field
    const rows = isHigh ? 10 : 8
    const cols = isHigh ? 16 : 11
    const xStart = -22
    const zStart = 8
    const xStep = 24 / rows
    const zStep = 22 / cols

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx >= count) break
        const x = xStart + r * xStep + (Math.sin(r + c * 2) * 0.15)
        const z = zStart + c * zStep + (Math.cos(r * 2 + c) * 0.15)
        const targetScale = 0.28 + (Math.sin(r * 3 + c) * 0.06)

        dummy.position.set(x, 0.15, z)
        dummy.scale.set(targetScale, targetScale * 1.6, targetScale)
        dummy.rotation.set(0, r * 0.5 + c * 0.3, 0)
        dummy.updateMatrix()

        meshRef.current.setMatrixAt(idx, dummy.matrix)
        idx++
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [count, isHigh])

  // Grow seedlings up as alternative progresses or display fully grown in comparison
  useFrame(() => {
    if (!meshRef.current || !isVisible) return
    const currentScale = showComparison ? 1.0 : Math.min(1.0, (alternativeProgress || 0) * 1.4)
    meshRef.current.scale.set(1, Math.max(0.01, currentScale), 1)
  })

  if (!isVisible) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow={isHigh}
      receiveShadow={false}
      name="SeedlingsInstanced"
    >
      <coneGeometry args={[0.16, 0.48, 5]} />
      <meshStandardMaterial
        color="#43A047"
        roughness={0.55}
        metalness={0.08}
        emissive="#1B5E20"
        emissiveIntensity={0.25}
      />
    </instancedMesh>
  )
}
