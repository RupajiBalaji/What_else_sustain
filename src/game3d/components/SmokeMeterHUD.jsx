import React from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'

export default function SmokeMeterHUD() {
  const { t } = useLanguage()
  const { burnState, burnProgress, smokeData } = useGame3D()

  const isVisible = burnState === 'burning' || burnState === 'consequence'
  if (!isVisible) return null

  // Growth over the 20s burn sequence
  const currentRatio = burnState === 'consequence' ? 1.0 : Math.min(1.0, burnProgress * 1.25)

  const playerTarget = smokeData?.playerExposure ?? 84
  const villageTarget = smokeData?.villageExposure ?? 62

  const currentPlayerVal = Math.round(playerTarget * currentRatio)
  const currentVillageVal = Math.round(villageTarget * currentRatio)

  return (
    <div
      style={{
        position: 'absolute',
        top: '68px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(38, 50, 56, 0.92)',
        backdropFilter: 'blur(6px)',
        border: '2px solid #FF7043',
        borderRadius: '16px',
        padding: '10px 18px',
        color: '#FFFFFF',
        zIndex: 40,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        width: '320px',
        maxWidth: '92vw',
        pointerEvents: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#FFAB91', letterSpacing: '0.2px' }}>
          💨 {t('game3d.smokeMeterTitle')}
        </span>
        <span style={{ fontSize: '0.65rem', backgroundColor: '#37474F', padding: '2px 6px', borderRadius: '6px', color: '#B0BEC5' }}>
          0-100 Index
        </span>
      </div>

      {/* 1. Player Exposure Meter */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 800, marginBottom: '2px' }}>
          <span>{t('game3d.smokeMeterPlayer')}</span>
          <span style={{ color: '#FF7043' }}>{currentPlayerVal} / 100</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#455A64', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${currentPlayerVal}%`,
              height: '100%',
              backgroundColor: '#FF5722',
              transition: 'width 0.2s ease',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* 2. Village Exposure Meter */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 800, marginBottom: '2px' }}>
          <span>{t('game3d.smokeMeterVillage')}</span>
          <span style={{ color: '#FFA726' }}>{currentVillageVal} / 100</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#455A64', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${currentVillageVal}%`,
              height: '100%',
              backgroundColor: '#FFA726',
              transition: 'width 0.2s ease',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Modelled Game Estimate Disclaimer (Strictly no AQI numbers without verified: true) */}
      <div
        style={{
          fontSize: '0.65rem',
          color: '#CFD8DC',
          lineHeight: 1.25,
          borderTop: '1px solid rgba(255,255,255,0.15)',
          paddingTop: '6px',
          textAlign: 'center',
          fontStyle: 'italic'
        }}
      >
        {smokeData?.disclaimer || t('game3d.smokeDisclaimer')}
      </div>
    </div>
  )
}
