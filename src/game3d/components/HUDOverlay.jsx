import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'
import { playerInput } from './FarmerPlayer'
import ChoiceWheel from './ChoiceWheel'
import SmokeMeterHUD from './SmokeMeterHUD'
import OneSeasonLaterModal from './OneSeasonLaterModal'
import RewindGlitchOverlay from './RewindGlitchOverlay'
import RupeeCounterHUD from './RupeeCounterHUD'
import ComparisonSliderModal from './ComparisonSliderModal'
import KidPledgeScreen from '../../game/KidPledgeScreen'

export default function HUDOverlay({ onSwitchToLite }) {
  const { t } = useLanguage()
  const {
    windState,
    quality,
    toggleQuality,
    interactionTarget,
    nearestPileInfo,
    hasMadeChoice,
    harvestState,
    harvestProgress,
    skipHarvest,
    handleInteract,
    burnState,
    useInWorldChoices,
    showOneSeasonModal,
    setShowOneSeasonModal,
    showPledgeModal,
    setShowPledgeModal,
    showFps,
    toggleFps,
    fps,
    frameTimeMs
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

  // Auto-advance to OneSeasonLaterModal after letting in-world consequence callouts play
  useEffect(() => {
    if (burnState === 'consequence' && !showOneSeasonModal) {
      const timer = setTimeout(() => {
        setShowOneSeasonModal(true)
      }, 6500)
      return () => clearTimeout(timer)
    }
  }, [burnState, showOneSeasonModal, setShowOneSeasonModal])

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

    const clampedDist = Math.min(dist, maxRadius)
    const angle = Math.atan2(dy, dx)
    const knobX = Math.cos(angle) * clampedDist
    const knobY = Math.sin(angle) * clampedDist

    setKnobPos({ x: knobX, y: knobY })
    playerInput.joystickX = knobX / maxRadius
    playerInput.joystickY = knobY / maxRadius
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
        playerInput.lookDeltaX = dx
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
      {/* HARVEST SEQUENCE BANNER & SKIP BUTTON */}
      {harvestState === 'harvesting' && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(70px + env(safe-area-inset-top, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 65,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(27, 94, 32, 0.95)',
            color: '#FFFFFF',
            border: '2.5px solid #81C784',
            borderRadius: '9999px',
            padding: '6px 16px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.92rem' }}>
            <span>🚜</span>
            <span>{t('game3d.harvestingBanner')}</span>
            <span style={{ fontSize: '0.8rem', color: '#C8E6C9' }}>
              {Math.round((harvestProgress || 0) * 100)}%
            </span>
          </div>

          <button
            type="button"
            onClick={skipHarvest}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#FFD54F',
              color: '#16382B',
              border: 'none',
              fontWeight: 900,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            }}
          >
            {t('game3d.skipHarvestBtn')}
          </button>
        </div>
      )}

      {/* TOP-CENTRE OBJECTIVE BANNER & GUIDANCE ARROW (After harvest completes) */}
      {!hasMadeChoice && burnState === 'idle' && harvestState === 'harvested' && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(70px + env(safe-area-inset-top, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            width: 'max-content',
            maxWidth: '92vw'
          }}
        >
          <div
            style={{
              backgroundColor: interactionTarget ? '#FFD54F' : 'rgba(22, 56, 43, 0.92)',
              color: interactionTarget ? '#16382B' : '#FFFFFF',
              border: interactionTarget ? '2.5px solid #E65100' : '2px solid rgba(255, 255, 255, 0.45)',
              borderRadius: '9999px',
              padding: '8px 20px',
              fontWeight: 800,
              fontSize: '0.92rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.25s ease'
            }}
          >
            <span>🌾</span>
            <span>
              {interactionTarget
                ? (isTouchDevice ? t('game3d.objectiveInteractTouch') : t('game3d.objectiveInteractDesktop'))
                : t('game3d.objectiveWalkToPile')}
            </span>
          </div>

          {/* Small guidance arrow pointing towards nearest straw pile when far away */}
          {!interactionTarget && nearestPileInfo && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                color: '#16382B',
                border: '2px solid #FFB300',
                borderRadius: '9999px',
                padding: '4px 14px',
                fontSize: '0.8rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.18)'
              }}
            >
              <span>{Math.round(nearestPileInfo.distance)}m</span>
              <span
                style={{
                  display: 'inline-block',
                  transform: `rotate(${nearestPileInfo.angleDeg}deg)`,
                  fontSize: '1.05rem',
                  transition: 'transform 0.1s linear'
                }}
              >
                ⬆️
              </span>
            </div>
          )}
        </div>
      )}

      {/* TOP HUD BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Lite Mode Return & Wind Compass */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={onSwitchToLite}
            style={{
              minHeight: '44px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              color: '#16382B',
              border: '2.5px solid #2E7D32',
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
            }}
            aria-label="Switch to Lite 2D Mode"
          >
            <span>📱</span>
            <span>{t('game3d.switchToLite')}</span>
          </button>

          {/* Wind Indicator Pill */}
          <div
            style={{
              minHeight: '44px',
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              border: '2px solid #0288D1',
              color: '#01579B',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
            title="Current Wind Direction & Speed (affects smoke dispersion)"
          >
            <span>🧭</span>
            {/* Rotating Arrow based on wind direction */}
            <span
              style={{
                display: 'inline-block',
                transform: `rotate(${windState?.directionDeg || 75}deg)`,
                fontSize: '1.2rem',
                transition: 'transform 0.4s ease'
              }}
            >
              ⬆️
            </span>
            <span>
              {windState?.speedMs || 3.8} m/s
            </span>
          </div>
        </div>

        {/* Right: Controls & Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          {/* FPS Toggle Button */}
          <button
            type="button"
            onClick={toggleFps}
            style={{
              minHeight: '44px',
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: showFps ? '#E8F5E9' : '#FFFFFF',
              border: '2px solid #37474F',
              fontWeight: 800,
              fontSize: '0.82rem',
              color: '#263238',
              cursor: 'pointer'
            }}
            title="Press 'F' key to toggle FPS display"
          >
            {showFps ? `⚡ ${fps} FPS (${frameTimeMs}ms)` : 'FPS (F)'}
          </button>

          {/* Quality Toggle */}
          <button
            type="button"
            onClick={toggleQuality}
            style={{
              minHeight: '44px',
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: quality === 'high' ? '#FFF9C4' : quality === 'medium' ? '#E1F5FE' : '#ECEFF1',
              border: '2px solid #E65100',
              fontWeight: 800,
              fontSize: '0.82rem',
              color: '#BF360C',
              cursor: 'pointer'
            }}
          >
            {quality === 'high' ? '💎 High' : quality === 'medium' ? '⚖️ Med' : '⚡ Low'}
          </button>
        </div>
      </div>

      {/* LIVE SMOKE EXPOSURE METERS (During fire & consequence) */}
      <SmokeMeterHUD />

      {/* CENTER INTERACTION PROMPT (Only during idle exploration) */}
      {interactionTarget && burnState === 'idle' && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
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
              minHeight: '56px',
              padding: '12px 26px',
              borderRadius: '9999px',
              backgroundColor: '#FFD54F',
              color: '#16382B',
              border: '3.5px solid #E65100',
              fontWeight: 900,
              fontSize: '1.05rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              transform: 'scale(1.05)',
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

      {/* IN-WORLD CONSEQUENCES: CONTINUATION BUTTON TO ONE SEASON LATER */}
      {burnState === 'consequence' && !showOneSeasonModal && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(35px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            zIndex: 80,
            animation: 'fadeInUp 0.5s ease'
          }}
        >
          <button
            type="button"
            onClick={() => setShowOneSeasonModal(true)}
            style={{
              minHeight: '52px',
              padding: '12px 28px',
              borderRadius: '9999px',
              backgroundColor: '#D84315',
              color: '#FFFFFF',
              border: '3px solid #FFAB91',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap'
            }}
          >
            <span>📜</span>
            <span>One Season Later ➡️</span>
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
    </div>
  )
}
