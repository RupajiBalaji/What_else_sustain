import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'
import { safeStorage } from '../utils/safeStorage'
import FarmIllustration from './FarmIllustration'
import HomeIllustration from './HomeIllustration'

const PLEDGES_STORAGE_KEY = 'wes_pledges_v1'

export default function ScenarioPlayer({ scenario, onExit, onCompleteAll, isDemoMode = false }) {
  const { getLocalized, t, lang } = useLanguage()
  const {
    modifyNatureHealth,
    addPoints,
    unlockBadge,
    markScenarioCompleted,
    levelNumber,
    currentLevelKey,
    levelProgressPercent,
    points
  } = useGame()

  // Stages: 'intro' | 'choice' | 'impact_mistake' | 'what_else' | 'replay_choice' | 'comparison' | 'rewards' | 'pledge'
  const [stage, setStage] = useState('intro')
  const [selectedMistake, setSelectedMistake] = useState(null)
  const [chosenAlternative, setChosenAlternative] = useState(null)
  const [hasExploredMistake, setHasExploredMistake] = useState(false)
  const [hasExploredWhatElse, setHasExploredWhatElse] = useState(false)
  const [earnedInThisRun, setEarnedInThisRun] = useState({ mistakePts: 0, altPts: 0, bonusPts: 0 })

  // Check if pledge was previously recorded for this scenario
  const [isPledged, setIsPledged] = useState(() => {
    try {
      const stored = safeStorage.getItem(PLEDGES_STORAGE_KEY)
      if (stored) {
        const list = JSON.parse(stored)
        return Array.isArray(list) && list.some((item) => item.scenarioId === scenario.id)
      }
    } catch {
      // safe fallback
    }
    return false
  })

  // Demo Mode state
  const [demoSeconds, setDemoSeconds] = useState(0)
  const [isDemoPaused, setIsDemoPaused] = useState(false)

  const alternativeChoices = (scenario.choices || []).filter((c) => !c.isMistake)

  // Illustration visual state
  let illustrationState = 'normal'
  if (stage === 'impact_mistake') {
    illustrationState = 'burning'
  } else if (stage === 'comparison' || stage === 'rewards' || stage === 'pledge' || (chosenAlternative && stage !== 'what_else')) {
    illustrationState = 'sustainable'
  }

  // Determine badge to award for this scenario
  const getScenarioBadgeId = () => {
    if (scenario.id === 'farm_crop_residue') return 'soil_saver'
    if (scenario.id === 'home_plastic_bottle') return 'plastic_buster'
    return 'curious_mind'
  }

  // Get matched pledge text for the scenario
  const getScenarioPledgeText = () => {
    if (scenario.id === 'farm_crop_residue') {
      return t('pledge.farmPledge')
    }
    if (scenario.id === 'home_plastic_bottle') {
      return t('pledge.plasticPledge')
    }
    return t('pledge.defaultPledge')
  }

  // Handle player taking the pledge
  const handleTakePledge = () => {
    if (isPledged) return
    setIsPledged(true)
    addPoints(25)
    unlockBadge('pledge_keeper')

    // Persist pledge to safeStorage
    try {
      const stored = safeStorage.getItem(PLEDGES_STORAGE_KEY)
      const list = stored ? JSON.parse(stored) : []
      const pledgeText = getScenarioPledgeText()
      const newEntry = {
        scenarioId: scenario.id,
        pledgeText,
        date: new Date().toISOString()
      }
      if (!list.some((item) => item.scenarioId === scenario.id)) {
        list.push(newEntry)
      }
      safeStorage.setItem(PLEDGES_STORAGE_KEY, JSON.stringify(list))
    } catch (err) {
      console.warn('[ScenarioPlayer] safeStorage write error:', err)
    }
  }

  // Handle player's choice in step 2
  const handleSelectInitialChoice = (choice) => {
    if (!choice) return
    if (choice.isMistake) {
      setSelectedMistake(choice)
      setHasExploredMistake(true)
      modifyNatureHealth(choice.natureHealthDelta || -25)
      addPoints(choice.pointsDelta || 10)
      setEarnedInThisRun((prev) => ({ ...prev, mistakePts: choice.pointsDelta || 10 }))
      setStage('impact_mistake')
    } else {
      // Direct sustainable choice
      setChosenAlternative(choice)
      modifyNatureHealth(choice.natureHealthDelta || 25)
      addPoints(choice.pointsDelta || 50)
      unlockBadge(getScenarioBadgeId())
      markScenarioCompleted(scenario.id)
      setEarnedInThisRun((prev) => ({ ...prev, altPts: choice.pointsDelta || 50 }))
      setStage('comparison')
    }
  }

  // Handle "What Else?" button click
  const handleGoToWhatElse = () => {
    setHasExploredWhatElse(true)
    unlockBadge('curious_mind')
    addPoints(20)
    setEarnedInThisRun((prev) => ({ ...prev, bonusPts: 20 }))
    setStage('what_else')
  }

  // Handle alternative selection in replay
  const handleSelectAlternative = (alt) => {
    if (!alt) return
    setChosenAlternative(alt)
    modifyNatureHealth(alt.natureHealthDelta || 25)
    addPoints(alt.pointsDelta || 50)
    unlockBadge(getScenarioBadgeId())
    markScenarioCompleted(scenario.id)
    setEarnedInThisRun((prev) => ({ ...prev, altPts: alt.pointsDelta || 50 }))
    setStage('comparison')
  }

  // Auto-play demo timer (45 seconds)
  useEffect(() => {
    if (!isDemoMode || isDemoPaused) return

    const interval = setInterval(() => {
      setDemoSeconds((prev) => {
        const next = prev + 1

        if (next === 6) {
          setStage('choice')
        } else if (next === 13) {
          const mistake = scenario.choices.find((c) => c.isMistake)
          handleSelectInitialChoice(mistake)
        } else if (next === 23) {
          handleGoToWhatElse()
        } else if (next === 32) {
          const bestAlt = scenario.choices.find((c) => !c.isMistake)
          handleSelectAlternative(bestAlt)
        } else if (next === 38) {
          setStage('rewards')
        } else if (next === 41) {
          setStage('pledge')
        } else if (next === 43) {
          handleTakePledge()
        } else if (next === 45) {
          if (onCompleteAll) onCompleteAll()
        }

        return next <= 45 ? next : 45
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isDemoMode, isDemoPaused, scenario])

  // Narration helper text for demo mode
  const getDemoNarration = () => {
    if (demoSeconds < 6) {
      return 'Step 1: The Dilemma — 5 acres of stubble left after harvest.'
    }
    if (demoSeconds < 13) {
      return 'Step 2: The Tempting Mistake — Burning looks fast and free.'
    }
    if (demoSeconds < 23) {
      return 'Step 3: The True Impact — Toxic smog, respiratory risk & lost soil fertility.'
    }
    if (demoSeconds < 32) {
      return 'Step 4: What Else? — Practical alternatives (Mulch, Compost, Sell).'
    }
    if (demoSeconds < 38) {
      return 'Step 5: Better Choice — Happy Seeder mulch restores nature health and saves money!'
    }
    if (demoSeconds < 43) {
      return 'Step 6: The Pledge — Taking the pledge: "I will not burn crop waste this season".'
    }
    return 'Finished: Bonus points & Pledge Keeper badge unlocked!'
  }

  return (
    <div className="scenario-player-container" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Pitch Demo Bar (Shown in Demo Mode) */}
      {isDemoMode && (
        <div
          style={{
            background: 'linear-gradient(135deg, #0B3D2E, #145943)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            border: '2px solid var(--color-lime)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot" style={{ fontSize: '1rem', color: '#FF4D4F' }}>🔴</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-lime)' }}>
                {lang === 'te' ? 'పిచ్ డెమో మోడ్ (45 సెకన్లు)' : 'Live Pitch Demo (45s Auto-play)'}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-cream)', fontWeight: 700, marginRight: '4px' }}>
                {demoSeconds}s / 45s
              </span>
              <button
                type="button"
                onClick={() => setIsDemoPaused(!isDemoPaused)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  color: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  minHeight: '36px'
                }}
              >
                {isDemoPaused ? (lang === 'te' ? '▶️ కొనసాగించు' : '▶️ Resume') : (lang === 'te' ? '⏸️ నిలిపివేయి' : '⏸️ Pause')}
              </button>

              <button
                type="button"
                onClick={() => {
                  // Skip demo directly to rewards / final scorecard
                  const bestAlt = scenario.choices.find((c) => !c.isMistake)
                  if (bestAlt) {
                    handleSelectAlternative(bestAlt)
                  }
                  handleTakePledge()
                  if (onCompleteAll) {
                    onCompleteAll()
                  }
                }}
                style={{
                  background: 'var(--color-lime)',
                  border: 'none',
                  color: 'var(--color-deep-green)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  minHeight: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{lang === 'te' ? 'దాటవేయి ⏭️' : 'Skip demo ⏭️'}</span>
              </button>

              <button
                type="button"
                onClick={onExit}
                style={{
                  background: 'rgba(217, 83, 79, 0.85)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  minHeight: '36px'
                }}
              >
                {lang === 'te' ? '✕ నిష్క్రమించు' : '✕ Exit'}
              </button>
            </div>
          </div>

          {/* Demo Timeline Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(demoSeconds / 45) * 100}%`,
                height: '100%',
                background: 'var(--color-lime)',
                transition: 'width 1s linear'
              }}
            />
          </div>

          {/* Storyteller Narration Pill */}
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem', color: '#FFFFFF', fontWeight: 600 }}>
            📢 {getDemoNarration()}
          </div>
        </div>
      )}

      {/* Top Nav Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onExit}
          style={{
            background: 'var(--color-surface-subtle)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            padding: '8px 16px',
            fontSize: '0.84rem',
            fontWeight: 800,
            color: 'var(--color-deep-green)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            minHeight: '44px'
          }}
        >
          <span>←</span>
          <span>{t('scenarioFlow.exit')}</span>
        </button>

        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            background: 'var(--color-card-bg)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-leaf-green)'
          }}
        >
          {stage === 'intro' && `${t('scenarioFlow.step')} 1 ${t('scenarioFlow.of')} 5`}
          {stage === 'choice' && `${t('scenarioFlow.step')} 2 ${t('scenarioFlow.of')} 5`}
          {stage === 'impact_mistake' && `${t('scenarioFlow.step')} 3 ${t('scenarioFlow.of')} 5`}
          {stage === 'what_else' && `${t('scenarioFlow.step')} 4 ${t('scenarioFlow.of')} 5`}
          {(stage === 'replay_choice' || stage === 'comparison') && `${t('scenarioFlow.step')} 5 ${t('scenarioFlow.of')} 5`}
          {stage === 'rewards' && `🏆 ${t('scenarioFlow.rewardTitle')}`}
        </span>
      </div>

      {/* Dynamic Animated Illustration based on scenario type */}
      {scenario.illustrationType === 'home' ? (
        <HomeIllustration state={illustrationState} />
      ) : (
        <FarmIllustration state={illustrationState} />
      )}

      {/* STAGE 1: INTRO SCREEN */}
      {stage === 'intro' && (
        <div className="player-stage-card intro-card">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(46, 158, 91, 0.15)', padding: '5px 12px', borderRadius: 'var(--radius-full)', color: 'var(--color-deep-green)', fontSize: '0.76rem', fontWeight: 800 }}>
            <span>{scenario.icon}</span>
            <span>{getLocalized(scenario.title)}</span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-deep-green)', lineHeight: 1.3, marginTop: '8px' }}>
            {getLocalized(scenario.summary)}
          </h2>

          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', lineHeight: 1.5, marginTop: '8px' }}>
            {getLocalized(scenario.contextPrompt || scenario.summary)}
          </p>

          <button
            type="button"
            className="start-action-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', marginTop: '16px', minHeight: '48px' }}
            onClick={() => setStage('choice')}
          >
            <span>{t('scenarioFlow.startChoiceBtn')}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {/* STAGE 2: CHOICE SCREEN (4 OPTIONS) */}
      {stage === 'choice' && (
        <div className="player-stage-card choice-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-deep-green)' }}>
            {t('scenarioFlow.choicesHeading')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {scenario.choices.map((choice) => {
              const isMistake = choice.isMistake
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleSelectInitialChoice(choice)}
                  className={`choice-button ${isMistake ? 'choice-burn-tempting' : 'choice-sustainable'}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: isMistake ? '2px solid #D9534F' : '1.5px solid var(--color-border)',
                    background: isMistake ? '#FFF5F5' : 'var(--color-card-bg)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isMistake ? '0 4px 10px rgba(217, 83, 79, 0.15)' : 'var(--shadow-sm)',
                    minHeight: '52px'
                  }}
                >
                  <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{choice.icon}</span>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.94rem', fontWeight: 800, color: isMistake ? '#B22222' : 'var(--color-deep-green)' }}>
                        {getLocalized(choice.text)}
                      </span>
                      {choice.badge && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: isMistake ? 'var(--color-harm-red)' : 'var(--color-leaf-green)',
                            color: '#FFFFFF'
                          }}
                        >
                          {getLocalized(choice.badge)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* STAGE 3: IMPACT OF MISTAKE SCREEN */}
      {stage === 'impact_mistake' && selectedMistake && (
        <div className="player-stage-card impact-card">
          <div
            style={{
              background: '#FDEDED',
              border: '1.5px solid var(--color-harm-red)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>⚠️</span>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-harm-red)' }}>
                {getLocalized(selectedMistake.impact?.headline) || t('scenarioFlow.impactHeading')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#78281F', marginTop: '2px', fontWeight: 600 }}>
                {getLocalized(selectedMistake.impact?.description) || t('scenarioFlow.impactSubheading')}
              </p>
            </div>
          </div>

          {/* 3 Impact Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {(selectedMistake.impact?.threeCards || []).map((card) => (
              <div
                key={card.id}
                style={{
                  background: 'var(--color-card-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{card.icon}</span>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--color-deep-green)' }}>
                    {getLocalized(card.title)}
                  </h4>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-main)', lineHeight: 1.45 }}>
                  {getLocalized(card.detail)}
                </p>

                {/* Metric with Source & Unverified Flag */}
                {card.stat && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px 10px',
                      background: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {getLocalized(card.stat.label)}:
                      </span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-harm-red)', textAlign: 'right' }}>
                        {getLocalized(card.stat.value)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '0.72rem', color: 'var(--color-text-muted)', paddingTop: '6px', borderTop: '1px dashed var(--color-border)', flexWrap: 'wrap' }}>
                      <span>
                        <strong>{t('dataNotice.sourcePrefix')}</strong> {card.stat.source}
                      </span>
                      {card.stat.verified ? (
                        <span style={{ color: 'var(--color-leaf-green)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ✓ {card.stat.source}
                        </span>
                      ) : (
                        <span style={{ color: '#B25E00', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ⚠️ {t('dataNotice.unverifiedBadge')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action to What Else */}
          <button
            type="button"
            className="start-action-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', marginTop: '14px', minHeight: '48px' }}
            onClick={handleGoToWhatElse}
          >
            <span>{t('scenarioFlow.whatElseBtn')}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {/* STAGE 4: "WHAT ELSE?" ALTERNATIVES SCREEN */}
      {stage === 'what_else' && (
        <div className="player-stage-card what-else-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-deep-green)' }}>
              {t('scenarioFlow.whatElseHeading')}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {t('scenarioFlow.whatElseSubheading')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alternativeChoices.map((alt) => (
              <div
                key={alt.id}
                style={{
                  background: 'var(--color-card-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  border: '1.5px solid var(--color-leaf-green)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.8rem', background: 'rgba(46, 158, 91, 0.12)', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                    {alt.icon}
                  </span>
                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--color-deep-green)' }}>
                      {getLocalized(alt.text)}
                    </h4>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-leaf-green)' }}>
                      {getLocalized(alt.badge)}
                    </span>
                  </div>
                </div>

                {/* Practical Metrics: Cost, Effort, Money */}
                {alt.alternativeDetails && (
                  <>
                    <div className="what-else-grid">
                      <div style={{ background: 'var(--color-surface-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem' }}>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontWeight: 600 }}>{t('scenarioFlow.costLabel')}</span>
                        <strong style={{ color: 'var(--color-deep-green)' }}>{getLocalized(alt.alternativeDetails.cost)}</strong>
                      </div>

                      <div style={{ background: 'var(--color-surface-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem' }}>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontWeight: 600 }}>{t('scenarioFlow.effortLabel')}</span>
                        <strong style={{ color: 'var(--color-deep-green)' }}>{getLocalized(alt.alternativeDetails.effort)}</strong>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(46, 158, 91, 0.1)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--color-leaf-green)', fontWeight: 800, display: 'block' }}>
                        💵 {t('scenarioFlow.financialLabel')}
                      </span>
                      <span style={{ color: 'var(--color-deep-green)', fontWeight: 800 }}>
                        {getLocalized(alt.alternativeDetails.moneyImpact)}
                      </span>
                    </div>

                    {/* How-To Steps */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', lineHeight: 1.45, borderTop: '1px dashed var(--color-border)', paddingTop: '6px' }}>
                      <strong style={{ color: 'var(--color-deep-green)' }}>{t('scenarioFlow.howToLabel')} </strong>
                      {getLocalized(alt.alternativeDetails.howTo)}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  className="start-action-btn"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '12px', fontSize: '0.9rem', minHeight: '44px' }}
                  onClick={() => handleSelectAlternative(alt)}
                >
                  <span>Select & Apply This Choice</span>
                  <span aria-hidden="true">✓</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 5: BEFORE / AFTER COMPARISON */}
      {stage === 'comparison' && chosenAlternative && (
        <div className="player-stage-card comparison-card">
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-deep-green)' }}>
              {t('scenarioFlow.comparisonHeading')}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              See how your choice protected nature and saved financial value:
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Mistake side */}
            <div
              style={{
                background: '#FFF5F5',
                border: '1.5px solid var(--color-harm-red)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-harm-red)' }}>
                  {t('scenarioFlow.burnedStateLabel')}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-harm-red)' }}>
                  -25% Health
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#78281F', fontWeight: 600 }}>
                • {t('scenarioFlow.healthDrop')}
              </p>
              <p style={{ fontSize: '0.82rem', color: '#78281F', fontWeight: 600 }}>
                • {t('scenarioFlow.fertilityLoss')}
              </p>
            </div>

            {/* Sustainable Choice side */}
            <div
              style={{
                background: 'rgba(46, 158, 91, 0.1)',
                border: '1.5px solid var(--color-leaf-green)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-deep-green)' }}>
                  {t('scenarioFlow.sustainableStateLabel')} ({chosenAlternative.icon} {getLocalized(chosenAlternative.text)})
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-leaf-green)' }}>
                  +{chosenAlternative.natureHealthDelta || 25}% Health
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-deep-green)', fontWeight: 600 }}>
                • {t('scenarioFlow.healthRise')}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-deep-green)', fontWeight: 600 }}>
                • {t('scenarioFlow.netGain')}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="start-action-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', marginTop: '16px', minHeight: '48px' }}
            onClick={() => setStage('rewards')}
          >
            <span>{t('scenarioFlow.claimRewardBtn')}</span>
            <span aria-hidden="true">🎉</span>
          </button>
        </div>
      )}

      {/* STAGE 6: REWARDS SCREEN */}
      {stage === 'rewards' && (
        <div className="player-stage-card rewards-card">
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <span style={{ fontSize: '3.5rem', display: 'block', animation: 'bounce 1s infinite alternate' }}>
              🏆
            </span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-deep-green)', marginTop: '8px' }}>
              {t('scenarioFlow.rewardTitle')}
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {t('scenarioFlow.rewardSubtitle')}
            </p>
          </div>

          {/* Points Breakdown */}
          <div
            style={{
              background: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-deep-green)' }}>
              {t('scenarioFlow.pointsEarned')}:
            </h4>

            {earnedInThisRun.mistakePts > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span>• {t('scenarioFlow.tryingBonus')}</span>
                <strong style={{ color: 'var(--color-leaf-green)' }}>+{earnedInThisRun.mistakePts} pts</strong>
              </div>
            )}

            {earnedInThisRun.altPts > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span>• {t('scenarioFlow.alternativeBonus')}</span>
                <strong style={{ color: 'var(--color-leaf-green)' }}>+{earnedInThisRun.altPts} pts</strong>
              </div>
            )}

            {earnedInThisRun.bonusPts > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                <span>• {t('scenarioFlow.explorerBonus')}</span>
                <strong style={{ color: '#B25E00' }}>+{earnedInThisRun.bonusPts} pts</strong>
              </div>
            )}
          </div>

          {/* Badge Unlocked Notification Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-deep-green), #155743)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <span style={{ fontSize: '2.4rem' }}>{scenario.icon}</span>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-lime)', fontWeight: 800 }}>
                {t('scenarioFlow.badgeUnlocked')}
              </span>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                {scenario.id === 'home_plastic_bottle' ? t('badges.plasticBusterTitle') : t('badges.soilSaverTitle')}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-cream)', marginTop: '2px' }}>
                {scenario.id === 'home_plastic_bottle' ? t('badges.plasticBusterDesc') : t('badges.soilSaverDesc')}
              </p>
            </div>
          </div>

          {/* Level Status */}
          <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--color-deep-green)', fontWeight: 800 }}>
            {t('header.level')} {levelNumber}: {t(`levels.${currentLevelKey}`)} ({points} {t('header.points')})
          </div>

          {/* Proceed to Pledge Card before Final Score */}
          <button
            type="button"
            className="start-action-btn"
            style={{ width: '100%', justifyContent: 'center', minHeight: '48px', padding: '14px', fontSize: '1rem', marginTop: '4px', boxShadow: 'var(--shadow-md)' }}
            onClick={() => setStage('pledge')}
          >
            <span>{t('pledge.cardTitle')}</span>
            <span aria-hidden="true">→</span>
          </button>

          {/* End Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              className="filter-tab"
              style={{ flex: 1, justifyContent: 'center', background: 'var(--color-surface-subtle)', minHeight: '44px', fontWeight: 700 }}
              onClick={() => {
                setStage('intro')
                setSelectedMistake(null)
                setChosenAlternative(null)
              }}
            >
              <span>{t('scenarioFlow.playAgainBtn')}</span>
            </button>

            <button
              type="button"
              className="filter-tab"
              style={{ flex: 1, justifyContent: 'center', background: 'var(--color-surface-subtle)', minHeight: '44px', fontWeight: 700 }}
              onClick={onExit}
            >
              <span>{t('scenarioFlow.backToListBtn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 7: TAKE THE PLEDGE CARD (Before Final Score) */}
      {stage === 'pledge' && (
        <div className="player-stage-card pledge-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <span style={{ fontSize: '3.4rem', display: 'block', animation: 'bounce 1s infinite alternate' }}>
              🤝
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-deep-green)', marginTop: '8px' }}>
              {t('pledge.cardTitle')}
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {t('pledge.cardSubtitle')}
            </p>
          </div>

          {/* Scenario-Matched Pledge Text Box */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(46, 158, 91, 0.12), rgba(183, 227, 106, 0.2))',
              border: '2px solid var(--color-leaf-green)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 16px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>
              {scenario.icon}
            </span>
            <blockquote
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--color-deep-green)',
                lineHeight: 1.45,
                margin: 0
              }}
            >
              "{getScenarioPledgeText()}"
            </blockquote>
          </div>

          {/* Bonus Points Banner if Not Yet Pledged */}
          {!isPledged && (
            <div
              style={{
                textAlign: 'center',
                fontSize: '0.84rem',
                fontWeight: 800,
                color: 'var(--color-amber)',
                background: '#FFF8E1',
                border: '1px solid #FFE082',
                padding: '10px 14px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              ⭐ {t('pledge.bonusNotice')}
            </div>
          )}

          {/* Pledged Success Feedback Banner */}
          {isPledged && (
            <div
              style={{
                background: '#E8F5E9',
                border: '1.5px solid var(--color-leaf-green)',
                color: 'var(--color-deep-green)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                fontSize: '0.9rem',
                fontWeight: 800,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span>✓ {t('pledge.successMessage')}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            {!isPledged ? (
              <>
                <button
                  type="button"
                  className="start-action-btn"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    minHeight: '48px',
                    padding: '14px',
                    fontSize: '1.05rem',
                    boxShadow: 'var(--shadow-md)'
                  }}
                  onClick={handleTakePledge}
                >
                  <span>{t('pledge.pledgeBtn')}</span>
                  <span aria-hidden="true">✋</span>
                </button>

                <button
                  type="button"
                  className="filter-tab"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    minHeight: '44px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.84rem'
                  }}
                  onClick={() => {
                    if (onCompleteAll) onCompleteAll()
                    else onExit()
                  }}
                >
                  <span>{t('pledge.skipBtn')}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="start-action-btn"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    minHeight: '48px',
                    padding: '14px',
                    fontSize: '1rem',
                    boxShadow: 'var(--shadow-md)'
                  }}
                  onClick={() => {
                    if (onCompleteAll) onCompleteAll()
                    else onExit()
                  }}
                >
                  <span>{t('pledge.viewScoreBtn')}</span>
                  <span aria-hidden="true">🏆</span>
                </button>

                <button
                  type="button"
                  className="filter-tab"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    minHeight: '44px',
                    background: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.84rem'
                  }}
                  onClick={onExit}
                >
                  <span>{t('pledge.backBtn')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
