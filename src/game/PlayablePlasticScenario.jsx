import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'
import SproutMascot from './SproutMascot'
import { sound } from './soundManager'
import scenariosData from '../data/scenarios.json'
import './cartoonGame.css'

export default function PlayablePlasticScenario({ onExit, onTakePledge }) {
  const { language } = useLanguage()
  const {
    modifyNatureHealth,
    addPoints,
    unlockBadge,
    recordMistakeExplored,
    markScenarioCompleted
  } = useGame()

  // Scenario data
  const plasticScenario = scenariosData.find((s) => s.id === 'home_plastic_bottle') || scenariosData[1]

  // Game States: 'intro' | 'playing' | 'gameover' | 'impact'
  const [gameState, setGameState] = useState('intro')
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [activeItem, setActiveItem] = useState(null)
  const [burnedCount, setBurnedCount] = useState(0)
  const [burnWarning, setBurnWarning] = useState(null)
  const [confetti, setConfetti] = useState([])

  // Bottle types
  const bottleTypes = [
    { id: 'pet_soda', icon: '🍾', labelEn: 'PET Drink Bottle', labelTe: 'కూల్‌డ్రింక్ బాటిల్', bestBin: 'sell' },
    { id: 'water_jug', icon: '🧴', labelEn: 'Plastic Water Bottle', labelTe: 'నీళ్ల బాటిల్', bestBin: 'reuse' },
    { id: 'oil_can', icon: '🪣', labelEn: 'Clean Plastic Jar', labelTe: 'ఖాళీ ప్లాస్టిక్ డబ్బా', bestBin: 'reuse' },
    { id: 'crushed_bottle', icon: '🥤', labelEn: 'Crushed Plastic Cup', labelTe: 'నలిపిన ప్లాస్టిక్ కప్పు', bestBin: 'sell' }
  ]

  // Spawn falling bottle
  const spawnBottle = () => {
    const randomType = bottleTypes[Math.floor(Math.random() * bottleTypes.length)]
    const randomX = 15 + Math.random() * 70 // 15% to 85%
    return {
      ...randomType,
      key: Date.now() + Math.random(),
      x: randomX,
      y: 0
    }
  }

  // Timer loop
  useEffect(() => {
    let timer = null
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver()
            return 0
          }
          if (prev <= 6) {
            sound.playTap() // Urgent countdown tick
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [gameState, timeLeft])

  // Falling bottle loop
  useEffect(() => {
    let bottleTimer = null
    if (gameState === 'playing' && !activeItem) {
      setActiveItem(spawnBottle())
    }
    return () => clearInterval(bottleTimer)
  }, [gameState, activeItem])

  const handleStartGame = () => {
    sound.initAudio()
    sound.playTap()
    setScore(0)
    setCombo(0)
    setTimeLeft(30)
    setBurnedCount(0)
    setActiveItem(spawnBottle())
    setGameState('playing')
  }

  const handleSortItem = (binType) => {
    sound.initAudio()
    if (!activeItem || gameState !== 'playing') return

    if (binType === 'burn') {
      // Bad temptation clicked!
      sound.playError()
      setBurnedCount((prev) => prev + 1)
      setCombo(0)
      setScore((prev) => Math.max(0, prev - 15))
      modifyNatureHealth(-15)
      recordMistakeExplored('choice_burn_plastic')
      setBurnWarning(
        language === 'te'
          ? '⚠️ ప్లాస్టిక్ ఎప్పుడూ కాల్చవద్దు! క్యాన్సర్ కారక విషవాయువులు విడుదలవుతాయి!'
          : '⚠️ Never burn plastic! Toxic dioxins harm lungs and neighbors!'
      )
      setTimeout(() => setBurnWarning(null), 3500)
    } else if (binType === 'dustbin') {
      // Mixed trash (mediocre choice)
      sound.playPop()
      setScore((prev) => prev + 5)
      setCombo(0)
    } else {
      // Sustainable choice (sell for recycling or DIY reuse)
      sound.playPop()
      const newCombo = combo + 1
      setCombo(newCombo)
      const bonus = newCombo > 2 ? 30 : 20
      setScore((prev) => prev + bonus)
      if (newCombo % 3 === 0) {
        sound.playCoin()
      }
    }

    // Spawn next bottle
    setActiveItem(spawnBottle())
  }

  const handleGameOver = () => {
    sound.playWin()
    modifyNatureHealth(25)
    addPoints(score)
    unlockBadge('plastic_buster')
    markScenarioCompleted('home_plastic_bottle')

    // Generate confetti bursts
    const bursts = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ['#FFD54F', '#4FC3F7', '#81C784', '#FF8A80', '#BA68C8'][i % 5]
    }))
    setConfetti(bursts)
    setGameState('gameover')
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
            onExit()
          }}
          aria-label="Exit to Village Map"
        >
          ⬅️ {language === 'te' ? 'మ్యాప్‌కు వెళ్లు' : 'Village Map'}
        </button>

        {/* Center: Live Timer and Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="kid-hud-pill" style={{ backgroundColor: timeLeft <= 5 ? '#FFCDD2' : '#FFF' }}>
            <span>⏱️</span>
            <span style={{ color: timeLeft <= 5 ? '#D32F2F' : '#16382B', fontWeight: 900 }}>
              {timeLeft}s
            </span>
          </div>

          <div className="kid-hud-pill">
            <span>⭐</span>
            <span style={{ color: '#E65100', fontWeight: 900 }}>{score}</span>
          </div>
        </div>

        {/* Combo Multiplier Pill */}
        {combo > 1 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.15, 1] }}
            className="kid-hud-pill"
            style={{ backgroundColor: '#FFF59D', borderColor: '#F57F17' }}
          >
            <span>🔥</span>
            <span style={{ color: '#E65100', fontWeight: 900 }}>Combo x{combo}!</span>
          </motion.div>
        )}
      </header>

      {/* Main Arcade Area */}
      <main className="village-map-container" style={{ paddingBottom: '24px' }}>
        {/* Warning Toast for Burn Mistake */}
        <AnimatePresence>
          {burnWarning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                background: '#FFEBEE',
                border: '3px solid #D32F2F',
                borderRadius: '16px',
                padding: '10px 16px',
                color: '#B71C1C',
                fontWeight: 800,
                fontSize: '0.92rem',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(211,47,47,0.25)',
                margin: '8px 0',
                zIndex: 40
              }}
            >
              {burnWarning}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot Header */}
        <div style={{ zIndex: 10, display: 'flex', justifyContent: 'center', margin: '4px 0 10px 0' }}>
          <SproutMascot
            expression={
              burnWarning
                ? 'worried'
                : gameState === 'gameover'
                ? 'cheering'
                : combo > 2
                ? 'cheering'
                : 'happy'
            }
            speech={
              burnWarning
                ? 'Stop! Plastic smoke is dangerous! Put it in Recycle or Reuse!'
                : gameState === 'gameover'
                ? `Awesome! You scored ${score} points and kept our river clean! 🏆`
                : gameState === 'playing'
                ? 'Fast! Sort the falling bottle into the green bins!'
                : '30-second plastic speed sorter! Ready to save our waterways?'
            }
            size="md"
            bubblePosition="top"
          />
        </div>

        {/* STATE 1: INTRO */}
        {gameState === 'intro' && (
          <div
            style={{
              background: '#FFFFFF',
              border: '3.5px solid #0277BD',
              borderRadius: '24px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: 'var(--kid-shadow)',
              zIndex: 10
            }}
          >
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#01579B', margin: '0 0 10px 0' }}>
              🧴 30-Second Plastic Sorter
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#37474F', margin: '0 0 16px 0' }}>
              Bottles will drop from the top! Sort them into Recycle or Reuse bins. Watch out: NEVER touch the red Burn button!
            </p>

            <button
              type="button"
              className="kid-btn kid-btn-green"
              style={{ width: '100%', minHeight: '60px', fontSize: '1.2rem' }}
              onClick={handleStartGame}
            >
              ▶️ Start Game (30s)
            </button>
          </div>
        )}

        {/* STATE 2: PLAYING */}
        {gameState === 'playing' && (
          <div style={{ zIndex: 10 }}>
            {/* The Falling Bottle Playfield */}
            <div className="plastic-game-viewport">
              {activeItem && (
                <motion.div
                  key={activeItem.key}
                  drag
                  dragConstraints={{ top: 0, bottom: 260, left: -100, right: 100 }}
                  initial={{ y: 0, opacity: 0, scale: 0.8 }}
                  animate={{ y: 220, opacity: 1, scale: 1 }}
                  transition={{ duration: 3.2, ease: 'linear' }}
                  onAnimationComplete={() => {
                    // Fell to bottom without sorting -> auto dustbin
                    handleSortItem('dustbin')
                  }}
                  className="falling-item"
                  style={{ left: `${activeItem.x}%` }}
                >
                  <span style={{ fontSize: '3rem' }}>{activeItem.icon}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: 'rgba(255,255,255,0.9)',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                      border: '1.5px solid #0277BD'
                    }}
                  >
                    {language === 'te' ? activeItem.labelTe : activeItem.labelEn}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Tap-to-sort bins row (Min 56px touch target compliant) */}
            <div className="sorting-bins-row">
              {/* Bin 1: Sell / Recycle */}
              <button
                type="button"
                className="sorting-bin"
                style={{ backgroundColor: '#E8F5E9', borderColor: '#2E7D32' }}
                onClick={() => handleSortItem('sell')}
                aria-label="Sort into Scrap Dealer / Recycling"
              >
                <span style={{ fontSize: '2rem' }}>♻️</span>
                <strong style={{ fontSize: '0.88rem', color: '#1B5E20' }}>
                  {language === 'te' ? 'స్క్రాప్ / రీసైకిల్' : 'Sell Recycle'}
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#2E7D32' }}>+20 Pts</span>
              </button>

              {/* Bin 2: Reuse / Planter */}
              <button
                type="button"
                className="sorting-bin"
                style={{ backgroundColor: '#E1F5FE', borderColor: '#0288D1' }}
                onClick={() => handleSortItem('reuse')}
                aria-label="Sort into DIY Planter / Reuse"
              >
                <span style={{ fontSize: '2rem' }}>🌱</span>
                <strong style={{ fontSize: '0.88rem', color: '#01579B' }}>
                  {language === 'te' ? 'ఇంట్లో పునర్వినియోగం' : 'DIY Planter'}
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#0288D1' }}>+20 Pts</span>
              </button>

              {/* Bin 3: Mixed Dustbin */}
              <button
                type="button"
                className="sorting-bin"
                style={{ backgroundColor: '#ECEFF1', borderColor: '#546E7A' }}
                onClick={() => handleSortItem('dustbin')}
                aria-label="Sort into Mixed Dustbin"
              >
                <span style={{ fontSize: '2rem' }}>🗑️</span>
                <strong style={{ fontSize: '0.88rem', color: '#37474F' }}>
                  {language === 'te' ? 'చెత్తబుట్ట' : 'Dustbin'}
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#78909C' }}>+5 Pts</span>
              </button>
            </div>

            {/* Bad Temptation: Burn Button */}
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="kid-btn kid-btn-red"
                style={{ width: '100%', minHeight: '56px', fontSize: '0.95rem' }}
                onClick={() => handleSortItem('burn')}
                aria-label="Temptation: Burn plastic in backyard"
              >
                🔥 {language === 'te' ? 'పెరట్లో కాల్చేయ్ (ప్రమాదం!)' : 'Burn in Backyard (Temptation Warning!)'}
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: GAMEOVER & IMPACT REVEAL */}
        {gameState === 'gameover' && (
          <div style={{ zIndex: 10, marginTop: '8px' }}>
            {/* Confetti Animation */}
            <div style={{ position: 'relative', width: '100%', height: '40px', overflow: 'hidden' }}>
              {confetti.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: [0, 80], x: [0, (c.id % 2 === 0 ? 30 : -30)] }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    left: `${c.x}%`,
                    top: '0px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: c.color,
                    borderRadius: '50%'
                  }}
                />
              ))}
            </div>

            {/* Scorecard Box */}
            <div
              style={{
                background: '#FFFFFF',
                border: '3.5px solid #2E7D32',
                borderRadius: '24px',
                padding: '16px',
                boxShadow: 'var(--kid-shadow)',
                textAlign: 'center'
              }}
            >
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', color: '#1B5E20' }}>
                🎉 {language === 'te' ? 'ఆట ముగిసింది! అద్భుతం!' : 'Time Up! Plastic Buster!'}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-around', margin: '12px 0' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#555' }}>
                    {language === 'te' ? 'సాధించిన స్కోర్' : 'Total Score'}
                  </div>
                  <strong style={{ fontSize: '1.6rem', color: '#2E7D32' }}>⭐ {score}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#555' }}>
                    {language === 'te' ? 'లభించిన బ్యాడ్జ్' : 'Unlocked Badge'}
                  </div>
                  <strong style={{ fontSize: '1.2rem', color: '#0288D1' }}>🧴 Plastic Buster</strong>
                </div>
              </div>
            </div>

            {/* River Impact Visual Comparison */}
            <div
              style={{
                background: '#E0F7FA',
                border: '3px solid #00838F',
                borderRadius: '20px',
                padding: '14px',
                margin: '12px 0'
              }}
            >
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#006064', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🌊</span> Your Sorting Saved Our River:
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: '#2E7D32', fontWeight: 800 }}>
                  🐟 Living River & Swimming Fish
                </span>
                <span style={{ color: '#D32F2F', fontWeight: 800 }}>
                  ❌ 0 Plastic in Canals
                </span>
              </div>
            </div>

            {/* Did You Know Bubble */}
            <div className="did-you-know-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ color: '#E65100', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💡</span> Did You Know?
                </strong>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#D84315',
                    background: '#FBE9E7',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #FFAB91'
                  }}
                >
                  ℹ️ Qualitative Note
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#37474F' }}>
                Burning plastic releases toxic soot and fumes that harm lungs. Sorting PET bottles allows scrap dealers to recycle them into recycled polyester fiber and new bottles.
              </p>
              <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#78909C' }}>
                Source: Urban Waste Management Benchmarks
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="kid-btn"
                style={{ flex: 1, backgroundColor: '#FFF', minHeight: '56px' }}
                onClick={handleStartGame}
              >
                🔄 Play Again
              </button>

              <button
                type="button"
                className="kid-btn kid-btn-green"
                style={{ flex: 1, minHeight: '56px', fontSize: '1rem' }}
                onClick={() => {
                  sound.initAudio()
                  sound.playCoin()
                  onTakePledge()
                }}
              >
                🤝 Take Pledge
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
