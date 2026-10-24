import React from 'react'
import { motion } from 'framer-motion'
import { useGame3D } from '../context/Game3DContext'
import { sound } from '../../game/soundManager'

/**
 * Non-blocking Seasonal Event Card.
 * Rendered after the season report as a dismissible card with a Close button.
 * Never blocks the full screen or interrupts the decision/burn sequence.
 */
export default function SeasonalEventModal({ event, onResolve }) {
  const { persistentState, seasonPhase, burnState } = useGame3D()

  // Guard: Never show during sowing, growing, harvest, decision, or active burn
  if (!event || seasonPhase === 'sowing' || seasonPhase === 'growing' || seasonPhase === 'harvest' || seasonPhase === 'decision' || burnState !== 'idle') {
    return null
  }

  const handleSelect = (option) => {
    sound.initAudio()
    sound.playCoin()
    onResolve(option)
  }

  const handleClose = () => {
    sound.initAudio()
    sound.playTap()
    onResolve(null)
  }

  const optionAEffect = typeof event.optionA?.effectText === 'function'
    ? event.optionA.effectText(persistentState)
    : event.optionA?.effectText

  const optionBEffect = typeof event.optionB?.effectText === 'function'
    ? event.optionB.effectText(persistentState)
    : event.optionB?.effectText

  return (
    <motion.div
      data-testid="seasonal-event-card"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      style={{
        position: 'fixed',
        right: '16px',
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        maxWidth: '380px',
        width: 'calc(100vw - 32px)',
        zIndex: 85,
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '3px solid #2E7D32',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        pointerEvents: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header Ribbon with Close Button */}
      <div
        style={{
          backgroundColor: '#1B5E20',
          color: '#FFFFFF',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>{event.icon}</span>
          <div>
            <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#A5D6A7', fontWeight: 900 }}>
              Village Report Note
            </div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900 }}>
              {event.title}
            </h4>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          data-testid="close-seasonal-event-btn"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '1rem',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900
          }}
          title="Dismiss card"
          aria-label="Close seasonal event"
        >
          ✕
        </button>
      </div>

      {/* Description */}
      <div style={{ padding: '12px 14px 8px 14px', fontSize: '0.82rem', color: '#37474F', lineHeight: 1.4, fontWeight: 600 }}>
        {event.desc}
      </div>

      {/* Options */}
      <div style={{ padding: '0 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          type="button"
          onClick={() => handleSelect(event.optionA)}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1.5px solid #81C784',
            backgroundColor: '#F1F8E9',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#1B5E20' }}>
            🅰️ {event.optionA.label}
          </div>
          {optionAEffect && (
            <div style={{ fontSize: '0.72rem', color: '#33691E', fontWeight: 700 }}>
              {optionAEffect}
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSelect(event.optionB)}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1.5px solid #B0BEC5',
            backgroundColor: '#ECEFF1',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#37474F' }}>
            🅱️ {event.optionB.label}
          </div>
          {optionBEffect && (
            <div style={{ fontSize: '0.72rem', color: '#546E7A', fontWeight: 700 }}>
              {optionBEffect}
            </div>
          )}
        </button>
      </div>
    </motion.div>
  )
}
