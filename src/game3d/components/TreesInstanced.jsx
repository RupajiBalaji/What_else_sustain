import React, { useMemo, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { useModelAvailability } from '../assets/ModelLoader'
import { useGLTF } from '@react-three/drei'

// Pre-defined tree positions around perimeter, riverbank, and roads with varied archetypes
export const TREE_POSITIONS = [
  // Along the riverbank (X = -36 to -38)
  { x: -37, z: -25, s: 1.3, type: 'round' },
  { x: -38, z: -15, s: 1.1, type: 'slender' },
  { x: -37, z: -5, s: 1.4, type: 'acacia' },
  { x: -38, z: 5, s: 1.2, type: 'round' },
  { x: -36, z: 15, s: 1.3, type: 'slender' },
  { x: -38, z: 25, s: 1.5, type: 'round' },
  // Around the farmhouse (X = 14 to 28, Z = -20 to -6)
  { x: 12, z: -20, s: 1.3, type: 'round' },
  { x: 26, z: -18, s: 1.4, type: 'acacia' },
  { x: 25, z: -6, s: 1.2, type: 'slender' },
  { x: 10, z: -16, s: 1.1, type: 'round' },
  // Along the roadside towards the village (X = 12, Z = 10 to 35)
  { x: 12, z: 10, s: 1.2, type: 'slender' },
  { x: 12, z: 22, s: 1.3, type: 'round' },
  { x: 11, z: 32, s: 1.4, type: 'acacia' },
  { x: 0, z: 34, s: 1.1, type: 'slender' },
  { x: -14, z: 32, s: 1.3, type: 'round' }
]

/**
 * Sub-archetype instanced renderer for varied tree silhouettes
 */
function TreeArchetype({ trees, trunkGeo, foliageGeo, foliageColor, trunkHeight, foliageY, isHigh, windSpeed }) {
  const trunkRef = useRef(null)
  const foliageRef = useRef(null)
  const count = trees.length

  useLayoutEffect(() => {
    if (!trunkRef.current || !foliageRef.current || count === 0) return
    const dummy = new THREE.Object3D()

    trees.forEach((t, i) => {
      // 1. Trunk
      dummy.position.set(t.x, (trunkHeight * t.s) / 2, t.z)
      dummy.scale.set(t.s, t.s, t.s)
      dummy.rotation.set(0, i * 0.9 + t.x * 0.1, 0)
      dummy.updateMatrix()
      trunkRef.current.setMatrixAt(i, dummy.matrix)

      // 2. Foliage
      dummy.position.set(t.x, foliageY * t.s, t.z)
      dummy.scale.set(t.s, t.s, t.s)
      dummy.updateMatrix()
      foliageRef.current.setMatrixAt(i, dummy.matrix)
    })

    trunkRef.current.instanceMatrix.needsUpdate = true
    foliageRef.current.instanceMatrix.needsUpdate = true
  }, [trees, count, trunkHeight, foliageY])

  // Gentle wind sway
  useFrame(({ clock }) => {
    if (!foliageRef.current || count === 0) return
    const time = clock.getElapsedTime()
    const swayFactor = 0.035 * (windSpeed / 3.0)

    const dummy = new THREE.Object3D()
    const matrix = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    for (let i = 0; i < count; i++) {
      foliageRef.current.getMatrixAt(i, matrix)
      matrix.decompose(pos, quat, scale)

      const sway = Math.sin(time * 1.8 + i * 1.2) * swayFactor
      dummy.position.copy(pos)
      dummy.rotation.set(sway * 0.7, i * 0.9, sway)
      dummy.scale.copy(scale)
      dummy.updateMatrix()

      foliageRef.current.setMatrixAt(i, dummy.matrix)
    }
    foliageRef.current.instanceMatrix.needsUpdate = true
  })

  if (count === 0) return null

  return (
    <group>
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeo, undefined, count]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <meshStandardMaterial color="#543D2B" roughness={0.92} />
      </instancedMesh>
      <instancedMesh
        ref={foliageRef}
        args={[foliageGeo, undefined, count]}
        castShadow={isHigh}
        receiveShadow={isHigh}
      >
        <meshStandardMaterial color={foliageColor} roughness={0.78} />
      </instancedMesh>
    </group>
  )
}

