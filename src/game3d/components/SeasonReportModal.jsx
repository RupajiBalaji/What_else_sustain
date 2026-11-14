import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useGame3D } from '../context/Game3DContext'
import { GAME_BALANCE } from '../config/gameBalance'
import { sound } from '../../game/soundManager'

export default function SeasonReportModal({ onNextSeason, onRewindSeason, onOpenAchievements }) {
  const {
    seasonReportData,
    persistentState,
    setShowSeasonReport
  } = useGame3D()

  const [counterAnim, setCounterAnim] = useState(0)

  useEffect(() => {
    sound.initAudio()
    sound.playWin()

    const timer = setInterval(() => {
      setCounterAnim((c) => Math.min(100, c + 5))
    }, 30)

    return () => clearInterval(timer)
  }, [])

  if (!seasonReportData || typeof document === 'undefined') return null

  const {
    rank,
    cropRevenue = 24000,
    decisionRevenue = 0,
    netSeasonBalance = 24000,
    soilDelta = 0,
    villageDelta = 0,
    xpGained = 50,
    streak = 0,
    summaryText = 'Clean air maintained across the village.'
  } = seasonReportData

  const currentLevel = GAME_BALANCE.LEVELS.find((l) => l.level === (persistentState?.farmerLevel || 1)) || GAME_BALANCE.LEVELS[0]
  const nextLevel = GAME_BALANCE.LEVELS.find((l) => l.level === (persistentState?.farmerLevel || 1) + 1)
  const xpNeeded = nextLevel ? nextLevel.xpNeeded : 9999
  const currentXP = persistentState?.farmerXP || 0

  const handleShare = () => {
    sound.initAudio()
    sound.playTap()
    const text = `🌾 What Else Sustain - Finished Season ${persistentState?.seasonIndex || 1} with Rank ${rank?.rank || 'A'}! Net earnings: ₹${netSeasonBalance.toLocaleString('en-IN')}, Soil Health: ${Math.round(persistentState?.soilHealth || 70)}/100! 🌍 #SustainableFarming`
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'What Else Sustain', text }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      alert('Report copied to clipboard!')
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 25, 20, 0.85)',
        zIndex: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(6px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflowY: 'auto',
        pointerEvents: 'auto'
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '3px solid #2E7D32',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Header Banner: Title and Rank Badge in clean horizontal layout (Zero overlap!) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
            color: '#FFFFFF',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#A5D6A7' }}>
              Season {persistentState?.seasonIndex || 1} Report
            </div>
            <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2 }}>
              Harvest Complete!
            </h2>
          </div>

          {/* Letter Rank Badge: Cleanly right-aligned without covering title */}
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: rank?.badgeColor || '#FFD700',
              color: '#16382B',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '2.5px solid #FFFFFF',
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: '1.3rem', fontWeight: 900, lineHeight: 1 }}>{rank?.rank || 'A'}</span>
            <span style={{ fontSize: '0.5rem', fontWeight: 900, textTransform: 'uppercase' }}>Rank</span>
          </div>
        </div>

        {/* Content Body: Compact on 360x640 to ensure Next Season button is reachable without scrolling */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Summary Box */}
          <div
            style={{
              backgroundColor: '#F1F8E9',
              border: '1.5px solid #81C784',
              borderRadius: '12px',
              padding: '8px 12px',
              fontSize: '0.80rem',
              color: '#1B5E20',
              fontWeight: 700,
              lineHeight: 1.35
            }}
          >
            <strong>What changed:</strong> {summaryText}
          </div>

          {/* Economics Breakdown */}
          <div
            style={{
              backgroundColor: '#FAFAFA',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              padding: '8px 12px'
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#616161', textTransform: 'uppercase', marginBottom: '4px' }}>
              Financial Results
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#37474F', marginBottom: '3px' }}>
              <span>Crop Harvest Sale:</span>
              <strong style={{ color: '#2E7D32' }}>+₹{Math.round(cropRevenue * (counterAnim / 100)).toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#37474F', marginBottom: '3px' }}>
              <span>Residue Choice Balance:</span>
              <strong style={{ color: decisionRevenue >= 0 ? '#2E7D32' : '#C62828' }}>
                {decisionRevenue >= 0 ? '+' : ''}₹{Math.round(decisionRevenue * (counterAnim / 100)).toLocaleString('en-IN')}
              </strong>
            </div>
            <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '4px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 900 }}>
              <span style={{ color: '#16382B' }}>Net Season Balance:</span>
              <span style={{ color: netSeasonBalance >= 0 ? '#2E7D32' : '#C62828' }}>
                {netSeasonBalance >= 0 ? '+' : ''}₹{Math.round(netSeasonBalance * (counterAnim / 100)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Carry-over Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            {/* Soil Health */}
            <div style={{ backgroundColor: '#EFEBE9', borderRadius: '10px', padding: '6px', textAlign: 'center', border: '1px solid #BCAAA4' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#5D4037' }}>SOIL</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#3E2723' }}>
                {Math.round(persistentState?.soilHealth || 70)}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: soilDelta >= 0 ? '#2E7D32' : '#C62828' }}>
                {soilDelta >= 0 ? `+${soilDelta}` : soilDelta}
              </div>
            </div>

            {/* Village Health */}
            <div style={{ backgroundColor: '#E0F2F1', borderRadius: '10px', padding: '6px', textAlign: 'center', border: '1px solid #80CBC4' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#00695C' }}>VILLAGE AIR</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#004D40' }}>
                {Math.round(persistentState?.villageHealth || 75)}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: villageDelta >= 0 ? '#2E7D32' : '#C62828' }}>
                {villageDelta >= 0 ? `+${villageDelta}` : villageDelta}
              </div>
            </div>

            {/* Sustainable Streak */}
            <div style={{ backgroundColor: '#FFF8E1', borderRadius: '10px', padding: '6px', textAlign: 'center', border: '1px solid #FFE082' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#F57F17' }}>STREAK</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#E65100' }}>
                {streak}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#F57F17' }}>
                {streak > 1 ? '🔥 Zero fire' : 'Seasons'}
              </div>
            </div>
          </div>

          {/* Action Buttons: Next Season reachable without scrolling on 360x640 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
            <button
              type="button"
              data-testid="next-season-button"
              onClick={onNextSeason}
              style={{
                width: '100%',
                minHeight: '44px',
                backgroundColor: '#2E7D32',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.98rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(46,125,50,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Next Season ➔</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={onRewindSeason}
                style={{
                  padding: '10px',
                  backgroundColor: '#FFF8E1',
                  color: '#E65100',
                  border: '1.5px solid #FFB74D',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                ↺ Replay Season
              </button>
              <button
                type="button"
                onClick={handleShare}
                style={{
                  padding: '10px',
                  backgroundColor: '#E8F5E9',
                  color: '#1B5E20',
                  border: '1.5px solid #81C784',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                📤 Share
              </button>
              <button
                type="button"
                onClick={onOpenAchievements}
                style={{
                  padding: '10px',
                  backgroundColor: '#EDE7F6',
                  color: '#4A148C',
                  border: '1.5px solid #B39DDB',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                🏆 Badges
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
