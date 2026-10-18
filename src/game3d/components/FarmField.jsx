import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

/**
 * Custom Animated Water Shader for Irrigation Canal
 * Features flowing normal ripples, fresnel rim glow, shoreline foam, and sky tint.
 */
function CanalWater({ windState, qualityConfig }) {
  const meshRef = useRef(null)

  const waterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWindDir: { value: new THREE.Vector2(0.5, 0.8) },
        uWindSpeed: { value: 3.8 },
        uSkyColor: { value: new THREE.Color('#FFE0B2') }, // Golden-hour sky reflection
        uWaterColor: { value: new THREE.Color('#0288D1') }, // River deep blue
        uShallowColor: { value: new THREE.Color('#4FC3F7') }, // Shallow sunlit water
        uFoamColor: { value: new THREE.Color('#FFFFFF') } // Bank foam
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uWindDir;
        uniform float uWindSpeed;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vNormal;

        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);

          // Flowing ripple displacement along wind vector
          float waveSpeed = uTime * (uWindSpeed * 0.4 + 0.8);
          float wave1 = sin(worldPos.x * 0.8 + worldPos.z * 0.4 + waveSpeed) * 0.05;
          float wave2 = cos(worldPos.x * 1.5 - worldPos.z * 1.2 + waveSpeed * 1.3) * 0.03;
          worldPos.y += wave1 + wave2;

          vWorldPos = worldPos.xyz;
          vNormal = normalize(vec3(-wave1 * 0.8, 1.0, -wave2 * 0.8));

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uSkyColor;
        uniform vec3 uWaterColor;
        uniform vec3 uShallowColor;
        uniform vec3 uFoamColor;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vNormal;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 3.5);

          // Blend water body from deep to shallow
          vec3 waterCol = mix(uWaterColor, uShallowColor, vUv.y * 0.4 + 0.3);

          // Add golden-hour sky reflection at grazing angles
          vec3 reflected = mix(waterCol, uSkyColor, fresnel * 0.75);

          // Shoreline foam lines along canal banks (edges at uv.x ~ 0 and ~ 1)
          float edgeDist = min(vUv.x, 1.0 - vUv.x);
          float foam = smoothstep(0.08, 0.01, edgeDist) * 0.55;

          vec3 finalColor = mix(reflected, uFoamColor, foam);
          gl_FragColor = vec4(finalColor, 0.88);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  }, [])

  useFrame(({ clock }) => {
    if (!waterMaterial.uniforms) return
    const t = clock.getElapsedTime()
    waterMaterial.uniforms.uTime.value = t

    const windRad = ((windState?.directionDeg ?? 75) * Math.PI) / 180
    waterMaterial.uniforms.uWindDir.value.set(Math.sin(windRad), Math.cos(windRad))
    waterMaterial.uniforms.uWindSpeed.value = windState?.speedMs ?? 3.8
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.15, 0]}
      material={waterMaterial}
    >
      <planeGeometry args={[11.5, 140, 24, 64]} />
    </mesh>
  )
}

/**
 * Procedural Wheel Tracks & Compacted Dirt Trail Decal Texture
 */
function useTreadDecalTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    // Base dirt road color
    ctx.fillStyle = '#9E784E'
    ctx.fillRect(0, 0, 256, 512)

    // Left tire tread groove (X ~ 45 to 80)
    // Right tire tread groove (X ~ 175 to 210)
    for (let y = 0; y < 512; y += 16) {
      // Chevron tractor tire tread pattern
      ctx.fillStyle = 'rgba(62, 39, 35, 0.42)' // Dark compacted mud groove
      ctx.fillRect(52, y, 28, 9)
      ctx.fillRect(176, y, 28, 9)

      // Center foot path dust
      ctx.fillStyle = 'rgba(189, 150, 102, 0.25)'
      ctx.fillRect(100, y, 56, 16)
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1, 14)
    return tex
  }, [])
}

