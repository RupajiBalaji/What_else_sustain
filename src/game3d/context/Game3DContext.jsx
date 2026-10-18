import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { sound } from '../../game/soundManager'
import { useGame } from '../../context/GameContext'
import { simulateSmokeApi, recordPlaySession } from '../../utils/api'

const Game3DContext = createContext(null)

export function Game3DProvider({ children, onFallbackToLite }) {
  const game = useGame()
  // Shared wind parameters (used for 3D visual flag/trees and backend smoke simulation)
  const [windState, setWindState] = useState({
    directionDeg: 75, // 0 = North, 90 = East (drifts smoke towards village at Z=45, X=5)
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

  // Interaction target: null or { id, x, z, scale, label }
  const [interactionTarget, setInteractionTarget] = useState(null)
  const [activePile, setActivePile] = useState(null)
  const [showChoiceWheel, setShowChoiceWheel] = useState(false)

  // Burn sequence state: 'idle' | 'lighting' | 'burning' | 'consequence'
  const [burnState, setBurnState] = useState('idle')
  const [burnProgress, setBurnProgress] = useState(0) // 0 -> 1 over 20s
  const [ignitedPiles, setIgnitedPiles] = useState([]) // Array of pile IDs on fire

  // Smoke Simulation Data (relative exposure 0-100)
  const [smokeData, setSmokeData] = useState({
    playerExposure: null,
    villageExposure: null,
    disclaimer: 'Modelled game estimate, not a measured air-quality reading.',
    allParamsVerified: false
  })

  // FPS & Performance tracking
  const [showFps, setShowFps] = useState(false)
  const [fps, setFps] = useState(60)
  const [frameTimeMs, setFrameTimeMs] = useState(16.6)

  // WebGL safety / Low FPS fallback monitor
  const lowFpsStartTimeRef = useRef(null)
  const burnTimerRef = useRef(null)
  const burnIntervalRef = useRef(null)

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

  // Player interaction with a straw pile
  const handleInteract = useCallback(() => {
    if (!interactionTarget) return
    sound.initAudio()
    sound.playPop()
    setActivePile(interactionTarget)
    setShowChoiceWheel(true)
  }, [interactionTarget])

  // Initiate Burn Sequence
  const startBurnSequence = useCallback((pile) => {
    setShowChoiceWheel(false)
    const targetPile = pile || activePile || interactionTarget
    setActivePile(targetPile)
    setBurnState('lighting')
    sound.initAudio()
    sound.playTap()

    // 1.8 seconds of player lighting animation with torch
    setTimeout(() => {
      setBurnState('burning')
      sound.startFireCrackle()

      // Set initial pile on fire
      if (targetPile?.id) {
        setIgnitedPiles([targetPile.id])
      }

      // Query smoke simulation API in background
      simulateSmokeApi({
        acres: 5.0, // 8 piles represent 5 acres harvested paddy
        windSpeedMs: windState.speedMs,
        windDirDeg: windState.directionDeg,
        distanceToVillageM: 180.0,
        burnMinutes: 60.0
      })
        .then((data) => {
          setSmokeData({
            playerExposure: Math.round(data.player_smoke_index),
            villageExposure: Math.round(data.village_smoke_index),
            disclaimer: data.disclaimer || 'Modelled game estimate, not a measured air-quality reading.',
            allParamsVerified: Boolean(data.all_params_verified)
          })
        })
        .catch((err) => {
          console.warn('[Game3D] Simulation API offline, using local calibrated estimate:', err)
          setSmokeData({
            playerExposure: 84,
            villageExposure: 62,
            disclaimer: 'Modelled game estimate, not a measured air-quality reading.',
            allParamsVerified: false
          })
        })

      // 20-second atmospheric transition timer & progress ticker
      const startTime = Date.now()
      const totalDurationMs = 20000

      if (burnIntervalRef.current) clearInterval(burnIntervalRef.current)
      burnIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const prog = Math.min(1.0, elapsed / totalDurationMs)
        setBurnProgress(prog)
      }, 100)

      if (burnTimerRef.current) clearTimeout(burnTimerRef.current)
      burnTimerRef.current = setTimeout(() => {
        if (burnIntervalRef.current) clearInterval(burnIntervalRef.current)
        setBurnProgress(1.0)
        setBurnState('consequence')
        sound.stopFireCrackle()

        // Apply game consequences
        if (game?.modifyNatureHealth) {
          game.modifyNatureHealth(-25)
        }
        if (game?.addPoints) {
          game.addPoints(10)
        }
        if (game?.recordMistakeExplored) {
          game.recordMistakeExplored('choice_burn_stubble')
        }

        // Record session to backend
        recordPlaySession({
          session_id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          scenario: 'farm_crop_residue',
          choice: 'choice_burn_stubble',
          smoke_index: 62.0,
          language: 'en'
        })
      }, totalDurationMs)
    }, 1800)
  }, [activePile, interactionTarget, windState, game])

  // Reset / Rewind the field back to healthy golden state
  const resetBurn = useCallback(() => {
    sound.stopFireCrackle()
    sound.playRewindWhoosh()
    if (burnTimerRef.current) clearTimeout(burnTimerRef.current)
    if (burnIntervalRef.current) clearInterval(burnIntervalRef.current)
    setBurnState('idle')
    setBurnProgress(0)
    setIgnitedPiles([])
    setShowChoiceWheel(false)
    setActivePile(null)
    setSmokeData({
      playerExposure: null,
      villageExposure: null,
      disclaimer: 'Modelled game estimate, not a measured air-quality reading.',
      allParamsVerified: false
    })
  }, [])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      sound.stopFireCrackle()
      if (burnTimerRef.current) clearTimeout(burnTimerRef.current)
      if (burnIntervalRef.current) clearInterval(burnIntervalRef.current)
    }
  }, [])

  return (
    <Game3DContext.Provider
      value={{
        windState,
        setWindState,
        quality,
        toggleQuality,
        interactionTarget,
        setInteractionTarget,
        activePile,
        showChoiceWheel,
        setShowChoiceWheel,
        burnState,
        burnProgress,
        ignitedPiles,
        setIgnitedPiles,
        smokeData,
        startBurnSequence,
        resetBurn,
        isFieldBurnt: burnState === 'consequence',
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
