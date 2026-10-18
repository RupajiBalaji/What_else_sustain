import React, { useMemo, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGame3D } from '../context/Game3DContext'
import { useModelAvailability } from '../assets/ModelLoader'

// 10 Village Houses in the distance along the north edge with 3 distinct architectural variants
export const VILLAGE_HOUSES_DATA = [
  { id: 'h1', variant: 1, x: -15, z: 42, rot: 0.2, s: 1.0, wallColor: '#E0D7C6', roofColor: '#D35400' },
  { id: 'h2', variant: 2, x: -8, z: 46, rot: -0.1, s: 1.1, wallColor: '#F5EEF8', roofColor: '#78909C' },
  { id: 'h3', variant: 3, x: 0, z: 43, rot: 0.4, s: 0.95, wallColor: '#FEF9E7', roofColor: '#D4AC0D' },
  { id: 'h4', variant: 1, x: 8, z: 48, rot: -0.3, s: 1.2, wallColor: '#EBF5FB', roofColor: '#C0392B' },
  { id: 'h5', variant: 2, x: 16, z: 44, rot: 0.1, s: 1.0, wallColor: '#EAFAF1', roofColor: '#607D8B' },
  { id: 'h6', variant: 3, x: 24, z: 47, rot: -0.2, s: 1.1, wallColor: '#FDFEFE', roofColor: '#B7950B' },
  { id: 'h7', variant: 1, x: -18, z: 52, rot: 0.3, s: 1.1, wallColor: '#FDEDEC', roofColor: '#E65100' },
  { id: 'h8', variant: 2, x: -4, z: 54, rot: -0.15, s: 1.0, wallColor: '#F4F6F6', roofColor: '#546E7A' },
  { id: 'h9', variant: 3, x: 10, z: 55, rot: 0.25, s: 1.15, wallColor: '#F9EBEA', roofColor: '#D4AC0D' },
  { id: 'h10', variant: 1, x: 20, z: 56, rot: -0.4, s: 1.05, wallColor: '#E8F8F5', roofColor: '#C0392B' }
]

// Export collision boundaries for the village buildings
export const VILLAGE_COLLIDERS = VILLAGE_HOUSES_DATA.map((h) => ({
  minX: h.x - 3.0 * h.s,
  maxX: h.x + 3.0 * h.s,
  minZ: h.z - 2.5 * h.s,
  maxZ: h.z + 2.5 * h.s
}))

