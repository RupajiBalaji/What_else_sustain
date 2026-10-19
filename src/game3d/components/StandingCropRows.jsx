import React, { useMemo, useLayoutEffect, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

const _cropDummy = new THREE.Object3D()
const _colorDummy = new THREE.Color()

/**
 * Creates an instanced crop blade cluster (3 curved vertical cards fanning out)
 * with a natural vertical color gradient: deep root/stalk green -> rich vibrant leaf green -> golden wheat/paddy ear tips.
 */
function createCropClusterGeometry(soilHealth = 70) {
  // 3 vertical blade cards angled at 0, 45, and -45 degrees
  const g1 = new THREE.PlaneGeometry(0.28, 1.35, 1, 4)
  g1.translate(0, 0.675, 0)

  const g2 = new THREE.PlaneGeometry(0.26, 1.3, 1, 4)
  g2.rotateY(Math.PI / 4)
  g2.translate(0, 0.65, 0)

  const g3 = new THREE.PlaneGeometry(0.26, 1.3, 1, 4)
  g3.rotateY(-Math.PI / 4)
  g3.translate(0, 0.65, 0)

  const p1 = g1.attributes.position.array
  const p2 = g2.attributes.position.array
  const p3 = g3.attributes.position.array
  const n1 = g1.attributes.normal.array
  const n2 = g2.attributes.normal.array
  const n3 = g3.attributes.normal.array

  const totalVerts = (p1.length + p2.length + p3.length) / 3
  const positions = new Float32Array(totalVerts * 3)
  const normals = new Float32Array(totalVerts * 3)
  const colors = new Float32Array(totalVerts * 3)

  positions.set(p1)
  positions.set(p2, p1.length)
  positions.set(p3, p1.length + p2.length)

  normals.set(n1)
  normals.set(n2, n1.length)
  normals.set(n3, n1.length + n2.length)

  const indices = []
  const idx1 = g1.index.array
  const idx2 = g2.index.array
  const idx3 = g3.index.array
  for (let i = 0; i < idx1.length; i++) indices.push(idx1[i])
  let off = g1.attributes.position.count
  for (let i = 0; i < idx2.length; i++) indices.push(idx2[i] + off)
  off += g2.attributes.position.count
  for (let i = 0; i < idx3.length; i++) indices.push(idx3[i] + off)

  // Color modulation by soil health
  const healthT = Math.max(0.2, Math.min(1.0, soilHealth / 100))
  const cBase = new THREE.Color().lerpColors(new THREE.Color('#4E342E'), new THREE.Color('#1B5E20'), healthT)
  const cMid = new THREE.Color().lerpColors(new THREE.Color('#558B2F'), new THREE.Color('#388E3C'), healthT)
  const cTip = new THREE.Color().lerpColors(new THREE.Color('#FFF59D'), new THREE.Color('#FBC02D'), healthT)
  const finalCol = new THREE.Color()

  for (let i = 0; i < totalVerts; i++) {
    const y = positions[i * 3 + 1]
    const t = Math.max(0, Math.min(1.0, y / 1.35))

    if (t < 0.45) {
      finalCol.lerpColors(cBase, cMid, t / 0.45)
    } else {
      finalCol.lerpColors(cMid, cTip, (t - 0.45) / 0.55)
    }

    colors[i * 3] = finalCol.r
    colors[i * 3 + 1] = finalCol.g
    colors[i * 3 + 2] = finalCol.b
  }

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  merged.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  merged.setIndex(indices)

  g1.dispose()
  g2.dispose()
  g3.dispose()

  return merged
}

export default function StandingCropRows() {
  const { qualityConfig, windState, harvestState, harvestProgress, persistentState } = useGame3D()
  const isShadows = qualityConfig.shadows
  const meshRef = useRef(null)
  const shaderRef = useRef(null)

  const soilHealth = persistentState?.soilHealth ?? 70

  // Distinct row & column counts with clearly visible row spacing
  const rows = qualityConfig.tier === 'high' ? 22 : qualityConfig.tier === 'medium' ? 16 : 10
  const cols = qualityConfig.tier === 'high' ? 26 : qualityConfig.tier === 'medium' ? 18 : 12
  const count = rows * cols

  const geometry = useMemo(() => createCropClusterGeometry(soilHealth), [soilHealth])

  // Agricultural Furrows layout with visible 1.1m row spacing
  const cropData = useMemo(() => {
    const items = []
    const xStart = -28.0
    const zStart = 6.0
    const xRange = 26.0
    const zRange = 28.0
    const xStep = xRange / rows
    const zStep = zRange / cols
    const heightMult = 0.75 + (soilHealth / 100) * 0.35

    // 3 distinct green shades for varied natural field canopy
    const greenShades = [
      new THREE.Color('#FFFFFF'), // Standard natural
      new THREE.Color('#E8F5E9'), // Slightly softer/fresher
      new THREE.Color('#FFFDE7')  // Golden-tinted mature
    ]

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Furrow row line with small natural organic jitter along the furrow
        const x = xStart + r * xStep + (Math.sin(r * 4 + c) * 0.08)
        const z = zStart + c * zStep + (Math.cos(r + c * 3) * 0.12)
        const rotY = (r * 0.35 + c * 0.6)
        const baseScale = 0.95 + (Math.sin(r * 2 + c * 3) * 0.15)
        const scale = baseScale * heightMult
        const cutOrder = (r / rows) * 0.6 + (c / cols) * 0.4
        const shadeIndex = (r + c * 2) % 3

        items.push({ x, z, scale, rotY, cutOrder, shade: greenShades[shadeIndex] })
      }
    }
    return items
  }, [rows, cols, soilHealth])

  // Instance transforms and tinting
  useLayoutEffect(() => {
    if (!meshRef.current) return

    cropData.forEach((item, i) => {
      _cropDummy.position.set(item.x, 0, item.z)
      _cropDummy.rotation.set(0, item.rotY, 0)
      _cropDummy.scale.set(item.scale, item.scale, item.scale)
      _cropDummy.updateMatrix()
      meshRef.current.setMatrixAt(i, _cropDummy.matrix)
      meshRef.current.setColorAt(i, item.shade)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [cropData, count])

  // Wind sway vertex shader
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.02,
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
        // Natural wind sway flexing from base to tip
        vec4 wPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
        float wavePhase = (wPos.x * uWindDir.x + wPos.z * uWindDir.y) * 0.45;
        float wave = sin(wavePhase - uWindTime * (uWindSpeed * 0.9 + 1.2));
        float hFactor = pow(max(0.0, position.y / 1.35), 1.6);
        transformed.x += uWindDir.x * wave * hFactor * 0.28;
        transformed.z += uWindDir.y * wave * hFactor * 0.28;
        `
      )
      shaderRef.current = shader
    }

    return mat
  }, [])

  // Animate wind shader and combine harvester cut
  useFrame(({ clock }) => {
    if (harvestState === 'harvested') return

    if (shaderRef.current) {
      const t = clock.getElapsedTime()
      shaderRef.current.uniforms.uWindTime.value = t
      const windRad = ((windState?.directionDeg ?? 75) * Math.PI) / 180
      shaderRef.current.uniforms.uWindDir.value.set(Math.sin(windRad), Math.cos(windRad))
      shaderRef.current.uniforms.uWindSpeed.value = windState?.speedMs ?? 3.8
    }

    // Dynamic cut progression during harvesting
    if (harvestState === 'harvesting' && meshRef.current) {
      const prog = harvestProgress || 0

      cropData.forEach((item, i) => {
        let currentHeightScale = item.scale
        if (prog >= item.cutOrder + 0.12) {
          currentHeightScale = 0.001
        } else if (prog >= item.cutOrder) {
          const localProg = (prog - item.cutOrder) / 0.12
          currentHeightScale = item.scale * (1.0 - localProg)
        }

        _cropDummy.position.set(item.x, 0, item.z)
        _cropDummy.rotation.set(0, item.rotY, 0)
        _cropDummy.scale.set(item.scale, currentHeightScale, item.scale)
        _cropDummy.updateMatrix()
        meshRef.current.setMatrixAt(i, _cropDummy.matrix)
      })

      meshRef.current.instanceMatrix.needsUpdate = true
    }
  })

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

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
