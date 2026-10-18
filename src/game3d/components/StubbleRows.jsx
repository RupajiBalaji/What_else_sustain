import React, { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGame3D } from '../context/Game3DContext'

export default function StubbleRows() {
  const { quality, isFieldBurnt } = useGame3D()
  const meshRef = useRef(null)

  // Rows configuration: field zone in front of player start [0, 0, 8]
  const rows = quality === 'high' ? 14 : 8
  const cols = quality === 'high' ? 16 : 10
  const count = rows * cols

  useLayoutEffect(() => {
    if (!meshRef.current) return
    const dummy = new THREE.Object3D()
    let idx = 0

    const xStart = -25
    const zStart = 6
    const xStep = 30 / rows
    const zStep = 28 / cols

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = xStart + r * xStep + (Math.sin(r + c) * 0.2)
        const z = zStart + c * zStep + (Math.cos(r * 2 + c) * 0.2)
        const height = (isFieldBurnt ? 0.18 : 0.38) + (Math.sin(r * 3 + c) * 0.08)

        dummy.position.set(x, height / 2, z)
        dummy.scale.set(0.2, height, 0.2)
        dummy.rotation.y = (r * 0.4 + c * 0.7)
        dummy.updateMatrix()

        meshRef.current.setMatrixAt(idx, dummy.matrix)
        idx++
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [rows, cols, isFieldBurnt])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow={quality === 'high'}
      receiveShadow={false}
    >
      <cylinderGeometry args={[0.08, 0.12, 1, 4]} />
      <meshStandardMaterial
        color={isFieldBurnt ? '#1C1B1A' : '#D4A359'} // Charred black ash stubble or golden stalk
        roughness={0.95}
      />
    </instancedMesh>
  )
}
