import React, { useMemo, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

function generateTuftPositions(count) {
  const positions = []
  const prng = (seed) => {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  let s = 42

  for (let i = 0; i < count; i++) {
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

const GRASS_PATCHES = [
  { x: 9.5, z: -10, r: 2.8 },
  { x: 10.2, z: 5, r: 3.2 },
  { x: 9.8, z: 20, r: 2.6 },
  { x: 10.5, z: 35, r: 3.0 },
  { x: 2.2, z: -8, r: 2.5 },
  { x: 1.8, z: 8, r: 3.1 },
  { x: 2.5, z: 24, r: 2.7 },
  { x: -37.5, z: -25, r: 4.2 },
  { x: -38.0, z: -5, r: 3.8 },
  { x: -37.2, z: 15, r: 4.5 },
  { x: -38.5, z: 30, r: 3.9 },
  { x: -25, z: 37, r: 3.5 },
  { x: -12, z: 37.5, r: 4.0 },
  { x: -2, z: 36.8, r: 3.2 },
  { x: -24, z: 4.2, r: 3.4 },
  { x: -10, z: 4.0, r: 3.8 },
  { x: 0, z: 4.5, r: 3.1 },
  { x: 14, z: -18, r: 3.6 },
  { x: 24, z: -16, r: 4.2 },
  { x: 22, z: -7, r: 3.5 },
  { x: 16, z: 12, r: 3.0 },
  { x: 15, z: 26, r: 3.4 }
]

function createTuftGeometry() {
  const g1 = new THREE.PlaneGeometry(0.8, 0.75, 1, 2)
  g1.translate(0, 0.375, 0)
  const g2 = new THREE.PlaneGeometry(0.8, 0.75, 1, 2)
  g2.rotateY(Math.PI / 3)
  g2.translate(0, 0.375, 0)
  const g3 = new THREE.PlaneGeometry(0.8, 0.75, 1, 2)
  g3.rotateY((Math.PI * 2) / 3)
  g3.translate(0, 0.375, 0)

  const merged = new THREE.BufferGeometry()
  const p1 = g1.attributes.position.array
  const p2 = g2.attributes.position.array
  const p3 = g3.attributes.position.array

  const positions = new Float32Array(p1.length + p2.length + p3.length)
  positions.set(p1)
  positions.set(p2, p1.length)
  positions.set(p3, p1.length + p2.length)

  const indices = []
  const idx1 = g1.index.array
  const idx2 = g2.index.array
  const idx3 = g3.index.array
  for (let i = 0; i < idx1.length; i++) indices.push(idx1[i])
  let off = g1.attributes.position.count
  for (let i = 0; i < idx2.length; i++) indices.push(idx2[i] + off)
  off += g2.attributes.position.count
  for (let i = 0; i < idx3.length; i++) indices.push(idx3[i] + off)

  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  merged.setIndex(indices)
  merged.computeVertexNormals()
  return merged
}

export default function GrassTufts() {
  const { qualityConfig, isFieldBurnt, windState } = useGame3D()
  const tuftsRef = useRef(null)
  const patchRef = useRef(null)
  const shaderRef = useRef(null)

  const count = qualityConfig.grassTuftsCount || 180
  const geometry = useMemo(() => createTuftGeometry(), [])
  const positions = useMemo(() => generateTuftPositions(count), [count])

  // Custom Wind-Driven Vertex Shader
  const tuftMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: isFieldBurnt ? '#5D503C' : '#558B2F',
      roughness: 0.88,
      side: THREE.DoubleSide
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
        float wave = sin((wPos.x * uWindDir.x + wPos.z * uWindDir.y) * 0.5 - uWindTime * (uWindSpeed * 0.9 + 1.4));
        float h = max(0.0, position.y);
        transformed.x += uWindDir.x * wave * h * 0.18;
        transformed.z += uWindDir.y * wave * h * 0.18;
        `
      )
      shaderRef.current = shader
    }

    return mat
  }, [isFieldBurnt])

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
      GRASS_PATCHES.forEach((patch, idx) => {
        dummy.position.set(patch.x, 0.005, patch.z)
        dummy.scale.set(patch.r, patch.r, patch.r)
        dummy.rotation.set(-Math.PI / 2, 0, 0)
        dummy.updateMatrix()
        patchRef.current.setMatrixAt(idx, dummy.matrix)
      })
      patchRef.current.instanceMatrix.needsUpdate = true
    }
  }, [positions])

  // Update wind uniforms in useFrame
  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uWindTime.value = clock.getElapsedTime()
      const windRad = ((windState?.directionDeg ?? 75) * Math.PI) / 180
      shaderRef.current.uniforms.uWindDir.value.set(Math.sin(windRad), Math.cos(windRad))
      shaderRef.current.uniforms.uWindSpeed.value = windState?.speedMs ?? 3.8
    }
  })

  return (
    <group name="GrassAndPatchesGroup">
      {/* 1. Flat Green Grass Carpet Patches */}
      <instancedMesh
        ref={patchRef}
        args={[undefined, undefined, GRASS_PATCHES.length]}
        receiveShadow={false}
      >
        <circleGeometry args={[1, 7]} />
        <meshStandardMaterial
          color={isFieldBurnt ? '#4E5B28' : '#43A047'}
          roughness={0.95}
        />
      </instancedMesh>

      {/* 2. Instanced Wind-Swaying Grass Tufts */}
      <instancedMesh
        ref={tuftsRef}
        args={[geometry, tuftMaterial, count]}
        receiveShadow={qualityConfig.shadows}
        name="GrassTuftsInstanced"
      />
    </group>
  )
}
