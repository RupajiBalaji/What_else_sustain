import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'

export default function BadgeCollectionPage({ onBack, onOpenScorecard }) {
  const { t } = useLanguage()
  const {
    badges,
    points,
    levelNumber,
    currentLevelKey,
    levelProgressPercent,
    nextLevelPoints
  } = useGame()

  const allBadges = [
    {
      id: 'soil_saver',
      icon: '🌾',
      title: t('badges.soilSaverTitle'),
      desc: t('badges.soilSaverDesc'),
      criteria: t('badgePage.soilSaverCriteria')
    },
    {
      id: 'plastic_buster',
      icon: '🧴',
      title: t('badges.plasticBusterTitle'),
      desc: t('badges.plasticBusterDesc'),
      criteria: t('badgePage.plasticBusterCriteria')
    },
    {
      id: 'curious_mind',
      icon: '🔍',
      title: t('badges.curiousMindTitle'),
      desc: t('badges.curiousMindDesc'),
      criteria: t('badgePage.curiousMindCriteria')
    },
    {
      id: 'green_guardian',
      icon: '🌳',
      title: t('badges.greenGuardianTitle'),
      desc: t('badges.greenGuardianDesc'),
      criteria: t('badgePage.greenGuardianCriteria')
    },
    {
      id: 'pledge_keeper',
      icon: '🤝',
      title: t('badges.pledgeKeeperTitle'),
      desc: t('badges.pledgeKeeperDesc'),
      criteria: t('badgePage.pledgeKeeperCriteria')
    }
  ]

  const unlockedCount = allBadges.filter((b) => badges.includes(b.id)).length

  return (
    <div data-testid="badge-collection-screen" className="badge-collection-container" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--color-deep-green)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>←</span>
          <span>{t('badgePage.back')}</span>
        </button>

        <button
          type="button"
          onClick={onOpenScorecard}
          style={{
            background: 'rgba(46, 158, 91, 0.12)',
            border: '1.5px solid var(--color-leaf-green)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: 'var(--color-leaf-green)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📊</span>
          <span>{t('badgePage.viewScorecard')}</span>
        </button>
      </div>

      {/* Hero Level Progression Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-deep-green), #145943)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          padding: '18px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-lime)', fontWeight: 800, textTransform: 'uppercase' }}>
              {t('badgePage.currentRank')}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.2, marginTop: '2px' }}>
              {t(`levels.${currentLevelKey}`)}
            </h2>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.9rem',
              fontWeight: 800,
              color: 'var(--color-lime)'
            }}
          >
            ⭐ {points} {t('header.points')}
          </div>
        </div>

        {/* Progress bar towards next tier */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '6px', color: 'var(--color-cream)' }}>
            <span>{t('header.level')} {levelNumber} of 4</span>
            <span>{points}/{nextLevelPoints} pts</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '10px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${levelProgressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--color-leaf-green), var(--color-lime))',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
        </div>

        {/* Tiers overview */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '8px', flexWrap: 'wrap', gap: '4px' }}>
          <span>1. {t('levels.seedling')}</span>
          <span>2. {t('levels.sapling')}</span>
          <span>3. {t('levels.tree')}</span>
          <span>4. {t('levels.forest')}</span>
        </div>
      </div>

      {/* Badges Collection Section */}
      <div className="section-header">
        <h3 className="section-title">
          <span>🏅 {t('badgePage.heading')}</span>
        </h3>
        <span className="section-badge">
          {unlockedCount} / {allBadges.length} {t('badgePage.unlocked')}
        </span>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
        {t('badgePage.subheading')}
      </p>

      {/* Grid of Badges */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {allBadges.map((badge) => {
          const isUnlocked = badges.includes(badge.id)
          return (
            <div
              key={badge.id}
              style={{
                background: isUnlocked ? 'var(--color-card-bg)' : '#F2EFE6',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                border: isUnlocked ? '2px solid var(--color-leaf-green)' : '1.5px dashed var(--color-border)',
                boxShadow: isUnlocked ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                opacity: isUnlocked ? 1 : 0.8
              }}
            >
              <div
                style={{
                  fontSize: '2.2rem',
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: isUnlocked ? 'rgba(46, 158, 91, 0.12)' : '#DDD9CD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isUnlocked ? '0 2px 8px rgba(46, 158, 91, 0.25)' : 'none',
                  filter: isUnlocked ? 'none' : 'grayscale(100%)'
                }}
              >
                {badge.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-deep-green)' }}>
                    {badge.title}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: isUnlocked ? 'var(--color-leaf-green)' : '#999999',
                      color: '#FFFFFF'
                    }}
                  >
                    {isUnlocked ? t('badges.unlocked') : t('badges.locked')}
                  </span>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-main)', marginTop: '4px', lineHeight: 1.4 }}>
                  {badge.desc}
                </p>

                <div
                  style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    background: isUnlocked ? 'rgba(46, 158, 91, 0.08)' : 'var(--color-surface-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.74rem',
                    color: isUnlocked ? 'var(--color-deep-green)' : 'var(--color-text-muted)'
                  }}
                >
                  <strong>{t('badgePage.howToEarn')}: </strong>
                  {badge.criteria}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
