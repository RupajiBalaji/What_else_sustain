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
  const [hasMadeChoice, setHasMadeChoice] = useState(false)
  const [nearestPileInfo, setNearestPileInfo] = useState(null)
  // Harvest cycle state: 'standing' (pre-harvest green field) | 'harvesting' (harvester sweep) | 'harvested' (stubble & straw piles ready)
  const [harvestState, setHarvestState] = useState('standing')
  const [harvestProgress, setHarvestProgress] = useState(0)
  const harvestTimerRef = useRef(null)
  const harvestIntervalRef = useRef(null)

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
    setHasMadeChoice(true)
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

  // VHS Rewind state
  const [isRewinding, setIsRewinding] = useState(false)
  const [playerResetTrigger, setPlayerResetTrigger] = useState(0)

  // Live Alternatives state: null | 'happy_seeder' | 'bale_sell' | 'mulch' | 'compost'
  const [activeAlternative, setActiveAlternative] = useState(null)
  const [alternativeProgress, setAlternativeProgress] = useState(0)
  const [rupeeCount, setRupeeCount] = useState(0)

  // Split-screen comparison modal
  const [showComparison, setShowComparison] = useState(false)
  const [showPledgeModal, setShowPledgeModal] = useState(false)

  const altIntervalRef = useRef(null)
  const altTimerRef = useRef(null)

  // Trigger VHS-style Rewind
  const triggerRewind = useCallback(() => {
    sound.stopFireCrackle()
    sound.stopTractorEngine()
    sound.stopBalerSound()
    sound.playRewindWhoosh()
    setIsRewinding(true)

    if (burnTimerRef.current) clearTimeout(burnTimerRef.current)
    if (burnIntervalRef.current) clearInterval(burnIntervalRef.current)
    if (altTimerRef.current) clearTimeout(altTimerRef.current)
    if (altIntervalRef.current) clearInterval(altIntervalRef.current)

    setTimeout(() => {
      setIsRewinding(false)
      setBurnState('idle')
      setBurnProgress(0)
      setIgnitedPiles([])
      setActiveAlternative(null)
      setAlternativeProgress(0)
      setRupeeCount(0)
      setPlayerResetTrigger((p) => p + 1)
      setHasMadeChoice(false)
      setHarvestState('harvested')
      setHarvestProgress(1.0)
      setSmokeData({
        playerExposure: null,
        villageExposure: null,
        disclaimer: 'Modelled game estimate, not a measured air-quality reading.',
        allParamsVerified: false
      })
      // Automatically reopen choice wheel so player can test alternatives!
      setShowChoiceWheel(true)
    }, 1350)
  }, [])

  // 5-second cinematic harvest pass across standing green field
  const startHarvestSequence = useCallback(() => {
    sound.initAudio()
    sound.startTractorEngine()
    setHarvestState('harvesting')
    setHarvestProgress(0)

    const startTime = Date.now()
    const durationMs = 5200

    if (harvestIntervalRef.current) clearInterval(harvestIntervalRef.current)
    harvestIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const p = Math.min(1.0, elapsed / durationMs)
      setHarvestProgress(p)
    }, 50)

    if (harvestTimerRef.current) clearTimeout(harvestTimerRef.current)
    harvestTimerRef.current = setTimeout(() => {
      if (harvestIntervalRef.current) clearInterval(harvestIntervalRef.current)
      setHarvestProgress(1.0)
      setHarvestState('harvested')
      sound.stopTractorEngine()
      sound.playSuccessChime()
    }, durationMs)
  }, [])

  // Immediate skip button action
  const skipHarvest = useCallback(() => {
    if (harvestTimerRef.current) clearTimeout(harvestTimerRef.current)
    if (harvestIntervalRef.current) clearInterval(harvestIntervalRef.current)
    sound.stopTractorEngine()
    sound.playTap()
    setHarvestProgress(1.0)
    setHarvestState('harvested')
  }, [])

  // Start one of the 4 sustainable alternatives
  const startAlternative = useCallback((altKey) => {
    setShowChoiceWheel(false)
    setHasMadeChoice(true)
    sound.initAudio()
    sound.playTap()
    setActiveAlternative(altKey)
    setAlternativeProgress(0)
    setRupeeCount(0)

    // Clean air: zero open burning
    setSmokeData({
      playerExposure: 2,
      villageExposure: 1,
      disclaimer: 'Modelled game estimate: Clean Air from zero open burning.',
      allParamsVerified: true
    })

    if (altKey === 'happy_seeder') {
      sound.startTractorEngine()
    } else if (altKey === 'bale_sell') {
      sound.startBalerSound()
    }

    const durationMs = 12000
    const startTime = Date.now()

    if (altIntervalRef.current) clearInterval(altIntervalRef.current)
    altIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const prog = Math.min(1.0, elapsed / durationMs)
      setAlternativeProgress(prog)

      if (altKey === 'bale_sell') {
        // Increment revenue from ₹0 to ₹15,000 (5 acres * ₹3,000/acre net)
        const targetRupees = 15000
        const currentRupees = Math.round(targetRupees * Math.pow(prog, 1.2))
        setRupeeCount(currentRupees)
      }
    }, 100)

    if (altTimerRef.current) clearTimeout(altTimerRef.current)
    altTimerRef.current = setTimeout(() => {
      if (altIntervalRef.current) clearInterval(altIntervalRef.current)
      sound.stopTractorEngine()
      sound.stopBalerSound()
      sound.playSuccessChime()
      setAlternativeProgress(1.0)
      if (altKey === 'bale_sell') {
        setRupeeCount(15000)
        sound.playCoin()
      }

      // Award game rewards
      if (game?.modifyNatureHealth) {
        game.modifyNatureHealth(25)
      }
      if (game?.addPoints) {
        game.addPoints(50)
      }
      if (game?.unlockBadge) {
        game.unlockBadge('soil_saver')
        game.unlockBadge('curious_mind')
      }
      if (game?.markScenarioCompleted) {
        game.markScenarioCompleted('farm_crop_residue')
      }

      // Record sustainable session to backend
      const choiceId =
        altKey === 'bale_sell'
          ? 'choice_sell_biomass'
          : altKey === 'compost'
          ? 'choice_compost_decomposer'
          : 'choice_mulch_soil'

      recordPlaySession({
        session_id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        scenario: 'farm_crop_residue',
        choice: choiceId,
        smoke_index: 1.0,
        language: 'en'
      })

      // Show the Before/After Comparison Split Slider!
      setShowComparison(true)
    }, durationMs)
  }, [game])

  // Reset / Rewind the field back to healthy golden state
  const resetBurn = useCallback(() => {
    triggerRewind()
  }, [triggerRewind])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      sound.stopFireCrackle()
      sound.stopTractorEngine()
      sound.stopBalerSound()
      if (burnTimerRef.current) clearTimeout(burnTimerRef.current)
      if (burnIntervalRef.current) clearInterval(burnIntervalRef.current)
      if (altTimerRef.current) clearTimeout(altTimerRef.current)
      if (altIntervalRef.current) clearInterval(altIntervalRef.current)
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
        hasMadeChoice,
        nearestPileInfo,
        setNearestPileInfo,
        harvestState,
        harvestProgress,
        startHarvestSequence,
        skipHarvest,
        burnState,
        burnProgress,
        ignitedPiles,
        setIgnitedPiles,
        smokeData,
        startBurnSequence,
        resetBurn,
        isFieldBurnt: burnState === 'consequence',
        isRewinding,
        triggerRewind,
        playerResetTrigger,
        activeAlternative,
        alternativeProgress,
        startAlternative,
        rupeeCount,
        showComparison,
        setShowComparison,
        showPledgeModal,
        setShowPledgeModal,
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
