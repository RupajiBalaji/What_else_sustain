import React, { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'
import { sound } from '../../game/soundManager'

const CHOICE_OPTIONS = [
  {
    id: 'burn',
    label: 'Burn',
    icon: '🔥',
    isBurn: true,
    color: '#D84315',
    bgColor: '#FFEBEE',
    borderColor: '#FF5722',
    cost: '₹0 Upfront',
    effort: 'Low (1 hr)',
    desc: 'Destroys soil nutrients, carbon & fills air with toxic PM2.5 smog.'
  },
  {
    id: 'happy_seeder',
    label: 'Seeder',
    icon: '🚜',
    isBurn: false,
    color: '#2E7D32',
    bgColor: '#E8F5E9',
    borderColor: '#4CAF50',
    cost: '~₹1,400 / acre',
    effort: 'Medium',
    desc: 'Direct tractor sowing through straw stubble; saves ₹2,000 in fertilizer.'
  },
  {
    id: 'bale_sell',
    label: 'Bale & Sell',
    icon: '🚛',
    isBurn: false,
    color: '#0D47A1',
    bgColor: '#E3F2FD',
    borderColor: '#1976D2',
    cost: 'Paid by plant',
    effort: 'Medium',
    desc: 'Collects straw bales and sells to biomass power plants for +₹15,000.'
  },
  {
    id: 'mulch',
    label: 'Mulch',
    icon: '🌾',
    isBurn: false,
    color: '#33691E',
    bgColor: '#F1F8E9',
    borderColor: '#689F38',
    cost: '~₹1,200 / acre',
    effort: 'Low-Med',
    desc: 'Retains 15-25% soil moisture, blocks weeds & feeds friendly earthworms.'
  },
  {
    id: 'compost',
    label: 'Compost',
    icon: '🧪',
    isBurn: false,
    color: '#4E342E',
    bgColor: '#EFEBE9',
    borderColor: '#8D6E63',
    cost: '~₹400 / acre',
    effort: 'Medium',
    desc: 'Bio-decomposer spray rapidly converts straw into rich dark humus.'
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
    setSelectedChoiceId
  } = useGame3D()

  // Track responsive screen width for mobile viewport adaptation
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const selectedId = selectedChoiceId || 'happy_seeder'
  const setSelectedId = setSelectedChoiceId || (() => {})

  // Only show when harvest is completed, player is at a straw pile, and no action in progress
  const isVisible =
    Boolean(useInWorldChoices) &&
    harvestState === 'harvested' &&
    Boolean(interactionTarget) &&
    burnState === 'idle' &&
    activeAlternative === null &&
    !hasMadeChoice

  const activeOption = CHOICE_OPTIONS.find((o) => o.id === selectedId) || CHOICE_OPTIONS[1]

  const handleSelectOption = (opt) => {
    sound.initAudio()
    sound.playTap()
    setSelectedId(opt.id)
  }

  const handleConfirm = (opt) => {
    sound.initAudio()
    sound.playPop()
    setShowChoiceWheel(false)
    if (opt.isBurn) {
      startBurnSequence(activePile || interactionTarget)
    } else {
      startAlternative(opt.id)
    }
  }

  // Keyboard shortcut listener: 1-5 to select, Enter or E to confirm
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key >= '1' && e.key <= '5') {
        const idx = parseInt(e.key, 10) - 1
        if (CHOICE_OPTIONS[idx]) {
          sound.playTap()
          setSelectedId(CHOICE_OPTIONS[idx].id)
        }
      } else if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
        if (activeOption) handleConfirm(activeOption)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, activeOption, setSelectedId])

  if (!isVisible) return null

  // Positioning: On mobile screens, float directly above farmer [0, 2.3, 0].
  // On desktop / wide screens, float over shoulder beside farmer [0.75, 2.05, 0].
  const panelAnchor = isMobile ? [0, 2.3, 0] : [0.75, 2.05, 0]

  return (
    <group position={panelAnchor}>
      <Html
        center
        zIndexRange={[100, 0]}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: 'min(312px, 86vw)',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            animation: 'fadeInUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {/* 1. In-World Choice Title Badge */}
          <div
            style={{
              backgroundColor: 'rgba(22, 56, 43, 0.95)',
              color: '#FFFFFF',
              borderRadius: '9999px',
              padding: '6px 14px',
              border: '2px solid #81C784',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(6px)'
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🌾</span>
              <span>Straw Decision</span>
            </span>
            <span style={{ fontSize: '0.72rem', color: '#C8E6C9', fontWeight: 700 }}>
              {interactionTarget?.label ? 'Pile in range' : '5 Options'}
            </span>
          </div>

          {/* 2. Horizontal Button Strip with 48px+ Touch Targets */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              padding: '6px',
              borderRadius: '18px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
              border: '2px solid #E0E0E0',
              backdropFilter: 'blur(8px)',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {CHOICE_OPTIONS.map((opt) => {
              const isSelected = selectedId === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  onPointerEnter={() => handleSelectOption(opt)}
                  title={`${opt.label} (${opt.effort})`}
                  style={{
                    flex: '1 0 48px',
                    minWidth: '48px',
                    minHeight: '48px',
                    padding: '4px 2px',
                    borderRadius: '12px',
                    border: isSelected ? `2.5px solid ${opt.borderColor}` : '1.5px solid #E0E0E0',
                    backgroundColor: isSelected ? opt.bgColor : '#F5F5F5',
                    color: isSelected ? opt.color : '#424242',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1.0)',
                    boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.18)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{opt.icon}</span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '48px',
                      lineHeight: 1
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 3. Floating Preview Card for Selected Action */}
          {activeOption && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '16px',
                padding: '10px 12px',
                border: `2px solid ${activeOption.borderColor}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backdropFilter: 'blur(8px)',
                animation: 'fadeIn 0.2s ease'
              }}
            >
              {/* Header with Title and Tags */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{activeOption.icon}</span>
                  <strong style={{ fontSize: '0.92rem', color: activeOption.color, fontWeight: 900 }}>
                    {activeOption.label}
                  </strong>
                </div>

                {/* Effort / Cost Badges */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: activeOption.isBurn ? '#FFEBEE' : '#E8F5E9',
                      color: activeOption.isBurn ? '#C62828' : '#2E7D32'
                    }}
                  >
                    {activeOption.cost}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: '#ECEFF1',
                      color: '#455A64'
                    }}
                  >
                    {activeOption.effort}
                  </span>
                </div>
              </div>

              {/* 1-Line Impact Explanation */}
              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#424242',
                  margin: 0,
                  lineHeight: 1.35,
                  fontWeight: 600
                }}
              >
                {activeOption.desc}
              </p>

              {/* Primary Action Button (Min Height 48px for WCAG Touch Targets) */}
              <button
                type="button"
                onClick={() => handleConfirm(activeOption)}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  borderRadius: '12px',
                  backgroundColor: activeOption.isBurn ? '#E65100' : '#2E7D32',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  transition: 'transform 0.1s ease'
                }}
              >
                <span>{activeOption.isBurn ? '🔥 Confirm Burning' : `🌱 Choose ${activeOption.label}`}</span>
              </button>
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
