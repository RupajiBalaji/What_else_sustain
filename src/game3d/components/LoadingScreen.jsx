import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import { sound } from '../../game/soundManager'
import SproutMascot from '../../game/SproutMascot'

export default function LoadingScreen({ onStart, onSwitchToLite }) {
  const { t } = useLanguage()
  const [progress, setProgress] = useState(15)
  const [isReady, setIsReady] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)

    // Simulated progress bar loading assets
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsReady(true)
          return 100
        }
        return prev + Math.floor(Math.random() * 25) + 15
      })
    }, 200)

    return () => clearInterval(interval)
  }, [])

  const handleStart = () => {
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

        {/* One-time Controls Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #8D6E63',
            borderRadius: '16px',
            padding: '10px 14px',
            margin: '10px 0 14px 0',
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
                <span style={{ color: '#2E7D32' }}>🔘 Action:</span> E to interact
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
            marginBottom: '20px'
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              borderRadius: '9999px',
              transition: 'width 0.25s ease'
            }}
          />
        </div>

        {/* Start Button (Unlocks audio & begins game) */}
        {isReady ? (
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            type="button"
            onClick={handleStart}
            style={{
              width: '100%',
              minHeight: '60px',
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
            {t('game3d.startBtn')}
          </motion.button>
        ) : (
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2E7D32' }}>
            <span>🌱 {progress}%</span>
          </div>
        )}

        {/* Option to switch straight to Lite mode if desired */}
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
