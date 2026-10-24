import React, { Suspense, useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useGLTF, useAnimations } from '@react-three/drei'
import { ASSET_MANIFEST, getManifestEntry } from './assetManifest'

// Configure local Draco decoder served from public/draco/
if (useGLTF && useGLTF.setDecoderPath) {
  try {
    useGLTF.setDecoderPath('/draco/')
  } catch {
    // Graceful fallback
  }
}

// Statically discover any .glb files physically present in public/models/ at build/dev time.
const AVAILABLE_MODELS_GLOB = import.meta.glob('/public/models/*.glb', { query: '?url', import: 'default' })

/**
 * Singleton Texture Loader for Kenney Assets Color Palette.
 * Configured with sRGB color space, nearest filter (crisp pixel palette),
 * flipY = false, and no mipmap blur as per specification.
 */
let sharedColormapTexture = null
const textureLoader = new THREE.TextureLoader()

export function getSharedColormapTexture() {
  if (!sharedColormapTexture) {
    sharedColormapTexture = textureLoader.load('/Textures/colormap.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.flipY = true // Must be true for correct Kenney palette UV mapping
      tex.magFilter = THREE.NearestFilter
      tex.minFilter = THREE.NearestFilter
      tex.generateMipmaps = false
      tex.needsUpdate = true
    })
    sharedColormapTexture.colorSpace = THREE.SRGBColorSpace
    sharedColormapTexture.flipY = true
    sharedColormapTexture.magFilter = THREE.NearestFilter
    sharedColormapTexture.minFilter = THREE.NearestFilter
    sharedColormapTexture.generateMipmaps = false
  }
  return sharedColormapTexture
}

/**
 * Shared PBR material for all untextured Kenney meshes.
 * Caches a single MeshStandardMaterial across all instances to minimize draw calls.
 */
let sharedKenneyMaterial = null
export function getSharedKenneyMaterial() {
  if (!sharedKenneyMaterial) {
    const colormap = getSharedColormapTexture()
    sharedKenneyMaterial = new THREE.MeshStandardMaterial({
      map: colormap,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.FrontSide,
      shadowSide: THREE.BackSide
    })
  }
  return sharedKenneyMaterial
}

/**
 * Traverses any Object3D/Scene and binds the shared colormap texture & material
 * to any mesh that has no texture map, and configures shadows.
 */
export function applyKenneyTextures(root, manifest = null) {
  if (!root) return root
  const sharedMat = getSharedKenneyMaterial()
  const colormap = getSharedColormapTexture()

  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = manifest ? manifest.castShadow : true
      child.receiveShadow = manifest ? manifest.receiveShadow : true

      if (!child.material) {
        child.material = sharedMat
      } else if (Array.isArray(child.material)) {
        child.material = child.material.map((mat) => {
          if (!mat || !mat.map) return sharedMat
          mat.roughness = 0.9
          mat.metalness = 0.0
          mat.side = THREE.FrontSide
          mat.shadowSide = THREE.BackSide
          return mat
        })
      } else if (!child.material.map) {
        child.material = sharedMat
      } else {
        child.material.side = THREE.FrontSide
        child.material.shadowSide = THREE.BackSide
        child.material.roughness = 0.9
        child.material.metalness = 0.0
        if (child.material.map) {
          child.material.map.anisotropy = 4
        }
      }
    }
  })
  return root
}

// Statically known physical Kenney GLTF models in public/models/
export const KNOWN_STATIC_MODELS = new Set([
  '/models/barn.glb',
  '/models/house_1.glb',
  '/models/house_2.glb',
  '/models/house_3.glb',
  '/models/tree_1.glb',
  '/models/truck.glb',
  '/models/villager_1.glb'
])

/**
 * Instant check to verify if a model file exists in public/models/.
 */
export function useModelAvailability(url) {
  return useMemo(() => {
    if (!url) return false
    const cleanUrl = url.replace(/^\/public/, '')
    if (KNOWN_STATIC_MODELS.has(cleanUrl)) return true
    const normKey = url.startsWith('/public') ? url : `/public${url}`
    return Boolean(AVAILABLE_MODELS_GLOB[normKey] || AVAILABLE_MODELS_GLOB[url])
  }, [url])
}

/**
 * Preload a model if available
 */
export function preloadModel(url) {
  if (url) {
    const cleanUrl = url.replace(/^\/public/, '')
    if (KNOWN_STATIC_MODELS.has(cleanUrl) || AVAILABLE_MODELS_GLOB[`/public${cleanUrl}`]) {
      try {
        useGLTF.preload(cleanUrl, '/draco/')
      } catch {
        // Ignore
      }
    }
  }
}

/**
 * Internal GLTF Renderer that handles cloning, material setup, shadows, and animation playback
 */
function GLTFModelInner({
  url,
  assetId,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  currentAnimation,
  onAnimate,
  ...props
}) {
  const groupRef = useRef(null)
  const gltf = useGLTF(url, '/draco/')
  const manifest = assetId ? getManifestEntry(assetId) : null

  // Clone scene and apply colormap texture & material setup
  const clonedScene = useMemo(() => {
    if (!gltf.scene) return null
    const cloned = gltf.scene.clone(true)
    applyKenneyTextures(cloned, manifest)
    return cloned
  }, [gltf.scene, manifest])

  // Animation support
  const { actions, names } = useAnimations(gltf.animations || [], groupRef)

  useEffect(() => {
    if (!actions || names.length === 0) return

    const animName = currentAnimation || names[0]
    const targetAction = actions[animName] || actions[names[0]]

    if (targetAction) {
      targetAction.reset().fadeIn(0.2).play()
      return () => {
        targetAction.fadeOut(0.2)
      }
    }
  }, [actions, names, currentAnimation])

  // Compute final transform with manifest offsets
  const finalScale = useMemo(() => {
    const s = (manifest?.scale || 1.0) * (typeof scale === 'number' ? scale : 1)
    return [s, s, s]
  }, [manifest, scale])

  const finalPos = useMemo(() => {
    const off = manifest?.positionOffset || [0, 0, 0]
    return [position[0] + off[0], position[1] + off[1], position[2] + off[2]]
  }, [manifest, position])

  const finalRot = useMemo(() => {
    const off = manifest?.rotationOffset || [0, 0, 0]
    return [rotation[0] + off[0], rotation[1] + off[1], rotation[2] + off[2]]
  }, [manifest, rotation])

  if (!clonedScene) return null

  return (
    <group ref={groupRef} position={finalPos} rotation={finalRot} scale={finalScale} {...props}>
      <primitive object={clonedScene} />
    </group>
  )
}

/**
 * ModelWithFallback
 */
export default function ModelWithFallback({
  assetId,
  modelUrl,
  fallback: FallbackComponent,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  currentAnimation,
  ...props
}) {
  const url = modelUrl || (assetId ? getManifestEntry(assetId)?.modelUrl : null)
  const isAvailable = useModelAvailability(url)

  if (!isAvailable || !url) {
    if (!FallbackComponent) return null
    return (
      <FallbackComponent
        position={position}
        rotation={rotation}
        scale={scale}
        currentAnimation={currentAnimation}
        {...props}
      />
    )
  }

  return (
    <Suspense
      fallback={
        FallbackComponent ? (
          <FallbackComponent
            position={position}
            rotation={rotation}
            scale={scale}
            currentAnimation={currentAnimation}
            {...props}
          />
        ) : null
      }
    >
      <GLTFModelInner
        url={url}
        assetId={assetId}
        scale={scale}
        position={position}
        rotation={rotation}
        currentAnimation={currentAnimation}
        {...props}
      />
    </Suspense>
  )
}
