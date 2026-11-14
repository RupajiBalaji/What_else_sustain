import React, { useState, useEffect } from 'react'
import { useGame3D } from '../context/Game3DContext'

/**
 * ConsequenceCallouts.jsx
 * Docked sequence of consequence insights for Money, Soil, Air, and People.
 * Rules:
 * - Appears as a timed sequence: ONE card at a time, ~3 seconds each
 * - Docked in a fixed left column on desktop, compact strip above bottom area on phone
 * - Never floats over or covers the farmer in 3D world space
 * - Cleared completely when any modal or season report opens
 * - Accurate NPMCR 2021 sourced nutrient figures, game estimates clearly labeled
 */
export default function ConsequenceCallouts() {
  const { burnState, activeAlternative, smokeData, isAnyModalOpen, showSeasonReport } = useGame3D()

  const isBurnt = burnState === 'consequence'
  const isAlternativeActive = Boolean(activeAlternative)

  // Step ticker: 0 (idle) -> 1 (Money) -> 2 (Soil) -> 3 (Air) -> 4 (People) -> 0 (finished)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (isAnyModalOpen || showSeasonReport || (!isBurnt && !isAlternativeActive)) {
      setActiveStep(0)
      return
    }

    // Step 1: 0 - 3s (Money Loss / Gain)
    setActiveStep(1)

    // Step 2: 3 - 6s (Soil Nutrients)
    const timer1 = setTimeout(() => setActiveStep(2), 3000)

    // Step 3: 6 - 9s (Air Exposure)
    const timer2 = setTimeout(() => setActiveStep(3), 6000)

    // Step 4: 9 - 12s (People / Health)
    const timer3 = setTimeout(() => setActiveStep(4), 9000)

    // End sequence after 12s
    const timer4 = setTimeout(() => setActiveStep(0), 12000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [isBurnt, isAlternativeActive, isAnyModalOpen, showSeasonReport])

  if (typeof document === 'undefined') return null
  if (isAnyModalOpen || showSeasonReport || activeStep === 0 || (!isBurnt && !isAlternativeActive)) {
    return null
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  // Sourced data for each callout card
  const calloutData = {
    1: {
      id: 'callout_money',
      icon: isBurnt ? '💸' : '💰',
      title: isBurnt ? 'Net Loss: ~₹3,000–₹4,500 / acre (game estimate)' : 'Financial Return: Input Savings',
      detail: isBurnt
        ? 'Estimated hidden soil nutrient drain across 5 acres (-₹15,000 to ₹22,500, game estimate).'
        : 'Avoided burning saves future fertilizer inputs and unlocks straw value.',
      tag: isBurnt ? 'game estimate • scenarios.json' : 'Sourced estimate (scenarios.json)',
      borderColor: isBurnt ? '#D32F2F' : '#2E7D32',
      color: isBurnt ? '#FF8A80' : '#A5D6A7'
    },
    2: {
      id: 'callout_soil',
      icon: '🪱',
      title: isBurnt ? 'Nutrient Loss: Stubble Burn' : 'Soil: Microbial Surge',
      detail: isBurnt
        ? 'Burning 1t stubble loses organic carbon + 5.5kg N, 2.3kg P, 25kg K, 1.2kg S.'
        : 'Earthworms and fungal enzymes thrive, turning retained straw into rich humus.',
      tag: isBurnt ? 'NPMCR, via 2021 review' : '15-25% Moisture Retained (NPMCR)',
      borderColor: isBurnt ? '#E65100' : '#388E3C',
      color: isBurnt ? '#FFB74D' : '#81C784'
    },
    3: {
      id: 'callout_air',
      icon: '💨',
      title: isBurnt ? `Village Air: Exposure ~${smokeData?.villageExposure || 62}/100` : 'Village Air: Clean Baseline (1/100)',
      detail: isBurnt
        ? 'Dense particulate smoke plume blankets village homes in toxic smog.'
        : 'Zero smoke plume; clean air maintained across the village settlement.',
      tag: isBurnt ? 'Modelled game estimate' : 'Clean Air Verified',
      borderColor: isBurnt ? '#D84315' : '#0288D1',
      color: isBurnt ? '#FFAB91' : '#81D4FA'
    },
    4: {
      id: 'callout_people',
      icon: isBurnt ? '😷' : '👋',
      title: isBurnt ? 'People: Severe Coughing' : 'People: Cheerful Community',
      detail: isBurnt
        ? 'Children and elders in downwind homes experience respiratory distress.'
        : 'Villagers breathe fresh air, waving cheerfully across the fields.',
      tag: isBurnt ? 'Respiratory distress model' : 'Healthy rural community',
      borderColor: isBurnt ? '#C2185B' : '#43A047',
      color: isBurnt ? '#F48FB1' : '#A5D6A7'
    }
  }

  const current = calloutData[activeStep]
  if (!current) return null

  return (
    <div
      role="region"
      aria-label="Consequence callout"
      data-testid="consequence-callout-card"
      style={{
        position: 'absolute',
        left: isMobile ? '50%' : '20px',
        transform: isMobile ? 'translateX(-50%)' : 'none',
        top: isMobile ? 'auto' : '150px',
        bottom: isMobile ? 'calc(96px + env(safe-area-inset-bottom, 0px))' : 'auto',
        width: isMobile ? 'min(340px, 92vw)' : '290px',
        zIndex: 75,
        backgroundColor: 'rgba(22, 28, 34, 0.95)',
        backdropFilter: 'blur(8px)',
        border: `1.5px solid ${current.borderColor}`,
        borderRadius: '14px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        color: '#FFFFFF',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 900, fontSize: '0.82rem', color: current.color }}>
          <span style={{ fontSize: '1rem' }}>{current.icon}</span>
          <span>{current.title}</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: '#90A4AE', fontWeight: 700 }}>
          {activeStep}/4
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: '0.74rem', color: '#ECEFF1', lineHeight: 1.35, fontWeight: 500 }}>
        {current.detail}
      </div>

      {/* Citation / Source Tag */}
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: current.color, opacity: 0.9, marginTop: '2px' }}>
        🏷️ {current.tag}
      </div>
    </div>
  )
}
