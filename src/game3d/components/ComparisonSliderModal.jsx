import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'
import { sound } from '../../game/soundManager'

export default function ComparisonSliderModal({ onSwitchToLite }) {
  const { t } = useLanguage()
  const {
    showComparison,
    setShowComparison,
    triggerRewind,
    setShowPledgeModal
  } = useGame3D()

  const [sliderPos, setSliderPos] = useState(50) // 0 to 100

  if (!showComparison) return null

  const handleDrag = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0
    const offset = clientX - rect.left
    const pct = Math.max(5, Math.min(95, (offset / rect.width) * 100))
    setSliderPos(pct)
  }

  const handleTakePledge = () => {
    sound.initAudio()
    sound.playTap()
    setShowComparison(false)
    setShowPledgeModal(true)
  }

  const handleTryAnother = () => {
    setShowComparison(false)
    triggerRewind()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 18, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px',
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        userSelect: 'none',
        pointerEvents: 'auto'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '620px',
          padding: '22px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.5)',
          border: '3px solid #2E7D32',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1B5E20', margin: '0 0 4px 0' }}>
            {t('game3d.comparisonTitle')}
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#546E7A', margin: 0, lineHeight: 1.35 }}>
            {t('game3d.comparisonSubtitle')}
          </p>
        </div>

        {/* INTERACTIVE COMPARISON SPLIT SLIDER */}
        <div
          onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
          onTouchMove={handleDrag}
          onClick={handleDrag}
          style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            borderRadius: '18px',
            overflow: 'hidden',
            cursor: 'ew-resize',
            boxShadow: 'inset 0 0 16px rgba(0,0,0,0.4)',
            marginBottom: '16px',
            border: '2px solid #37474F'
          }}
        >
          {/* 1. RIGHT SIDE: SUSTAINABLE OUTCOME (Clean green) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#1B5E20',
              backgroundImage: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%)',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              textAlign: 'right'
            }}
          >
            <div style={{ display: 'inline-block', alignSelf: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800 }}>
              {t('game3d.comparisonSustainableLabel')}
            </div>
            <div style={{ fontSize: '0.76rem', lineHeight: 1.4, maxWidth: '65%', alignSelf: 'flex-end' }}>
              <div style={{ fontWeight: 800, color: '#C8E6C9', marginBottom: '2px' }}>
                ✓ {t('game3d.comparisonAirSustainable')}
              </div>
              <div style={{ color: '#E8F5E9', marginBottom: '2px' }}>
                ✓ {t('game3d.comparisonSoilSustainable')}
              </div>
              <div style={{ fontWeight: 800, color: '#FFD54F' }}>
                ✓ {t('game3d.comparisonMoneySustainable')}
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>
              Smoke Exposure: 1 / 100 (Clean)
            </div>
          </div>

          {/* 2. LEFT SIDE: BURNED OUTCOME (Smoky ash) clipped by sliderPos */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${sliderPos}%`,
              backgroundColor: '#263238',
              backgroundImage: 'linear-gradient(135deg, #212121 0%, #37474F 50%, #4E342E 100%)',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              overflow: 'hidden',
              borderRight: '3px solid #FFFFFF'
            }}
          >
            <div style={{ display: 'inline-block', alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
              {t('game3d.comparisonMistakeLabel')}
            </div>
            <div style={{ fontSize: '0.76rem', lineHeight: 1.4, minWidth: '220px' }}>
              <div style={{ fontWeight: 800, color: '#FF8A65', marginBottom: '2px' }}>
                ✗ {t('game3d.comparisonAirMistake')}
              </div>
              <div style={{ color: '#CFD8DC', marginBottom: '2px' }}>
                ✗ {t('game3d.comparisonSoilMistake')}
              </div>
              <div style={{ fontWeight: 800, color: '#EF9A9A' }}>
                ✗ {t('game3d.comparisonMoneyMistake')}
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#FFAB91', whiteSpace: 'nowrap' }}>
              Smoke Exposure: 84 / 100 (Toxic)
            </div>
          </div>

          {/* 3. Draggable Divider Handle */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${sliderPos}%`,
              transform: 'translateX(-50%)',
              width: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                border: '3px solid #2E7D32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                color: '#1B5E20',
                fontWeight: 900
              }}
            >
              ↔
            </div>
          </div>
        </div>

        {/* Rewards & Badges Unlocked */}
        <div
          style={{
            backgroundColor: '#F1F8E9',
            border: '2px solid #81C784',
            borderRadius: '16px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#1B5E20' }}>
              🏆 {t('game3d.comparisonClaimRewards')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#33691E' }}>
              Earned Badges: <strong>Soil Saver 🌾</strong> & <strong>Curious Mind 🔍</strong>
            </div>
          </div>
          <div
            style={{
              backgroundColor: '#2E7D32',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.95rem',
              padding: '6px 14px',
              borderRadius: '9999px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            +50 PTS
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Take Sustainability Pledge */}
          <button
            type="button"
            onClick={handleTakePledge}
            style={{
              minHeight: '48px',
              padding: '10px 18px',
              borderRadius: '9999px',
              backgroundColor: '#FFD54F',
              color: '#16382B',
              border: '2.5px solid #E65100',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(230, 81, 0, 0.3)'
            }}
          >
            <span>🤝</span>
            <span>{t('game3d.takePledgeBtn')}</span>
          </button>

          {/* Try Another Alternative (Rewind to Choice Wheel) */}
          <button
            type="button"
            onClick={handleTryAnother}
            style={{
              minHeight: '44px',
              padding: '8px 18px',
              borderRadius: '9999px',
              backgroundColor: '#2E7D32',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>🔄</span>
            <span>{t('game3d.tryAnotherAlt')}</span>
          </button>

          {/* Switch to Lite mode fallback */}
          <button
            type="button"
            onClick={onSwitchToLite}
            style={{
              minHeight: '40px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              color: '#546E7A',
              border: '1.5px solid #CFD8DC',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            📱 {t('game3d.switchToLite')}
          </button>
        </div>
      </div>
    </div>
  )
}
