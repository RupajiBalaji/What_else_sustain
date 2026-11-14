import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'
import { sound } from '../../game/soundManager'

/**
 * 5 Crop Residue Choices:
 * 1. Burn the Stubble
 * 2. Happy Seeder
 * 3. Bale & Sell
 * 4. Mulch into Soil
 * 5. Compost (bio-decomposer)
 */
export const CHOICE_OPTIONS = [
  {
    id: 'burn',
    label: 'Burn the Stubble',
    shortLabel: 'Burn',
    icon: '🔥',
    isBurn: true,
    color: '#FF7043',
    bgColor: 'rgba(216, 67, 21, 0.22)',
    borderColor: '#D84315',
    cost: '₹0 upfront',
    effort: 'Low',
    desc: 'Quickest clearance, but releases toxic smoke plume across the village and vaporizes soil nutrients.'
  },
  {
    id: 'happy_seeder',
    label: 'Happy Seeder',
    shortLabel: 'Seeder',
    icon: '🚜',
    isBurn: false,
    color: '#81C784',
    bgColor: 'rgba(46, 125, 50, 0.22)',
    borderColor: '#2E7D32',
    cost: '~₹1,400 / acre',
    effort: 'Medium',
    desc: 'Direct tractor drilling wheat through standing stubble. Keeps village skies clean.'
  },
  {
    id: 'bale_sell',
    label: 'Bale & Sell',
    shortLabel: 'Baler',
    icon: '🚛',
    isBurn: false,
    color: '#64B5F6',
    bgColor: 'rgba(13, 71, 161, 0.22)',
    borderColor: '#1976D2',
    cost: 'Paid by plant',
    effort: 'Medium',
    desc: 'Collects straw bales and sells to biomass energy plants for +₹15,000 cash income.'
  },
  {
    id: 'mulch',
    label: 'Mulch into Soil',
    shortLabel: 'Mulch',
    icon: '🌾',
    isBurn: false,
    color: '#AED581',
    bgColor: 'rgba(51, 105, 30, 0.22)',
    borderColor: '#558B2F',
    cost: '~₹1,200 / acre',
    effort: 'Low-Med',
    desc: 'Retains 15-25% soil moisture, blocks weeds and feeds underground earthworms.'
  },
  {
    id: 'compost',
    label: 'Compost (bio-decomposer)',
    shortLabel: 'Compost',
    icon: '🧪',
    isBurn: false,
    color: '#D7CCC8',
    bgColor: 'rgba(78, 52, 46, 0.25)',
    borderColor: '#8D6E63',
    cost: '~₹400 / acre',
    effort: 'Medium',
    desc: 'Microbial spray rapidly digests straw into fertile humus within 20 days.'
  }
]

