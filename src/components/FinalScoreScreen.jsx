import React, { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'

export default function FinalScoreScreen({ onBackToScenarios, onOpenBadges }) {
  const { t, lang } = useLanguage()
  const {
    points,
    natureHealth,
    badges,
    completedScenarios,
    currentLevelKey,
    levelNumber,
    resetProgress
  } = useGame()

  const [copied, setCopied] = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')

  // Level name in chosen language
  const levelTitle = t(`levels.${currentLevelKey}`)

  // Get primary badge name for sharing
  const getBadgeNameForShare = () => {
    if (!badges || badges.length === 0) {
      return lang === 'te' ? 'పర్యావరణ రక్షకుడు' : 'Eco Hero'
    }
    const lastId = badges[badges.length - 1]
    const badgeMap = {
      pledge_keeper: { en: 'Pledge Keeper', te: 'ప్రతిజ్ఞా రక్షకుడు' },
      soil_saver: { en: 'Soil Saver', te: 'నేల సంరక్షకుడు' },
      plastic_buster: { en: 'Plastic Buster', te: 'ప్లాస్టిక్ రక్షకుడు' },
      curious_mind: { en: 'Curious Mind', te: 'ఆసక్తిగల అన్వేషకుడు' },
      green_guardian: { en: 'Green Guardian', te: 'హరిత సంరక్షకుడు' }
    }
    return badgeMap[lastId] ? badgeMap[lastId][lang] || badgeMap[lastId].en : (lang === 'te' ? 'పర్యావరణ రక్షకుడు' : 'Eco Hero')
  }

  const siteUrl = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://what-else-sustain.vercel.app'

  // Text format required by prompt:
  // "I scored X points on What Else Sustain and earned the [badge] badge. Make the mistake. Understand it. Choose what else." plus the site URL.
  const shareMyScoreText = lang === 'te'
    ? `నేను What Else Sustain లో ${points} పాయింట్లు సాధించాను మరియు ${getBadgeNameForShare()} బ్యాడ్జ్ గెలుచుకున్నాను. "తప్పు చేయండి. తెలుసుకోండి. ప్రత్యామ్నాయాన్ని ఎంచుకోండి." ${siteUrl}`
    : `I scored ${points} points on What Else Sustain and earned the ${getBadgeNameForShare()} badge. Make the mistake. Understand it. Choose what else. ${siteUrl}`

  // Detailed scorecard breakdown text
  const shareText = lang === 'te'
    ? `🌱 వాట్ ఎల్స్ సస్టైన్ (What Else Sustain) — నా పర్యావరణ స్కోర్‌కార్డ్!\n🎖️ నా స్థాయి: ${levelTitle}\n⭐ పాయింట్లు: ${points} Pts\n🌿 ప్రకృతి ఆరోగ్యం: ${natureHealth}%\n🏅 సాధించిన బ్యాడ్జీలు: ${badges.length}\n✅ పూర్తయిన సవాళ్లు: ${completedScenarios.length}\n\n"తప్పు చేయండి. తెలుసుకోండి. ప్రత్యామ్నాయాన్ని ఎంచుకోండి."\n${siteUrl}\n#WhatElseSustain #Sustainability #GoGreen`
    : `🌱 What Else Sustain — My Eco Scorecard!\n🎖️ My Rank: ${levelTitle} (Level ${levelNumber})\n⭐ Points: ${points} Pts\n🌿 Nature Health: ${natureHealth}%\n🏅 Badges Earned: ${badges.length}\n✅ Scenarios Completed: ${completedScenarios.length}\n\n"Make the mistake. Understand it. Choose what else."\n${siteUrl}\n#WhatElseSustain #Sustainability #EcoHero`

  const copyToClipboard = async (text, isScorecard = false) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      if (isScorecard) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } else {
        setShareFeedback(t('scoreScreen.shareScoreCopied'))
        setTimeout(() => setShareFeedback(''), 3000)
      }
    } catch {
      if (isScorecard) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } else {
        setShareFeedback(t('scoreScreen.shareScoreCopied'))
        setTimeout(() => setShareFeedback(''), 3000)
      }
    }
  }

  const handleShareMyScore = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: t('app.title'),
          text: shareMyScoreText,
          url: siteUrl
        })
        return
      } catch (err) {
        if (err && err.name === 'AbortError') {
          return // User cancelled share sheet
        }
      }
    }
    await copyToClipboard(shareMyScoreText, false)
  }

  const handleCopySummary = async () => {
    await copyToClipboard(shareText, true)
  }

  return (
    <div data-testid="final-scorecard-screen" className="final-score-container" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onBackToScenarios}
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
          <span>{t('scoreScreen.back')}</span>
        </button>

        <button
          type="button"
          onClick={onOpenBadges}
          style={{
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--color-deep-green)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🏅</span>
          <span>{t('header.badges')} ({badges.length})</span>
        </button>
      </div>

      {/* Hero Victory Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-deep-green), #145943)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 20px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <div style={{ fontSize: '3.6rem', lineHeight: 1, animation: 'bounce 1s infinite alternate' }}>
          🏆
        </div>

        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
          {t('scoreScreen.heroTitle')}
        </h2>

        <p style={{ fontSize: '0.86rem', color: 'var(--color-lime)', fontWeight: 600, maxWidth: '380px' }}>
          {t('scoreScreen.heroSubtitle')}
        </p>

        {/* Level Pill */}
        <div
          style={{
            background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid var(--color-lime)',
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#FFFFFF',
            marginTop: '4px'
          }}
        >
          {levelTitle}
        </div>
      </div>

      {/* 4 Key Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Metric 1: Total Points */}
        <div style={{ background: 'var(--color-card-bg)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <span style={{ fontSize: '1.4rem' }}>⭐</span>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-leaf-green)', marginTop: '2px' }}>
            {points}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {t('scoreScreen.metricPoints')}
          </span>
        </div>

        {/* Metric 2: Nature Health */}
        <div style={{ background: 'var(--color-card-bg)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <span style={{ fontSize: '1.4rem' }}>🌿</span>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: natureHealth >= 70 ? 'var(--color-leaf-green)' : 'var(--color-amber)', marginTop: '2px' }}>
            {natureHealth}%
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {t('scoreScreen.metricHealth')}
          </span>
        </div>

        {/* Metric 3: Badges */}
        <div style={{ background: 'var(--color-card-bg)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <span style={{ fontSize: '1.4rem' }}>🏅</span>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-deep-green)', marginTop: '2px' }}>
            {badges.length}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {t('scoreScreen.metricBadges')}
          </span>
        </div>

        {/* Metric 4: Completed Scenarios */}
        <div style={{ background: 'var(--color-card-bg)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <span style={{ fontSize: '1.4rem' }}>✅</span>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-deep-green)', marginTop: '2px' }}>
            {completedScenarios.length}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {t('scoreScreen.metricScenarios')}
          </span>
        </div>
      </div>

      {/* Shareable Summary Box */}
      <div
        style={{
          background: 'var(--color-card-bg)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          border: '1.5px solid var(--color-leaf-green)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-deep-green)' }}>
            📲 {t('scoreScreen.shareHeading')}
          </h3>
          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
            WhatsApp & Social
          </span>
        </div>

        <pre
          style={{
            background: 'var(--color-surface-subtle)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.78rem',
            color: 'var(--color-text-main)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'inherit',
            lineHeight: 1.45,
            border: '1px solid var(--color-border)'
          }}
        >
          {shareText}
        </pre>

        {/* Main "Share my score" action button with Web Share API and clipboard fallback */}
        <button
          type="button"
          onClick={handleShareMyScore}
          className="start-action-btn"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '14px',
            fontSize: '1rem',
            minHeight: '48px',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <span>{t('scoreScreen.shareScoreBtn')}</span>
        </button>

        {/* Feedback alert banner when text is copied */}
        {shareFeedback && (
          <div
            style={{
              background: '#E8F5E9',
              border: '1.5px solid var(--color-leaf-green)',
              color: 'var(--color-deep-green)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: '0.84rem',
              fontWeight: 800,
              textAlign: 'center'
            }}
          >
            {shareFeedback}
          </div>
        )}

        {/* Copy full detailed scorecard breakdown */}
        <button
          type="button"
          onClick={handleCopySummary}
          className="filter-tab"
          style={{
            width: '100%',
            justifyContent: 'center',
            background: copied ? 'var(--color-lime)' : 'var(--color-surface-subtle)',
            color: copied ? 'var(--color-deep-green)' : 'var(--color-text-main)',
            border: '1px solid var(--color-border)',
            minHeight: '44px',
            fontWeight: 700
          }}
        >
          <span>{copied ? '✓ ' + t('scoreScreen.copied') : '📋 ' + t('scoreScreen.copyBtn')}</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={onBackToScenarios}
          className="start-action-btn"
          style={{ flex: 1, justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}
        >
          <span>{t('scoreScreen.playMoreBtn')}</span>
          <span aria-hidden="true">→</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset score and replay all scenarios?')) {
              resetProgress()
              onBackToScenarios()
            }
          }}
          className="filter-tab"
          style={{ padding: '14px', justifyContent: 'center', background: 'var(--color-surface-subtle)', color: 'var(--color-text-muted)' }}
        >
          <span>🔄</span>
        </button>
      </div>
    </div>
  )
}
