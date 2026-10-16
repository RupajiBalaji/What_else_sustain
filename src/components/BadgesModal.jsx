import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'

export default function BadgesModal({ onClose }) {
  const { t } = useLanguage()
  const { badges, points, levelNumber, currentLevelKey, levelProgressPercent, nextLevelPoints } = useGame()

  const allBadges = [
    {
      id: 'soil_saver',
      icon: '🌾',
      title: t('badges.soilSaverTitle'),
      desc: t('badges.soilSaverDesc')
    },
    {
      id: 'curious_mind',
      icon: '🔍',
      title: t('badges.curiousMindTitle'),
      desc: t('badges.curiousMindDesc')
    },
    {
      id: 'green_guardian',
      icon: '🌳',
      title: t('badges.greenGuardianTitle'),
      desc: t('badges.greenGuardianDesc')
    }
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 61, 46, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 200,
        backdropFilter: 'blur(3px)'
      }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          background: 'var(--color-card-bg)',
          width: '100%',
          maxWidth: '460px',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-deep-green)', fontWeight: 800 }}>
              {t('badges.modalTitle')}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {t('badges.modalSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('badges.close')}
            style={{
              background: 'var(--color-surface-subtle)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Level Progression Card */}
        <div
          style={{
            background: 'var(--color-deep-green)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-lime)' }}>
              {t('header.level')} {levelNumber}: {t(`levels.${currentLevelKey}`)}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
              {points} {t('header.points')}
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${levelProgressPercent}%`,
                height: '100%',
                background: 'var(--color-lime)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>

          <span style={{ fontSize: '0.72rem', color: 'var(--color-cream)', textAlign: 'right' }}>
            {points}/{nextLevelPoints} pts to next rank
          </span>
        </div>

        {/* Badges List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {allBadges.map((badge) => {
            const isUnlocked = badges.includes(badge.id)
            return (
              <div
                key={badge.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: isUnlocked ? 'rgba(46, 158, 91, 0.08)' : 'var(--color-surface-subtle)',
                  border: isUnlocked ? '1.5px solid var(--color-leaf-green)' : '1px dashed var(--color-border)',
                  opacity: isUnlocked ? 1 : 0.75
                }}
              >
                <div
                  style={{
                    fontSize: '1.8rem',
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: isUnlocked ? 'var(--color-card-bg)' : '#E0DBD0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isUnlocked ? 'var(--shadow-sm)' : 'none',
                    filter: isUnlocked ? 'none' : 'grayscale(100%)'
                  }}
                >
                  {badge.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-deep-green)' }}>
                      {badge.title}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: isUnlocked ? 'var(--color-leaf-green)' : '#999999',
                        color: '#FFFFFF'
                      }}
                    >
                      {isUnlocked ? t('badges.unlocked') : t('badges.locked')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {badge.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="start-action-btn"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px' }}
        >
          {t('badges.close')}
        </button>
      </div>
    </div>
  )
}
