import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import { useLanguage } from '../../context/LanguageContext'
import { sound } from '../../game/soundManager'
import { audioManager } from '../audio/AudioManager'
import SproutMascot from '../../game/SproutMascot'

const SUSTAINABILITY_TIPS = [
  '🌱 Mulching with paddy straw retains up to 40% more soil moisture and protects topsoil.',
  '🌾 Happy Seeder sows wheat directly into standing stubble with zero burning.',
  '🚜 Baling straw earns farmers up to ₹3,000/acre while supplying clean biomass fuel.',
  '🧪 Bio-decomposer sprays convert stubble into rich organic compost in 20–25 days.',
  '💨 Open burning destroys essential nitrogen, phosphorus, and friendly earthworms.'
]

export default function LoadingScreen({ onStart, onSwitchToLite }) {
  const { t } = useLanguage()
  const { progress: dreiProgress, active } = useProgress()
  const [tipIndex, setTipIndex] = useState(0)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [minProgress, setMinProgress] = useState(15)

  // Smoothly increment a baseline floor so the bar looks lively while downloading
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)

    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % SUSTAINABILITY_TIPS.length)
    }, 3800)

    const progressTimer = setInterval(() => {
      setMinProgress((p) => (p < 85 ? p + 8 : p))
    }, 200)

    return () => {
      clearInterval(tipTimer)
      clearInterval(progressTimer)
    }
  }, [])

  // Calculate actual combined progress
  const actualProgress = Math.max(minProgress, Math.round(dreiProgress || 0))
  const isReady = actualProgress >= 100 || (!active && actualProgress >= 75)

  const handleStart = async () => {
    try {
      await audioManager.unlock()
    } catch {
      // Safe fallback
    }
    sound.initAudio()
    sound.playTap()
    onStart()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#F6E2B3',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(16px + env(safe-area-inset-top, 0px)) 20px calc(16px + env(safe-area-inset-bottom, 0px)) 20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        overflow: 'hidden'
      }}
    >
      <SproutMascot
        expression={isReady ? 'cheering' : 'happy'}
        speech={
          isReady
            ? 'The farm is ready! Tap Start to walk in 3D!'
            : 'Loading 3D harvest fields... get ready to explore!'
        }
        size="lg"
        bubblePosition="top"
      />

      <div style={{ marginTop: '16px', maxWidth: '380px', width: '100%' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#16382B', margin: '0 0 6px 0' }}>
          {t('game3d.loadingTitle')}
        </h2>

        {/* Sustainability Tip Carousel */}
        <div
          style={{
            backgroundColor: '#E8F5E9',
            border: '1.5px solid #81C784',
            borderRadius: '12px',
            padding: '8px 12px',
            margin: '6px 0 10px 0',
            fontSize: '0.8rem',
            color: '#1B5E20',
            fontWeight: 700,
            lineHeight: 1.4,
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {SUSTAINABILITY_TIPS[tipIndex]}
        </div>

        {/* One-time Controls Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #8D6E63',
            borderRadius: '16px',
            padding: '10px 14px',
            margin: '6px 0 14px 0',
            textAlign: 'left',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 900,
              color: '#2E7D32',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🎮</span>
            <span>Controls Guide</span>
          </div>
          {!isTouchDevice ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                fontSize: '0.82rem',
                color: '#3E2723',
                fontWeight: 700
              }}
            >
              <div>
                <span style={{ color: '#E65100' }}>⌨️ Move:</span> WASD or arrow keys to move
              </div>
              <div>
                <span style={{ color: '#0288D1' }}>🖱️ Look:</span> Drag the mouse to look around
              </div>
              <div>
                <span style={{ color: '#2E7D32' }}>🔘 Action:</span> E or Click to interact
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                fontSize: '0.82rem',
                color: '#3E2723',
                fontWeight: 700
              }}
            >
              <div>
                <span style={{ color: '#E65100' }}>🕹️ Move:</span> Use virtual joystick to move
              </div>
              <div>
                <span style={{ color: '#0288D1' }}>👆 Look:</span> Drag right side to look around
              </div>
              <div>
                <span style={{ color: '#2E7D32' }}>🔘 Action:</span> Tap button or straw pile to interact
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar Track */}
        <div
          style={{
            width: '100%',
            height: '14px',
            backgroundColor: '#E0D0B0',
            borderRadius: '9999px',
            overflow: 'hidden',
            border: '2px solid #8D6E63',
            marginBottom: '18px'
          }}
        >
          <div
            style={{
              width: `${actualProgress}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              borderRadius: '9999px',
              transition: 'width 0.25s ease'
            }}
          />
        </div>

        {/* Start Button (Unlocks audio & begins game) */}
        {isReady ? (
          <button
            data-testid="start-3d-button"
            type="button"
            onClick={handleStart}
            style={{
              width: '100%',
              minHeight: '58px',
              borderRadius: '9999px',
              backgroundColor: '#FFD54F',
              color: '#16382B',
              border: '3.5px solid #16382B',
              fontWeight: 900,
              fontSize: '1.15rem',
              cursor: 'pointer',
              boxShadow: '0 6px 0 rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>🌾</span>
            <span>{t('game3d.startBtn')}</span>
          </button>
        ) : (
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2E7D32' }}>
            <span>🌱 Loading {actualProgress}%</span>
          </div>
        )}

        {/* Option to switch straight to Lite mode */}
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            onClick={onSwitchToLite}
            style={{
              background: 'none',
              border: 'none',
              color: '#1B5E20',
              fontWeight: 700,
              fontSize: '0.85rem',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            {t('game3d.switchToLite')}
          </button>
        </div>
      </div>
    </div>
  )
}
