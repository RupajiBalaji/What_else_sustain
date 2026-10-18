import React, { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGame3D } from '../context/Game3DContext'

// 10 Village Houses in the distance along the north edge of the farm
export const VILLAGE_HOUSES_DATA = [
  { x: -15, z: 42, rot: 0.2, s: 1.0 },
  { x: -8, z: 46, rot: -0.1, s: 1.1 },
  { x: 0, z: 43, rot: 0.4, s: 0.95 },
  { x: 8, z: 48, rot: -0.3, s: 1.2 },
  { x: 16, z: 44, rot: 0.1, s: 1.0 },
  { x: 24, z: 47, rot: -0.2, s: 1.1 },
  { x: -18, z: 52, rot: 0.3, s: 1.1 },
  { x: -4, z: 54, rot: -0.15, s: 1.0 },
  { x: 10, z: 55, rot: 0.25, s: 1.15 },
  { x: 20, z: 56, rot: -0.4, s: 1.05 }
]

// Export collision boundaries for the village buildings
export const VILLAGE_COLLIDERS = VILLAGE_HOUSES_DATA.map((h) => ({
  minX: h.x - 3.0 * h.s,
  maxX: h.x + 3.0 * h.s,
  minZ: h.z - 2.5 * h.s,
  maxZ: h.z + 2.5 * h.s
}))

export default function VillageHousesInstanced() {
  const { quality } = useGame3D()
  const wallRef = useRef(null)
  const roofRef = useRef(null)

  const isHigh = quality === 'high'
  const count = VILLAGE_HOUSES_DATA.length

  useLayoutEffect(() => {
    if (!wallRef.current || !roofRef.current) return
    const dummy = new THREE.Object3D()

    VILLAGE_HOUSES_DATA.forEach((h, i) => {
      // 1. House Wall Base
      dummy.position.set(h.x, 1.5 * h.s, h.z)
      dummy.scale.set(h.s, h.s, h.s)
      dummy.rotation.set(0, h.rot, 0)
      dummy.updateMatrix()
      wallRef.current.setMatrixAt(i, dummy.matrix)

      // 2. House Roof
      dummy.position.set(h.x, 3.2 * h.s, h.z)
      dummy.scale.set(h.s, h.s, h.s)
      dummy.rotation.set(0, h.rot + Math.PI / 4, 0)
      dummy.updateMatrix()
      roofRef.current.setMatrixAt(i, dummy.matrix)
    })

    wallRef.current.instanceMatrix.needsUpdate = true
    roofRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <group name="VillageHousesGroup">
      {/* Village House Walls */}
      <instancedMesh
        ref={wallRef}
        args={[undefined, undefined, count]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <boxGeometry args={[4.8, 3.0, 3.8]} />
        <meshStandardMaterial color="#E0D7C6" roughness={0.9} />
      </instancedMesh>

      {/* Village House Roofs (warm reddish terracotta / thatch) */}
      <instancedMesh
        ref={roofRef}
        args={[undefined, undefined, count]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <coneGeometry args={[3.6, 1.6, 4]} />
        <meshStandardMaterial color="#D35400" roughness={0.8} />
      </instancedMesh>
    </group>
  )
}