export default function VillageHousesInstanced() {
  const { qualityConfig } = useGame3D()
  const isHigh = qualityConfig.shadows

  const wallRef1 = useRef(null)
  const roofRef1 = useRef(null)
  const wallRef2 = useRef(null)
  const roofRef2 = useRef(null)
  const wallRef3 = useRef(null)
  const roofRef3 = useRef(null)

  const housesV1 = useMemo(() => VILLAGE_HOUSES_DATA.filter((h) => h.variant === 1), [])
  const housesV2 = useMemo(() => VILLAGE_HOUSES_DATA.filter((h) => h.variant === 2), [])
  const housesV3 = useMemo(() => VILLAGE_HOUSES_DATA.filter((h) => h.variant === 3), [])

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()

    // Variant 1: Pitched Terracotta Roof
    if (wallRef1.current && roofRef1.current) {
      housesV1.forEach((h, i) => {
        dummy.position.set(h.x, 1.5 * h.s, h.z)
        dummy.scale.set(h.s, h.s, h.s)
        dummy.rotation.set(0, h.rot, 0)
        dummy.updateMatrix()
        wallRef1.current.setMatrixAt(i, dummy.matrix)

        dummy.position.set(h.x, 3.2 * h.s, h.z)
        dummy.scale.set(h.s, h.s, h.s)
        dummy.rotation.set(0, h.rot + Math.PI / 4, 0)
        dummy.updateMatrix()
        roofRef1.current.setMatrixAt(i, dummy.matrix)
      })
      wallRef1.current.instanceMatrix.needsUpdate = true
      roofRef1.current.instanceMatrix.needsUpdate = true
    }

    // Variant 2: Flat Terrace Roof
    if (wallRef2.current && roofRef2.current) {
      housesV2.forEach((h, i) => {
        dummy.position.set(h.x, 1.6 * h.s, h.z)
        dummy.scale.set(h.s, h.s, h.s)
        dummy.rotation.set(0, h.rot, 0)
        dummy.updateMatrix()
        wallRef2.current.setMatrixAt(i, dummy.matrix)

        dummy.position.set(h.x, 3.15 * h.s, h.z)
        dummy.scale.set(h.s, h.s, h.s)
        dummy.rotation.set(0, h.rot, 0)
        dummy.updateMatrix()
        roofRef2.current.setMatrixAt(i, dummy.matrix)
      })
      wallRef2.current.instanceMatrix.needsUpdate = true
      roofRef2.current.instanceMatrix.needsUpdate = true
    }

    // Variant 3: Thatched Veranda Roof
    if (wallRef3.current && roofRef3.current) {
      housesV3.forEach((h, i) => {
        dummy.position.set(h.x, 1.4 * h.s, h.z)
        dummy.scale.set(h.s, h.s, h.s)
        dummy.rotation.set(0, h.rot, 0)
        dummy.updateMatrix()
        wallRef3.current.setMatrixAt(i, dummy.matrix)

        dummy.position.set(h.x, 3.0 * h.s, h.z)
        dummy.scale.set(h.s, h.s, h.s)
        dummy.rotation.set(0, h.rot + Math.PI / 4, 0)
        dummy.updateMatrix()
        roofRef3.current.setMatrixAt(i, dummy.matrix)
      })
      wallRef3.current.instanceMatrix.needsUpdate = true
      roofRef3.current.instanceMatrix.needsUpdate = true
    }
  }, [housesV1, housesV2, housesV3])

  return (
    <group name="VillageHousesGroup">
      {/* Variant 1: Terracotta Pitched Roof Houses */}
      <instancedMesh
        ref={wallRef1}
        args={[undefined, undefined, housesV1.length]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <boxGeometry args={[4.8, 3.0, 3.8]} />
        <meshStandardMaterial color="#E0D7C6" roughness={0.88} />
      </instancedMesh>
      <instancedMesh
        ref={roofRef1}
        args={[undefined, undefined, housesV1.length]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <coneGeometry args={[3.6, 1.8, 4]} />
        <meshStandardMaterial color="#D35400" roughness={0.75} />
      </instancedMesh>

      {/* Variant 2: Flat Terrace Roof Houses */}
      <instancedMesh
        ref={wallRef2}
        args={[undefined, undefined, housesV2.length]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <boxGeometry args={[5.2, 3.2, 4.2]} />
        <meshStandardMaterial color="#F5EEF8" roughness={0.85} />
      </instancedMesh>
      <instancedMesh
        ref={roofRef2}
        args={[undefined, undefined, housesV2.length]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <boxGeometry args={[5.4, 0.35, 4.4]} />
        <meshStandardMaterial color="#546E7A" roughness={0.9} />
      </instancedMesh>

      {/* Variant 3: Thatched Veranda Roof Houses */}
      <instancedMesh
        ref={wallRef3}
        args={[undefined, undefined, housesV3.length]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <boxGeometry args={[4.4, 2.8, 3.6]} />
        <meshStandardMaterial color="#FEF9E7" roughness={0.92} />
      </instancedMesh>
      <instancedMesh
        ref={roofRef3}
        args={[undefined, undefined, housesV3.length]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <coneGeometry args={[3.8, 1.4, 4]} />
        <meshStandardMaterial color="#D4AC0D" roughness={0.9} />
      </instancedMesh>
    </group>
  )
}
