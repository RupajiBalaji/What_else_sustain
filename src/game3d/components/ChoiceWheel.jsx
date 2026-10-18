import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'
import { sound } from '../../game/soundManager'

export default function ChoiceWheel() {
  const { t } = useLanguage()
  const { showChoiceWheel, setShowChoiceWheel, startBurnSequence, startAlternative, activePile } = useGame3D()

  if (!showChoiceWheel) return null

  const handleClose = () => {
    sound.initAudio()
    sound.playTap()
    setShowChoiceWheel(false)
  }

  const handleSelectBurn = () => {
    startBurnSequence(activePile)
  }

  const handleSelectAlternative = (altKey) => {
    startAlternative(altKey)
  }

  // 5 radial options arranged in circle
  const options = [
    {
      id: 'burn',
      title: t('game3d.choiceBurn'),
      desc: t('game3d.choiceBurnDesc'),
      icon: '🔥',
      isBurn: true,
      angle: -90, // Top
      color: '#E65100',
      bgColor: '#FFEBEE',
      borderColor: '#D84315'
    },
    {
      id: 'happy_seeder',
      title: t('game3d.choiceHappySeeder'),
      desc: '🌱 Direct Sowing',
      icon: '🚜',
      isBurn: false,
      angle: -18, // Top-right
      color: '#2E7D32',
      bgColor: '#E8F5E9',
      borderColor: '#4CAF50'
    },
    {
      id: 'bale_sell',
      title: t('game3d.choiceBaleSell'),
      desc: '💰 +₹15,000 Income',
      icon: '🚛',
      isBurn: false,
      angle: 54, // Bottom-right
      color: '#0D47A1',
      bgColor: '#E3F2FD',
      borderColor: '#1976D2'
    },
    {
      id: 'mulch',
      title: t('game3d.choiceMulch'),
      desc: '💧 Soil Moisture',
      icon: '🌾',
      isBurn: false,
      angle: 126, // Bottom-left
      color: '#33691E',
      bgColor: '#F1F8E9',
      borderColor: '#689F38'
    },
    {
      id: 'compost',
      title: t('game3d.choiceCompost'),
      desc: '🪱 Bio-Decomposer',
      icon: '🧪',
      isBurn: false,
      angle: 198, // Top-left
      color: '#4E342E',
      bgColor: '#EFEBE9',
      borderColor: '#8D6E63'
    }
  ]

  // Radial radius in pixels
  const radius = 135

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 25, 20, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        userSelect: 'none',
        pointerEvents: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px)) 16px',
        overflow: 'hidden'
      }}
      onClick={handleClose}
    >
      {/* Container stopping click propagation */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '360px',
          height: '360px',
          maxWidth: '94vw',
          maxHeight: '94vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'scale(min(1, calc(100vw / 400), calc(100vh / 520)))',
          transformOrigin: 'center center'
        }}
      >
        {/* Central Hub */}
        <div
          style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '4px solid #2E7D32',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 10,
            textAlign: 'center',
            padding: '8px'
          }}
        >
          <span style={{ fontSize: '1.5rem', marginBottom: '2px' }}>🌾</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#16382B', lineHeight: 1.1 }}>
            {t('game3d.choiceWheelTitle')}
          </span>
        </div>

        {/* 5 Radial Choice Slices */}
        {options.map((opt) => {
          const rad = (opt.angle * Math.PI) / 180
          const x = Math.cos(rad) * radius
          const y = Math.sin(rad) * radius

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => (opt.isBurn ? handleSelectBurn() : handleSelectAlternative(opt.id))}
              style={{
                position: 'absolute',
                transform: `translate(${x}px, ${y}px)`,
                width: '100px',
                minHeight: '84px',
                borderRadius: '18px',
                backgroundColor: opt.bgColor,
                border: `3px solid ${opt.borderColor}`,
                color: opt.color,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 4px',
                cursor: 'pointer',
                boxShadow: opt.isBurn
                  ? '0 6px 18px rgba(216, 67, 21, 0.45)'
                  : '0 4px 10px rgba(0,0,0,0.18)',
                zIndex: opt.isBurn ? 12 : 11,
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              title={opt.isBurn ? 'Start Fire Sequence' : 'Coming soon'}
            >
              <span style={{ fontSize: '1.4rem', marginBottom: '2px' }}>{opt.icon}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, lineHeight: 1.1 }}>
                {opt.title}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  opacity: 0.85,
                  marginTop: '2px'
                }}
              >
                {opt.desc}
              </span>
            </button>
          )
        })}
      </div>

      {/* Coming Soon Alert Toast */}
      {comingSoonToast && (
        <div
          style={{
            marginTop: '24px',
            backgroundColor: '#FFF9C4',
            border: '2px solid #FBC02D',
            color: '#F57F17',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {comingSoonToast}
        </div>
      )}

      {/* Dismiss / Close Button */}
      <button
        type="button"
        onClick={handleClose}
        style={{
          marginTop: comingSoonToast ? '12px' : '28px',
          minHeight: '44px',
          padding: '8px 24px',
          borderRadius: '9999px',
          backgroundColor: '#FFFFFF',
          border: '2px solid #37474F',
          color: '#37474F',
          fontWeight: 800,
          fontSize: '0.85rem',
          cursor: 'pointer'
        }}
      >
        ✕ Close
      </button>
    </div>
  )
}
