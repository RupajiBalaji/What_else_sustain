import React from 'react'
import { motion } from 'framer-motion'
import { useGame3D } from '../context/Game3DContext'
import { sound } from '../../game/soundManager'

export default function SeasonalEventModal({ event, onResolve }) {
  const { persistentState } = useGame3D()

  if (!event) return null

  const handleSelect = (option) => {
    sound.initAudio()
    sound.playCoin()
    onResolve(option)
  }

  const optionAEffect = typeof event.optionA.effectText === 'function'
    ? event.optionA.effectText(persistentState)
    : event.optionA.effectText

  const optionBEffect = typeof event.optionB.effectText === 'function'
    ? event.optionB.effectText(persistentState)
    : event.optionB.effectText

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 25, 20, 0.72)',
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '3px solid #2E7D32',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          overflow: 'hidden'
        }}
      >
        {/* Header Ribbon */}
        <div
          style={{
            backgroundColor: '#1B5E20',
            color: '#FFFFFF',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>{event.icon}</span>
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A5D6A7', fontWeight: 900 }}>
              Seasonal Village Event
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>
              {event.title}
            </h3>
          </div>
        </div>

        {/* Narrative Description */}
        <div style={{ padding: '16px 20px 12px 20px', fontSize: '0.9rem', color: '#37474F', lineHeight: 1.5, fontWeight: 600 }}>
          {event.desc}
        </div>

        {/* Action Choices */}
        <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Option A */}
          <button
            type="button"
            onClick={() => handleSelect(event.optionA)}
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              border: '2px solid #81C784',
              backgroundColor: '#F1F8E9',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1B5E20', marginBottom: '3px' }}>
              🅰️ {event.optionA.label}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#33691E', fontWeight: 700 }}>
              {optionAEffect}
            </div>
          </button>

          {/* Option B */}
          <button
            type="button"
            onClick={() => handleSelect(event.optionB)}
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              border: '2px solid #FFB74D',
              backgroundColor: '#FFF8E1',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#E65100', marginBottom: '3px' }}>
              🅱️ {event.optionB.label}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#BF360C', fontWeight: 700 }}>
              {optionBEffect}
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
