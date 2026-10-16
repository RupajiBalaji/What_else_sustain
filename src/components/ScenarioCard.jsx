import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'

export default function ScenarioCard({ scenario, onSelect }) {
  const { getLocalized, t } = useLanguage()
  const { completedScenarios } = useGame()

  const isCompleted = completedScenarios.includes(scenario.id)
  const maxPossiblePoints = Math.max(
    ...(scenario.choices || []).map((c) => c.pointsDelta || 0),
    10
  )

  const audienceLabel = scenario.targetAudience && scenario.targetAudience[0]
    ? t(`scenarioList.audiences.${scenario.targetAudience[0]}`, scenario.targetAudience[0])
    : ''

  const difficultyLabel = t(`scenarioList.difficulties.${scenario.difficulty}`, scenario.difficulty)

  return (
    <article
      className="scenario-card"
      onClick={() => onSelect && onSelect(scenario)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (onSelect) onSelect(scenario)
        }
      }}
      aria-label={`${getLocalized(scenario.title)}. ${isCompleted ? t('scenarioList.card.completed') : t('scenarioList.card.new')}`}
    >
      <div className="card-top">
        <div className="card-icon-title">
          <span className="card-emoji" aria-hidden="true">{scenario.icon || '🌱'}</span>
          <div>
            <h3 className="card-title">{getLocalized(scenario.title)}</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {difficultyLabel}
            </span>
          </div>
        </div>

        {audienceLabel && (
          <span className="audience-tag">
            {audienceLabel}
          </span>
        )}
      </div>

      <p className="card-summary">{getLocalized(scenario.summary)}</p>

      <div className="card-footer">
        <div className="card-points">
          <span aria-hidden="true">⭐</span>
          <span>+{maxPossiblePoints} {t('scenarioList.card.pointsReward')}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`card-status-badge ${isCompleted ? 'completed' : 'pending'}`}>
            {isCompleted ? t('scenarioList.card.completed') : t('scenarioList.card.new')}
          </span>

          <button
            type="button"
            className="start-action-btn"
            onClick={(e) => {
              e.stopPropagation()
              if (onSelect) onSelect(scenario)
            }}
          >
            <span>{t('scenarioList.card.startBtn')}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  )
}
