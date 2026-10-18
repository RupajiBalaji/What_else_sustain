import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'
import SproutMascot from './SproutMascot'
import { sound } from './soundManager'
import scenariosData from '../data/scenarios.json'
import './cartoonGame.css'

export default function PlayableFarmScenario({ onExit, onTakePledge }) {
  const { language, t } = useLanguage()
  const {
    modifyNatureHealth,
    addPoints,
    unlockBadge,
    recordMistakeExplored,
    markScenarioCompleted
  } = useGame()

  // Scenario data
  const farmScenario = scenariosData.find((s) => s.id === 'farm_crop_residue') || scenariosData[0]
  const burnChoice = farmScenario.choices.find((c) => c.id === 'choice_burn_stubble')
  const mulchChoice = farmScenario.choices.find((c) => c.id === 'choice_mulch_soil')
  const compostChoice = farmScenario.choices.find((c) => c.id === 'choice_compost_decomposer')
  const biomassChoice = farmScenario.choices.find((c) => c.id === 'choice_sell_biomass')

  // Game States: 'ready' | 'burned' | 'sustainable' | 'comparison'
  const [gameState, setGameState] = useState('ready')
  const [activeChoice, setActiveChoice] = useState(null)
  const [isRewinding, setIsRewinding] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)

  // Targets definition
  const targets = [
    {
      id: 'fire',
      choice: burnChoice,
      icon: '🔥',
      titleEn: 'Fire Pit',
      titleTe: 'మంటల గుంత',
      descEn: 'Burn stubble in field',
      descTe: 'పొలంలోనే కాల్చివేయండి',
      className: 'target-fire'
    },
    {
      id: 'mulch',
      choice: mulchChoice,
      icon: '🚜',
      titleEn: 'Soil Mulcher',
      titleTe: 'మల్చింగ్ / హ్యాపీ సీడర్',
      descEn: 'Chop & return to soil',
      descTe: 'మట్టిలోనే కలియదున్నండి',
      className: 'target-mulch'
    },
    {
      id: 'compost',
      choice: compostChoice,
      icon: '🧪',
      titleEn: 'Compost Pit',
      titleTe: 'బయో-కంపోస్ట్',
      descEn: 'Spray bio-decomposer',
      descTe: 'సేంద్రీయ ఎరువుగా మార్చండి',
      className: 'target-compost'
    },
    {
      id: 'biomass',
      choice: biomassChoice,
      icon: '🚛',
      titleEn: 'Biomass Truck',
      titleTe: 'బయోమాస్ యూనిట్',
      descEn: 'Sell for green energy',
      descTe: 'నగదు ఆదాయానికి అమ్మండి',
      className: 'target-biomass'
    }
  ]

  // Handle picking or dropping on a target
  const handleSelectTarget = (target) => {
    sound.initAudio()
    setActiveChoice(target.choice)

    if (target.id === 'fire') {
      // Fire chosen (the mistake)
      sound.startFireCrackle()
      sound.playError()
      recordMistakeExplored('choice_burn_stubble')
      modifyNatureHealth(-25)
      addPoints(10)
      setGameState('burned')
    } else {
      // Sustainable choice chosen
      sound.stopFireCrackle()
      sound.playSuccessChime()
      modifyNatureHealth(25)
      addPoints(50)
      unlockBadge('soil_saver')
      unlockBadge('curious_mind')
      markScenarioCompleted('farm_crop_residue')
      setGameState('sustainable')
    }
  }

  // Handle What Else Rewind
  const handleWhatElseRewind = () => {
    sound.stopFireCrackle()
    sound.playRewindWhoosh()
    setIsRewinding(true)
    setTimeout(() => {
      setIsRewinding(false)
      setGameState('ready')
      setActiveChoice(null)
    }, 1100)
  }

  // Helper for Did-You-Know Fact adhering strictly to the verified rule:
  // If verified: true, show number + source.
  // If verified: false, show qualitative wording only (no raw numbers presented as verified facts).
  const renderFactContent = (statObj, fallbackQualitativeEn, fallbackQualitativeTe) => {
    if (!statObj) return null
    const isVerified = statObj.verified === true
    const sourceText = statObj.source || 'Agricultural Research'

    let displayText = ''
    if (isVerified) {
      const val = typeof statObj.value === 'object' ? statObj.value[language] || statObj.value.en : statObj.value
      displayText = `${val}`
    } else {
      // Qualitative statement only
      if (typeof statObj.value === 'object') {
        displayText = statObj.value[language] || statObj.value.en
      } else {
        displayText = language === 'te' ? fallbackQualitativeTe : fallbackQualitativeEn
      }
    }

    return (
      <div className="did-you-know-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <strong style={{ color: '#E65100', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>💡</span> {language === 'te' ? 'మీకు తెలుసా?' : 'Did You Know?'}
          </strong>
          {isVerified ? (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#2E7D32',
                background: '#E8F5E9',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #81C784'
              }}
            >
              ✓ {language === 'te' ? 'ధృవీకరించిన సమాచారం' : 'Verified Fact'}
            </span>
          ) : (
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
              ℹ️ {language === 'te' ? 'గుణాత్మక పరిశీలన' : 'Qualitative Note'}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.92rem', color: '#37474F' }}>{displayText}</p>
        <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#78909C' }}>
          {language === 'te' ? 'ఆధారం:' : 'Source:'} {sourceText}
        </div>
      </div>
    )
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
            sound.stopFireCrackle()
            sound.playTap()
            onExit()
          }}
          aria-label="Exit to Village Map"
        >
          ⬅️ Village Map
        </button>

        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#16382B' }}>
          🌾 The Farmer & Straw
        </h1>

        <div className="kid-hud-pill">
          <span>🌾</span>
          <span>{farmScenario.difficulty.toUpperCase()}</span>
        </div>
      </header>

      {/* Main Farm Play Arena */}
      <main className="village-map-container" style={{ paddingBottom: '24px' }}>
        {/* Animated Sky Backdrop */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '220px',
            background:
              gameState === 'burned'
                ? 'linear-gradient(180deg, #78909C 0%, #B0BEC5 60%, #ECEFF1 100%)'
                : 'linear-gradient(180deg, #4FC3F7 0%, #B3E5FC 70%, #C8E6C9 100%)',
            transition: 'background 1s ease',
            zIndex: 1
          }}
          aria-hidden="true"
        >
          {gameState === 'burned' ? (
            /* Smoke and dark smog */
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <motion.div
                animate={{ y: [-10, -60], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                style={{ position: 'absolute', bottom: '20px', left: '30%', fontSize: '3rem' }}
              >
                💨
              </motion.div>
              <motion.div
                animate={{ y: [-10, -70], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ position: 'absolute', bottom: '30px', left: '60%', fontSize: '2.5rem' }}
              >
                💨
              </motion.div>
              <div style={{ position: 'absolute', top: '16px', left: '20px', fontSize: '1.8rem' }}>
                🌫️ ☁️
              </div>
            </div>
          ) : (
            /* Bright sunny cheerful sky */
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <div style={{ position: 'absolute', top: '16px', right: '24px', fontSize: '2.4rem' }}>
                ☀️
              </div>
              <motion.div
                animate={{ x: [-30, 360] }}
                transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                style={{ position: 'absolute', top: '35px', left: '10px', fontSize: '1.6rem' }}
              >
                🐦 🕊️
              </motion.div>
            </div>
          )}
        </div>

        {/* Mascot Speech & Expression */}
        <div style={{ zIndex: 10, display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <SproutMascot
            expression={
              gameState === 'burned'
                ? 'worried'
                : gameState === 'sustainable'
                ? 'cheering'
                : 'thinking'
            }
            speech={
              gameState === 'burned'
                ? 'Oh no! Smoke is hurting our air and burning the soil! Tap "What Else?" below to fix it!'
                : gameState === 'sustainable'
                ? 'Awesome! Soil worms are happy, and the air stays crystal clean! You saved the farm! 🌟'
                : 'Harvest is done! Drag the straw pile to a target, or tap a choice to decide!'
            }
            size="md"
            bubblePosition="top"
          />
        </div>

        {/* REWIND ANIMATION OVERLAY */}
        <AnimatePresence>
          {isRewinding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(21, 101, 192, 0.85)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF'
              }}
            >
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
                style={{ fontSize: '4rem', marginBottom: '16px' }}
              >
                ⏪
              </motion.div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                {language === 'te' ? 'వెనుకకు తిప్పుతోంది...' : 'REWINDING...'}
              </h2>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {language === 'te' ? 'సమయాన్ని వెనక్కి తిప్పి మంచి ఎంపిక చేయండి!' : 'Turning back time to choose What Else!'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STATE 1: READY (Drag Straw or Tap Targets) */}
        {gameState === 'ready' && (
          <div style={{ zIndex: 10, marginTop: '16px' }}>
            {/* Draggable Straw Pile Centerpiece */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '14px 0' }}>
              <motion.div
                drag
                dragConstraints={{ top: -60, bottom: 60, left: -60, right: 60 }}
                dragElastic={0.2}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="straw-dragger"
                role="button"
                tabIndex={0}
                aria-label="Straw pile - drag to a target or tap a card below"
              >
                <span style={{ fontSize: '2.5rem' }}>🌾</span>
                <span style={{ fontSize: '0.85rem' }}>{language === 'te' ? 'గడ్డి కుప్ప' : 'Straw Pile'}</span>
              </motion.div>
              <span style={{ fontSize: '0.85rem', color: '#16382B', fontWeight: 700, marginTop: '8px' }}>
                👇 {language === 'te' ? 'ఈ 4 మార్గాలలో ఒకదాన్ని ఎంచుకోండి:' : 'Choose one of these 4 paths:'}
              </span>
            </div>

            {/* 4 Interactive Drop Targets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {targets.map((tgt) => (
                <motion.div
                  key={tgt.id}
                  className={`drop-target-card ${tgt.className}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSelectTarget(tgt)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleSelectTarget(tgt)
                  }}
                  aria-label={`${language === 'te' ? tgt.titleTe : tgt.titleEn} - ${language === 'te' ? tgt.descTe : tgt.descEn}`}
                >
                  <span style={{ fontSize: '2.2rem', marginBottom: '4px' }}>{tgt.icon}</span>
                  <strong style={{ fontSize: '1rem', color: '#16382B' }}>
                    {language === 'te' ? tgt.titleTe : tgt.titleEn}
                  </strong>
                  <span style={{ fontSize: '0.82rem', color: '#555', marginTop: '2px' }}>
                    {language === 'te' ? tgt.descTe : tgt.descEn}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      marginTop: '6px',
                      color: tgt.id === 'fire' ? '#D32F2F' : '#2E7D32'
                    }}
                  >
                    {tgt.id === 'fire'
                      ? language === 'te'
                        ? '⚠️ మంటలు'
                        : '⚠️ Fire Risk'
                      : language === 'te'
                      ? '🌱 సుస్థిరం'
                      : '🌱 Eco Friendly'}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* STATE 2: BURNED (Consequence Screen with Animated Meters & "What Else?" Button) */}
        {gameState === 'burned' && (
          <div style={{ zIndex: 10, marginTop: '12px' }}>
            {/* Visual Consequence Meters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {/* Air Meter */}
              <div className="kid-meter-box">
                <span style={{ fontSize: '1.6rem' }}>💨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 800 }}>
                    <span>{language === 'te' ? 'గాలి నాణ్యత (కాలుష్యం)' : 'Air Quality'}</span>
                    <span style={{ color: '#D32F2F' }}>20% (Hazardous)</span>
                  </div>
                  <div className="kid-meter-bar-track">
                    <div className="kid-meter-bar-fill" style={{ width: '20%', backgroundColor: '#D32F2F' }} />
                  </div>
                </div>
              </div>

              {/* Soil Health Meter */}
              <div className="kid-meter-box">
                <span style={{ fontSize: '1.6rem' }}>🪱</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 800 }}>
                    <span>{language === 'te' ? 'నేల ఆరోగ్యం & పోషకాలు' : 'Soil Fertility'}</span>
                    <span style={{ color: '#D32F2F' }}>15% (Loss)</span>
                  </div>
                  <div className="kid-meter-bar-track">
                    <div className="kid-meter-bar-fill" style={{ width: '15%', backgroundColor: '#F57C00' }} />
                  </div>
                </div>
              </div>

              {/* Money Meter */}
              <div className="kid-meter-box">
                <span style={{ fontSize: '1.6rem' }}>💸</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 800 }}>
                    <span>{language === 'te' ? 'రైతు నికర ఆదాయం' : 'Farmer Income'}</span>
                    <span style={{ color: '#D32F2F' }}>-₹3,500 Extra Loss</span>
                  </div>
                  <div className="kid-meter-bar-track">
                    <div className="kid-meter-bar-fill" style={{ width: '10%', backgroundColor: '#C62828' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Did You Know Bubble (using verified flag rule) */}
            {renderFactContent(
              burnChoice?.impact?.threeCards?.find((c) => c.id === 'air')?.stat,
              'Releases dense hazardous smoke that blankets nearby villages and harms respiratory health.',
              'గ్రామాలను కమ్మేసే దట్టమైన ప్రమాదకర పొగను వెలువరిస్తుంది, శ్వాసకోశ ఆరోగ్యానికి హానికరం.'
            )}

            {/* What Else Rewind Button */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <motion.button
                type="button"
                className="kid-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                style={{
                  backgroundColor: '#FFD54F',
                  borderColor: '#E65100',
                  color: '#16382B',
                  fontSize: '1.2rem',
                  padding: '16px 28px',
                  width: '100%',
                  minHeight: '64px'
                }}
                onClick={handleWhatElseRewind}
              >
                ⏪ 💡 {language === 'te' ? 'మరి ఏంచేయాలి? (సమయాన్ని వెనక్కి తిప్పండి!)' : 'What Else? (Rewind Time!)'}
              </motion.button>
            </div>
          </div>
        )}

        {/* STATE 3: SUSTAINABLE CHOICE WON */}
        {gameState === 'sustainable' && (
          <div style={{ zIndex: 10, marginTop: '12px' }}>
            {/* Visual Positive Meters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <div className="kid-meter-box">
                <span style={{ fontSize: '1.6rem' }}>💨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 800 }}>
                    <span>{language === 'te' ? 'గాలి నాణ్యత' : 'Air Quality'}</span>
                    <span style={{ color: '#2E7D32' }}>95% Clean</span>
                  </div>
                  <div className="kid-meter-bar-track">
                    <div className="kid-meter-bar-fill" style={{ width: '95%', backgroundColor: '#4CAF50' }} />
                  </div>
                </div>
              </div>

              <div className="kid-meter-box">
                <span style={{ fontSize: '1.6rem' }}>🪱</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 800 }}>
                    <span>{language === 'te' ? 'నేల తేమ & వానపాములు' : 'Soil Microbes & Carbon'}</span>
                    <span style={{ color: '#2E7D32' }}>+100% Rich Humus</span>
                  </div>
                  <div className="kid-meter-bar-track">
                    <div className="kid-meter-bar-fill" style={{ width: '90%', backgroundColor: '#66BB6A' }} />
                  </div>
                </div>
              </div>

              <div className="kid-meter-box">
                <span style={{ fontSize: '1.6rem' }}>💰</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 800 }}>
                    <span>{language === 'te' ? 'ఆదా అయిన డబ్బు' : 'Money Saved & Earned'}</span>
                    <span style={{ color: '#2E7D32' }}>+₹2,000 Profit</span>
                  </div>
                  <div className="kid-meter-bar-track">
                    <div className="kid-meter-bar-fill" style={{ width: '85%', backgroundColor: '#FFB300' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Did You Know Bubble for Sustainable Choice */}
            {renderFactContent(
              activeChoice?.impact?.metrics?.[0],
              'Retains ground moisture, suppresses weed growth, and gradually decomposes into dark rich humus.',
              'నేల తేమ ఆవిరి కాకుండా కాపాడుతుంది, కలుపు మొక్కలను అణచివేస్తుంది, సహజ ఎరువుగా మారుతుంది.'
            )}

            {/* Split Screen Reveal & Pledge Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '18px' }}>
              <button
                type="button"
                className="kid-btn kid-btn-blue"
                style={{ width: '100%', minHeight: '56px' }}
                onClick={() => setGameState('comparison')}
              >
                ⚖️ {language === 'te' ? 'ముందు vs తర్వాత పోలిక చూడండి' : 'See Burned vs Sustainable Reveal'}
              </button>

              <button
                type="button"
                className="kid-btn kid-btn-green"
                style={{ width: '100%', minHeight: '56px', fontSize: '1.1rem' }}
                onClick={() => {
                  sound.initAudio()
                  sound.playCoin()
                  onTakePledge()
                }}
              >
                🤝 {language === 'te' ? 'ప్రతిజ్ఞ తీసుకోండి (+25 పాయింట్లు)' : 'Take the Pledge (+25 Points)'}
              </button>
            </div>
          </div>
        )}

        {/* STATE 4: SPLIT SCREEN COMPARISON */}
        {gameState === 'comparison' && (
          <div style={{ zIndex: 10, marginTop: '12px' }}>
            <h3 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '1.15rem', color: '#16382B' }}>
              ⚖️ {language === 'te' ? 'రెండు భవిష్యత్తుల పోలిక' : 'Burned vs Sustainable Future'}
            </h3>

            {/* Visual Slider Container */}
            <div
              style={{
                position: 'relative',
                height: '240px',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '4px solid #16382B',
                boxShadow: 'var(--kid-shadow)'
              }}
            >
              {/* Left Side: Burned Future */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#78909C',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  padding: '20px',
                  color: '#FFFFFF'
                }}
              >
                <span style={{ fontSize: '3rem' }}>🔥 🌫️</span>
                <strong style={{ fontSize: '1.2rem', color: '#FFCDD2' }}>
                  {language === 'te' ? 'కాల్చిన భవిష్యత్తు' : 'Burned Future'}
                </strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem' }}>
                  {language === 'te' ? 'నల్లటి పొగ, చనిపోయిన సూక్ష్మజీవులు' : 'Smog blankets town, soil killed'}
                </p>
              </div>

              {/* Right Side: Sustainable Future (Clipped by slider) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#81C784',
                  clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  padding: '20px',
                  color: '#FFFFFF',
                  textAlign: 'right'
                }}
              >
                <span style={{ fontSize: '3rem' }}>🌱 🌻</span>
                <strong style={{ fontSize: '1.2rem', color: '#FFF' }}>
                  {language === 'te' ? 'సుస్థిర భవిష్యత్తు' : 'Sustainable Future'}
                </strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem' }}>
                  {language === 'te' ? 'స్వచ్ఛమైన గాలి, మేలైన సేంద్రీయ ఎరువు' : 'Clean fresh air, organic moisture'}
                </p>
              </div>

              {/* Slider Divider Line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${sliderPosition}%`,
                  width: '6px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                  transform: 'translateX(-50%)'
                }}
              />
            </div>

            {/* Range Slider Controller */}
            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <label htmlFor="farm-reveal-slider" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#37474F' }}>
                ↔️ Drag slider left / right to compare:
              </label>
              <input
                id="farm-reveal-slider"
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                style={{ width: '100%', marginTop: '8px', height: '36px', cursor: 'pointer' }}
              />
            </div>

            {/* Back to Rewards */}
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="kid-btn"
                style={{ flex: 1, backgroundColor: '#FFF', minHeight: '56px' }}
                onClick={() => setGameState('sustainable')}
              >
                ⬅️ Back
              </button>
              <button
                type="button"
                className="kid-btn kid-btn-green"
                style={{ flex: 1, minHeight: '56px' }}
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
