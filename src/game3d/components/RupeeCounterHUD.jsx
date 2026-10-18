import React from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'

export default function RupeeCounterHUD() {
  const { t } = useLanguage()
  const { activeAlternative, rupeeCount } = useGame3D()

  if (!activeAlternative) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: '124px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        zIndex: 45,
        pointerEvents: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* 1. Live Biomass Revenue Counter (During Bale & Sell) */}
      {activeAlternative === 'bale_sell' && (
        <div
          style={{
            backgroundColor: 'rgba(13, 71, 161, 0.92)',
            border: '2.5px solid #64B5F6',
            color: '#FFFFFF',
            borderRadius: '9999px',
            padding: '8px 20px',
            boxShadow: '0 6px 20px rgba(13, 71, 161, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'pulse 1s infinite'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>💰</span>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#BBDEFB' }}>
            {t('game3d.rupeeEarned')}:
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFD54F' }}>
            +₹{rupeeCount.toLocaleString()}
          </span>
        </div>
      )}

      {/* 2. Active Sustainable Alternative Status Banner */}
      <div
        style={{
          backgroundColor: 'rgba(27, 94, 32, 0.9)',
          border: '2px solid #81C784',
          color: '#E8F5E9',
          borderRadius: '9999px',
          padding: '6px 16px',
          fontSize: '0.78rem',
          fontWeight: 800,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>🌱</span>
        <span>
          {activeAlternative === 'happy_seeder'
            ? t('game3d.happySeederActive')
            : activeAlternative === 'bale_sell'
            ? t('game3d.baleSellActive')
            : activeAlternative === 'mulch'
            ? t('game3d.mulchActive')
            : t('game3d.compostActive')}
        </span>
      </div>
    </div>
  )
}
