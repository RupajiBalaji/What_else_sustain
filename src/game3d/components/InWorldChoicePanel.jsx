import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'
import { sound } from '../../game/soundManager'

export const CHOICE_OPTIONS = [
  {
    id: 'burn',
    label: 'Burn Stubble',
    shortLabel: 'Burn',
    icon: '🔥',
    isBurn: true,
    color: '#D84315',
    bgColor: '#FFEBEE',
    borderColor: '#FF5722',
    cost: '₹0 Upfront',
    effort: 'Low (1 hr)',
    desc: 'Quick but toxic. Destroys soil carbon and fills village air with hazardous PM2.5 smog.'
  },
  {
    id: 'happy_seeder',
    label: 'Happy Seeder',
    shortLabel: 'Seeder',
    icon: '🚜',
    isBurn: false,
    color: '#2E7D32',
    bgColor: '#E8F5E9',
    borderColor: '#4CAF50',
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
    color: '#0D47A1',
    bgColor: '#E3F2FD',
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
    color: '#33691E',
    bgColor: '#F1F8E9',
    borderColor: '#689F38',
    cost: '~₹1,200 / acre',
    effort: 'Low-Med',
    desc: 'Retains 15-25% soil moisture, blocks weeds and feeds underground earthworms.'
  },
  {
    id: 'compost',
    label: 'Bio-Decomposer',
    shortLabel: 'Compost',
    icon: '🧪',
    isBurn: false,
    color: '#4E342E',
    bgColor: '#EFEBE9',
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
    startBurnSequence,
    startAlternative,
    activePile,
    setShowChoiceWheel,
    useInWorldChoices,
    selectedChoiceId,
    setSelectedChoiceId,
    seasonPhase
  } = useGame3D()

  // Track responsive screen width for mobile viewport adaptation
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

  const selectedId = selectedChoiceId
  const setSelectedId = setSelectedChoiceId || (() => {})

  // Visible when in decision phase (or harvest completed with target), no action in progress, and no modal
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

  // Keyboard shortcut listener: 1-5 to select, Enter to confirm
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key >= '1' && e.key <= '5') {
        const idx = parseInt(e.key, 10) - 1
        if (CHOICE_OPTIONS[idx]) {
          sound.initAudio()
          sound.playTap()
          setSelectedId(CHOICE_OPTIONS[idx].id)
        }
      } else if (e.key === 'Enter') {
        if (activeOption) {
          handleConfirm(activeOption)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, activeOption, setSelectedId])

  if (!isVisible || typeof document === 'undefined') return null

  // Fixed screen position: Right-side card on desktop, bottom sheet on mobile.
  // Never covers the farmer and does not overlap the top HUD bar.
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
              maxHeight: '58vh',
              borderRadius: '24px 24px 18px 18px',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.4)'
            }
          : {
              right: '20px',
              top: 'calc(74px + env(safe-area-inset-top, 0px))',
              width: 'min(380px, calc(100vw - 40px))',
              maxHeight: 'calc(100dvh - 94px)',
              borderRadius: '24px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.35)'
            }),
        backgroundColor: '#FFFFFF',
        border: '3px solid #2E7D32',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '10px',
        zIndex: 95,
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        userSelect: 'none',
        pointerEvents: 'auto',
        animation: isMobile ? 'fadeInUp 0.25s ease' : 'fadeInRight 0.25s ease'
      }}
    >
      {/* 1. Header Ribbon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1B5E20',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '8px 14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>🌾</span>
          <div>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#A5D6A7', fontWeight: 900, letterSpacing: '0.04em' }}>
              Crop Residue Decision
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900 }}>
              What will you do with the straw?
            </div>
          </div>
        </div>
      </div>

      {/* 2. Options Grid (Horizontal strip on mobile, vertical cards on desktop) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(5, 1fr)' : '1fr',
          gap: '8px'
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
                justifyContent: isMobile ? 'center' : 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                padding: isMobile ? '8px 4px' : '10px 14px',
                borderRadius: '14px',
                border: isSelected ? `2.5px solid ${opt.borderColor}` : '1.5px solid #E0E0E0',
                backgroundColor: isSelected ? opt.bgColor : '#FAFAFA',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                gap: '6px',
                minHeight: '48px',
                boxShadow: isSelected ? `0 4px 12px ${opt.borderColor}33` : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: isMobile ? '1.3rem' : '1.4rem' }}>{opt.icon}</span>
                {!isMobile && (
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.88rem', color: isSelected ? opt.color : '#212121' }}>
                      {idx + 1}. {opt.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#616161', fontWeight: 700 }}>
                      {opt.cost} • {opt.effort}
                    </div>
                  </div>
                )}
                {isMobile && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isSelected ? opt.color : '#37474F' }}>
                    {opt.shortLabel}
                  </span>
                )}
              </div>
              {!isMobile && (
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: isSelected ? opt.color : '#9E9E9E' }}>
                  {isSelected ? '✓ SELECTED' : `[${idx + 1}]`}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 3. Detailed Card & Confirm Button when an option is selected */}
      {activeOption ? (
        <div
          style={{
            backgroundColor: activeOption.bgColor,
            border: `2px solid ${activeOption.borderColor}`,
            borderRadius: '16px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 900, fontSize: '0.92rem', color: activeOption.color }}>
              {activeOption.icon} {activeOption.label}
            </span>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#37474F' }}>
              Cost: {activeOption.cost}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.8rem', color: '#37474F', lineHeight: 1.35, fontWeight: 600 }}>
            {activeOption.desc}
          </p>

          <button
            type="button"
            data-testid="confirm-choice-button"
            onClick={() => handleConfirm(activeOption)}
            style={{
              width: '100%',
              minHeight: '48px',
              borderRadius: '12px',
              backgroundColor: activeOption.isBurn ? '#D84315' : '#2E7D32',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 900,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
              marginTop: '4px'
            }}
          >
            <span>{activeOption.isBurn ? '🔥 Confirm Burning' : `🌱 Confirm: ${activeOption.label}`}</span>
            <span>➔</span>
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.82rem', color: '#616161', fontWeight: 700 }}>
          👆 Click an option or press 1–5 to select
        </div>
      )}
    </div>
  )

  return createPortal(panelContent, document.body)
}
