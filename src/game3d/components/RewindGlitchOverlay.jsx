import React from 'react'
import { useGame3D } from '../context/Game3DContext'
import { useLanguage } from '../../context/LanguageContext'

export default function RewindGlitchOverlay() {
  const { isRewinding } = useGame3D()
  const { t } = useLanguage()

  if (!isRewinding) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        pointerEvents: 'none',
        overflow: 'hidden',
        userSelect: 'none',
        mixBlendMode: 'screen'
      }}
    >
      {/* 1. VHS Scanlines Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45) 0px, rgba(0, 0, 0, 0.45) 2px, transparent 2px, transparent 4px)',
          opacity: 0.85
        }}
      />

      {/* 2. VHS Chromatic Glitch Bar */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: 0,
          right: 0,
          height: '22%',
          background: 'linear-gradient(180deg, rgba(0, 255, 255, 0.35) 0%, rgba(255, 0, 128, 0.4) 50%, rgba(255, 255, 0, 0.35) 100%)',
          filter: 'blur(2px)',
          animation: 'pulse 0.2s infinite'
        }}
      />

      {/* 3. VHS REWIND HUD TEXT & TRACKING INDICATOR */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          left: '32px',
          color: '#00E676',
          fontFamily: 'monospace, monospace',
          textShadow: '0 0 8px rgba(0, 230, 118, 0.8), 2px 2px 0 #FF0055',
          fontSize: '1.4rem',
          fontWeight: 900,
          letterSpacing: '3px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⏪</span>
          <span>REW 08x</span>
        </div>
        <div style={{ fontSize: '1rem', color: '#FFFFFF', opacity: 0.9 }}>
          SP -0:04:18
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          border: '2px solid #00E676',
          color: '#00E676',
          padding: '8px 20px',
          borderRadius: '9999px',
          fontFamily: 'monospace',
          fontWeight: 900,
          fontSize: '1rem',
          letterSpacing: '1px',
          textShadow: '0 0 10px #00E676'
        }}
      >
        {t('game3d.whatElseRewindTitle')}
      </div>
    </div>
  )
}
