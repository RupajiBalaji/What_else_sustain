import React, { useMemo, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

// Pre-calculated seed positions for grass tufts along roads, canal, and field edges
function generateTuftPositions(count) {
  const positions = []
  const prng = (seed) => {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  let s = 42

  for (let i = 0; i < count; i++) {
    // 6 distinct greenery zones:
    // 0: East road verge (X ~ 9 to 11.5)
    // 1: West road verge (X ~ 1.0 to 3.2)
    // 2: Canal embankment (X ~ -36 to -39)
    // 3: North field edge towards village (Z ~ 36 to 39, X ~ -30 to 2)
    // 4: South field edge towards farmhouse (Z ~ 3.5 to 5.5, X ~ -30 to 2)
    // 5: Trees & Farmhouse perimeter
    const zone = i % 6
    let x = 0
    let z = 0

    if (zone === 0) {
      x = 9.2 + prng(s++) * 2.2
      z = -15 + prng(s++) * 55
    } else if (zone === 1) {
      x = 1.0 + prng(s++) * 2.0
      z = -15 + prng(s++) * 55
    } else if (zone === 2) {
      x = -38.5 + prng(s++) * 2.8
      z = -40 + prng(s++) * 80
    } else if (zone === 3) {
      x = -30 + prng(s++) * 32
      z = 36.5 + prng(s++) * 2.5
    } else if (zone === 4) {
      x = -30 + prng(s++) * 32
      z = 3.5 + prng(s++) * 2.0
    } else {
      // Around trees and farmhouse
      const angle = prng(s++) * Math.PI * 2
      const radius = 8 + prng(s++) * 22
      x = 18 + Math.cos(angle) * radius
      z = -10 + Math.sin(angle) * radius
    }

    const scale = 0.75 + prng(s++) * 0.55
    const rotY = prng(s++) * Math.PI
    positions.push({ x, z, scale, rotY })
  }

  return positions
}

// 22 Pre-defined green grass carpet patch centers along roads, edges and canal
const GRASS_PATCHES = [
  // Along canal
  { x: -37.5, z: -25, sx: 2.5, sz: 3.5, rot: 0.1 },
  { x: -38.0, z: -10, sx: 2.2, sz: 4.0, rot: -0.2 },
  { x: -37.5, z: 5, sx: 2.4, sz: 3.2, rot: 0.3 },
  { x: -38.0, z: 20, sx: 2.6, sz: 4.2, rot: -0.1 },
  { x: -37.5, z: 32, sx: 2.2, sz: 3.0, rot: 0.2 },
  // West road verge
  { x: 2.2, z: -5, sx: 1.8, sz: 3.2, rot: 0.15 },
  { x: 1.8, z: 12, sx: 2.0, sz: 3.5, rot: -0.1 },
  { x: 2.4, z: 24, sx: 1.9, sz: 3.8, rot: 0.2 },
  { x: 1.6, z: 36, sx: 2.2, sz: 3.0, rot: -0.25 },
  // East road verge
  { x: 10.2, z: -8, sx: 2.2, sz: 3.4, rot: -0.1 },
  { x: 9.8, z: 8, sx: 2.0, sz: 3.6, rot: 0.2 },
  { x: 10.5, z: 22, sx: 2.4, sz: 3.8, rot: -0.15 },
  { x: 9.6, z: 34, sx: 2.1, sz: 3.2, rot: 0.1 },
  // Field north boundary
  { x: -22, z: 37.5, sx: 3.5, sz: 2.0, rot: 0.05 },
  { x: -10, z: 37.8, sx: 3.8, sz: 2.2, rot: -0.1 },
  { x: -2, z: 37.2, sx: 3.0, sz: 1.9, rot: 0.15 },
  // Field south boundary
  { x: -20, z: 4.2, sx: 3.2, sz: 1.8, rot: -0.2 },
  { x: -8, z: 4.5, sx: 3.6, sz: 2.0, rot: 0.1 }
]

export default function GrassTufts() {
  const { quality, windState, isFieldBurnt } = useGame3D()
  const isHigh = quality === 'high'
  const count = isHigh ? 210 : 105
  const tuftsRef = useRef(null)
  const patchRef = useRef(null)

  const positions = useMemo(() => generateTuftPositions(count), [count])

  // Crossed double-plane geometry for lightweight, 3D-volumetric grass tufts
  const geometry = useMemo(() => {
    const g1 = new THREE.PlaneGeometry(0.55, 0.45)
    g1.translate(0, 0.22, 0)
    const g2 = new THREE.PlaneGeometry(0.55, 0.45)
    g2.rotateY(Math.PI / 2)
    g2.translate(0, 0.22, 0)

    const merged = new THREE.BufferGeometry()
    const pos1 = g1.attributes.position.array
    const pos2 = g2.attributes.position.array
    const norm1 = g1.attributes.normal.array
    const norm2 = g2.attributes.normal.array

    const positionsArr = new Float32Array(pos1.length + pos2.length)
    positionsArr.set(pos1)
    positionsArr.set(pos2, pos1.length)

    const normalsArr = new Float32Array(norm1.length + norm2.length)
    normalsArr.set(norm1)
    normalsArr.set(norm2, norm1.length)

    const indices = []
    const idx1 = g1.index.array
    const idx2 = g2.index.array
    for (let i = 0; i < idx1.length; i++) indices.push(idx1[i])
    const offset = g1.attributes.position.count
    for (let i = 0; i < idx2.length; i++) indices.push(idx2[i] + offset)

    merged.setAttribute('position', new THREE.BufferAttribute(positionsArr, 3))
    merged.setAttribute('normal', new THREE.BufferAttribute(normalsArr, 3))
    merged.setIndex(indices)
    return merged
  }, [])

  // Position instances
  useLayoutEffect(() => {
    if (!tuftsRef.current) return
    const dummy = new THREE.Object3D()

    positions.forEach((p, i) => {
      dummy.position.set(p.x, 0, p.z)
      dummy.scale.set(p.scale, p.scale, p.scale)
      dummy.rotation.set(0, p.rotY, 0)
      dummy.updateMatrix()
      tuftsRef.current.setMatrixAt(i, dummy.matrix)
    })
    tuftsRef.current.instanceMatrix.needsUpdate = true

    if (patchRef.current) {
      const activePatches = isHigh ? GRASS_PATCHES : GRASS_PATCHES.slice(0, 10)
      activePatches.forEach((patch, idx) => {
        dummy.position.set(patch.x, 0.015, patch.z)
        dummy.rotation.set(-Math.PI / 2, 0, patch.rot)
        dummy.scale.set(patch.sx, patch.sz, 1)
        dummy.updateMatrix()
        patchRef.current.setMatrixAt(idx, dummy.matrix)
      })
      patchRef.current.instanceMatrix.needsUpdate = true
    }
  }, [positions, isHigh])

  // Subtle wind sway animation in useFrame
  useFrame(({ clock }) => {
    if (!tuftsRef.current) return
    const t = clock.getElapsedTime()
    const windSpeed = windState?.speedMs || 3.0
    const swayFactor = 0.08 * (windSpeed / 3.0)

    const dummy = new THREE.Object3D()
    const matrix = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    const updateLimit = isHigh ? count : 40

    for (let i = 0; i < updateLimit; i++) {
      tuftsRef.current.getMatrixAt(i, matrix)
      matrix.decompose(pos, quat, scale)

      const sway = Math.sin(t * 2.2 + i * 0.7) * swayFactor
      dummy.position.copy(pos)
      dummy.rotation.set(sway * 0.7, positions[i].rotY, sway)
      dummy.scale.copy(scale)
      dummy.updateMatrix()

      tuftsRef.current.setMatrixAt(i, dummy.matrix)
    }

    tuftsRef.current.instanceMatrix.needsUpdate = true
  })

  const patchCount = isHigh ? GRASS_PATCHES.length : 10

  return (
    <group name="GrassAndPatchesGroup">
      {/* 1. Low-Poly Flat Green Grass Carpet Patches along borders, road, and canal */}
      <instancedMesh
        ref={patchRef}
        args={[undefined, undefined, patchCount]}
        receiveShadow={false}
      >
        <circleGeometry args={[1, 7]} />
        <meshStandardMaterial
          color={isFieldBurnt ? '#4E5B28' : '#43A047'} // Lush vibrant green turf
          roughness={0.95}
        />
      </instancedMesh>

      {/* 2. Volumetric Instanced Grass Tufts */}
      <instancedMesh
        ref={tuftsRef}
        args={[geometry, undefined, count]}
        receiveShadow={isHigh}
        name="GrassTuftsInstanced"
      >
        <meshStandardMaterial
          color={isFieldBurnt ? '#5D503C' : '#558B2F'} // Lush green olive tufts
          roughness={0.88}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  )
}
