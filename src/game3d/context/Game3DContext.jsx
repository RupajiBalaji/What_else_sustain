import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { sound } from '../../game/soundManager'
import { audioManager } from '../audio/AudioManager'
import { useGame } from '../../context/GameContext'
import { simulateSmokeApi, recordPlaySession } from '../../utils/api'

import { getQualityConfig, autoDetectQualityTier } from '../config/qualityConfig'

const Game3DContext = createContext(null)

export function Game3DProvider({ children, onFallbackToLite }) {
  const game = useGame()
  // Shared wind parameters (used for 3D visual flag/trees, audio, and backend smoke simulation)
  const [windState, setWindState] = useState({
    directionDeg: 75, // 0 = North, 90 = East (drifts smoke towards village at Z=45, X=5)
    speedMs: 3.8,      // m/s
  })

  // Quality tier settings: 'high' | 'medium' | 'low'
  const [quality, setQuality] = useState(() => {
    try {
      const saved = localStorage.getItem('wes_3d_quality')
      if (saved && (saved === 'high' || saved === 'medium' || saved === 'low')) {
        return saved
      }
      return autoDetectQualityTier()
    } catch {
      return autoDetectQualityTier()
    }
  })

  const [isTierLocked, setIsTierLocked] = useState(() => {
    try {
      return localStorage.getItem('wes_tier_locked') === 'true'
    } catch {
      return false
    }
  })

  // Dynamic Resolution Scale (1.0 = native, down to 0.72 under heavy load)
  const [dprScale, setDprScale] = useState(1.0)

  // Persist tier lock state
  useEffect(() => {
    try {
      localStorage.setItem('wes_tier_locked', isTierLocked ? 'true' : 'false')
      localStorage.setItem('wes_3d_quality', quality)
    } catch {
      // Safe fallback
    }
  }, [isTierLocked, quality])

  const qualityConfig = useMemo(() => getQualityConfig(quality), [quality])

  // Toast Notification System ("Adjusted graphics for smooth play")
  const [toastNotice, setToastNotice] = useState(null)
  const toastTimeoutRef = useRef(null)
  const triggerToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastNotice(msg)
    toastTimeoutRef.current = setTimeout(() => {
      setToastNotice(null)
    }, 3200)
  }, [])

  // Settings Drawer & Diagnostics
  const [showSettings, setShowSettings] = useState(false)
  const [showDevStats, setShowDevStats] = useState(false)
  const toggleDevStats = useCallback(() => {
    setShowDevStats((p) => !p)
  }, [])

  // Audio Channels State
  const [soundVolume, setSoundVolume] = useState(0.8)
  const [musicVolume, setMusicVolume] = useState(0.6)
  const [isMuted, setIsMuted] = useState(false)

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      sound.setMuted(next)
      audioManager.setMuted(next)
      return next
    })
  }, [])

  // Accessibility & Controls: Reduced Motion & Invert Look
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
    return false
  })

  const [invertLook, setInvertLook] = useState(false)

  // Haptic feedback trigger (respects reducedMotion)
  const triggerHaptic = useCallback((pattern) => {
    if (reducedMotion) return
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern)
      } catch {
        // Safe fallback
      }
    }
  }, [reducedMotion])

  // Day-night cycle state: golden-hour by default, can be paused/resumed
  const [isDayCyclePaused, setIsDayCyclePaused] = useState(false)
  const toggleDayCycle = useCallback(() => {
    setIsDayCyclePaused((p) => !p)
  }, [])

  // Cinematic Camera & Slow-Motion States
  // 'flyover' | 'normal' | 'burn_focus' | 'alt_showcase'
  const [cinematicMode, setCinematicMode] = useState('flyover')
  const [isFlyoverActive, setIsFlyoverActive] = useState(true)
  const [timeScale, setTimeScale] = useState(1.0) // 0.3 for slow motion

  const skipFlyover = useCallback(() => {
    setIsFlyoverActive(false)
    setCinematicMode('normal')
  }, [])

  // Diagnostics & FPS Monitor
  const [showFps, setShowFps] = useState(false)
  const [fps, setFps] = useState(60)
  const [frameTimeMs, setFrameTimeMs] = useState(16.6)
  const lowFpsStartTimeRef = useRef(null)

  const toggleFps = useCallback(() => {
    sound.initAudio()
    sound.playTap()
    setShowFps((prev) => !prev)
  }, [])

  // Keyboard shortcuts: Press 'F' to toggle FPS, 'G' to toggle GPU stats overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'f' || e.key === 'F') {
        toggleFps()
      } else if (e.key === 'g' || e.key === 'G') {
        toggleDevStats()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFps, toggleDevStats])

  // Update wind audio loop when wind speed changes
  useEffect(() => {
    audioManager.updateWind(windState.speedMs)
  }, [windState.speedMs])

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

  const toggleQuality = useCallback(() => {
    sound.initAudio()
    sound.playTap()
    setQuality((prev) => {
      const cycle = { high: 'medium', medium: 'low', low: 'high' }
      const next = cycle[prev] || 'high'
      try {
        localStorage.setItem('wes_3d_quality', next)
      } catch {
        // Safe fallback
      }
      return next
    })
  }, [])

  // Initiate Burn Sequence with slow-motion beat and push-in camera
  const startBurnSequence = useCallback((pile) => {
    setShowChoiceWheel(false)
    setShowOneSeasonModal(false)
    setHasMadeChoice(true)
    const targetPile = pile || activePile || interactionTarget
    setActivePile(targetPile)
    setBurnState('lighting')
    setCinematicMode('burn_focus')
    if (!reducedMotion) {
      setTimeScale(0.3) // 0.3x time slow-motion beat for 1.5s
    }
    sound.initAudio()
    sound.playTap()
    triggerHaptic([40, 30, 40])
    audioManager.setMusicState('tense')

    // Slow-mo beat for 1.5s then return to regular timeScale and normal camera
    setTimeout(() => {
      setTimeScale(1.0)
      setCinematicMode('normal')
    }, 1500)

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
    audioManager.setMusicState('calm')
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
      setShowOneSeasonModal(false)
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
    audioManager.setMusicState('hopeful')
    setActiveAlternative(altKey)
    setAlternativeProgress(0)
    setRupeeCount(0)

    // Smooth showcase dolly to showcase machine at work
    setCinematicMode('alt_showcase')
    setTimeout(() => {
      setCinematicMode('normal')
    }, 4500)

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

    const durationMs = 14500
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
      triggerHaptic(60)
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
  }, [game, triggerHaptic])

  // Player interaction with a straw pile (handles both in-world choices and legacy wheel)
  const handleInteract = useCallback(() => {
    if (!interactionTarget) return
    sound.initAudio()
    sound.playPop()
    setActivePile(interactionTarget)
    if (!useInWorldChoices) {
      // Legacy wheel mode: open the radial choice wheel
      setShowChoiceWheel(true)
    }
  }, [interactionTarget, useInWorldChoices])

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
        setQuality,
        qualityConfig,
        toggleQuality,
        isTierLocked,
        setIsTierLocked,
        dprScale,
        setDprScale,
        toastNotice,
        triggerToast,
        showSettings,
        setShowSettings,
        showDevStats,
        setShowDevStats,
        toggleDevStats,
        soundVolume,
        setSoundVolume,
        musicVolume,
        setMusicVolume,
        isMuted,
        toggleMute,
        reducedMotion,
        setReducedMotion,
        invertLook,
        setInvertLook,
        triggerHaptic,
        isDayCyclePaused,
        toggleDayCycle,
        cinematicMode,
        setCinematicMode,
        isFlyoverActive,
        skipFlyover,
        timeScale,
        interactionTarget,
        setInteractionTarget,
        activePile,
        showChoiceWheel,
        setShowChoiceWheel,
        useInWorldChoices,
        setUseInWorldChoices,
        selectedChoiceId,
        setSelectedChoiceId,
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
        showOneSeasonModal,
        setShowOneSeasonModal,
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
