import React from 'react'
import { useGame3D } from '../context/Game3DContext'
import { useLanguage } from '../../context/LanguageContext'

export default function RewindGlitchOverlay() {
  const { isRewinding, reducedMotion, quality } = useGame3D()
  const { t } = useLanguage()

  if (!isRewinding) return null

  const isLowOrReduced = reducedMotion || quality === 'low'
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  return (
    <div
      data-testid="rewind-glitch-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        pointerEvents: 'none',
        overflow: 'hidden',
        userSelect: 'none',
        // Single lightweight translucent CSS layer (no expensive mix-blend-mode or blur over full canvas)
        background: isLowOrReduced
          ? 'rgba(10, 16, 20, 0.35)'
          : 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.22) 0px, rgba(0, 0, 0, 0.22) 2px, rgba(0, 230, 118, 0.04) 2px, rgba(0, 230, 118, 0.04) 4px)'
      }}
    >
      {/* Subtle colour-band accent only on Medium/High without reduced motion */}
      {!isLowOrReduced && (
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: 0,
            right: 0,
            height: '14%',
            background: 'linear-gradient(180deg, rgba(0, 230, 118, 0.14) 0%, rgba(255, 193, 7, 0.12) 50%, rgba(0, 188, 212, 0.14) 100%)'
          }}
        />
      )}

      {/* REW / SP timecode safely below top HUD bar & readable on 360x640 */}
      <div
        data-testid="rewind-timecode"
        style={{
          position: 'absolute',
          top: 'calc(64px + env(safe-area-inset-top, 0px))',
          left: 'calc(16px + env(safe-area-inset-left, 0px))',
          backgroundColor: 'rgba(16, 22, 28, 0.90)',
          border: '1.5px solid rgba(0, 230, 118, 0.65)',
          borderRadius: '10px',
          padding: isMobile ? '6px 12px' : '8px 14px',
          color: '#00E676',
          fontFamily: 'monospace, monospace',
          fontSize: isMobile ? '0.95rem' : '1.15rem',
          fontWeight: 900,
          letterSpacing: '2px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>⏪</span>
          <span>REW 08x</span>
        </div>
        <div style={{ fontSize: isMobile ? '0.78rem' : '0.9rem', color: '#ECEFF1', letterSpacing: '1px' }}>
          SP -0:04:18
        </div>
      </div>

      {/* Bottom Rewind Label inside safe area */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: 'rgba(16, 22, 28, 0.92)',
          border: '1.5px solid #00E676',
          color: '#00E676',
          padding: isMobile ? '6px 14px' : '8px 20px',
          borderRadius: '9999px',
          fontFamily: 'monospace',
          fontWeight: 900,
          fontSize: isMobile ? '0.82rem' : '0.95rem',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap'
        }}
      >
        {t('game3d.whatElseRewindTitle')}
      </div>
    </div>
  )
}
