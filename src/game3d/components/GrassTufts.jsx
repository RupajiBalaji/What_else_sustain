import React, { useMemo, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

// Pre-calculated seed positions for grass tufts along roads, canal, and borders
function generateTuftPositions(count) {
  const positions = []
  const prng = (seed) => {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  let s = 42

  for (let i = 0; i < count; i++) {
    // 4 zones:
    // 0: East road verge (X ~ 9 to 11.5, Z ~ -15 to 40)
    // 1: West road verge (X ~ 0.5 to 2.5, Z ~ -15 to 40)
    // 2: Canal embankment (X ~ -36 to -39, Z ~ -40 to 40)
    // 3: Farmhouse & field perimeter (Scattered)
    const zone = i % 4
    let x = 0
    let z = 0

    if (zone === 0) {
      x = 9.2 + prng(s++) * 2.2
      z = -15 + prng(s++) * 55
    } else if (zone === 1) {
      x = 1.0 + prng(s++) * 2.0
      z = -15 + prng(s++) * 55
    } else if (zone === 2) {
      x = -38.5 + prng(s++) * 3.0
      z = -40 + prng(s++) * 80
    } else {
      // Around trees and farmhouse
      const angle = prng(s++) * Math.PI * 2
      const radius = 10 + prng(s++) * 25
      x = 18 + Math.cos(angle) * radius
      z = -10 + Math.sin(angle) * radius
    }

    const scale = 0.7 + prng(s++) * 0.6
    const rotY = prng(s++) * Math.PI
    positions.push({ x, z, scale, rotY })
  }

  return positions
}

export default function GrassTufts() {
  const { quality, windState, isFieldBurnt } = useGame3D()
  const isHigh = quality === 'high'
  const count = isHigh ? 180 : 90
  const tuftsRef = useRef(null)

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
  }, [positions])

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

    // Sway first 40 tufts on low or all on high for maximum FPS efficiency
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

  return (
    <instancedMesh
      ref={tuftsRef}
      args={[geometry, undefined, count]}
      receiveShadow={isHigh}
      name="GrassTuftsInstanced"
    >
      <meshStandardMaterial
        color={isFieldBurnt ? '#5D503C' : '#7E9848'} // Warm olive harvest green or dry burnt verge
        roughness={0.9}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  )
}
