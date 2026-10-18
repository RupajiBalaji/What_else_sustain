import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { sound } from '../../game/soundManager'

const Game3DContext = createContext(null)

export function Game3DProvider({ children, onFallbackToLite }) {
  // Shared wind parameters (used for 3D visual flag/trees and backend smoke simulation)
  const [windState, setWindState] = useState({
    directionDeg: 75, // 0 = North, 90 = East
    speedMs: 3.8,      // m/s
  })

  // Quality settings: 'high' (shadows, full instancing, fog) vs 'low' (no shadows, reduced objects, minimal fog)
  const [quality, setQuality] = useState(() => {
    try {
      return localStorage.getItem('wes_3d_quality') || 'high'
    } catch {
      return 'high'
    }
  })

  // Interaction target: null or { id, type, position, label }
  const [interactionTarget, setInteractionTarget] = useState(null)

  // FPS & Performance tracking
  const [showFps, setShowFps] = useState(false)
  const [fps, setFps] = useState(60)
  const [frameTimeMs, setFrameTimeMs] = useState(16.6)

  // WebGL safety / Low FPS fallback monitor
  const lowFpsStartTimeRef = useRef(null)

  const toggleQuality = useCallback(() => {
    sound.initAudio()
    sound.playTap()
    setQuality((prev) => {
      const next = prev === 'high' ? 'low' : 'high'
      try {
        localStorage.setItem('wes_3d_quality', next)
      } catch {
        // Safe fallback
      }
      return next
    })
  }, [])

  const toggleFps = useCallback(() => {
    sound.initAudio()
    sound.playTap()
    setShowFps((prev) => !prev)
  }, [])

  // Keyboard shortcut: Press 'F' to toggle FPS
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'f' || e.key === 'F') {
        toggleFps()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFps])

  const reportFps = useCallback((currentFps, frameTime) => {
    setFps(currentFps)
    setFrameTimeMs(frameTime)

    // Check if FPS stays under 15 for 5 seconds
    if (currentFps < 15 && currentFps > 0) {
      if (!lowFpsStartTimeRef.current) {
        lowFpsStartTimeRef.current = Date.now()
      } else if (Date.now() - lowFpsStartTimeRef.current >= 5000) {
        console.warn('[Game3D] Sustained low FPS (<15 for 5s). Triggering fallback to Lite mode.')
        if (onFallbackToLite) {
          onFallbackToLite('Performance protection: switched to Lite mode for smooth experience.')
        }
      }
    } else {
      lowFpsStartTimeRef.current = null
    }
  }, [onFallbackToLite])

  const handleInteract = useCallback(() => {
    if (!interactionTarget) return
    sound.initAudio()
    sound.playPop()
    console.log('[Game3D Interaction]:', interactionTarget)
  }, [interactionTarget])

  return (
    <Game3DContext.Provider
      value={{
        windState,
        setWindState,
        quality,
        toggleQuality,
        interactionTarget,
        setInteractionTarget,
        showFps,
        toggleFps,
        fps,
        frameTimeMs,
        reportFps,
        handleInteract,
        onFallbackToLite
      }}
    >
      {children}
    </Game3DContext.Provider>
  )
}

export function useGame3D() {
  const context = useContext(Game3DContext)
  if (!context) {
    throw new Error('useGame3D must be used within Game3DProvider')
  }
  return context
}
