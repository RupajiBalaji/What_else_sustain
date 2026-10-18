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
// This completely avoids runtime HTTP network requests that trigger 405/404 errors in DevTools.
const AVAILABLE_MODELS_GLOB = import.meta.glob('/public/models/*.glb', { query: '?url', import: 'default' })

/**
 * Instant check to verify if a model file exists in public/models/.
 * Returns false immediately if absent, eliminating network 405/404 errors.
 */
export function useModelAvailability(url) {
  return useMemo(() => {
    if (!url) return false
    const normKey = url.startsWith('/public') ? url : `/public${url}`
    return Boolean(AVAILABLE_MODELS_GLOB[normKey] || AVAILABLE_MODELS_GLOB[url])
  }, [url])
}

/**
 * Preload a model if available
 */
export function preloadModel(url) {
  if (url && (AVAILABLE_MODELS_GLOB[`/public${url}`] || AVAILABLE_MODELS_GLOB[url])) {
    try {
      useGLTF.preload(url, '/draco/')
    } catch {
      // Ignore
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

  // Clone scene so multiple instances don't share identical scene graph nodes
  const clonedScene = useMemo(() => {
    if (!gltf.scene) return null
    const cloned = gltf.scene.clone(true)

    // Traverse and configure shadows and PBR materials
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = manifest ? manifest.castShadow : true
        child.receiveShadow = manifest ? manifest.receiveShadow : true

        if (child.material) {
          child.material.side = THREE.FrontSide
          child.material.shadowSide = THREE.BackSide
          if (child.material.map) {
            child.material.map.anisotropy = 4
          }
        }
      }
    })

    return cloned
  }, [gltf.scene, manifest])

  // Animation support
  const { actions, names } = useAnimations(gltf.animations || [], groupRef)

  useEffect(() => {
    if (!actions || names.length === 0) return

    // Play requested animation clip if it exists in the model
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
 * Loads a .glb model if available via Suspense and local Draco;
 * otherwise gracefully renders the provided procedural component without error.
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
