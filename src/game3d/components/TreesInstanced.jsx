import React, { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { useModelAvailability } from '../assets/ModelLoader'
import { useGLTF } from '@react-three/drei'

// Pre-defined tree positions around the perimeter and roadside
export const TREE_POSITIONS = [
  // Along the riverbank (X = -36 to -38)
  { x: -37, z: -25, s: 1.3 },
  { x: -38, z: -15, s: 1.1 },
  { x: -37, z: -5, s: 1.4 },
  { x: -38, z: 5, s: 1.2 },
  { x: -36, z: 15, s: 1.3 },
  { x: -38, z: 25, s: 1.5 },
  // Around the farmhouse (X = 14 to 28, Z = -20 to -6)
  { x: 12, z: -20, s: 1.3 },
  { x: 26, z: -18, s: 1.4 },
  { x: 25, z: -6, s: 1.2 },
  { x: 10, z: -16, s: 1.1 },
  // Along the roadside towards the village (X = 12, Z = 10 to 35)
  { x: 12, z: 10, s: 1.2 },
  { x: 12, z: 22, s: 1.3 },
  { x: 11, z: 32, s: 1.4 },
  { x: 0, z: 34, s: 1.1 },
  { x: -14, z: 32, s: 1.3 }
]

/**
 * Procedural Instanced Trees Fallback
 */
function ProceduralTrees({ activeTrees, count, isHigh, windSpeed }) {
  const trunkRef = useRef(null)
  const foliageRef = useRef(null)

  useLayoutEffect(() => {
    if (!trunkRef.current || !foliageRef.current) return
    const dummy = new THREE.Object3D()

    activeTrees.forEach((t, i) => {
      // 1. Trunk
      dummy.position.set(t.x, (2.2 * t.s) / 2, t.z)
      dummy.scale.set(t.s, t.s, t.s)
      dummy.rotation.set(0, (i * 0.8), 0)
      dummy.updateMatrix()
      trunkRef.current.setMatrixAt(i, dummy.matrix)

      // 2. Foliage
      dummy.position.set(t.x, 3.2 * t.s, t.z)
      dummy.scale.set(t.s, t.s, t.s)
      dummy.updateMatrix()
      foliageRef.current.setMatrixAt(i, dummy.matrix)
    })

    trunkRef.current.instanceMatrix.needsUpdate = true
    foliageRef.current.instanceMatrix.needsUpdate = true
  }, [activeTrees])

  // Gentle wind sway in useFrame
  useFrame(({ clock }) => {
    if (!foliageRef.current) return
    const time = clock.getElapsedTime()
    const swayFactor = 0.04 * (windSpeed / 3.0)

    const dummy = new THREE.Object3D()
    const matrix = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    for (let i = 0; i < count; i++) {
      foliageRef.current.getMatrixAt(i, matrix)
      matrix.decompose(pos, quat, scale)

      const sway = Math.sin(time * 2.0 + i) * swayFactor
      dummy.position.copy(pos)
      dummy.rotation.set(sway, (i * 0.8), sway * 0.7)
      dummy.scale.copy(scale)
      dummy.updateMatrix()

      foliageRef.current.setMatrixAt(i, dummy.matrix)
    }
    foliageRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group name="ProceduralTreesGroup">
      {/* Trunks */}
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, count]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <cylinderGeometry args={[0.3, 0.45, 2.2, 5]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </instancedMesh>

      {/* Foliage Canopy */}
      <instancedMesh
        ref={foliageRef}
        args={[undefined, undefined, count]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <coneGeometry args={[2.5, 3.8, 6]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.7} />
      </instancedMesh>
    </group>
  )
}

/**
 * GLTF Model Trees (used when public/models/tree.glb is provided)
 */
function GLTFTrees({ activeTrees, count, isHigh, windSpeed }) {
  const { scene } = useGLTF('/models/tree.glb', true)
  const groupRef = useRef(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const time = clock.getElapsedTime()
    const swayFactor = 0.03 * (windSpeed / 3.0)
    groupRef.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(time * 2.0 + i) * swayFactor
    })
  })

  return (
    <group ref={groupRef} name="GLTFTreesGroup">
      {activeTrees.map((t, idx) => (
        <primitive
          key={idx}
          object={scene.clone(true)}
          position={[t.x, 0, t.z]}
          scale={[t.s, t.s, t.s]}
          rotation={[0, idx * 0.8, 0]}
        />
      ))}
    </group>
  )
}

export default function TreesInstanced() {
  const { quality, windState } = useGame3D()
  const isHigh = quality === 'high'
  const activeTrees = isHigh ? TREE_POSITIONS : TREE_POSITIONS.slice(0, 8)
  const count = activeTrees.length
  const windSpeed = windState?.speedMs || 3.0

  const hasTreeModel = useModelAvailability('/models/tree.glb')

  if (hasTreeModel) {
    return (
      <React.Suspense fallback={<ProceduralTrees activeTrees={activeTrees} count={count} isHigh={isHigh} windSpeed={windSpeed} />}>
        <GLTFTrees activeTrees={activeTrees} count={count} isHigh={isHigh} windSpeed={windSpeed} />
      </React.Suspense>
    )
  }

  return <ProceduralTrees activeTrees={activeTrees} count={count} isHigh={isHigh} windSpeed={windSpeed} />
}
