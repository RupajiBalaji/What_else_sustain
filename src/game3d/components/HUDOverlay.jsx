import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'
import { playerInput } from './FarmerPlayer'
import ChoiceWheel from './ChoiceWheel'
import InWorldChoicePanel from './InWorldChoicePanel'
import SmokeMeterHUD from './SmokeMeterHUD'
import OneSeasonLaterModal from './OneSeasonLaterModal'
import RewindGlitchOverlay from './RewindGlitchOverlay'
import RupeeCounterHUD from './RupeeCounterHUD'
import ComparisonSliderModal from './ComparisonSliderModal'
import KidPledgeScreen from '../../game/KidPledgeScreen'
import SettingsDrawer from './SettingsDrawer'
import SowingMiniGame from './SowingMiniGame'
import GrowingTimeLapse from './GrowingTimeLapse'
import SeasonalEventModal from './SeasonalEventModal'
import SeasonReportModal from './SeasonReportModal'
import AchievementsPanel from './AchievementsPanel'

export default function HUDOverlay({ onSwitchToLite }) {
  const { t } = useLanguage()
  const {
    persistentState,
    seasonPhase,
    activeSeasonalEvent,
    resolveSeasonalEvent,
    showSeasonReport,
    setShowSeasonReport,
    showAchievements,
    setShowAchievements,
    nextSeason,
    replaySeason,
    windState,
    quality,
    toggleQuality,
    interactionTarget,
    nearestPileInfo,
    activeAlternative,
    hasMadeChoice,
    harvestState,
    harvestProgress,
    skipHarvest,
    jumpToDecisionPhase,
    setInteractionTarget,
    handleInteract,
    rotateCamera,
    zoomCamera,
    resetCamera,
    watchVillage,
    proceedToSeasonReport,
    burnState,
    useInWorldChoices,
    showOneSeasonModal,
    setShowOneSeasonModal,
    showPledgeModal,
    setShowPledgeModal,
    showFps,
    toggleFps,
    fps,
    frameTimeMs,
    showSettings,
    setShowSettings,
    toastNotice,
    invertLook
  } = useGame3D()

  // Mobile virtual joystick state
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const joystickBaseRef = useRef(null)
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 })
  const isDraggingJoystickRef = useRef(false)
  const joystickTouchIdRef = useRef(null)

  // Look touch surface state
  const lookTouchIdRef = useRef(null)
  const lastLookXRef = useRef(0)

  const isChoicePanelOpen =
    Boolean(useInWorldChoices) &&
    (harvestState === 'harvested' || seasonPhase === 'decision') &&
    burnState === 'idle' &&
    activeAlternative === null &&
    !hasMadeChoice

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)

    // Keyboard 'E' listener for straw interaction
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'e' || e.key === 'E') {
        if (interactionTarget) {
          handleInteract()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [interactionTarget, handleInteract])

  // Touch handlers for virtual joystick
  const handleJoystickTouchStart = (e) => {
    e.preventDefault()
    const touch = e.changedTouches[0]
    joystickTouchIdRef.current = touch.identifier
    isDraggingJoystickRef.current = true
    updateJoystick(touch.clientX, touch.clientY)
  }

  const handleJoystickTouchMove = (e) => {
    e.preventDefault()
    if (!isDraggingJoystickRef.current) return
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (touch.identifier === joystickTouchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY)
        break
      }
    }
  }

  const handleJoystickTouchEnd = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        isDraggingJoystickRef.current = false
        joystickTouchIdRef.current = null
        setKnobPos({ x: 0, y: 0 })
        playerInput.joystickX = 0
        playerInput.joystickY = 0
        break
      }
    }
  }

  const updateJoystick = (clientX, clientY) => {
    if (!joystickBaseRef.current) return
    const rect = joystickBaseRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const dx = clientX - centerX
    const dy = clientY - centerY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxRadius = 45
    const deadzone = 7 // 0.15 * 45px deadzone to eliminate touch drift

    if (dist < deadzone) {
      setKnobPos({ x: 0, y: 0 })
      playerInput.joystickX = 0
      playerInput.joystickY = 0
      return
    }

    const clampedDist = Math.min(dist, maxRadius)
    const angle = Math.atan2(dy, dx)
    const knobX = Math.cos(angle) * clampedDist
    const knobY = Math.sin(angle) * clampedDist

    setKnobPos({ x: knobX, y: knobY })
    // Remap deadzone range smoothly to 0..1
    const normalizedMag = (clampedDist - deadzone) / (maxRadius - deadzone)
    playerInput.joystickX = Math.cos(angle) * normalizedMag
    playerInput.joystickY = Math.sin(angle) * normalizedMag
  }

  // Touch handlers for Drag-to-Look area (right side)
  const handleLookTouchStart = (e) => {
    const touch = e.changedTouches[0]
    lookTouchIdRef.current = touch.identifier
    lastLookXRef.current = touch.clientX
  }

  const handleLookTouchMove = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookXRef.current
        lastLookXRef.current = touch.clientX
        playerInput.lookDeltaX = invertLook ? -dx : dx
        break
      }
    }
  }

  const handleLookTouchEnd = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null
        playerInput.lookDeltaX = 0
        break
      }
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'calc(14px + env(safe-area-inset-top, 0px)) calc(14px + env(safe-area-inset-right, 0px)) calc(14px + env(safe-area-inset-bottom, 0px)) calc(14px + env(safe-area-inset-left, 0px))',
        zIndex: 50,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        userSelect: 'none'
      }}
    >
      {/* TOP HEADER CLUSTER (Respects safe-area insets) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          width: '100%',
          pointerEvents: 'none'
        }}
      >
        {/* 1. TOP HUD BAR: Single non-wrapping row (menu, wind, settings, quality, [fps if enabled]) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
            flexWrap: 'nowrap',
            width: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            pointerEvents: 'auto'
          }}
        >
          {/* Left: Lite Mode & Wind */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              data-testid="switch-to-lite-button"
              onClick={onSwitchToLite}
              style={{
                minHeight: '40px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                color: '#16382B',
                border: '2px solid #2E7D32',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap'
              }}
              aria-label="Switch to Lite 2D Mode"
            >
              <span>📱</span>
              <span>{t('game3d.switchToLite')}</span>
            </button>

            {/* Wind Indicator Pill */}
            <div
              style={{
                minHeight: '40px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                border: '2px solid #0288D1',
                color: '#01579B',
                fontWeight: 800,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap'
              }}
              title="Current Wind Direction & Speed (affects smoke dispersion)"
            >
              <span>🧭</span>
              <span
                style={{
                  display: 'inline-block',
                  transform: `rotate(${windState?.directionDeg || 75}deg)`,
                  fontSize: '1.05rem',
                  transition: 'transform 0.4s ease'
                }}
              >
                ⬆️
              </span>
              <span>{windState?.speedMs || 3.8} m/s</span>
            </div>

            {/* Always-Visible HUD Button: Choose what to do with the straw */}
            {seasonPhase !== 'decision' && burnState === 'idle' && (
              <button
                type="button"
                data-testid="choose-straw-action-btn"
                id="choose-straw-action-btn"
                onClick={jumpToDecisionPhase}
                style={{
                  minHeight: '40px',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  backgroundColor: '#D84315',
                  color: '#FFFFFF',
                  border: '2px solid #FFAB91',
                  fontWeight: 900,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(216,67,21,0.35)',
                  whiteSpace: 'nowrap'
                }}
                title="Choose what to do with the straw"
              >
                <span>🌾</span>
                <span>Choose what to do with the straw</span>
              </button>
            )}
          </div>

          {/* Right: Settings, Quality, and FPS toggle (hidden unless showFps is enabled) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* FPS Button: Hidden unless showFps is active */}
            {showFps && (
              <button
                type="button"
                onClick={toggleFps}
                style={{
                  minHeight: '40px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#E8F5E9',
                  border: '2px solid #37474F',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  color: '#263238',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title="FPS display active (press F or click to hide)"
              >
                ⚡ {fps} FPS
              </button>
            )}

            {/* Quality Toggle */}
            <button
              type="button"
              onClick={toggleQuality}
              style={{
                minHeight: '40px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: quality === 'high' ? '#FFF9C4' : quality === 'medium' ? '#E1F5FE' : '#ECEFF1',
                border: '2px solid #E65100',
                fontWeight: 800,
                fontSize: '0.8rem',
                color: '#BF360C',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              title="Toggle graphics quality"
            >
              {quality === 'high' ? '💎 High' : quality === 'medium' ? '⚖️ Med' : '⚡ Low'}
            </button>

            {/* Settings Drawer Button */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              style={{
                minHeight: '40px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                border: '2px solid #2E7D32',
                fontWeight: 800,
                fontSize: '0.8rem',
                color: '#16382B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
              title="Open Settings"
              aria-label="Open Game Settings"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* 2. ONE OBJECTIVE BANNER (Shown only when harvest is active or done without in-world choice panel open) */}
        {seasonPhase === 'harvest' && harvestState === 'harvesting' && (
          <div
            style={{
              alignSelf: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(27, 94, 32, 0.95)',
              color: '#FFFFFF',
              border: '2.5px solid #81C784',
              borderRadius: '9999px',
              padding: '6px 16px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              pointerEvents: 'auto',
              maxWidth: '92vw'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.86rem' }}>
              <span>🚜</span>
              <span>{t('game3d.harvestingBanner')}</span>
              <span style={{ fontSize: '0.78rem', color: '#C8E6C9' }}>{Math.round((harvestProgress || 0) * 100)}%</span>
            </div>
            <button
              type="button"
              key="skip-harvest-button"
              data-testid="skip-harvest-button"
              onClick={skipHarvest}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: '#FFD54F',
                color: '#16382B',
                border: 'none',
                fontWeight: 900,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {t('game3d.skipHarvestBtn')}
            </button>
          </div>
        )}

        {/* Objective Banner: Walk to straw pile (Hidden whenever in-world choice panel is open) */}
        {!hasMadeChoice && burnState === 'idle' && (seasonPhase === 'decision' || harvestState === 'harvested') && seasonPhase !== 'sowing' && seasonPhase !== 'growing' && !interactionTarget && (
          <div
            style={{
              alignSelf: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              maxWidth: '92vw',
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(22, 56, 43, 0.92)',
                color: '#FFFFFF',
                border: '2px solid rgba(255, 255, 255, 0.45)',
                borderRadius: '9999px',
                padding: '6px 16px',
                fontWeight: 800,
                fontSize: '0.86rem',
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                pointerEvents: 'auto'
              }}
            >
              <span>🌾</span>
              <span>{t('game3d.objectiveWalkToPile')}</span>
              <button
                type="button"
                data-testid="open-choices-banner-btn"
                onClick={() => setInteractionTarget({ id: 'straw_1', x: -3.2, z: 12.5, scale: 1.0, label: 'Nearby Golden Straw Mound' })}
                style={{
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFD54F',
                  color: '#16382B',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Open Choices ➔
              </button>
            </div>
            {nearestPileInfo && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.94)',
                  color: '#16382B',
                  border: '1.5px solid #FFB300',
                  borderRadius: '9999px',
                  padding: '2px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{Math.round(nearestPileInfo.distance)}m</span>
                <span
                  style={{
                    display: 'inline-block',
                    transform: `rotate(${nearestPileInfo.angleDeg}deg)`,
                    fontSize: '0.95rem'
                  }}
                >
                  ⬆️
                </span>
              </div>
            )}
          </div>
        )}

        {/* If in Lite/Wheel mode (not in-world choices) and at interaction target: show one prompt banner */}
        {!hasMadeChoice && burnState === 'idle' && harvestState === 'harvested' && interactionTarget && !useInWorldChoices && (
          <div
            style={{
              alignSelf: 'center',
              backgroundColor: '#FFD54F',
              color: '#16382B',
              border: '2.5px solid #E65100',
              borderRadius: '9999px',
              padding: '6px 16px',
              fontWeight: 800,
              fontSize: '0.86rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🌾</span>
            <span>{isTouchDevice ? t('game3d.objectiveInteractTouch') : t('game3d.objectiveInteractDesktop')}</span>
          </div>
        )}

        {/* 3. STATUS CHIPS STRIP: Horizontally scrollable single row below objective banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            width: '100%',
            boxSizing: 'border-box',
            pointerEvents: 'auto',
            paddingBottom: '2px'
          }}
        >
          {/* Season & Year Badge */}
          <div
            style={{
              backgroundColor: 'rgba(27, 94, 32, 0.92)',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontWeight: 900,
              fontSize: '0.78rem',
              border: '1.5px solid #81C784',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <span>🌾</span>
            <span>S{persistentState?.seasonIndex || 1} • Y{persistentState?.yearIndex || 1}</span>
            <span style={{ fontSize: '0.7rem', backgroundColor: '#388E3C', padding: '1px 6px', borderRadius: '8px' }}>
              {seasonPhase.toUpperCase()}
            </span>
          </div>

          {/* Soil Health */}
          <div
            title="Soil Health"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#3E2723',
              border: '1.5px solid #8D6E63',
              borderRadius: '9999px',
              padding: '3px 8px',
              fontWeight: 800,
              fontSize: '0.76rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <span>🪱</span>
            <span>{Math.round(persistentState?.soilHealth ?? 70)}%</span>
          </div>

          {/* Village Health */}
          <div
            title="Village Community Air Health"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1B5E20',
              border: '1.5px solid #81C784',
              borderRadius: '9999px',
              padding: '3px 8px',
              fontWeight: 800,
              fontSize: '0.76rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <span>🏡</span>
            <span>{Math.round(persistentState?.villageHealth ?? 75)}%</span>
          </div>

          {/* Money */}
          <div
            title="Farmer Capital"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#BF360C',
              border: '1.5px solid #FFB74D',
              borderRadius: '9999px',
              padding: '3px 8px',
              fontWeight: 800,
              fontSize: '0.76rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <span>💰</span>
            <span>₹{(persistentState?.money ?? 12000).toLocaleString('en-IN')}</span>
          </div>

          {/* Reputation */}
          <div
            title="Reputation"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#4A148C',
              border: '1.5px solid #BA68C8',
              borderRadius: '9999px',
              padding: '3px 8px',
              fontWeight: 800,
              fontSize: '0.76rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <span>👑</span>
            <span>{Math.round(persistentState?.reputation ?? 50)}</span>
          </div>

          {/* Streak */}
          <div
            title="Sustainable Streak"
            style={{
              backgroundColor: (persistentState?.streak || 0) > 0 ? '#FFF3E0' : '#ECEFF1',
              color: (persistentState?.streak || 0) > 0 ? '#E65100' : '#78909C',
              border: '1.5px solid #FF9800',
              borderRadius: '9999px',
              padding: '3px 8px',
              fontWeight: 900,
              fontSize: '0.76rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <span>🔥</span>
            <span>{persistentState?.streak ?? 0}</span>
          </div>

          {/* Badges Panel Trigger */}
          <button
            type="button"
            onClick={() => setShowAchievements(true)}
            style={{
              backgroundColor: '#FFF8E1',
              color: '#F57F17',
              border: '1.5px solid #FBC02D',
              borderRadius: '9999px',
              padding: '3px 8px',
              fontWeight: 900,
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
            title="View Achievements"
          >
            <span>🏆</span>
            <span>Badges</span>
          </button>
        </div>
      </div>

      {/* LIVE SMOKE EXPOSURE METERS (During fire & consequence) */}
      <SmokeMeterHUD />

      {/* CENTER INTERACTION PROMPT: Only shown when in wheel/Lite fallback mode */}
      {!useInWorldChoices && interactionTarget && burnState === 'idle' && (
        <div
          style={{
            position: 'absolute',
            bottom: isTouchDevice ? 'calc(140px + env(safe-area-inset-bottom, 0px))' : 'calc(80px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            animation: 'pulse 1.5s infinite',
            zIndex: 65
          }}
        >
          <button
            type="button"
            onClick={handleInteract}
            style={{
              minHeight: '52px',
              padding: '10px 24px',
              borderRadius: '9999px',
              backgroundColor: '#FFD54F',
              color: '#16382B',
              border: '3px solid #E65100',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🌾</span>
            <span>
              {isTouchDevice
                ? t('game3d.objectiveInteractTouch')
                : t('game3d.objectiveInteractDesktop')}
            </span>
          </button>
        </div>
      )}

      {/* 5-OPTION RADIAL CHOICE WHEEL (Legacy fallback behind flag) */}
      {!useInWorldChoices && <ChoiceWheel />}

      {/* BURN CONSEQUENCE ACTIONS: WATCH THE VILLAGE & CONTINUE TO REPORT */}
      {burnState === 'consequence' && !showSeasonReport && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(35px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeInUp 0.4s ease'
          }}
        >
          <button
            type="button"
            data-testid="watch-village-button"
            onClick={watchVillage}
            style={{
              minHeight: '48px',
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: '#1B5E20',
              color: '#FFFFFF',
              border: '2px solid #81C784',
              fontWeight: 900,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.3)'
            }}
          >
            <span>🏘️</span>
            <span>Watch the village</span>
          </button>

          <button
            type="button"
            data-testid="continue-to-report-button"
            onClick={proceedToSeasonReport}
            style={{
              minHeight: '48px',
              padding: '10px 24px',
              borderRadius: '9999px',
              backgroundColor: '#D84315',
              color: '#FFFFFF',
              border: '2px solid #FFAB91',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
            }}
          >
            <span>Continue ➔</span>
          </button>
        </div>
      )}

      {/* ONE SEASON LATER CONSEQUENCE MODAL */}
      <OneSeasonLaterModal onSwitchToLite={onSwitchToLite} />

      {/* VHS REWIND VISUAL GLITCH OVERLAY */}
      <RewindGlitchOverlay />

      {/* LIVE BIOMASS REVENUE COUNTER & CLEAN AIR HUD */}
      <RupeeCounterHUD />

      {/* BEFORE & AFTER COMPARISON SPLIT SLIDER */}
      <ComparisonSliderModal onSwitchToLite={onSwitchToLite} />

      {/* SUSTAINABILITY PLEDGE MODAL */}
      {showPledgeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 140,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
            pointerEvents: 'auto'
          }}
        >
          <div style={{ width: '100%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '24px' }}>
            <KidPledgeScreen
              scenarioId="farm_crop_residue"
              onExitToMap={() => setShowPledgeModal(false)}
              onOpenScorecard={onSwitchToLite}
            />
          </div>
        </div>
      )}

      {/* BOTTOM TOUCH CONTROLS (for mobile / touchscreens) */}
      {isTouchDevice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
            width: '100%'
          }}
        >
          {/* Virtual Joystick (Left) */}
          <div
            ref={joystickBaseRef}
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickTouchMove}
            onTouchEnd={handleJoystickTouchEnd}
            onTouchCancel={handleJoystickTouchEnd}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.35)',
              border: '3px solid rgba(255, 255, 255, 0.7)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              touchAction: 'none'
            }}
          >
            {/* Movable Knob */}
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                border: '2px solid #FFFFFF',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* Drag-to-Look Area (Right) */}
          <div
            onTouchStart={handleLookTouchStart}
            onTouchMove={handleLookTouchMove}
            onTouchEnd={handleLookTouchEnd}
            onTouchCancel={handleLookTouchEnd}
            style={{
              width: '140px',
              height: '120px',
              borderRadius: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              border: '2px dashed rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.8rem',
              pointerEvents: 'auto',
              touchAction: 'none',
              textAlign: 'center'
            }}
          >
            <span>↔️ Drag to Look</span>
          </div>
        </div>
      )}

      {/* Dynamic Performance & Tier Adjustment Toast Notice */}
      {toastNotice && (
        <div
          style={{
            position: 'absolute',
            bottom: isTouchDevice ? 'calc(140px + env(safe-area-inset-bottom, 0px))' : 'calc(80px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(22, 56, 43, 0.94)',
            color: '#FFFFFF',
            border: '2px solid #81C784',
            borderRadius: '16px',
            padding: '8px 18px',
            fontSize: '0.86rem',
            fontWeight: 800,
            boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
            maxWidth: 'min(90vw, 420px)',
            width: 'max-content',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            textAlign: 'center'
          }}
        >
          <span>⚡</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* ON-SCREEN ORBIT CAMERA CONTROLS (for people without a mouse or on touch devices) */}
      <div
        data-testid="camera-controls-cluster"
        style={{
          position: 'absolute',
          right: '16px',
          bottom: isTouchDevice
            ? (isChoicePanelOpen ? 'calc(58vh + 20px)' : 'calc(140px + env(safe-area-inset-bottom, 0px))')
            : 'calc(24px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(22, 56, 43, 0.90)',
          padding: '8px',
          borderRadius: '16px',
          border: '1.5px solid rgba(129, 199, 132, 0.6)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
          pointerEvents: 'auto',
          zIndex: 70
        }}
      >
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            data-testid="cam-rotate-left"
            onClick={() => rotateCamera(0.35)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer'
            }}
            title="Rotate camera left (turn view)"
            aria-label="Rotate camera left"
          >
            🔄 Left
          </button>
          <button
            type="button"
            data-testid="cam-rotate-right"
            onClick={() => rotateCamera(-0.35)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer'
            }}
            title="Rotate camera right (turn view)"
            aria-label="Rotate camera right"
          >
            Right 🔄
          </button>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            data-testid="cam-zoom-in"
            onClick={() => zoomCamera(-1.0)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer'
            }}
            title="Zoom in (closer to farmer)"
            aria-label="Zoom in"
          >
            ➕ Zoom
          </button>
          <button
            type="button"
            data-testid="cam-zoom-out"
            onClick={() => zoomCamera(1.0)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer'
            }}
            title="Zoom out (wider view)"
            aria-label="Zoom out"
          >
            ➖ Out
          </button>
        </div>
        <button
          type="button"
          data-testid="cam-reset"
          onClick={resetCamera}
          style={{
            width: '100%',
            padding: '5px 8px',
            borderRadius: '8px',
            backgroundColor: '#FFD54F',
            color: '#16382B',
            border: 'none',
            fontWeight: 900,
            fontSize: '0.76rem',
            cursor: 'pointer'
          }}
          title="Reset camera view (Key: R)"
          aria-label="Reset view"
        >
          🎯 Reset View (R)
        </button>
      </div>

      {/* FIXED 2D CROP RESIDUE CHOICE PANEL (Screen-space right card / bottom sheet) */}
      <InWorldChoicePanel />

      {/* SOWING MINI-GAME (Hold-to-plant timing meter) */}
      {seasonPhase === 'sowing' && <SowingMiniGame />}

      {/* GROWING TIME-LAPSE & SEASONAL WEATHER CYCLE */}
      <GrowingTimeLapse onComplete={() => resolveSeasonalEvent(null)} />

      {/* SEASONAL RANDOM EVENT MODAL */}
      <SeasonalEventModal
        event={activeSeasonalEvent}
        onResolve={resolveSeasonalEvent}
      />

      {/* COMPREHENSIVE SEASON REPORT SCREEN */}
      {showSeasonReport && (
        <SeasonReportModal
          onNextSeason={nextSeason}
          onRewindSeason={replaySeason}
          onOpenAchievements={() => setShowAchievements(true)}
        />
      )}

      {/* 12 STRUCTURED ACHIEVEMENTS PANEL */}
      <AchievementsPanel
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />

      {/* Settings Drawer Slide-Over */}
      <SettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}
