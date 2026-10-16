import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'

export default function NatureHealthBar() {
  const { t } = useLanguage()
  const { natureHealth } = useGame()

  // Determine health color and status label
  let statusText = t('healthBar.statusStable')
  let barColor = 'var(--color-leaf-green)'
  let statusEmoji = '🌿'

  if (natureHealth >= 75) {
    statusText = t('healthBar.statusThriving')
    barColor = 'linear-gradient(90deg, var(--color-leaf-green), var(--color-lime))'
    statusEmoji = '🌳'
  } else if (natureHealth >= 45) {
    statusText = t('healthBar.statusStable')
    barColor = 'linear-gradient(90deg, var(--color-amber), var(--color-leaf-green))'
    statusEmoji = '🌿'
  } else {
    statusText = t('healthBar.statusCritical')
    barColor = 'var(--color-harm-red)'
    statusEmoji = '🥀'
  }

  return (
    <section className="health-bar-container" aria-label="Nature Health Indicator">
      <div className="health-header">
        <div className="health-title-group">
          <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>{statusEmoji}</span>
          <span>{t('healthBar.title')}</span>
        </div>
        <div className="health-percent" style={{ color: natureHealth < 40 ? 'var(--color-harm-red)' : 'var(--color-deep-green)' }}>
          {natureHealth}%
        </div>
      </div>

      <div className="health-track" role="progressbar" aria-valuenow={natureHealth} aria-valuemin="0" aria-valuemax="100">
        <div
          className="health-fill"
          style={{
            width: `${natureHealth}%`,
            background: barColor
          }}
        />
      </div>

      <div className="health-hint">
        <span style={{ fontWeight: 600 }}>{statusText}</span>
        <span>{t('healthBar.instruction')}</span>
      </div>
    </section>
  )
}
