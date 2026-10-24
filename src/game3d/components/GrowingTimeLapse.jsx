import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame3D } from '../context/Game3DContext'
import { sound } from '../../game/soundManager'

export default function GrowingTimeLapse({ onComplete }) {
  const { seasonPhase, activeSeasonalEvent } = useGame3D()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (seasonPhase !== 'growing') return
    setProgress(0)

    const startTime = performance.now()
    const duration = 4500 // 4.5s time-lapse

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime
      const p = Math.min(100, (elapsed / duration) * 100)
      setProgress(p)
      if (p >= 100) {
        clearInterval(interval)
        // Only auto-proceed if event is resolved
        if (!activeSeasonalEvent) {
          onComplete?.()
        }
      }
    }, 50)

    return () => clearInterval(interval)
  }, [seasonPhase, activeSeasonalEvent, onComplete])

  if (seasonPhase !== 'growing') return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(75px + env(safe-area-inset-top, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 85,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        width: 'max-content',
        maxWidth: '92vw',
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(27, 94, 32, 0.94)',
          color: '#FFFFFF',
          padding: '8px 18px',
          borderRadius: '9999px',
          border: '2px solid #81C784',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 800,
          fontSize: '0.88rem'
        }}
      >
        <span>☀️</span>
        <span>GROWING CYCLE • Time-Lapse ({Math.round(progress)}%)</span>
        <button
          type="button"
          data-testid="skip-growing-button"
          onClick={() => onComplete?.()}
          style={{
            backgroundColor: '#FFD54F',
            color: '#16382B',
            border: 'none',
            borderRadius: '9999px',
            padding: '4px 12px',
            fontWeight: 900,
            fontSize: '0.78rem',
            cursor: 'pointer',
            marginLeft: '4px'
          }}
        >
          Skip ⏭️
        </button>
      </div>
    </div>
  )
}
