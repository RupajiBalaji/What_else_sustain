import React, { Suspense, useState, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'

// Configure default Draco decoder path for compressed .glb models
if (useGLTF && useGLTF.setDecoderPath) {
  useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/')
}

/**
 * Hook to verify if a model file actually exists on the host
 * to avoid unhandled 404 console errors or R3F crashes.
 */
export function useModelAvailability(url) {
  const [available, setAvailable] = useState(null) // null = checking, true = exists, false = does not exist

  useEffect(() => {
    let active = true
    if (!url) {
      setAvailable(false)
      return
    }

    // Quick HEAD check to see if the file is present in public/
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (!active) return
        if (res.ok) {
          const contentType = res.headers.get('content-type') || ''
          // Ensure it's not an HTML 404 fallback page from Vite dev server or SPA routing
          if (contentType.includes('text/html')) {
            setAvailable(false)
          } else {
            setAvailable(true)
          }
        } else {
          setAvailable(false)
        }
      })
      .catch(() => {
        if (active) setAvailable(false)
      })

    return () => {
      active = false
    }
  }, [url])

  return available
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
