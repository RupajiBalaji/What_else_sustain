import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGame3D } from '../context/Game3DContext'
import { GAME_BALANCE } from '../config/gameBalance'
import { sound } from '../../game/soundManager'

export default function SowingMiniGame() {
  const {
    seasonPhase,
    completeSowing,
    addFarmerXP,
    triggerToast,
    incrementPerfectSowing
  } = useGame3D()

  const [currentRow, setCurrentRow] = useState(1)
  const totalRows = GAME_BALANCE.SOWING.ROW_COUNT || 4
  const [isHolding, setIsHolding] = useState(false)
  const [meterValue, setMeterValue] = useState(0) // 0 to 1
  const [feedback, setFeedback] = useState(null)
  const animationFrameRef = useRef(null)
  const startTimeRef = useRef(null)

  const sweetMin = GAME_BALANCE.SOWING.SWEET_SPOT_MIN
  const sweetMax = GAME_BALANCE.SOWING.SWEET_SPOT_MAX

  const startHold = () => {
    if (isHolding) return
    setIsHolding(true)
    startTimeRef.current = performance.now()
    sound.initAudio()
    sound.playTap()

    const step = (now) => {
      const elapsed = (now - startTimeRef.current) / 1000
      // Oscillation between 0 and 1 with a cycle of ~1.8 seconds
      const cycle = (elapsed % 1.8) / 1.8
      const val = Math.sin(cycle * Math.PI)
      setMeterValue(val)
      animationFrameRef.current = requestAnimationFrame(step)
    }

    animationFrameRef.current = requestAnimationFrame(step)
  }

  const releaseHold = () => {
    if (!isHolding) return
    setIsHolding(false)
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)

    const finalVal = meterValue
    const isPerfect = finalVal >= sweetMin && finalVal <= sweetMax
    const isGood = finalVal >= sweetMin - 0.15 && finalVal <= sweetMax + 0.12

    if (isPerfect) {
      sound.playSuccessChime()
      setFeedback('✨ PERFECT DEPTH! +10% Yield Bonus')
      triggerToast('Perfect Sowing! +25 XP')
      addFarmerXP(GAME_BALANCE.SOWING.PERFECT_XP_BONUS)
      incrementPerfectSowing()
    } else if (isGood) {
      sound.playCoin()
      setFeedback('👍 GOOD PLACEMENT! Standard Yield')
      addFarmerXP(GAME_BALANCE.SOWING.GOOD_XP_BONUS)
    } else {
      sound.playPop()
      setFeedback('🌱 PLANTED! Soil will nurture the crop')
      addFarmerXP(5)
    }

    setTimeout(() => {
      setFeedback(null)
      setMeterValue(0)
      if (currentRow >= totalRows) {
        completeSowing(isPerfect)
      } else {
        setCurrentRow((r) => r + 1)
      }
    }, 700)
  }

  // Keyboard Spacebar listener
  useEffect(() => {
    if (seasonPhase !== 'sowing') return

    const onKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && !isHolding) {
        e.preventDefault()
        startHold()
      }
    }
    const onKeyUp = (e) => {
      if (e.code === 'Space' && isHolding) {
        e.preventDefault()
        releaseHold()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [seasonPhase, isHolding, meterValue, currentRow])

  if (seasonPhase !== 'sowing') return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 85,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        width: '92%',
        maxWidth: '420px',
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      {/* Header Pill */}
      <div
        style={{
          backgroundColor: 'rgba(27, 94, 32, 0.95)',
          color: '#FFFFFF',
          padding: '6px 16px',
          borderRadius: '9999px',
          border: '2px solid #81C784',
          fontWeight: 800,
          fontSize: '0.85rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>🌾</span>
        <span>SOWING SEEDS — Row {currentRow} of {totalRows}</span>
        <button
          onClick={() => completeSowing(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFD54F',
            fontSize: '0.78rem',
            fontWeight: 800,
            textDecoration: 'underline',
            cursor: 'pointer',
            marginLeft: '4px'
          }}
        >
          Skip
        </button>
      </div>

      {/* Timing Meter Box */}
      <div
        style={{
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '18px',
          padding: '14px 18px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          border: '2.5px solid #2E7D32',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '0.8rem', color: '#3E2723', fontWeight: 800, marginBottom: '8px' }}>
          {feedback ? (
            <span style={{ color: feedback.includes('PERFECT') ? '#2E7D32' : '#E65100' }}>
              {feedback}
            </span>
          ) : (
            <span>Hold to meter seed depth, release in the GREEN zone!</span>
          )}
        </div>

        {/* Progress Track */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '24px',
            backgroundColor: '#E0E0E0',
            borderRadius: '9999px',
            overflow: 'hidden',
            border: '2px solid #9E9E9E',
            marginBottom: '12px'
          }}
        >
          {/* Sweet Spot Highlight */}
          <div
            style={{
              position: 'absolute',
              left: `${sweetMin * 100}%`,
              width: `${(sweetMax - sweetMin) * 100}%`,
              top: 0,
              bottom: 0,
              backgroundColor: '#81C784',
              borderLeft: '2px dashed #2E7D32',
              borderRight: '2px dashed #2E7D32',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 900,
              color: '#1B5E20'
            }}
          >
            SWEET SPOT
          </div>

          {/* Moving Fill Gauge */}
          <div
            style={{
              width: `${meterValue * 100}%`,
              height: '100%',
              backgroundColor: meterValue >= sweetMin && meterValue <= sweetMax ? '#2E7D32' : '#FFA000',
              transition: isHolding ? 'none' : 'width 0.15s ease'
            }}
          />
        </div>

        {/* Hold Button */}
        <button
          type="button"
          onMouseDown={startHold}
          onMouseUp={releaseHold}
          onTouchStart={startHold}
          onTouchEnd={releaseHold}
          style={{
            width: '100%',
            minHeight: '48px',
            backgroundColor: isHolding ? '#1B5E20' : '#4CAF50',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(46,125,50,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🌱</span>
          <span>{isHolding ? 'RELEASE TO SOW!' : 'HOLD TO SOW SEED (Spacebar / Tap)'}</span>
        </button>
      </div>
    </div>
  )
}
