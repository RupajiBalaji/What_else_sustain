import React from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'
import SproutMascot from './SproutMascot'
import { sound } from './soundManager'
import './cartoonGame.css'

export default function VillageMapHome({
  onSelectFarm,
  onSelectPlastic,
  onOpenClassicMode,
  onOpenBadges,
  onOpenScorecard,
  onOpenAdvisor,
  onSwitchTo3D
}) {
  const { language, toggleLanguage, t } = useLanguage()
  const {
    points,
    natureHealth,
    badges,
    completedScenarios,
    currentLevelKey,
    levelNumber
  } = useGame()

  const [isMuted, setIsMuted] = React.useState(sound.isMuted)

  const handleToggleMute = () => {
    sound.initAudio()
    const muted = sound.toggleMute()
    setIsMuted(muted)
  }

  // Calculate stars: 1 star per 10 points
  const totalStars = Math.max(0, Math.floor(points / 10))

  // Friendly Sprout greeting based on state
  const isFarmDone = completedScenarios.includes('farm_crop_residue')
  const isPlasticDone = completedScenarios.includes('home_plastic_bottle')

  let sproutSpeech = ''
  let sproutExpression = 'happy'

  if (isFarmDone && isPlasticDone) {
    sproutSpeech = 'Amazing! Our whole village is thriving and clean! You are a true Eco Hero! 🌟'
    sproutExpression = 'cheering'
  } else if (isFarmDone || isPlasticDone) {
    sproutSpeech = 'Great work! Keep going to restore every corner of the village!'
    sproutExpression = 'happy'
  } else if (natureHealth < 50) {
    sproutSpeech = 'Oh no! Nature is hurting. Visit the Farm or Home to heal our village!'
    sproutExpression = 'worried'
  } else {
    sproutSpeech = "Hi, I'm Sprout! Tap a location to play, learn, and make eco choices! 🌱"
    sproutExpression = 'happy'
  }

  const levelName = t(`levels.${currentLevelKey}`) || currentLevelKey

  return (
    <div className="cartoon-game-root">
      {/* Top Game HUD Bar */}
      <header className="kid-hud-bar" role="banner">
        {/* Left: Star Counter & Level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div className="kid-hud-pill" title="Total Stars Earned">
            <span style={{ fontSize: '1.25rem' }}>⭐</span>
            <span style={{ color: '#E65100', fontSize: '1.05rem' }}>{totalStars}</span>
          </div>

          <div
            className="kid-hud-pill"
            style={{ backgroundColor: '#E8F5E9', borderColor: '#2E7D32', cursor: 'pointer' }}
            onClick={() => {
              sound.initAudio()
              sound.playTap()
              onOpenBadges()
            }}
            title="Current Level & Stickers"
          >
            <span style={{ fontSize: '1.1rem' }}>🏆</span>
            <span style={{ color: '#1B5E20' }}>{levelName}</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons (min 56px tap target) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Sound Mute Toggle */}
          <button
            type="button"
            className="kid-btn kid-btn-circle"
            style={{ backgroundColor: isMuted ? '#FFCDD2' : '#FFF9C4', borderColor: '#16382B' }}
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            <span style={{ fontSize: '1.4rem' }}>{isMuted ? '🔇' : '🔊'}</span>
          </button>

          {/* AI Advisor Mascot Buddy */}
          <button
            type="button"
            data-testid="village-advisor-btn"
            className="kid-btn kid-btn-green"
            style={{ padding: '6px 14px', fontSize: '0.92rem' }}
            onClick={() => {
              sound.initAudio()
              sound.playTap()
              onOpenAdvisor()
            }}
            aria-label="Ask Sprout's AI Advisor"
          >
            🤖 AI Help
          </button>
        </div>
      </header>

      {/* Main Village Map Arena */}
      <main className="village-map-container" role="main">
        {/* Animated Background Atmosphere (Clouds & Sun) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '240px',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 1
          }}
          aria-hidden="true"
        >
          {/* Sunny smiling cartoon sun */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: '12px',
              right: '24px',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FFD54F',
              border: '3.5px solid #FFA000',
              boxShadow: '0 0 20px rgba(255, 213, 79, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem'
            }}
          >
            ☀️
          </motion.div>

          {/* Floating Cloud 1 */}
          <motion.div
            animate={{ x: [-80, 500] }}
            transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: '30px',
              left: 0,
              fontSize: '2.5rem',
              opacity: 0.9
            }}
          >
            ☁️
          </motion.div>

          {/* Floating Cloud 2 */}
          <motion.div
            animate={{ x: [450, -80] }}
            transition={{ repeat: Infinity, duration: 32, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: '80px',
              right: 0,
              fontSize: '2rem',
              opacity: 0.8
            }}
          >
            ☁️
          </motion.div>

          {/* Cartoon flying birds */}
          <motion.div
            animate={{ x: [-50, 420], y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: '55px',
              left: '40px',
              fontSize: '1.4rem'
            }}
          >
            🕊️
          </motion.div>
        </div>

        {/* Mascot Greeting Area */}
        <section
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            margin: '8px 0 16px 0'
          }}
          aria-label="Sprout Greeting"
        >
          <SproutMascot
            expression={sproutExpression}
            speech={sproutSpeech}
            size="md"
            bubblePosition="top"
          />
        </section>

        {/* Interactive Landmark Cards (The Village Map Nodes) */}
        <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* LANDMARK 1: The Farm Field (Scenario 1) */}
          <motion.div
            className="map-node-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              sound.initAudio()
              sound.playTap()
              onSelectFarm()
            }}
            role="button"
            tabIndex={0}
            aria-label="Play Farm Field Challenge"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectFarm()
            }}
          >
            <div
              className="map-node-icon"
              style={{ backgroundColor: '#FFF9C4', borderColor: '#F57F17' }}
            >
              🌾
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#16382B' }}>
                  The Farm & Straw Field
                </h2>
                {isFarmDone && (
                  <span
                    style={{
                      background: '#4CAF50',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '9999px'
                    }}
                  >
                    ✓ Done
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#4A5568' }}>
                Drag leftover straw away from fire to save air and soil!
              </p>
            </div>
            <button
              type="button"
              className="kid-btn kid-btn-green"
              style={{ padding: '8px 18px', fontSize: '0.95rem', flexShrink: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                sound.initAudio()
                sound.playTap()
                onSelectFarm()
              }}
            >
              ▶ Play
            </button>
          </motion.div>

          {/* LANDMARK 2: Village Home & Town (Scenario 2 - 30s Plastic Sorter) */}
          <motion.div
            className="map-node-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              sound.initAudio()
              sound.playTap()
              onSelectPlastic()
            }}
            role="button"
            tabIndex={0}
            aria-label="Play Plastic Sorting Arcade"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectPlastic()
            }}
          >
            <div
              className="map-node-icon"
              style={{ backgroundColor: '#E1F5FE', borderColor: '#0288D1' }}
            >
              🧴
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#16382B' }}>
                  Home Plastic Speed Sorter
                </h2>
                {isPlasticDone && (
                  <span
                    style={{
                      background: '#4CAF50',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '9999px'
                    }}
                  >
                    ✓ Done
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#4A5568' }}>
                30-second arcade challenge: sort bottles into recycling and reuse!
              </p>
            </div>
            <button
              type="button"
              className="kid-btn kid-btn-blue"
              style={{ padding: '8px 18px', fontSize: '0.95rem', flexShrink: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                sound.initAudio()
                sound.playTap()
                onSelectPlastic()
              }}
            >
              ▶ Play
            </button>
          </motion.div>

          {/* LANDMARK 3: Village Center & River Restoration Progress */}
          <div
            style={{
              background: '#FFFFFF',
              border: '3.5px solid #2E7D32',
              borderRadius: '24px',
              padding: '16px',
              boxShadow: '0 6px 0 rgba(0,0,0,0.12)',
              marginTop: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.6rem' }}>🌊</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1B5E20' }}>
                    Village River & Nature Health
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#555' }}>
                    {natureHealth >= 80
                      ? 'Clean crystal water & blooming trees 🌳'
                      : 'Make green choices to heal the river and soil'}
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  color: natureHealth >= 70 ? '#2E7D32' : natureHealth >= 40 ? '#F57C00' : '#D32F2F'
                }}
              >
                {natureHealth}%
              </div>
            </div>

            {/* Health Progress Track */}
            <div
              style={{
                width: '100%',
                height: '16px',
                background: '#E0E0E0',
                borderRadius: '9999px',
                border: '2px solid #37474F',
                overflow: 'hidden',
                margin: '10px 0 6px 0'
              }}
            >
              <div
                style={{
                  width: `${natureHealth}%`,
                  height: '100%',
                  background:
                    natureHealth >= 70
                      ? 'linear-gradient(90deg, #66BB6A, #43A047)'
                      : natureHealth >= 40
                      ? 'linear-gradient(90deg, #FFA726, #FB8C00)'
                      : 'linear-gradient(90deg, #EF5350, #E53935)',
                  transition: 'width 0.6s ease'
                }}
              />
            </div>

            {/* Mini Village Restoration Panorama */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                paddingTop: '6px',
                fontSize: '1.6rem'
              }}
            >
              <span title="Village Trees" style={{ filter: natureHealth < 50 ? 'grayscale(0.7)' : 'none' }}>
                {natureHealth >= 70 ? '🌳' : '🌾'}
              </span>
              <span title="River Health">
                {natureHealth >= 70 ? '🐟' : natureHealth >= 40 ? '💧' : '🥀'}
              </span>
              <span title="Village Birds">
                {natureHealth >= 60 ? '🐦' : '💨'}
              </span>
              <span title="Soil Worms">
                {natureHealth >= 65 ? '🪱' : '🏜️'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Navigation & Classic Mode Link */}
        <footer
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '20px',
            flexWrap: 'wrap',
            zIndex: 10
          }}
        >
          {/* Stickers & Badges Showcase Button */}
          <button
            type="button"
            data-testid="village-badges-btn"
            className="kid-btn"
            style={{ backgroundColor: '#FFF', flex: '1 1 140px', minHeight: '56px' }}
            onClick={() => {
              sound.initAudio()
              sound.playTap()
              onOpenBadges()
            }}
          >
            🎨 Sticker Collection ({badges.length}/5)
          </button>

          {/* Final Scorecard Button */}
          <button
            type="button"
            data-testid="village-scorecard-btn"
            className="kid-btn kid-btn-green"
            style={{ flex: '1 1 140px', minHeight: '56px' }}
            onClick={() => {
              sound.initAudio()
              sound.playTap()
              onOpenScorecard()
            }}
          >
            📊 Scorecard
          </button>

          {/* 3D Mode Switcher */}
          {onSwitchTo3D && (
            <button
              type="button"
              className="kid-btn"
              style={{
                backgroundColor: '#E1F5FE',
                borderColor: '#0277BD',
                color: '#01579B',
                flex: '1 1 100%',
                minHeight: '56px',
                fontWeight: 900
              }}
              onClick={() => {
                sound.initAudio()
                sound.playTap()
                onSwitchTo3D()
              }}
              aria-label="Switch to 3D Game World"
            >
              🌐 Switch to 3D World Mode
            </button>
          )}

          {/* Classic Mode Switcher */}
          <button
            type="button"
            className="kid-btn"
            style={{
              backgroundColor: '#EDE7F6',
              borderColor: '#4A148C',
              color: '#4A148C',
              flex: '1 1 100%',
              minHeight: '56px'
            }}
            onClick={() => {
              sound.initAudio()
              sound.playTap()
              onOpenClassicMode()
            }}
            aria-label="Switch to Classic Mode List"
          >
            📜 Switch to Classic List Mode
          </button>
        </footer>
      </main>
    </div>
  )
}
