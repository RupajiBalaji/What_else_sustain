import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'
import { safeStorage } from '../utils/safeStorage'
import SproutMascot from './SproutMascot'
import { sound } from './soundManager'
import './cartoonGame.css'

const PLEDGES_STORAGE_KEY = 'wes_pledges_v1'

export default function KidPledgeScreen({ scenarioId = 'farm_crop_residue', onExitToMap, onOpenScorecard }) {
  const { language, t } = useLanguage()
  const { addPoints, unlockBadge } = useGame()

  const [hasPledged, setHasPledged] = useState(() => {
    try {
      const stored = safeStorage.getItem(PLEDGES_STORAGE_KEY)
      if (stored) {
        const list = JSON.parse(stored)
        return Array.isArray(list) && list.some((item) => item.scenarioId === scenarioId)
      }
    } catch {
      // safe fallback
    }
    return false
  })

  const [justPledged, setJustPledged] = useState(false)

  // Determine pledge statement
  const getPledgeText = () => {
    if (scenarioId === 'home_plastic_bottle') {
      return t('pledge.plasticPledge') || 'I will reuse or sell my plastic bottles'
    }
    return t('pledge.farmPledge') || 'I will not burn crop waste this season'
  }

  const handleTakePledge = () => {
    sound.initAudio()
    sound.playWin()
    sound.playCoin()

    try {
      const existing = safeStorage.getItem(PLEDGES_STORAGE_KEY)
      let list = []
      if (existing) {
        list = JSON.parse(existing)
        if (!Array.isArray(list)) list = []
      }
      if (!list.some((item) => item.scenarioId === scenarioId)) {
        list.push({
          scenarioId,
          pledgedAt: new Date().toISOString(),
          pledgeText: getPledgeText()
        })
        safeStorage.setItem(PLEDGES_STORAGE_KEY, JSON.stringify(list))
      }
    } catch {
      // safe fallback
    }

    addPoints(25)
    unlockBadge('pledge_keeper')
    setHasPledged(true)
    setJustPledged(true)
  }

  return (
    <div className="cartoon-game-root" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Top HUD */}
      <header className="kid-hud-bar">
        <button
          type="button"
          className="kid-btn"
          style={{ minHeight: '44px', padding: '6px 14px', fontSize: '0.9rem', backgroundColor: '#FFF' }}
          onClick={() => {
            sound.playTap()
            onExitToMap()
          }}
          aria-label="Back to Village Map"
        >
          ⬅️ Village Map
        </button>

        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#16382B' }}>
          🤝 {t('pledge.cardTitle')}
        </h1>

        <div className="kid-hud-pill" style={{ backgroundColor: '#FFF9C4', borderColor: '#F57F17' }}>
          <span>⭐</span>
          <span>+25 Pts</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="village-map-container" style={{ paddingBottom: '24px', justifyContent: 'center' }}>
        <div style={{ zIndex: 10, display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
          <SproutMascot
            expression={hasPledged ? 'cheering' : 'happy'}
            speech={
              hasPledged
                ? 'You are a true friend of nature! Thank you for pledging! 🌟'
                : 'Take a personal pledge to protect our planet in daily life!'
            }
            size="lg"
            bubblePosition="top"
          />
        </div>

        {/* Pledge Card Box */}
        <div
          style={{
            background: '#FFFFFF',
            border: '4px solid #2E7D32',
            borderRadius: '28px',
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: 'var(--kid-shadow)',
            zIndex: 10,
            maxWidth: '520px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>
            {scenarioId === 'home_plastic_bottle' ? '🧴' : '🌾'}
          </span>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1B5E20', margin: '0 0 6px 0' }}>
            {t('pledge.cardTitle')}
          </h2>

          <p style={{ fontSize: '0.88rem', color: '#546E7A', margin: '0 0 16px 0' }}>
            {t('pledge.cardSubtitle')}
          </p>

          {/* The Pledge Quotation */}
          <blockquote
            style={{
              background: '#E8F5E9',
              border: '2.5px dashed #4CAF50',
              borderRadius: '20px',
              padding: '16px 18px',
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#16382B',
              lineHeight: 1.45,
              margin: '0 0 16px 0'
            }}
          >
            "{getPledgeText()}"
          </blockquote>

          {/* Bonus Notice Banner if not pledged */}
          {!hasPledged && (
            <div
              style={{
                background: '#FFF8E1',
                border: '2px solid #FFE082',
                borderRadius: '9999px',
                padding: '8px 16px',
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#E65100',
                marginBottom: '18px',
                display: 'inline-block'
              }}
            >
              ⭐ +25 {language === 'te' ? 'బోనస్ పాయింట్లు & ప్లెడ్జ్ కీపర్ బ్యాడ్జ్' : 'Bonus Points & Pledge Keeper Badge'}
            </div>
          )}

          {/* Success Banner if pledged */}
          {hasPledged && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: '#E8F5E9',
                border: '2px solid #2E7D32',
                borderRadius: '16px',
                padding: '12px 16px',
                color: '#1B5E20',
                fontWeight: 800,
                fontSize: '0.95rem',
                marginBottom: '18px'
              }}
            >
              🌟 {t('pledge.successMessage')}
            </motion.div>
          )}

          {/* Pledge CTA Button (Min 56px touch target) */}
          {!hasPledged ? (
            <button
              type="button"
              className="kid-btn kid-btn-green"
              style={{ width: '100%', minHeight: '60px', fontSize: '1.2rem' }}
              onClick={handleTakePledge}
            >
              ✋ {t('pledge.pledgeBtn')}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="kid-btn kid-btn-blue"
                style={{ width: '100%', minHeight: '56px', fontSize: '1.05rem' }}
                onClick={() => {
                  sound.initAudio()
                  sound.playTap()
                  onOpenScorecard()
                }}
              >
                📊 {t('pledge.viewScoreBtn')}
              </button>

              <button
                type="button"
                className="kid-btn"
                style={{ width: '100%', minHeight: '56px', backgroundColor: '#FFF' }}
                onClick={() => {
                  sound.initAudio()
                  sound.playTap()
                  onExitToMap()
                }}
              >
                🌾 Return to Village Map
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
