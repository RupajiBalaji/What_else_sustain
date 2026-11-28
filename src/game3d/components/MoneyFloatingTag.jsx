import React from 'react'
import { useGame3D } from '../context/Game3DContext'
import { ManagedOverlay } from '../ui/OverlayManager'
import { computeChoiceFinancials } from '../config/economy'

/**
 * Floating financial outcome badge displayed directly above the farmer.
 * Reads real impact values from scenarios.json via economy.js and agrees
 * to the rupee with the HUD balance and Season Report.
 */
export default function MoneyFloatingTag({ position = [0, 2.35, 0] }) {
  const { burnState, activeAlternative, rupeeCount, farmConfig, persistentState } = useGame3D()

  const isBurnt = burnState === 'consequence'
  const isAlternativeActive = Boolean(activeAlternative)

  if (!isBurnt && !isAlternativeActive) return <group />

  const choiceKey = isBurnt ? 'burn' : activeAlternative
  const fin = computeChoiceFinancials(choiceKey, {
    acres: farmConfig?.acres || 5,
    seasonIndex: persistentState?.seasonIndex || 1
  })
  const absRev = Math.abs(fin.decisionRevenue).toLocaleString('en-IN')
  const revSign = fin.decisionRevenue >= 0 ? '+' : '-'

  let tagData = null

  if (isBurnt) {
    tagData = {
      icon: '💸',
      title: `Choice Cost: -₹${absRev} (${fin.acres} ac)`,
      total: 'Net drain ~₹3,000–₹4,500/ac (game estimate)',
      detail: 'Burnt soil nutrients force extra urea & DAP next season • Game estimate',
      borderColor: '#EF5350',
      accentColor: '#FF8A80'
    }
  } else if (activeAlternative === 'bale_sell') {
    const shownRupees = (rupeeCount ?? fin.decisionRevenue).toLocaleString('en-IN')
    tagData = {
      icon: '🚛',
      title: `Bale & Sell Net: +₹${shownRupees} (${fin.acres} ac)`,
      total: 'Punjab range: -₹200 to +₹800/ac net',
      detail: 'After baling & transport • Source: PAU & MNRE (Punjab, game estimate)',
      borderColor: '#42A5F5',
      accentColor: '#90CAF9'
    }
  } else if (activeAlternative === 'happy_seeder') {
    tagData = {
      icon: '🚜',
      title: `Hire Cost: ${revSign}₹${absRev} (${fin.acres} ac)`,
      total: `₹${fin.econ.upfrontCostPerAcre.toLocaleString('en-IN')}/ac • Retains soil moisture`,
      detail: 'Source: PAU & ICAR custom hiring • Game estimate',
      borderColor: '#66BB6A',
      accentColor: '#A5D6A7'
    }
  } else if (activeAlternative === 'mulch') {
    tagData = {
      icon: '🌾',
      title: `Mulch Cost: ${revSign}₹${absRev} (${fin.acres} ac)`,
      total: `₹${fin.econ.upfrontCostPerAcre.toLocaleString('en-IN')}/ac • +15–25% moisture`,
      detail: 'Source: FAO & NPMCR guidelines • Game estimate',
      borderColor: '#9CCC65',
      accentColor: '#C5E1A5'
    }
  } else if (activeAlternative === 'compost') {
    tagData = {
      icon: '🧪',
      title: `Spray Cost: ${revSign}₹${absRev} (${fin.acres} ac)`,
      total: `₹${fin.econ.upfrontCostPerAcre.toLocaleString('en-IN')}/ac • Organic humus`,
      detail: 'Source: ICAR-IARI Pusa trials • Game estimate',
      borderColor: '#A1887F',
      accentColor: '#D7CCC8'
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
        data-testid="money-floating-tag"
        style={{
          backgroundColor: 'rgba(20, 26, 32, 0.94)',
          backdropFilter: 'blur(10px)',
          border: `1.5px solid ${tagData.borderColor}`,
          borderRadius: '14px',
          padding: '8px 12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          color: '#FFFFFF',
          width: '228px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          userSelect: 'none',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}
      >
        <div style={{ fontSize: '11.5px', fontWeight: 900, color: tagData.accentColor, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>{tagData.icon}</span>
          <span>{tagData.title}</span>
        </div>
        <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#ECEFF1' }}>
          {tagData.total}
        </div>
        <div style={{ fontSize: '9.5px', lineHeight: 1.25, color: '#B0BEC5' }}>
          {tagData.detail}
        </div>
      </div>
    </ManagedOverlay>
  )
}
