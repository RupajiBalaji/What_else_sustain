import React, { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import scenariosData from '../data/scenarios.json'
import ScenarioCard from './ScenarioCard'

export default function ScenarioList({ onSelectScenario, onStartDemoMode }) {
  const { t, lang } = useLanguage()
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { key: 'all', label: t('scenarioList.categories.all'), icon: '✨' },
    { key: 'students', label: t('scenarioList.categories.students'), icon: '🎒' },
    { key: 'farming', label: t('scenarioList.categories.farming'), icon: '🌾' },
    { key: 'daily_life', label: t('scenarioList.categories.daily_life'), icon: '🏠' }
  ]

  const filteredScenarios = scenariosData.filter((scenario) => {
    if (selectedCategory === 'all') return true
    if (scenario.category === selectedCategory) return true
    if (scenario.targetAudience && scenario.targetAudience.includes(selectedCategory)) return true
    return false
  })

  return (
    <section className="scenario-section" aria-labelledby="scenario-list-heading">
      {/* Pitch Day Demo Mode Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0B3D2E, #1B6A50)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 16px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '14px',
          border: '1.5px solid var(--color-lime)',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-lime)' }}>
            <span>⚡ STARTUP PITCH DAY</span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginTop: '4px', lineHeight: 1.25 }}>
            {lang === 'te' ? '45 సెకన్ల ఆటో-ప్లే పిచ్ డెమో' : '45-Second Live Pitch Demo'}
          </h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--color-cream)', marginTop: '2px' }}>
            {lang === 'te'
              ? 'నిర్ణయం, నష్టం & ప్రత్యామ్నాయాల పూర్తి గేమ్‌ను ఆటోమేటిక్‌గా చూడండి.'
              : 'Auto-plays the complete game loop from mistake to sustainable profit.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onStartDemoMode}
          className="start-action-btn"
          style={{
            background: 'var(--color-lime)',
            color: 'var(--color-deep-green)',
            fontWeight: 800,
            fontSize: '0.85rem',
            padding: '10px 16px',
            boxShadow: '0 4px 12px rgba(183, 227, 106, 0.4)',
            minHeight: '44px',
            whiteSpace: 'nowrap'
          }}
        >
          <span>▶️ {lang === 'te' ? 'డెమో ప్రారంభించండి' : 'Launch Demo'}</span>
        </button>
      </div>

      <div className="section-header">
        <h2 id="scenario-list-heading" className="section-title">
          <span>{t('scenarioList.heading')}</span>
        </h2>
        <span className="section-badge">
          {filteredScenarios.length} {t('scenarioList.totalAvailable')}
        </span>
      </div>

      <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
        {t('scenarioList.subheading')}
      </p>

      {/* Filter Tabs */}
      <nav className="filter-tabs" aria-label="Category filters">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`filter-tab ${selectedCategory === cat.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            <span aria-hidden="true">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </nav>

      {/* Cards List */}
      <div className="scenario-list" style={{ marginTop: '12px' }}>
        {filteredScenarios.length > 0 ? (
          filteredScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onSelect={onSelectScenario}
            />
          ))
        ) : (
          <div className="empty-state">
            <span style={{ fontSize: '2.5rem' }}>🌱</span>
            <h4 style={{ fontWeight: 700, color: 'var(--color-deep-green)' }}>
              {t('scenarioList.empty.title')}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {t('scenarioList.empty.description')}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
