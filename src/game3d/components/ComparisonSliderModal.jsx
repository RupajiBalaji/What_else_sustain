import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'
import { sound } from '../../game/soundManager'

export default function ComparisonSliderModal({ onSwitchToLite }) {
  const { t } = useLanguage()
  const {
    showComparison,
    setShowComparison,
    triggerRewind,
    setShowPledgeModal,
    activeAlternative
  } = useGame3D()

  const [sliderPos, setSliderPos] = useState(50) // 0 to 100

  if (!showComparison) return null

  const handleDrag = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0
    const offset = clientX - rect.left
    const pct = Math.max(5, Math.min(95, (offset / rect.width) * 100))
    setSliderPos(pct)
  }

  const handleTakePledge = () => {
    sound.initAudio()
    sound.playTap()
    setShowComparison(false)
    setShowPledgeModal(true)
  }

  const handleTryAnother = () => {
    sound.initAudio()
    sound.playTap()
    setShowComparison(false)
    triggerRewind()
  }

  const altTitle =
    activeAlternative === 'happy_seeder' ? 'Happy Seeder' :
    activeAlternative === 'mulch' ? 'Mulch into Soil' :
    activeAlternative === 'compost' ? 'Compost (bio-decomposer)' :
    activeAlternative === 'bale_sell' ? 'Bale & Sell' : 'Sustainable Alternative'

  return (
    <div
      data-testid="comparison-slider-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 15, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        userSelect: 'none',
        pointerEvents: 'auto',
        color: '#FFFFFF'
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(20, 26, 32, 0.96)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '680px',
          padding: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflowY: 'auto',
          gap: '16px'
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>⚖️</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#A5D6A7', margin: 0 }}>
                {t('game3d.comparisonTitle') || 'What Else? Side-by-Side Comparison'}
              </h2>
            </div>
            <button
              onClick={() => setShowComparison(false)}
              aria-label="Close comparison"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 900
              }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: '0.80rem', color: '#B0BEC5', margin: '4px 0 0 0' }}>
            {t('game3d.comparisonSubtitle') || 'Compare the harmful burn decision with your chosen sustainable alternative.'}
          </p>
        </div>

        {/* INTERACTIVE COMPARISON SPLIT SLIDER */}
        <div
          onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
          onTouchMove={handleDrag}
          onClick={handleDrag}
          style={{
            position: 'relative',
            width: '100%',
            height: '200px',
            borderRadius: '14px',
            overflow: 'hidden',
            cursor: 'ew-resize',
            boxShadow: 'inset 0 0 16px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          {/* 1. RIGHT SIDE: SUSTAINABLE OUTCOME (Clean green) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#1B3B2B',
              backgroundImage: 'radial-gradient(circle at top right, #2E7D32 0%, #16382B 70%)',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              textAlign: 'right'
            }}
          >
            <div style={{ display: 'inline-block', alignSelf: 'flex-end', backgroundColor: 'rgba(46, 125, 50, 0.75)', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 900 }}>
              ✓ {altTitle}
            </div>
            <div style={{ fontSize: '0.74rem', lineHeight: 1.4 }}>
              <div style={{ fontWeight: 800, color: '#A5D6A7' }}>✓ Clean air, zero toxic village smoke</div>
              <div style={{ color: '#C8E6C9' }}>✓ Organic carbon preserved in topsoil</div>
              <div style={{ fontWeight: 800, color: '#81C784' }}>✓ Soil fertility reduces next season fertilizer costs</div>
            </div>
            <div style={{ fontSize: '0.70rem', color: '#81C784' }}>
              Simulated Exposure: 0 / 100 (Safe)
            </div>
          </div>

          {/* 2. LEFT SIDE: BURNING MISTAKE (Smog & Ash) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: `${sliderPos}%`,
              backgroundColor: '#3E2723',
              backgroundImage: 'radial-gradient(circle at top left, #D84315 0%, #212121 80%)',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              overflow: 'hidden',
              boxShadow: '4px 0 16px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ display: 'inline-block', alignSelf: 'flex-start', backgroundColor: 'rgba(198, 40, 40, 0.75)', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
              ✗ Burning Stubble
            </div>
            <div style={{ fontSize: '0.74rem', lineHeight: 1.4, minWidth: '220px' }}>
              <div style={{ fontWeight: 800, color: '#FF8A65' }}>✗ Toxic PM2.5 smoke plumes blanket village</div>
              <div style={{ color: '#CFD8DC' }}>✗ Heat kills earthworms & beneficial fungi</div>
              <div style={{ fontWeight: 800, color: '#EF9A9A' }}>✗ -₹3,000 to ₹4,500 / acre lost (game estimate)</div>
            </div>
            <div style={{ fontSize: '0.70rem', color: '#FFAB91', whiteSpace: 'nowrap' }}>
              Simulated Exposure: 84 / 100 (Toxic)
            </div>
          </div>

          {/* 3. Draggable Divider Handle */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${sliderPos}%`,
              transform: 'translateX(-50%)',
              width: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(20, 26, 32, 0.95)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                border: '2px solid #81C784',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                color: '#81C784',
                fontWeight: 900
              }}
            >
              ↔
            </div>
          </div>
        </div>

        {/* 2-COLUMN METRICS COMPARISON TABLE */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#90A4AE', fontWeight: 800 }}>Metric</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#EF9A9A', fontWeight: 800 }}>Burn Stubble</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#A5D6A7', fontWeight: 800 }}>{altTitle}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#ECEFF1' }}>Farm Financial Impact</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#EF9A9A' }}>-₹3,000 to ₹4,500/ac <span style={{ fontSize: '0.65rem', color: '#B0BEC5' }}>(game estimate)</span></td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#A5D6A7' }}>
                  {activeAlternative === 'bale_sell'
                    ? '-₹200 to +₹800/ac (Punjab)'
                    : 'Moisture & NPK saved'}
                  {' '}
                  <span style={{ fontSize: '0.65rem', color: '#B0BEC5' }}>(Source: PAU / NPMCR, game estimate)</span>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#ECEFF1' }}>Soil Health Delta</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#EF9A9A' }}>-25 pts (microbes perished)</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#A5D6A7' }}>+25 pts (microbes thriving)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#ECEFF1' }}>Simulated Smoke Index</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#EF9A9A' }}>84 / 100 (Toxic Smog)</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#A5D6A7' }}>0 / 100 (Clean Air)</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#ECEFF1' }}>Nutrient Retention</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#EF9A9A' }}>100% C & ~34kg NPK lost</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#A5D6A7' }}>Retained & recycled</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sourced Takeaway */}
        <div style={{ backgroundColor: 'rgba(76, 175, 80, 0.10)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.74rem', color: '#C8E6C9', lineHeight: 1.4 }}>
          <strong>💡 Sourced Takeaway (NPMCR / 2021 review):</strong> Burning residue vaporizes all organic carbon and roughly 5.5kg N, 2.3kg P, 25kg K per tonne. Sustainable alternatives return nutrients directly to the soil, saving money next season.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            data-testid="comparison-try-another-button"
            onClick={handleTryAnother}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔄</span>
            <span>Try another alternative</span>
          </button>

          <button
            type="button"
            data-testid="comparison-keep-choice-button"
            onClick={handleTakePledge}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              backgroundColor: '#4CAF50',
              color: '#141A20',
              border: 'none',
              fontWeight: 900,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
            }}
          >
            <span>✓</span>
            <span>Keep this choice</span>
          </button>
        </div>
      </div>
    </div>
  )
}
