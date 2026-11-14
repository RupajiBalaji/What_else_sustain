import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame3D } from '../context/Game3DContext'
import { shareOrDownloadCard } from '../../utils/shareCard'
import { sound } from '../../game/soundManager'
import { safeStorage } from '../../utils/safeStorage'

const PLEDGES_STORAGE_KEY = 'wes_pledges_v1'

export default function PledgeCardModal({ isOpen, onClose }) {
  const { persistentState, rupeeCount, farmBalance, activeAlternative } = useGame3D()

  const [hasPledged, setHasPledged] = useState(() => {
    try {
      const stored = safeStorage.getItem(PLEDGES_STORAGE_KEY)
      if (stored) {
        const list = JSON.parse(stored)
        return Array.isArray(list) && list.some((item) => item.scenarioId === 'farm_crop_residue')
      }
    } catch {
      // safe fallback
    }
    return false
  })

  const [isSharing, setIsSharing] = useState(false)

  if (!isOpen) return null

  const handleConfirmPledge = () => {
    sound.initAudio()
    sound.playWin()
    try {
      const existing = safeStorage.getItem(PLEDGES_STORAGE_KEY)
      let list = []
      if (existing) {
        list = JSON.parse(existing)
        if (!Array.isArray(list)) list = []
      }
      if (!list.some((item) => item.scenarioId === 'farm_crop_residue')) {
        list.push({
          scenarioId: 'farm_crop_residue',
          pledgedAt: new Date().toISOString(),
          pledgeText: 'I will choose an alternative to burning straw this season and protect our community.'
        })
        safeStorage.setItem(PLEDGES_STORAGE_KEY, JSON.stringify(list))
      }
    } catch {
      // safe fallback
    }
    setHasPledged(true)
  }

  const handleShare = async () => {
    setIsSharing(true)
    sound.initAudio()
    sound.playTap()
    try {
      await shareOrDownloadCard({
        rank: persistentState?.streak >= 2 ? 'S' : 'A',
        rankTitle: activeAlternative === 'happy_seeder' ? 'Direct Drill Pioneer' :
                   activeAlternative === 'compost' ? 'Bio-Decomposer Master' :
                   activeAlternative === 'mulch' ? 'Soil Moisture Guardian' :
                   activeAlternative === 'bale_sell' ? 'Clean Biomass Partner' : 'Sustainable Farmer',
        seasonIndex: persistentState?.seasonIndex || 1,
        balance: rupeeCount || farmBalance || 12000,
        soilHealth: persistentState?.soilHealth || 75,
        villageHealth: persistentState?.villageHealth || 80,
        siteUrl: window.location.origin || 'https://what-else-sustain.web.app'
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div
      data-testid="pledge-card-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 140,
        backgroundColor: 'rgba(10, 15, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
        pointerEvents: 'auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'rgba(20, 26, 32, 0.96)',
          borderRadius: '20px',
          border: '1.5px solid rgba(129, 199, 132, 0.3)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          color: '#FFFFFF',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>📜</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#A5D6A7', margin: 0 }}>
                Clean Sky & Soil Stewardship Pledge
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#90A4AE', marginTop: '2px' }}>
                Commitment to village health and soil preservation
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close pledge"
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

        {/* Pledge Body */}
        <div
          style={{
            backgroundColor: 'rgba(46, 125, 50, 0.12)',
            border: '1px solid rgba(129, 199, 132, 0.3)',
            borderRadius: '14px',
            padding: '18px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#E8F5E9', lineHeight: 1.5 }}>
            “I pledge to choose sustainable alternatives to open stubble burning — nurturing microbial topsoil, keeping our village air clean, and championing regenerative farming.”
          </div>
          <div style={{ fontSize: '0.75rem', color: '#81C784', marginTop: '8px', fontWeight: 700 }}>
            {hasPledged ? '✓ Pledged by you this season' : 'Ready to commit for the upcoming harvest'}
          </div>
        </div>

        {/* Educational Note */}
        <div style={{ fontSize: '0.76rem', color: '#B0BEC5', lineHeight: 1.45 }}>
          Scientific evidence demonstrates that every acre spared from open fire saves 5.5 kg of organic nitrogen, shields local elders and children from PM2.5 respiratory distress, and enriches soil carbon over successive seasons.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          {!hasPledged ? (
            <button
              data-testid="confirm-pledge-button"
              onClick={handleConfirmPledge}
              style={{
                width: '100%',
                minHeight: '48px',
                backgroundColor: '#2E7D32',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(46, 125, 50, 0.4)'
              }}
            >
              <span>✍️</span>
              <span>Confirm My Stewardship Pledge</span>
            </button>
          ) : (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderRadius: '10px',
                textAlign: 'center',
                color: '#A5D6A7',
                fontWeight: 800,
                fontSize: '0.9rem'
              }}
            >
              ✓ Stewardship Pledge Active
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              data-testid="share-card-button"
              onClick={handleShare}
              disabled={isSharing}
              style={{
                flex: 1,
                minHeight: '44px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFF176',
                border: '1px solid rgba(255, 241, 118, 0.3)',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: isSharing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>🖼️</span>
              <span>{isSharing ? 'Generating...' : 'Save & Share Honor Card'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                minHeight: '44px',
                padding: '0 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#CFD8DC',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
