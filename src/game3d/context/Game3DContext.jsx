import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { sound } from '../../game/soundManager'
import { audioManager } from '../audio/AudioManager'
import { useGame } from '../../context/GameContext'
import { simulateSmokeApi, recordPlaySession } from '../../utils/api'
import { getQualityConfig, autoDetectQualityTier } from '../config/qualityConfig'
import { GAME_BALANCE, getSeasonEvent } from '../config/gameBalance'

const Game3DContext = createContext(null)

export function Game3DProvider({ children, onFallbackToLite }) {
  const game = useGame()

  // ==========================================
  // 1. PERSISTENT STATE & STORAGE (Carried over across seasons)
  // ==========================================
  const [persistentState, setPersistentState] = useState(() => {
    try {
      const raw = localStorage.getItem('wes_season_save')
      if (raw) {
        const parsed = JSON.parse(raw)
        return { ...GAME_BALANCE.INITIAL_STATE, ...parsed }
      }
    } catch (e) {
      console.warn('[Game3D] Failed to read wes_season_save, using initial balance:', e)
    }
    return { ...GAME_BALANCE.INITIAL_STATE }
  })

  const savePersistentState = useCallback((stateToSave) => {
    try {
      localStorage.setItem('wes_season_save', JSON.stringify(stateToSave))
    } catch (e) {
      console.warn('[Game3D] Failed to persist state to localStorage:', e)
    }
  }, [])

  // ==========================================
  // 2. SEASON STATE MACHINE
  // 'sowing' -> 'growing' -> 'harvest' -> 'decision' -> 'consequence' -> 'season_report'
  // ==========================================
  const [seasonPhase, setSeasonPhase] = useState('sowing')
  const [activeSeasonalEvent, setActiveSeasonalEvent] = useState(null)
  const [seasonReportData, setSeasonReportData] = useState(null)
  const [showSeasonReport, setShowSeasonReport] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const lastSowingWasPerfectRef = useRef(false)

  // ==========================================
  // 3. SHARED WORLD & ATMOSPHERE
  // ==========================================
  const [windState, setWindState] = useState({
    directionDeg: 75, // 0 = North, 90 = East (drifts smoke towards village)
    speedMs: 3.8
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

  const [dprScale, setDprScale] = useState(1.0)

  useEffect(() => {
    try {
      localStorage.setItem('wes_tier_locked', isTierLocked ? 'true' : 'false')
      localStorage.setItem('wes_3d_quality', quality)
    } catch {
      // Safe fallback
    }
  }, [isTierLocked, quality])

  const qualityConfig = useMemo(() => getQualityConfig(quality), [quality])

  // Toast Notification System
  const [toastNotice, setToastNotice] = useState(null)
  const toastTimeoutRef = useRef(null)
  const triggerToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastNotice(msg)
    toastTimeoutRef.current = setTimeout(() => {
      setToastNotice(null)
    }, 3400)
  }, [])

  // Check achievements helper
  const checkAndUnlockAchievements = useCallback((stateSnapshot) => {
    const unlocked = stateSnapshot.unlockedAchievements || []
    const newUnlocked = [...unlocked]
    let newlyFound = false

    GAME_BALANCE.ACHIEVEMENTS.forEach((ach) => {
      if (!newUnlocked.includes(ach.id) && ach.condition(stateSnapshot)) {
        newUnlocked.push(ach.id)
        newlyFound = true
        triggerToast(`🏆 Achievement Unlocked: ${ach.title}!`)
        sound.initAudio()
        sound.playWin()
      }
    })

    if (newlyFound) {
      const updated = { ...stateSnapshot, unlockedAchievements: newUnlocked }
      setPersistentState(updated)
      savePersistentState(updated)
      return updated
    }
    return stateSnapshot
  }, [triggerToast, savePersistentState])

  // Add Farmer XP & Level progression
  const addFarmerXP = useCallback((xpAmount) => {
    setPersistentState((prev) => {
      const currentXP = (prev.farmerXP || 0) + xpAmount
      let newLevel = prev.farmerLevel || 1
      for (let i = GAME_BALANCE.LEVELS.length - 1; i >= 0; i--) {
        if (currentXP >= GAME_BALANCE.LEVELS[i].xpNeeded) {
          newLevel = GAME_BALANCE.LEVELS[i].level
          break
        }
      }
      if (newLevel > (prev.farmerLevel || 1)) {
        const lvlDef = GAME_BALANCE.LEVELS.find((l) => l.level === newLevel)
        triggerToast(`🎉 Level Up! You are now a ${lvlDef?.title || 'Master Farmer'}!`)
        sound.initAudio()
        sound.playSuccessChime()
      }
      const updated = { ...prev, farmerXP: currentXP, farmerLevel: newLevel }
      savePersistentState(updated)
      return updated
    })
  }, [triggerToast, savePersistentState])

  const incrementPerfectSowing = useCallback(() => {
    setPersistentState((prev) => {
      const count = (prev.perfectSowingCount || 0) + 1
      const updated = { ...prev, perfectSowingCount: count }
      savePersistentState(updated)
      return updated
    })
  }, [savePersistentState])

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

  // Accessibility & Controls
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
    return false
  })

  const [invertLook, setInvertLook] = useState(false)

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

  // Day-night cycle state
  const [isDayCyclePaused, setIsDayCyclePaused] = useState(false)
  const toggleDayCycle = useCallback(() => {
    setIsDayCyclePaused((p) => !p)
  }, [])

  // Cinematic Camera & Slow-Motion States
  const [cinematicMode, setCinematicMode] = useState('flyover')
  const [isFlyoverActive, setIsFlyoverActive] = useState(true)
  const [timeScale, setTimeScale] = useState(1.0)

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

  useEffect(() => {
    audioManager.updateWind(windState.speedMs)
  }, [windState.speedMs])

  const reportFps = useCallback((currentFps, frameTime) => {
    setFps(currentFps)
    setFrameTimeMs(frameTime)

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

  // ==========================================
  // 4. GAMEPLAY INTERACTION & RESIDUE STATES
  // ==========================================
  const [interactionTarget, setInteractionTarget] = useState(null)
  const [activePile, setActivePile] = useState(null)
  const [showChoiceWheel, setShowChoiceWheel] = useState(false)
  const [hasMadeChoice, setHasMadeChoice] = useState(false)
  const [useInWorldChoices, setUseInWorldChoices] = useState(true)
  const [selectedChoiceId, setSelectedChoiceId] = useState('happy_seeder')
  const [nearestPileInfo, setNearestPileInfo] = useState(null)
  const [showOneSeasonModal, setShowOneSeasonModal] = useState(false)

  // Harvest cycle state: 'standing' | 'harvesting' | 'harvested'
  const [harvestState, setHarvestState] = useState('standing')
  const [harvestProgress, setHarvestProgress] = useState(0)
  const harvestTimerRef = useRef(null)
  const harvestIntervalRef = useRef(null)

  // Burn sequence state: 'idle' | 'lighting' | 'burning' | 'consequence'
  const [burnState, setBurnState] = useState('idle')
  const [burnProgress, setBurnProgress] = useState(0)
  const [ignitedPiles, setIgnitedPiles] = useState([])
  const burnTimerRef = useRef(null)
  const burnIntervalRef = useRef(null)

  // Smoke Simulation Data
  const [smokeData, setSmokeData] = useState({
    playerExposure: null,
    villageExposure: null,
    disclaimer: 'Modelled game estimate, not a measured air-quality reading.',
    allParamsVerified: false
  })

  // VHS Rewind state
  const [isRewinding, setIsRewinding] = useState(false)
  const [playerResetTrigger, setPlayerResetTrigger] = useState(0)

  // Live Alternatives state: null | 'happy_seeder' | 'bale_sell' | 'mulch' | 'compost'
  const [activeAlternative, setActiveAlternative] = useState(null)
  const [alternativeProgress, setAlternativeProgress] = useState(0)
  const [rupeeCount, setRupeeCount] = useState(0)

  const [showComparison, setShowComparison] = useState(false)
  const [showPledgeModal, setShowPledgeModal] = useState(false)

  const altIntervalRef = useRef(null)
  const altTimerRef = useRef(null)

  // ==========================================
  // 5. SEASON FLOW ACTIONS
  // ==========================================

  // Step A: Complete Sowing (from SowingMiniGame)
  const completeSowing = useCallback((isPerfect) => {
    lastSowingWasPerfectRef.current = isPerfect
    setSeasonPhase('growing')
    const currentEvent = getSeasonEvent(persistentState.seasonIndex || 1)
    setActiveSeasonalEvent(currentEvent)
  }, [persistentState.seasonIndex])

  // Step B: Resolve Seasonal Random Event
  const resolveSeasonalEvent = useCallback((option) => {
    if (option && option.apply) {
      setPersistentState((prev) => {
        const nextState = option.apply(prev)
        savePersistentState(nextState)
        checkAndUnlockAchievements(nextState)
        return nextState
      })
    }
    setActiveSeasonalEvent(null)
    triggerToast('Field growth cycle complete! Ready for harvest.')
    // Automatically transition to harvest sequence
    setSeasonPhase('harvest')
    startHarvestSequence()
  }, [savePersistentState, checkAndUnlockAchievements, triggerToast])

  // Step C: Harvest Sequence
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
      setSeasonPhase('decision')
      sound.stopTractorEngine()
      sound.playSuccessChime()
      triggerToast('🌾 Paddy harvested! Approach the straw pile to decide residue action.')
    }, durationMs)
  }, [triggerToast])

  const skipHarvest = useCallback(() => {
    if (harvestTimerRef.current) clearTimeout(harvestTimerRef.current)
    if (harvestIntervalRef.current) clearInterval(harvestIntervalRef.current)
    sound.stopTractorEngine()
    sound.playTap()
    setHarvestProgress(1.0)
    setHarvestState('harvested')
    setSeasonPhase('decision')
    triggerToast('🌾 Harvest complete! Choose how to manage the stubble.')
  }, [triggerToast])

  // Step D: Finish Season & Calculate Carry-Over Consequences
  const finishSeason = useCallback((choiceKey) => {
    const decisionConfig = GAME_BALANCE.DECISIONS[choiceKey] || GAME_BALANCE.DECISIONS.burn
    const soilHealth = persistentState.soilHealth || 70
    const villageHealth = persistentState.villageHealth || 75
    const isPerfectSow = lastSowingWasPerfectRef.current

    // Base grain revenue scaled by current soil health + sowing precision
    const baseRevenue = GAME_BALANCE.HARVEST.BASE_CROP_REVENUE
    const minRevenue = GAME_BALANCE.HARVEST.MIN_CROP_REVENUE
    const healthMult = Math.max(0.4, soilHealth / 100)
    const sowBonus = isPerfectSow ? 1.10 : 1.0
    const cropRevenue = Math.max(minRevenue, Math.round(baseRevenue * healthMult * sowBonus))

    // Decision specific costs / gains
    const decisionRevenue = (decisionConfig.baleSaleGrossIncome || 0) + (decisionConfig.moneyCost || 0)
    const netSeasonBalance = cropRevenue + decisionRevenue

    const soilDelta = decisionConfig.soilHealthDelta
    const villageDelta = decisionConfig.villageHealthDelta
    const repDelta = decisionConfig.reputationDelta
    const xpGained = decisionConfig.xpAward

    const nextStreak = decisionConfig.streakReset ? 0 : (persistentState.streak || 0) + 1

    // Calculate score (0-100) for letter rank
    const compositeScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (soilHealth + soilDelta) * 0.4 +
          (villageHealth + villageDelta) * 0.4 +
          (choiceKey !== 'burn' ? 20 : 0) +
          nextStreak * 2
        )
      )
    )

    let rank = GAME_BALANCE.RANKS.C
    if (compositeScore >= GAME_BALANCE.RANKS.S.minScore) rank = GAME_BALANCE.RANKS.S
    else if (compositeScore >= GAME_BALANCE.RANKS.A.minScore) rank = GAME_BALANCE.RANKS.A
    else if (compositeScore >= GAME_BALANCE.RANKS.B.minScore) rank = GAME_BALANCE.RANKS.B

    const summaryText =
      choiceKey === 'burn'
        ? 'Stubble was burnt. Heavy smog drifted into the village, and soil microbes perished in the heat.'
        : choiceKey === 'happy_seeder'
        ? 'Happy Seeder zero-till drilling preserved field moisture and kept the village skies pure.'
        : choiceKey === 'bale_sell'
        ? 'Residue was baled and transported to the bio-energy refinery, generating ₹15,000 extra income.'
        : choiceKey === 'mulch'
        ? 'Mulching shielded topsoil moisture, nurtured earthworms, and boosted next season root vitality.'
        : 'Bio-decomposer converted straw into fertile organic humus, reviving soil biodiversity.'

    const report = {
      rank,
      choiceKey,
      cropRevenue,
      decisionRevenue,
      netSeasonBalance,
      soilDelta,
      villageDelta,
      repDelta,
      xpGained,
      streak: nextStreak,
      summaryText
    }

    setSeasonReportData(report)

    // Apply carry-over to persistent state
    setPersistentState((prev) => {
      const nextSoil = Math.max(0, Math.min(100, (prev.soilHealth || 70) + soilDelta))
      const nextVillage = Math.max(0, Math.min(100, (prev.villageHealth || 75) + villageDelta))
      const nextMoney = Math.max(0, (prev.money || 12000) + netSeasonBalance)
      const nextRep = Math.max(0, Math.min(100, (prev.reputation || 50) + repDelta))
      const nextXP = (prev.farmerXP || 0) + xpGained

      let nextLevel = prev.farmerLevel || 1
      for (let i = GAME_BALANCE.LEVELS.length - 1; i >= 0; i--) {
        if (nextXP >= GAME_BALANCE.LEVELS[i].xpNeeded) {
          nextLevel = GAME_BALANCE.LEVELS[i].level
          break
        }
      }

      const updated = {
        ...prev,
        soilHealth: nextSoil,
        villageHealth: nextVillage,
        money: nextMoney,
        reputation: nextRep,
        streak: nextStreak,
        farmerXP: nextXP,
        farmerLevel: nextLevel,
        totalBaleIncome: (prev.totalBaleIncome || 0) + (decisionConfig.baleSaleGrossIncome || 0),
        happySeederUses: (prev.happySeederUses || 0) + (choiceKey === 'happy_seeder' ? 1 : 0),
        compostUses: (prev.compostUses || 0) + (choiceKey === 'compost' ? 1 : 0),
        mulchUses: (prev.mulchUses || 0) + (choiceKey === 'mulch' ? 1 : 0),
        history: [...(prev.history || []), { seasonIndex: prev.seasonIndex || 1, choiceKey, netSeasonBalance, rank: rank.rank }]
      }

      savePersistentState(updated)
      checkAndUnlockAchievements(updated)
      return updated
    })

    // Advance to season report
    setSeasonPhase('season_report')
    setShowSeasonReport(true)
  }, [persistentState, savePersistentState, checkAndUnlockAchievements])

  // Step E: Next Season Transition
  const nextSeason = useCallback(() => {
    setShowSeasonReport(false)
    setShowComparison(false)
    setShowOneSeasonModal(false)
    setBurnState('idle')
    setBurnProgress(0)
    setIgnitedPiles([])
    setActiveAlternative(null)
    setAlternativeProgress(0)
    setRupeeCount(0)
    setHasMadeChoice(false)
    setHarvestState('standing')
    setHarvestProgress(0)
    setPlayerResetTrigger((p) => p + 1)
    audioManager.setMusicState('calm')

    setPersistentState((prev) => {
      const nextSeasonIdx = (prev.seasonIndex || 1) + 1
      const nextYearIdx = Math.floor((nextSeasonIdx - 1) / 2) + 1
      const updated = {
        ...prev,
        seasonIndex: nextSeasonIdx,
        yearIndex: nextYearIdx
      }
      savePersistentState(updated)
      triggerToast(`🌾 Welcome to Season ${nextSeasonIdx} • Year ${nextYearIdx}! Time to sow.`)
      return updated
    })

    setSeasonPhase('sowing')
  }, [savePersistentState, triggerToast])

  // Replay Current Season (Rewind & Try Alternate Choice)
  const replaySeason = useCallback(() => {
    setShowSeasonReport(false)
    setShowComparison(false)
    setShowOneSeasonModal(false)
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
      setHarvestState('harvested')
      setHarvestProgress(1.0)
      setSeasonPhase('decision')
      setShowChoiceWheel(true)
      triggerToast('Rewound to harvest! Explore an alternative approach.')
    }, 1350)
  }, [triggerToast])

  // Start New Game (Reset all progression)
  const resetNewGame = useCallback(() => {
    try {
      localStorage.removeItem('wes_season_save')
    } catch {
      // Safe fallback
    }
    const fresh = { ...GAME_BALANCE.INITIAL_STATE }
    setPersistentState(fresh)
    setShowSeasonReport(false)
    setShowComparison(false)
    setShowOneSeasonModal(false)
    setBurnState('idle')
    setBurnProgress(0)
    setIgnitedPiles([])
    setActiveAlternative(null)
    setAlternativeProgress(0)
    setRupeeCount(0)
    setHasMadeChoice(false)
    setHarvestState('standing')
    setHarvestProgress(0)
    setSeasonPhase('sowing')
    setPlayerResetTrigger((p) => p + 1)
    audioManager.setMusicState('calm')
    triggerToast('🔄 New Farm Game started! First sowing season ready.')
  }, [triggerToast])

  // Initiate Burn Sequence with slow-motion beat and push-in camera
  const startBurnSequence = useCallback((pile) => {
    setShowChoiceWheel(false)
    setShowOneSeasonModal(false)
    setHasMadeChoice(true)
    setSeasonPhase('consequence')
    const targetPile = pile || activePile || interactionTarget
    setActivePile(targetPile)
    setBurnState('lighting')
    setCinematicMode('burn_focus')
    if (!reducedMotion) {
      setTimeScale(0.3)
    }
    sound.initAudio()
    sound.playTap()
    triggerHaptic([40, 30, 40])
    audioManager.setMusicState('tense')

    setTimeout(() => {
      setTimeScale(1.0)
      setCinematicMode('normal')
    }, 1500)

    setTimeout(() => {
      setBurnState('burning')
      sound.startFireCrackle()

      if (targetPile?.id) {
        setIgnitedPiles([targetPile.id])
      }

      simulateSmokeApi({
        acres: 5.0,
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

        if (game?.modifyNatureHealth) game.modifyNatureHealth(-25)
        if (game?.addPoints) game.addPoints(10)
        if (game?.recordMistakeExplored) game.recordMistakeExplored('choice_burn_stubble')

        recordPlaySession({
          session_id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          scenario: 'farm_crop_residue',
          choice: 'choice_burn_stubble',
          smoke_index: 62.0,
          language: 'en'
        })

        // Conclude season
        finishSeason('burn')
      }, totalDurationMs)
    }, 1800)
  }, [activePile, interactionTarget, windState, reducedMotion, triggerHaptic, game, finishSeason])

  // Trigger VHS-style Rewind
  const triggerRewind = useCallback(() => {
    replaySeason()
  }, [replaySeason])

  // Start one of the 4 sustainable alternatives
  const startAlternative = useCallback((altKey) => {
    setShowChoiceWheel(false)
    setHasMadeChoice(true)
    setSeasonPhase('consequence')
    sound.initAudio()
    sound.playTap()
    audioManager.setMusicState('hopeful')
    setActiveAlternative(altKey)
    setAlternativeProgress(0)
    setRupeeCount(0)

    setCinematicMode('alt_showcase')
    setTimeout(() => {
      setCinematicMode('normal')
    }, 4500)

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

      if (game?.modifyNatureHealth) game.modifyNatureHealth(25)
      if (game?.addPoints) game.addPoints(50)
      if (game?.unlockBadge) {
        game.unlockBadge('soil_saver')
        game.unlockBadge('curious_mind')
      }
      if (game?.markScenarioCompleted) game.markScenarioCompleted('farm_crop_residue')

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

      setShowComparison(true)
      finishSeason(altKey)
    }, durationMs)
  }, [game, triggerHaptic, finishSeason])

  const handleInteract = useCallback(() => {
    if (!interactionTarget) return
    sound.initAudio()
    sound.playPop()
    setActivePile(interactionTarget)
    if (!useInWorldChoices) {
      setShowChoiceWheel(true)
    }
  }, [interactionTarget, useInWorldChoices])

  const resetBurn = useCallback(() => {
    triggerRewind()
  }, [triggerRewind])

  useEffect(() => {
    return () => {
      sound.stopFireCrackle()
      sound.stopTractorEngine()
      sound.stopBalerSound()
      if (burnTimerRef.current) clearTimeout(burnTimerRef.current)
      if (burnIntervalRef.current) clearInterval(burnIntervalRef.current)
      if (altTimerRef.current) clearTimeout(altTimerRef.current)
      if (altIntervalRef.current) clearInterval(altIntervalRef.current)
      if (harvestTimerRef.current) clearTimeout(harvestTimerRef.current)
      if (harvestIntervalRef.current) clearInterval(harvestIntervalRef.current)
    }
  }, [])

  return (
    <Game3DContext.Provider
      value={{
        persistentState,
        setPersistentState,
        seasonPhase,
        setSeasonPhase,
        activeSeasonalEvent,
        setActiveSeasonalEvent,
        seasonReportData,
        showSeasonReport,
        setShowSeasonReport,
        showAchievements,
        setShowAchievements,
        completeSowing,
        resolveSeasonalEvent,
        finishSeason,
        nextSeason,
        replaySeason,
        resetNewGame,
        addFarmerXP,
        incrementPerfectSowing,
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
        setActivePile,
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
