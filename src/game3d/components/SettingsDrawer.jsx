import React from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useGame3D } from '../context/Game3DContext'
import { audioManager } from '../audio/AudioManager'

export default function SettingsDrawer({ isOpen, onClose }) {
  const { t } = useLanguage()
  const {
    quality,
    setQuality,
    isTierLocked,
    setIsTierLocked,
    showFps,
    toggleFps,
    reducedMotion,
    setReducedMotion,
    invertLook,
    setInvertLook,
    soundVolume,
    setSoundVolume,
    musicVolume,
    setMusicVolume,
    isMuted,
    toggleMute,
    showDevStats,
    toggleDevStats
  } = useGame3D()

  if (!isOpen) return null

  const handleQualityChange = (newTier) => {
    if (newTier === 'auto') {
      setIsTierLocked(false)
    } else {
      setQuality(newTier)
      setIsTierLocked(true)
    }
  }

  const handleSoundVolume = (e) => {
    const val = parseFloat(e.target.value)
    setSoundVolume(val)
    audioManager.setSfxVolume(val)
  }

  const handleMusicVolume = (e) => {
    const val = parseFloat(e.target.value)
    setMusicVolume(val)
    audioManager.setMusicVolume(val)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        zIndex: 120,
        display: 'flex',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(3px)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          height: '100%',
          backgroundColor: '#FFFFFF',
          padding: 'calc(18px + env(safe-area-inset-top, 0px)) 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #E0E0E0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#16382B' }}>
              Game Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{
              background: '#F5F5F5',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '1.1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#424242'
            }}
          >
            ✕
          </button>
        </div>

        {/* 1. Quality Preset & Lock */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#3E2723', marginBottom: '8px' }}>
            Graphics Quality
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {[
              { id: 'auto', label: 'Auto' },
              { id: 'low', label: 'Low' },
              { id: 'medium', label: 'Med' },
              { id: 'high', label: 'High' }
            ].map((opt) => {
              const isSelected = opt.id === 'auto' ? !isTierLocked : (isTierLocked && quality === opt.id)
              return (
                <button
                  key={opt.id}
                  onClick={() => handleQualityChange(opt.id)}
                  style={{
                    padding: '8px 0',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #2E7D32' : '1px solid #BDBDBD',
                    backgroundColor: isSelected ? '#E8F5E9' : '#FAFAFA',
                    color: isSelected ? '#1B5E20' : '#424242',
                    fontWeight: isSelected ? 900 : 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#757575', marginTop: '6px' }}>
            {!isTierLocked ? 'Adaptive performance actively optimizes frame rate.' : 'Graphics tier locked by player.'}
          </div>
        </div>

        {/* 2. Audio Controls */}
        <div style={{ borderTop: '1px solid #EEEEEE', paddingTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3E2723' }}>Sound & Music</span>
            <button
              onClick={toggleMute}
              style={{
                background: isMuted ? '#FFEBEE' : '#E8F5E9',
                color: isMuted ? '#C62828' : '#2E7D32',
                border: `1px solid ${isMuted ? '#EF9A9A' : '#A5D6A7'}`,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {isMuted ? '🔇 Unmute' : '🔊 Mute All'}
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#616161', marginBottom: '4px' }}>
              <span>Sound Effects</span>
              <span>{Math.round(soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundVolume}
              onChange={handleSoundVolume}
              disabled={isMuted}
              style={{ width: '100%', accentColor: '#2E7D32' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#616161', marginBottom: '4px' }}>
              <span>Music</span>
              <span>{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={handleMusicVolume}
              disabled={isMuted}
              style={{ width: '100%', accentColor: '#2E7D32' }}
            />
          </div>
        </div>

        {/* 3. Toggles: FPS, Reduced Motion, Invert Look */}
        <div style={{ borderTop: '1px solid #EEEEEE', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Reduced Motion */}
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3E2723' }}>Reduced Motion</div>
              <div style={{ fontSize: '0.74rem', color: '#757575' }}>Disables camera shake, slow-mo & flashes</div>
            </div>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#2E7D32' }}
            />
          </label>

          {/* Invert Look */}
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3E2723' }}>Invert Look</div>
              <div style={{ fontSize: '0.74rem', color: '#757575' }}>Inverts horizontal mouse & touch look</div>
            </div>
            <input
              type="checkbox"
              checked={invertLook}
              onChange={(e) => setInvertLook(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#2E7D32' }}
            />
          </label>

          {/* Show FPS */}
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3E2723' }}>Show FPS (F)</div>
              <div style={{ fontSize: '0.74rem', color: '#757575' }}>Displays real-time frame rate</div>
            </div>
            <input
              type="checkbox"
              checked={showFps}
              onChange={toggleFps}
              style={{ width: '18px', height: '18px', accentColor: '#2E7D32' }}
            />
          </label>

          {/* Memory / Draw Calls Overlay */}
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3E2723' }}>GPU Stats Overlay (G)</div>
              <div style={{ fontSize: '0.74rem', color: '#757575' }}>Draw calls, triangles & memory metrics</div>
            </div>
            <input
              type="checkbox"
              checked={showDevStats}
              onChange={toggleDevStats}
              style={{ width: '18px', height: '18px', accentColor: '#2E7D32' }}
            />
          </label>
        </div>

        {/* Done Button */}
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2E7D32',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(46,125,50,0.3)'
            }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  )
}
