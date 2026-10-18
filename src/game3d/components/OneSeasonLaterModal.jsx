import React from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'
import scenariosData from '../../data/scenarios.json'

export default function OneSeasonLaterModal({ onSwitchToLite }) {
  const { language, t } = useLanguage()
  const { burnState, resetBurn, smokeData } = useGame3D()

  if (burnState !== 'consequence') return null

  // Fetch the farm crop residue scenario and burn choice impact cards
  const farmScenario = scenariosData.find((s) => s.id === 'farm_crop_residue') || scenariosData[0]
  const burnChoice = farmScenario.choices.find((c) => c.id === 'choice_burn_stubble')
  const threeCards = burnChoice?.impact?.threeCards || []

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 18, 16, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
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
          maxWidth: '560px',
          padding: '24px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          border: '3px solid #D84315',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🔥 🌾</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#BF360C', margin: '0 0 6px 0' }}>
            {t('game3d.oneSeasonLaterTitle')}
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#5D4037', margin: 0, lineHeight: 1.4 }}>
            {t('game3d.oneSeasonLaterSubtitle')}
          </p>
        </div>

        {/* Consequence Badges Summary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '18px',
            flexWrap: 'wrap'
          }}
        >
          <span
            style={{
              backgroundColor: '#FFEBEE',
              border: '1.5px solid #E53935',
              color: '#C62828',
              fontWeight: 800,
              fontSize: '0.78rem',
              padding: '4px 12px',
              borderRadius: '9999px'
            }}
          >
            📉 Nature Health: -25%
          </span>
          <span
            style={{
              backgroundColor: '#FFF8E1',
              border: '1.5px solid #FFB300',
              color: '#F57F17',
              fontWeight: 800,
              fontSize: '0.78rem',
              padding: '4px 12px',
              borderRadius: '9999px'
            }}
          >
            ⭐ Learning Points: +10 pts
          </span>
        </div>

        {/* 3 Consequence Cards from scenarios.json */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {threeCards.map((card) => {
            const cardTitle = typeof card.title === 'object' ? card.title[language] || card.title.en : card.title
            const cardDetail = typeof card.detail === 'object' ? card.detail[language] || card.detail.en : card.detail
            const isVerified = card.stat?.verified === true
            const statVal = card.stat?.value
              ? typeof card.stat.value === 'object'
                ? card.stat.value[language] || card.stat.value.en
                : card.stat.value
              : null

            return (
              <div
                key={card.id}
                style={{
                  backgroundColor: '#FAFAFA',
                  border: '1.5px solid #E0E0E0',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>{card.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#263238', margin: 0 }}>
                      {cardTitle}
                    </h3>
                    {/* Verified Flag Badge */}
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        color: isVerified ? '#2E7D32' : '#E65100',
                        backgroundColor: isVerified ? '#E8F5E9' : '#FFF3E0',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        border: `1px solid ${isVerified ? '#A5D6A7' : '#FFE082'}`
                      }}
                    >
                      {isVerified ? t('dataNotice.verifiedBadge') : t('dataNotice.unverifiedBadge')}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: '#546E7A', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                    {cardDetail}
                  </p>

                  {/* Stat value & source citation */}
                  {statVal && (
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: '#37474F',
                        fontWeight: 700,
                        backgroundColor: '#ECEFF1',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <span>📊 {statVal}</span>
                      {card.stat?.source && (
                        <span style={{ fontSize: '0.65rem', color: '#78909C', fontWeight: 600 }}>
                          Source: {card.stat.source}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button
            type="button"
            onClick={resetBurn}
            style={{
              minHeight: '48px',
              padding: '10px 18px',
              borderRadius: '9999px',
              backgroundColor: '#2E7D32',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.35)'
            }}
          >
            <span>↺</span>
            <span>{t('game3d.rewindBtn')}</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToLite}
            style={{
              minHeight: '44px',
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              color: '#37474F',
              border: '2px solid #90A4AE',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>📱</span>
            <span>{t('game3d.switchToLite')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