export default function InWorldChoicePanel() {
  const { t } = useLanguage()
  const {
    interactionTarget,
    harvestState,
    burnState,
    activeAlternative,
    hasMadeChoice,
    useInWorldChoices,
    startBurnSequence,
    startAlternative,
    activePile,
    setShowChoiceWheel,
    selectedChoiceId,
    setSelectedChoiceId,
    seasonPhase
  } = useGame3D()

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 680 : false
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 680)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const selectedId = selectedChoiceId
  const setSelectedId = setSelectedChoiceId || (() => {})

  // Visible when in decision phase, no action in progress, and no modal
  const isVisible =
    Boolean(useInWorldChoices) &&
    (harvestState === 'harvested' || seasonPhase === 'decision') &&
    burnState === 'idle' &&
    activeAlternative === null &&
    !hasMadeChoice

  const activeOption = selectedId ? CHOICE_OPTIONS.find((o) => o.id === selectedId) : null

  const handleSelectOption = (opt) => {
    sound.initAudio()
    sound.playTap()
    setSelectedId(opt.id)
  }

  const handleConfirm = (opt) => {
    if (!opt) return
    sound.initAudio()
    sound.playPop()
    setShowChoiceWheel(false)
    if (opt.isBurn) {
      startBurnSequence(activePile || interactionTarget)
    } else {
      startAlternative(opt.id)
    }
  }

  // Keyboard shortcut listener: 1-5 to select, Enter to confirm ONLY after selecting
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return

      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 5) {
        e.preventDefault()
        const opt = CHOICE_OPTIONS[num - 1]
        if (opt) handleSelectOption(opt)
      } else if (e.code === 'Enter') {
        if (activeOption) {
          e.preventDefault()
          handleConfirm(activeOption)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, activeOption, setSelectedId])

  if (!isVisible || typeof document === 'undefined') return null

  // Fixed screen position: Right card on desktop, bottom sheet on mobile.
  // Dark, calm, minimal aesthetic matching serious product direction (Zero white box!).
  const panelContent = (
    <div
      data-testid="in-world-choice-panel"
      data-interactive="true"
      style={{
        position: 'fixed',
        ...(isMobile
          ? {
              left: '8px',
              right: '8px',
              bottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
              maxHeight: '64vh',
              borderRadius: '20px 20px 16px 16px',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.6)'
            }
          : {
              right: 'calc(54px + env(safe-area-inset-right, 0px))',
              top: 'calc(54px + env(safe-area-inset-top, 0px))',
              width: 'min(380px, calc(100vw - 74px))',
              maxHeight: 'calc(100dvh - 74px)',
              borderRadius: '20px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
            }),
        backgroundColor: 'rgba(20, 26, 32, 0.96)',
        backdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(255, 255, 255, 0.16)',
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? '12px' : '16px',
        gap: '8px',
        zIndex: 95,
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        userSelect: 'none',
        pointerEvents: 'auto',
        color: '#FFFFFF',
        animation: isMobile ? 'fadeInUp 0.25s ease' : 'fadeInRight 0.25s ease'
      }}
    >
      {/* 1. Header Ribbon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(27, 94, 32, 0.65)',
          border: '1px solid #81C784',
          borderRadius: '12px',
          padding: '6px 12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.15rem' }}>🌾</span>
          <div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#A5D6A7', fontWeight: 900, letterSpacing: '0.04em' }}>
              Crop Residue Decision
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 900 }}>
              Choose what to do with the straw
            </div>
          </div>
        </div>
      </div>

      {/* 2. Compact Options List (All 5 options visible without horizontal scroll) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          width: '100%'
        }}
      >
        {CHOICE_OPTIONS.map((opt, idx) => {
          const isSelected = selectedId === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={`choice-option-${opt.id}`}
              onClick={() => handleSelectOption(opt)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                border: isSelected ? `2px solid ${opt.borderColor}` : '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: isSelected ? opt.bgColor : 'rgba(255, 255, 255, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                gap: '8px',
                minHeight: '40px',
                boxShadow: isSelected ? `0 2px 10px ${opt.borderColor}44` : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.84rem', color: isSelected ? opt.color : '#FFFFFF' }}>
                    {idx + 1}. {opt.label}
                  </div>
                  <div style={{ fontSize: '0.70rem', color: '#90A4AE', fontWeight: 600 }}>
                    Cost: {opt.cost} • Effort: {opt.effort}
                  </div>
                </div>
              </div>

              <span style={{ fontSize: '0.70rem', fontWeight: 900, color: isSelected ? opt.color : '#78909C', flexShrink: 0 }}>
                {isSelected ? '✓ SELECTED' : isMobile ? 'TAP' : `[${idx + 1}]`}
              </span>
            </button>
          )
        })}
      </div>

      {/* 3. Detailed Card & Confirm Button when an option is selected */}
      {activeOption ? (
        <div
          style={{
            backgroundColor: activeOption.bgColor,
            border: `1.5px solid ${activeOption.borderColor}`,
            borderRadius: '12px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 900, fontSize: '0.86rem', color: activeOption.color }}>
              {activeOption.icon} {activeOption.label}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B0BEC5' }}>
              {activeOption.cost}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.76rem', color: '#ECEFF1', lineHeight: 1.35, fontWeight: 500 }}>
            {activeOption.desc}
          </p>

          <button
            type="button"
            data-testid="confirm-choice-button"
            onClick={() => handleConfirm(activeOption)}
            style={{
              width: '100%',
              minHeight: '44px',
              borderRadius: '10px',
              backgroundColor: activeOption.isBurn ? '#D84315' : '#2E7D32',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 900,
              fontSize: '0.90rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              marginTop: '4px'
            }}
          >
            <span>{activeOption.isBurn ? '🔥 Confirm Burning' : `🌱 Confirm: ${activeOption.label}`}</span>
            <span>➔</span>
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '6px', fontSize: '0.76rem', color: '#90A4AE', fontWeight: 600 }}>
          {isTouch ? '👆 Tap an option to select, then tap Confirm' : '⌨️ Click an option or press 1–5 to select, Enter to confirm'}
        </div>
      )}
    </div>
  )

  return createPortal(panelContent, document.body)
}