export default function FarmField() {
  const { qualityConfig, isFieldBurnt, windState } = useGame3D()
  const isShadows = qualityConfig.shadows
  const treadTexture = useTreadDecalTexture()

  // Subdivided ground geometry with procedural vertex colors and contact ambient occlusion
  const groundGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(140, 140, 42, 42)
    const count = geo.attributes.position.count
    const colors = new Float32Array(count * 3)
    const pos = geo.attributes.position

    const c1 = new THREE.Color()
    const c2 = new THREE.Color()
    const finalColor = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i) // In PlaneGeometry (XY) before -PI/2 X-rotation
      const worldZ = -y // After -PI/2 X-rotation, -y is world Z

      // Natural multi-frequency soil variation
      const n1 = Math.sin(x * 0.14) * Math.cos(y * 0.16)
      const n2 = Math.sin(x * 0.045 + y * 0.055) * 0.5
      const n3 = Math.cos(x * 0.28 - y * 0.22) * 0.25
      const t = THREE.MathUtils.clamp((n1 + n2 + n3 + 1.0) * 0.5, 0, 1)

      // Cultivated crop field boundary (X: -30 to 2, Z: 5 to 36)
      const isInsideField = x >= -30 && x <= 2 && worldZ >= 5 && worldZ <= 36
      const distToBorder = Math.min(
        Math.abs(x - (-30)),
        Math.abs(x - 2),
        Math.abs(worldZ - 5),
        Math.abs(worldZ - 36)
      )

      // Faked ambient occlusion near farmhouse (X: 18, Z: -12) and village (Z: 44)
      const distToHouse = Math.sqrt(Math.pow(x - 18, 2) + Math.pow(worldZ - (-12), 2))
      const houseAO = distToHouse < 7.0 ? Math.max(0.65, distToHouse / 7.0) : 1.0

      if (isFieldBurnt) {
        if (isInsideField) {
          // Burnt field: deep soot, charred earth, and ash-grey patches
          c1.set('#1A1817') // Deep soot
          c2.set('#3D3734') // Ash grey
          finalColor.lerpColors(c1, c2, t)
        } else {
          // Surrounding grass verges remain earthy olive-green
          c1.set('#4E6B2A')
          c2.set('#5D7E32')
          finalColor.lerpColors(c1, c2, t)
        }
      } else {
        if (isInsideField) {
          // Warm golden harvest loam: rich agricultural soil & sunlit straw tones
          c1.set('#B58434') // Warm rich loam
          c2.set('#DBA952') // Golden sun-baked earth
          finalColor.lerpColors(c1, c2, t)
        } else {
          // Lush green grass borders along field edges, road, and canal
          c1.set('#4E8C2B') // Fresh green grass
          c2.set('#689F38') // Vibrant meadow grass
          finalColor.lerpColors(c1, c2, t)

          // Smooth blend along field boundary edge
          if (distToBorder < 2.5) {
            const blend = distToBorder / 2.5
            const soilColor = new THREE.Color().lerpColors(
              new THREE.Color('#B58434'),
              new THREE.Color('#DBA952'),
              t
            )
            finalColor.lerpColors(soilColor, finalColor, blend)
          }
        }
      }

      // Apply ambient occlusion contact darkening
      finalColor.multiplyScalar(houseAO)

      // Micro-grain tactile ground jitter
      const jitter = ((i % 7) - 3) * 0.012
      colors[i * 3] = THREE.MathUtils.clamp(finalColor.r + jitter, 0, 1)
      colors[i * 3 + 1] = THREE.MathUtils.clamp(finalColor.g + jitter, 0, 1)
      colors[i * 3 + 2] = THREE.MathUtils.clamp(finalColor.b + jitter, 0, 1)
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [isFieldBurnt])

  // Far surrounding plains
  const plainsGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(260, 260, 18, 18)
    const count = geo.attributes.position.count
    const colors = new Float32Array(count * 3)
    const pos = geo.attributes.position

    const c1 = new THREE.Color('#7E9848')
    const c2 = new THREE.Color('#94B056')
    const finalColor = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const t = THREE.MathUtils.clamp((Math.sin(x * 0.03) * Math.cos(y * 0.03) + 1.0) * 0.5, 0, 1)
      finalColor.lerpColors(c1, c2, t)

      colors[i * 3] = finalColor.r
      colors[i * 3 + 1] = finalColor.g
      colors[i * 3 + 2] = finalColor.b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  return (
    <group name="FarmFieldWorld">
      {/* 1. Main Harvested Ground Plane with Vertex Colors & Contact AO */}
      <mesh
        geometry={groundGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow={isShadows}
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      {/* 2. Far Surrounding Green Plains */}
      <mesh
        geometry={plainsGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow={false}
      >
        <meshStandardMaterial
          vertexColors
          roughness={1.0}
        />
      </mesh>

      {/* 3. Winding Dirt Road with Realistic Tire Wheel Tracks */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[6, 0.012, 15]}
        receiveShadow={isShadows}
      >
        <planeGeometry args={[6.5, 90]} />
        <meshStandardMaterial
          map={treadTexture}
          roughness={0.92}
        />
      </mesh>

      {/* Cross Path to River with compacted soil */}
      <mesh
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        position={[-18, 0.014, 10]}
        receiveShadow={isShadows}
      >
        <planeGeometry args={[4.5, 42]} />
        <meshStandardMaterial
          color="#A68257"
          roughness={0.9}
        />
      </mesh>

      {/* 4. Irrigation Canal with Custom Animated Shader Water */}
      <group position={[-44, 0, 0]}>
        {/* Riverbed Trench */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[12, 0.8, 140]} />
          <meshStandardMaterial color="#4E3629" roughness={1.0} />
        </mesh>

        {/* Animated Shader Water with Ripples, Foam & Fresnel */}
        <CanalWater windState={windState} qualityConfig={qualityConfig} />
      </group>
    </group>
  )
}
