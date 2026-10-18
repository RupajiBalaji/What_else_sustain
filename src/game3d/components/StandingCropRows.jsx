import React, { useMemo, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

/**
 * Creates a slender paddy/wheat crop cluster with vertex color gradient
 * (Lush green stalk base -> vibrant green mid -> golden ripe grain ear tip)
 */
function createCropGeometry() {
  const g1 = new THREE.PlaneGeometry(0.55, 1.15, 1, 3)
  g1.translate(0, 0.57, 0)
  const g2 = new THREE.PlaneGeometry(0.55, 1.15, 1, 3)
  g2.rotateY(Math.PI / 2)
  g2.translate(0, 0.57, 0)

  const merged = new THREE.BufferGeometry()
  const pos1 = g1.attributes.position.array
  const pos2 = g2.attributes.position.array
  const norm1 = g1.attributes.normal.array
  const norm2 = g2.attributes.normal.array

  const positions = new Float32Array(pos1.length + pos2.length)
  positions.set(pos1)
  positions.set(pos2, pos1.length)

  const normals = new Float32Array(norm1.length + norm2.length)
  normals.set(norm1)
  normals.set(norm2, norm1.length)

  const indices = []
  const idx1 = g1.index.array
  const idx2 = g2.index.array
  for (let i = 0; i < idx1.length; i++) indices.push(idx1[i])
  const offset = g1.attributes.position.count
  for (let i = 0; i < idx2.length; i++) indices.push(idx2[i] + offset)

  // Vertex colors: Lush green roots/stems -> golden yellow grain heads
  const vertexCount = (pos1.length + pos2.length) / 3
  const colors = new Float32Array(vertexCount * 3)

  const cBase = new THREE.Color('#2E7D32') // Deep paddy green
  const cMid = new THREE.Color('#43A047')  // Lush vibrant green
  const cTip = new THREE.Color('#F9A825')  // Golden ripe grain tip
  const finalColor = new THREE.Color()

  for (let i = 0; i < vertexCount; i++) {
    const y = positions[i * 3 + 1]
    const t = Math.max(0, Math.min(1, y / 1.15))

    if (t < 0.5) {
      finalColor.lerpColors(cBase, cMid, t * 2)
    } else {
      finalColor.lerpColors(cMid, cTip, (t - 0.5) * 2)
    }

    colors[i * 3] = finalColor.r
    colors[i * 3 + 1] = finalColor.g
    colors[i * 3 + 2] = finalColor.b
  }

  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  merged.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  merged.setIndex(indices)
  return merged
}

export default function StandingCropRows() {
  const { qualityConfig, windState, harvestState, harvestProgress } = useGame3D()
  const isShadows = qualityConfig.shadows
  const meshRef = useRef(null)
  const shaderRef = useRef(null)

  // Rows and cols covering the main field based on quality tier
  const rows = qualityConfig.cropRows || 14
  const cols = qualityConfig.cropCols || 14
  const count = rows * cols

  const geometry = useMemo(() => createCropGeometry(), [])

  // Crop instance position data
  const cropData = useMemo(() => {
    const items = []
    const xStart = -27
    const zStart = 7
    const xStep = 28 / rows
    const zStep = 26 / cols

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = xStart + r * xStep + (Math.sin(r + c * 2) * 0.18)
        const z = zStart + c * zStep + (Math.cos(r * 2 + c) * 0.18)
        const scale = 0.9 + (Math.sin(r * 3 + c) * 0.15)
        const rotY = (r * 0.4 + c * 0.7)
        const cutOrder = (r / rows) * 0.6 + (c / cols) * 0.4

        items.push({ x, z, scale, rotY, cutOrder })
      }
    }
    return items
  }, [rows, cols])

  // Initial layout for instanced mesh
  useLayoutEffect(() => {
    if (!meshRef.current) return
    const dummy = new THREE.Object3D()

    cropData.forEach((item, i) => {
      dummy.position.set(item.x, 0, item.z)
      dummy.rotation.set(0, item.rotY, 0)
      dummy.scale.set(item.scale, item.scale, item.scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [cropData, count])

  // Custom Wind-Driven Vertex Shader with real wind speed/direction
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.05,
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
        // GPU vertex wave driven by real wind direction & speed
        vec4 wPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
        float wavePhase = (wPos.x * uWindDir.x + wPos.z * uWindDir.y) * 0.45;
        float wave = sin(wavePhase - uWindTime * (uWindSpeed * 0.8 + 1.2));
        float hFactor = max(0.0, position.y);
        transformed.x += uWindDir.x * wave * hFactor * 0.22;
        transformed.z += uWindDir.y * wave * hFactor * 0.22;
        `
      )
      shaderRef.current = shader
    }

    return mat
  }, [])

  // Animate wind shader uniforms and handle dynamic harvesting cut
  useFrame(({ clock }) => {
    if (harvestState === 'harvested') return

    // Update GPU wind shader uniforms
    if (shaderRef.current) {
      const t = clock.getElapsedTime()
      shaderRef.current.uniforms.uWindTime.value = t
      const windRad = ((windState?.directionDeg ?? 75) * Math.PI) / 180
      shaderRef.current.uniforms.uWindDir.value.set(Math.sin(windRad), Math.cos(windRad))
      shaderRef.current.uniforms.uWindSpeed.value = windState?.speedMs ?? 3.8
    }

    // Harvester cut progression
    if (harvestState === 'harvesting' && meshRef.current) {
      const dummy = new THREE.Object3D()
      const prog = harvestProgress || 0

      cropData.forEach((item, i) => {
        let currentHeightScale = item.scale
        if (prog >= item.cutOrder + 0.12) {
          currentHeightScale = 0.001
        } else if (prog >= item.cutOrder) {
          const localProg = (prog - item.cutOrder) / 0.12
          currentHeightScale = item.scale * (1.0 - localProg)
        }

        dummy.position.set(item.x, 0, item.z)
        dummy.rotation.set(0, item.rotY, 0)
        dummy.scale.set(item.scale, currentHeightScale, item.scale)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
      })

      meshRef.current.instanceMatrix.needsUpdate = true
    }
  })

  // Completely unmount once harvest is finalized to save 100% GPU
  if (harvestState === 'harvested') {
    return null
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow={isShadows}
      receiveShadow={isShadows}
      name="StandingCropRowsInstanced"
    />
  )
}
