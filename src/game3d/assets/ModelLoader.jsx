import React, { Suspense, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'

// Configure default Draco decoder path for compressed .glb models
if (useGLTF && useGLTF.setDecoderPath) {
  useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/')
}

// Statically discover any .glb files physically present in public/models/ at build/dev time.
// This completely avoids runtime HTTP network requests that trigger 405/404 errors in DevTools.
const AVAILABLE_MODELS_GLOB = import.meta.glob('/public/models/*.glb')

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
 * Internal GLTF Renderer that executes inside React Suspense
 */
function GLTFModel({ url, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], ...props }) {
  const { scene } = useGLTF(url, true) // true enables Draco decompression automatically
  const clonedScene = React.useMemo(() => scene.clone(true), [scene])

  // Ensure shadows are properly enabled on imported meshes
  React.useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [clonedScene])

  return (
    <primitive
      object={clonedScene}
      scale={scale}
      position={position}
      rotation={rotation}
      {...props}
    />
  )
}

/**
 * ModelWithFallback
 * Loads a .glb model if available via Suspense and Draco;
 * otherwise gracefully renders the provided procedural component.
 */
export default function ModelWithFallback({
  modelUrl,
  fallback: FallbackComponent,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  ...props
}) {
  const isAvailable = useModelAvailability(modelUrl)

  // While checking availability or if file not found, render procedural fallback
  if (!isAvailable) {
    return <FallbackComponent position={position} rotation={rotation} scale={scale} {...props} />
  }

  // Model file exists: load with Suspense and Draco
  return (
    <Suspense fallback={<FallbackComponent position={position} rotation={rotation} scale={scale} {...props} />}>
      <GLTFModel
        url={modelUrl}
        scale={scale}
        position={position}
        rotation={rotation}
        {...props}
      />
    </Suspense>
  )
}
