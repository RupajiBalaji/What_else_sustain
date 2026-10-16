import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'

export default function Header({ onOpenBadges, onOpenScorecard, onOpenAdvisor }) {
  const { lang, toggleLanguage, t } = useLanguage()
  const { points, badges, currentLevelKey } = useGame()

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand-wrap">
          <div className="brand-icon" aria-hidden="true">🌱</div>
          <div>
            <h1 className="brand-title">{t('app.title')}</h1>
            <p className="brand-tagline">{t('app.tagline')}</p>
          </div>
        </div>

        <button
          onClick={toggleLanguage}
          className="lang-toggle-btn"
          aria-label={`Switch language to ${lang === 'en' ? 'Telugu' : 'English'}`}
          type="button"
        >
          <span aria-hidden="true">🌐</span>
          <span>{lang === 'en' ? 'తెలుగు' : 'English'}</span>
        </button>
      </div>

      {/* Main Stats Row */}
      <div className="header-stats-row">
        {/* Level Indicator */}
        <div
          className="stat-pill"
          style={{ cursor: 'pointer' }}
          onClick={onOpenBadges}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' ? onOpenBadges() : null)}
          aria-label="View user level and badges"
        >
          <span className="icon" aria-hidden="true">🎖️</span>
          <span style={{ fontSize: '0.78rem' }}>{t(`levels.${currentLevelKey}`)}</span>
        </div>

        {/* Points Pill */}
        <div className="stat-pill">
          <span className="icon" aria-hidden="true">⭐</span>
          <span>{t('header.points')}:</span>
          <span className="val">{points}</span>
        </div>

        {/* Badges Pill */}
        <div
          className="stat-pill badge-clickable-pill"
          style={{ cursor: 'pointer', background: 'rgba(183, 227, 106, 0.25)', padding: '4px 8px', borderRadius: 'var(--radius-full)' }}
          onClick={onOpenBadges}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' ? onOpenBadges() : null)}
          aria-label="Open earned badges collection"
        >
          <span className="icon" aria-hidden="true">🏅</span>
          <span style={{ color: '#FFFFFF' }}>{t('header.badges')}:</span>
          <span className="val">{badges.length}</span>
        </div>
      </div>

      {/* Quick Access Action Bar for AI Advisor and Scorecard */}
      <div style={{ display: 'flex', gap: '6px', paddingTop: '2px' }}>
        <button
          type="button"
          onClick={onOpenAdvisor}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(183, 227, 106, 0.5)',
            color: 'var(--color-lime)',
            padding: '7px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>🤖</span>
          <span>{t('header.advisorBtn')}</span>
        </button>

        <button
          type="button"
          onClick={onOpenScorecard}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#FFFFFF',
            padding: '7px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>📊</span>
          <span>{t('header.scorecardBtn')}</span>
        </button>
      </div>
    </header>
  )
}