/**
 * Procedural Instanced Trees with Varied Indian Rural Archetypes
 */
function ProceduralTrees({ activeTrees, isHigh, windSpeed }) {
  // Split trees by archetype
  const roundTrees = useMemo(() => activeTrees.filter(t => t.type === 'round'), [activeTrees])
  const slenderTrees = useMemo(() => activeTrees.filter(t => t.type === 'slender'), [activeTrees])
  const acaciaTrees = useMemo(() => activeTrees.filter(t => t.type === 'acacia'), [activeTrees])

  // Geometries for Archetype 1: Round Leafy Banyan / Mango Canopy
  const roundTrunkGeo = useMemo(() => new THREE.CylinderGeometry(0.24, 0.4, 2.2, 6), [])
  const roundFoliageGeo = useMemo(() => new THREE.DodecahedronGeometry(2.1, 0), [])

  // Geometries for Archetype 2: Slender Neem / Poplar
  const slenderTrunkGeo = useMemo(() => new THREE.CylinderGeometry(0.18, 0.28, 2.8, 5), [])
  const slenderFoliageGeo = useMemo(() => new THREE.ConeGeometry(1.5, 3.4, 6), [])

  // Geometries for Archetype 3: Umbrella Acacia / Babool
  const acaciaTrunkGeo = useMemo(() => new THREE.CylinderGeometry(0.2, 0.35, 2.4, 5), [])
  const acaciaFoliageGeo = useMemo(() => new THREE.CylinderGeometry(2.4, 1.2, 1.1, 7), [])

  return (
    <group name="ProceduralTreesVaried">
      {/* 1. Round Banyan / Mango - Warm Rich Leafy Olive */}
      <TreeArchetype
        trees={roundTrees}
        trunkGeo={roundTrunkGeo}
        foliageGeo={roundFoliageGeo}
        foliageColor="#689F38"
        trunkHeight={2.2}
        foliageY={3.1}
        isHigh={isHigh}
        windSpeed={windSpeed}
      />

      {/* 2. Slender Upright Neem - Lighter Lime-Olive */}
      <TreeArchetype
        trees={slenderTrees}
        trunkGeo={slenderTrunkGeo}
        foliageGeo={slenderFoliageGeo}
        foliageColor="#7CB342"
        trunkHeight={2.8}
        foliageY={3.5}
        isHigh={isHigh}
        windSpeed={windSpeed}
      />

      {/* 3. Umbrella Acacia / Babool - Warm Sage Olive */}
      <TreeArchetype
        trees={acaciaTrees}
        trunkGeo={acaciaTrunkGeo}
        foliageGeo={acaciaFoliageGeo}
        foliageColor="#558B2F"
        trunkHeight={2.4}
        foliageY={3.0}
        isHigh={isHigh}
        windSpeed={windSpeed}
      />
    </group>
  )
}

/**
 * GLTF Model Trees (used when public/models/tree.glb is provided)
 */
function GLTFTrees({ activeTrees, isHigh, windSpeed }) {
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
  const windSpeed = windState?.speedMs || 3.0

  const hasTreeModel = useModelAvailability('/models/tree.glb')

  if (hasTreeModel) {
    return (
      <React.Suspense fallback={<ProceduralTrees activeTrees={activeTrees} isHigh={isHigh} windSpeed={windSpeed} />}>
        <GLTFTrees activeTrees={activeTrees} isHigh={isHigh} windSpeed={windSpeed} />
      </React.Suspense>
    )
  }

  return <ProceduralTrees activeTrees={activeTrees} isHigh={isHigh} windSpeed={windSpeed} />
}
