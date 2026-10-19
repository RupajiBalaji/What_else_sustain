import React from 'react'
import { useGame3D } from '../context/Game3DContext'
import { ManagedOverlay } from '../ui/OverlayManager'

/**
 * Floating financial outcome badge displayed directly above the farmer.
 * Reads real impact values from scenarios.json:
 * - Loss when burning (-₹3,500/acre)
 * - Pure cash revenue when baling (+₹15,000)
 * - Fertilizer and moisture savings when mulching / composting (+₹2,000 - ₹3,000/acre)
 */
export default function MoneyFloatingTag({ position = [0, 2.35, 0] }) {
  const { burnState, activeAlternative, rupeeCount } = useGame3D()

  const isBurnt = burnState === 'consequence'
  const isAlternativeActive = Boolean(activeAlternative)

  if (!isBurnt && !isAlternativeActive) return <group />

  // Determine financial details based on scenarios.json data
  let tagData = null

  if (isBurnt) {
    tagData = {
      icon: '💸',
      title: 'Net Loss: ~₹3,500 / acre',
      total: '-₹17,500 total drain (5 acres)',
      detail: 'Burnt soil nutrients force expensive synthetic urea & DAP next season',
      bgColor: 'rgba(255, 235, 238, 0.96)',
      borderColor: '#D32F2F',
      textColor: '#B71C1C',
      badgeColor: '#FFCDD2',
      badgeText: '⚠️ HIDDEN LOSS'
    }
  } else if (activeAlternative === 'bale_sell') {
    tagData = {
      icon: '💵',
      title: `Cash Revenue: +₹${rupeeCount.toLocaleString()}`,
      total: '+₹3,000 / acre net profit',
      detail: 'Direct cash payout from biomass power plant for baled paddy straw',
      bgColor: 'rgba(227, 242, 253, 0.96)',
      borderColor: '#1976D2',
      textColor: '#0D47A1',
      badgeColor: '#BBDEFB',
      badgeText: '💰 CASH PROFIT'
    }
  } else if (activeAlternative === 'happy_seeder') {
    tagData = {
      icon: '🚜',
      title: 'Fertilizer Saved: ~₹2,000 / acre',
      total: '+₹10,000 saved (5 acres)',
      detail: 'Direct stubble sowing retains natural fertility and cuts fertilizer needs',
      bgColor: 'rgba(232, 245, 233, 0.96)',
      borderColor: '#388E3C',
      textColor: '#1B5E20',
      badgeColor: '#C8E6C9',
      badgeText: '🌱 SMART SAVINGS'
    }
  } else if (activeAlternative === 'mulch') {
    tagData = {
      icon: '🌾',
      title: 'Moisture & Nutrients: +₹2,000 / acre',
      total: '+₹10,000 net value (5 acres)',
      detail: 'Straw mulch retains 15-25% soil water and enriches topsoil humus',
      bgColor: 'rgba(241, 248, 233, 0.96)',
      borderColor: '#689F38',
      textColor: '#33691E',
      badgeColor: '#DCEDC8',
      badgeText: '💧 WATER SHIELD'
    }
  } else if (activeAlternative === 'compost') {
    tagData = {
      icon: '🧪',
      title: 'Humus Value: +₹3,000 / acre',
      total: '+₹15,000 organic gold value',
      detail: 'Bio-decomposer yields ~3.5 tons/ha of premium organic compost',
      bgColor: 'rgba(239, 235, 233, 0.96)',
      borderColor: '#8D6E63',
      textColor: '#4E342E',
      badgeColor: '#D7CCC8',
      badgeText: '✨ ORGANIC GOLD'
    }
  }

  if (!tagData) return <group />

  return (
    <ManagedOverlay
      id="money_floating_tag"
      priority="consequence_callout"
      position={position}
      icon={tagData.icon}
      center
      zIndexRange={[20, 0]}
    >
      <div
        style={{
          backgroundColor: tagData.bgColor,
          border: `2px solid ${tagData.borderColor}`,
          borderRadius: '16px',
          padding: '8px 12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          color: tagData.textColor,
          width: '220px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          userSelect: 'none',
          pointerEvents: 'none',
          animation: 'fadeInUp 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{tagData.icon}</span>
            <span>{tagData.title}</span>
          </span>
        </div>

        {/* Total Value */}
        <div style={{ fontSize: '11px', fontWeight: 900 }}>
          {tagData.total}
        </div>

        {/* Subtext description */}
        <div style={{ fontSize: '9.5px', lineHeight: 1.25, opacity: 0.9 }}>
          {tagData.detail}
        </div>
      </div>
    </ManagedOverlay>
  )
}
