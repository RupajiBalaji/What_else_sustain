import React, { useMemo, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { useModelAvailability } from '../assets/ModelLoader'
import { useGLTF } from '@react-three/drei'

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
  { x: -14, z: 32, s: 1.3, type: 'round' },
  // Far boundary trees
  { x: -28, z: -35, s: 1.4, type: 'round' },
  { x: -10, z: -32, s: 1.2, type: 'acacia' },
  { x: 6, z: -34, s: 1.3, type: 'slender' },
  { x: 28, z: 15, s: 1.2, type: 'round' },
  { x: 30, z: 32, s: 1.3, type: 'acacia' },
  { x: -24, z: 46, s: 1.1, type: 'slender' },
  { x: 26, z: 48, s: 1.2, type: 'round' }
]

function TreeArchetype({ trees, trunkGeo, foliageGeo, foliageColor, trunkHeight, foliageY, isShadows, windState }) {
  const trunkRef = useRef(null)
  const foliageRef = useRef(null)
  const shaderRef = useRef(null)
  const count = trees.length

  const foliageMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: foliageColor,
      roughness: 0.78
    })

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = { value: 0 }
      shader.uniforms.uWindDir = { value: new THREE.Vector2(0.5, 0.8) }
      shader.uniforms.uWindSpeed = { value: 3.8 }

      shader.vertexShader = `
        uniform float uWindTime;
        uniform vec2 uWindDir;
        uniform float uWindSpeed;
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vec4 wPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
        float wave = sin((wPos.x * uWindDir.x + wPos.z * uWindDir.y) * 0.25 - uWindTime * (uWindSpeed * 0.4 + 1.0));
        float h = max(0.0, position.y);
        transformed.x += uWindDir.x * wave * h * 0.08;
        transformed.z += uWindDir.y * wave * h * 0.08;
        `
      )
      shaderRef.current = shader
    }

    return mat
  }, [foliageColor])

  useLayoutEffect(() => {
    if (!trunkRef.current || !foliageRef.current || count === 0) return
    const dummy = new THREE.Object3D()

    trees.forEach((t, i) => {
      dummy.position.set(t.x, (trunkHeight * t.s) / 2, t.z)
      dummy.scale.set(t.s, t.s, t.s)
      dummy.rotation.set(0, i * 0.9 + t.x * 0.1, 0)
      dummy.updateMatrix()
      trunkRef.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(t.x, foliageY * t.s, t.z)
      dummy.scale.set(t.s, t.s, t.s)
      dummy.updateMatrix()
      foliageRef.current.setMatrixAt(i, dummy.matrix)
    })

    trunkRef.current.instanceMatrix.needsUpdate = true
    foliageRef.current.instanceMatrix.needsUpdate = true
  }, [trees, count, trunkHeight, foliageY])

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uWindTime.value = clock.getElapsedTime()
      const windRad = ((windState?.directionDeg ?? 75) * Math.PI) / 180
      shaderRef.current.uniforms.uWindDir.value.set(Math.sin(windRad), Math.cos(windRad))
      shaderRef.current.uniforms.uWindSpeed.value = windState?.speedMs ?? 3.8
    }
  })

  if (count === 0) return null

  return (
    <group>
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeo, undefined, count]}
        castShadow={isShadows}
        receiveShadow={isShadows}
      >
        <meshStandardMaterial color="#543D2B" roughness={0.92} />
      </instancedMesh>
      <instancedMesh
        ref={foliageRef}
        args={[foliageGeo, foliageMaterial, count]}
        castShadow={isShadows}
        receiveShadow={isShadows}
      />
    </group>
  )
}

function ProceduralTrees({ activeTrees, isShadows, windState }) {
  const roundTrees = useMemo(() => activeTrees.filter(t => t.type === 'round'), [activeTrees])
  const slenderTrees = useMemo(() => activeTrees.filter(t => t.type === 'slender'), [activeTrees])
  const acaciaTrees = useMemo(() => activeTrees.filter(t => t.type === 'acacia'), [activeTrees])

  const roundTrunkGeo = useMemo(() => new THREE.CylinderGeometry(0.24, 0.4, 2.2, 6), [])
  const roundFoliageGeo = useMemo(() => new THREE.DodecahedronGeometry(2.1, 0), [])

  const slenderTrunkGeo = useMemo(() => new THREE.CylinderGeometry(0.18, 0.28, 2.8, 5), [])
  const slenderFoliageGeo = useMemo(() => new THREE.ConeGeometry(1.5, 3.4, 6), [])

  const acaciaTrunkGeo = useMemo(() => new THREE.CylinderGeometry(0.2, 0.35, 2.4, 5), [])
  const acaciaFoliageGeo = useMemo(() => new THREE.CylinderGeometry(2.4, 1.2, 1.1, 7), [])

  return (
    <group name="ProceduralTreesVaried">
      <TreeArchetype
        trees={roundTrees}
        trunkGeo={roundTrunkGeo}
        foliageGeo={roundFoliageGeo}
        foliageColor="#689F38"
        trunkHeight={2.2}
        foliageY={3.1}
        isShadows={isShadows}
        windState={windState}
      />
      <TreeArchetype
        trees={slenderTrees}
        trunkGeo={slenderTrunkGeo}
        foliageGeo={slenderFoliageGeo}
        foliageColor="#7CB342"
        trunkHeight={2.8}
        foliageY={3.5}
        isShadows={isShadows}
        windState={windState}
      />
      <TreeArchetype
        trees={acaciaTrees}
        trunkGeo={acaciaTrunkGeo}
        foliageGeo={acaciaFoliageGeo}
        foliageColor="#558B2F"
        trunkHeight={2.4}
        foliageY={3.0}
        isShadows={isShadows}
        windState={windState}
      />
    </group>
  )
}

function GLTFTrees({ activeTrees, isShadows, windState }) {
  const { scene } = useGLTF('/models/tree_1.glb', '/draco/')
  const groupRef = useRef(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const time = clock.getElapsedTime()
    const windSpeed = windState?.speedMs || 3.0
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
  const { qualityConfig, windState } = useGame3D()
  const isShadows = qualityConfig.shadows
  const maxCount = qualityConfig.treeCount || 26
  const activeTrees = TREE_POSITIONS.slice(0, maxCount)

  const hasTreeModel = useModelAvailability('/models/tree_1.glb') || useModelAvailability('/models/tree.glb')

  if (hasTreeModel) {
    return (
      <React.Suspense fallback={<ProceduralTrees activeTrees={activeTrees} isShadows={isShadows} windState={windState} />}>
        <GLTFTrees activeTrees={activeTrees} isShadows={isShadows} windState={windState} />
      </React.Suspense>
    )
  }

  return <ProceduralTrees activeTrees={activeTrees} isShadows={isShadows} windState={windState} />
}
