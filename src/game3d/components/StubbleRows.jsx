import React, { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGame3D } from '../context/Game3DContext'

export default function StubbleRows() {
  const { quality } = useGame3D()
  const meshRef = useRef(null)

  // Rows configuration: field zone between X: -10 to -34, Z: -20 to 20
  const rows = quality === 'high' ? 14 : 8
  const cols = quality === 'high' ? 16 : 10
  const count = rows * cols

  useLayoutEffect(() => {
    if (!meshRef.current) return
    const dummy = new THREE.Object3D()
    let idx = 0

    const xStart = -34
    const zStart = -20
    const xStep = 24 / rows
    const zStep = 40 / cols

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = xStart + r * xStep + (Math.sin(r + c) * 0.2)
        const z = zStart + c * zStep + (Math.cos(r * 2 + c) * 0.2)
        const height = 0.35 + (Math.sin(r * 3 + c) * 0.1)

        dummy.position.set(x, height / 2, z)
        dummy.scale.set(0.2, height, 0.2)
        dummy.rotation.y = (r * 0.4 + c * 0.7)
        dummy.updateMatrix()

        meshRef.current.setMatrixAt(idx, dummy.matrix)
        idx++
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [rows, cols])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow={quality === 'high'}
      receiveShadow={false}
    >
      <cylinderGeometry args={[0.08, 0.12, 1, 4]} />
      <meshStandardMaterial
        color="#D4A359" // Harvested golden stubble stalk
        roughness={0.9}
      />
    </instancedMesh>
  )
}
