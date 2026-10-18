/**
 * VillageGameWorld.jsx
 * The Cinematic, Story-Driven Village World for What Else Sustain.
 * 
 * Features:
 * - Full-screen responsive viewport (portrait and landscape) with 60fps targeted CSS & Canvas rendering.
 * - Dynamic Day / Golden Hour / Night cycle & Village Restoration Meter (river, trees, crops).
 * - Layered SVG parallax background (sky, hills, river, settlement, field).
 * - Side-scrolling farmer walk navigation (drag, tap left/right, directional buttons).
 * - Hold-to-light fire interaction with canvas fire and smoke particle generator.
 * - One season later flash-forward with 3 verified impact consequence cards.
 * - Retro VHS Rewind mechanism with sound effect sweeping time back to the decision point.
 * - Interactive in-world alternative machines & objects (Mulcher, Compost Pit, Biomass Truck, Happy Seeder).
 * - Split-screen future comparison slider.
 * - Seamless integration with points, badges, pledge, and audio mute toggle.
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useGame } from '../context/GameContext'
import { sound } from './soundManager'
import StoryIntroCinematic from './StoryIntroCinematic'
import SplitScreenComparison from './SplitScreenComparison'
import FireParticlesCanvas from './FireParticlesCanvas'
import {
  DistantHills,
  VillageRiver,
  VillageSettlement,
  StrawPile,
  MulcherObject,
  CompostPitObject,
  BiomassTruckObject,
  HappySeederObject,
  FarmerCharacter
} from './assets/VillageAssets'

export default function VillageGameWorld({
  scenario,
  onOpenClassicMode,
  onOpenScorecard,
  onOpenBadges,
  onOpenAdvisor
}) {
  const { lang, t, toggleLanguage, getLocalized } = useLanguage()
  const {
    points,
    natureHealth,
    modifyNatureHealth,
    addPoints,
    unlockBadge,
    markScenarioCompleted,
    currentLevelKey
  } = useGame()

  // Game Phases: 'intro_cinematic' | 'field_exploration' | 'burning' | 'flash_forward' | 'rewind' | 'choose_alternatives' | 'split_screen' | 'pledge'
  const [phase, setPhase] = useState('intro_cinematic')

  // Farmer position along side-scrolling field (0 to 100%)
  const [farmerPos, setFarmerPos] = useState(25) // starts on left near house
  const [farmerFacing, setFarmerFacing] = useState('right')
  const [isWalking, setIsWalking] = useState(false)

  // Hold-to-light fire state
  const [isHoldingLight, setIsHoldingLight] = useState(false)
  const [burnProgress, setBurnProgress] = useState(0) // 0 to 1
  const holdIntervalRef = useRef(null)

  // Rewind effect state
  const [isRewinding, setIsRewinding] = useState(false)

  // In-world alternative selection
  const [selectedAlternative, setSelectedAlternative] = useState(null)

  // Audio mute state
  const [isMuted, setIsMuted] = useState(false)

  // Day / Night / Golden hour cycle: 'golden' | 'day' | 'night'
  const [timeOfDay, setTimeOfDay] = useState('golden')

  // Find scenario choices
  const mistakeChoice = scenario?.choices?.find((c) => c.isMistake) || scenario?.choices?.[0]
  const alternativeChoices = scenario?.choices?.filter((c) => !c.isMistake) || []

  // Toggle Mute
  const handleToggleMute = () => {
    sound.initAudio()
    const nextMuted = sound.toggleMute()
    setIsMuted(nextMuted)
  }

  // Handle Walking Left/Right
  const walkTo = (targetPercent) => {
    sound.initAudio()
    sound.playTap()
    const target = Math.max(5, Math.min(92, targetPercent))
    setFarmerFacing(target >= farmerPos ? 'right' : 'left')
    setIsWalking(true)

    // Smooth step
    setFarmerPos(target)
    setTimeout(() => {
      setIsWalking(false)
    }, 700)
  }

  // Hold to Light Fire Logic
  const startHoldToLight = () => {
    sound.initAudio()
    if (phase !== 'field_exploration') return
    setIsHoldingLight(true)
    sound.startFireCrackle()

    holdIntervalRef.current = setInterval(() => {
      setBurnProgress((prev) => {
        const next = prev + 0.04
        if (next >= 1) {
          clearInterval(holdIntervalRef.current)
          setIsHoldingLight(false)
          sound.stopFireCrackle()
          triggerBurnedConsequence()
          return 1
        }
        return next
      })
    }, 80)
  }

  const cancelHoldToLight = () => {
    if (burnProgress < 1) {
      clearInterval(holdIntervalRef.current)
      setIsHoldingLight(false)
      sound.stopFireCrackle()
      setBurnProgress(0)
    }
  }

  // Trigger fire spreading and flash-forward
  const triggerBurnedConsequence = () => {
    setPhase('burning')
    sound.playSuccessChime()
    modifyNatureHealth(-25)
    addPoints(10) // +10 for learning from mistake

    setTimeout(() => {
      setPhase('flash_forward')
    }, 3200)
  }

  // VHS Rewind back to decision moment
  const triggerRewind = () => {
    sound.initAudio()
    sound.playRewindWhoosh()
    setIsRewinding(true)
    setPhase('rewind')

    setTimeout(() => {
      setIsRewinding(false)
      setBurnProgress(0)
      setPhase('choose_alternatives')
      walkTo(45)
    }, 1400)
  }

  // Select an in-world alternative
  const handleChooseAlternative = (alt) => {
    sound.initAudio()
    sound.playSuccessChime()
    setSelectedAlternative(alt)
    modifyNatureHealth(alt.natureHealthDelta || 25)
    addPoints(alt.pointsDelta || 50)
    unlockBadge('soil_saver')
    unlockBadge('curious_mind')
    markScenarioCompleted(scenario.id)
    setPhase('split_screen')
  }

  // Take the Pledge
  const [pledged, setPledged] = useState(false)
  const handleTakePledge = () => {
    sound.initAudio()
    sound.playSuccessChime()
    setPledged(true)
    addPoints(25)
    unlockBadge('pledge_keeper')
  }

  // Background sky styling based on Nature Health and Time of Day
  let skyBackground = 'linear-gradient(180deg, #E65C00 0%, #F9D423 70%, #FFE082 100%)' // Golden hour default
  if (phase === 'burning' || phase === 'flash_forward' || natureHealth < 40) {
    skyBackground = 'linear-gradient(180deg, #37332F 0%, #6E6862 55%, #A69E96 100%)' // Smoky ash grey
  } else if (timeOfDay === 'night') {
    skyBackground = 'linear-gradient(180deg, #09121A 0%, #172D3D 70%, #284457 100%)'
  } else if (timeOfDay === 'day') {
    skyBackground = 'linear-gradient(180deg, #4A90E2 0%, #87CEEB 70%, #E0F7FA 100%)'
  }

  return (
    <div className={`cinematic-game-container ${isRewinding ? 'vhs-rewind-active' : ''}`}>
      {/* 1. Top HUD Bar */}
      <header className="cinematic-hud-bar">
        <div className="hud-left-group">
          {/* Game Brand & Mode Badge */}
          <div className="hud-brand">
            <span className="brand-leaf">🌾</span>
            <div>
              <h1 className="hud-title">{t('app.title')}</h1>
              <span className="mode-badge">✨ {lang === 'te' ? 'సినిమాటిక్ కథ మోడ్' : 'Story Game Mode'}</span>
            </div>
          </div>

          {/* Restoration Health Meter */}
          <div className="hud-restoration-meter" title="Village Nature Health">
            <div className="meter-label-row">
              <span>🌿 {lang === 'te' ? 'గ్రామ పర్యావరణ ఆరోగ్యం' : 'Village Health'}</span>
              <strong>{natureHealth}%</strong>
            </div>
            <div className="meter-track">
              <motion.div
                className="meter-fill"
                style={{ width: `${natureHealth}%` }}
                animate={{ width: `${natureHealth}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        </div>

        {/* Controls & Nav */}
        <div className="hud-right-group">
          {/* Audio Mute Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            className="hud-icon-btn"
            aria-label="Toggle Sound"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            <span>{isMuted ? '🔇' : '🔊'}</span>
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="hud-icon-btn lang-btn"
            aria-label="Switch Language"
          >
            <span>🌐</span>
            <span>{lang === 'en' ? 'తెలుగు' : 'English'}</span>
          </button>

          {/* Time of Day Cycle Toggle */}
          <button
            type="button"
            onClick={() => {
              setTimeOfDay((prev) => (prev === 'golden' ? 'day' : prev === 'day' ? 'night' : 'golden'))
            }}
            className="hud-icon-btn"
            title="Cycle Lighting (Golden / Day / Night)"
          >
            <span>{timeOfDay === 'golden' ? '🌅' : timeOfDay === 'day' ? '☀️' : '🌙'}</span>
          </button>

          {/* Classic List Mode Toggle */}
          <button
            type="button"
            onClick={onOpenClassicMode}
            className="hud-switch-mode-btn"
            title="Switch back to Classic Mode"
          >
            <span>📋</span>
            <span>{lang === 'te' ? 'క్లాసిక్ మోడ్' : 'Classic Mode'}</span>
          </button>
        </div>
      </header>

      {/* 2. Layered SVG Parallax Viewport */}
      <div className="cinematic-viewport" style={{ background: skyBackground }}>
        {/* Layer 1: Sun / Moon & Animated Clouds */}
        <div className="parallax-layer layer-sky">
          {/* Sun / Moon disc */}
          <div
            className={`celestial-orb ${timeOfDay}`}
            style={{
              opacity: phase === 'burning' || phase === 'flash_forward' ? 0.25 : 1
            }}
          />

          {/* Flocks of birds (they disperse when fire is lit) */}
          {phase !== 'burning' && phase !== 'flash_forward' && (
            <div className="birds-flock">
              <span className="bird bird-1">‹</span>
              <span className="bird bird-2">‹</span>
              <span className="bird bird-3">‹</span>
            </div>
          )}

          {/* Drifting clouds */}
          <div className="clouds-container">
            <div className="cloud cloud-slow" />
            <div className="cloud cloud-fast" />
          </div>
        </div>

        {/* Layer 2: Deccan Distant Hills */}
        <div className="parallax-layer layer-hills">
          <DistantHills timeOfDay={timeOfDay} natureHealth={natureHealth} />
        </div>

        {/* Layer 3: Meandering River */}
        <div className="parallax-layer layer-river">
          <VillageRiver natureHealth={natureHealth} timeOfDay={timeOfDay} />
        </div>

        {/* Layer 4: Village Settlement & School Garden */}
        <div className="parallax-layer layer-settlement">
          <VillageSettlement natureHealth={natureHealth} />
        </div>

        {/* Layer 5: Interactive Ground & Field Layer */}
        <div className="parallax-layer layer-field">
          {/* Ground soil path */}
          <div
            className="field-soil-strip"
            style={{
              background: phase === 'burning' || phase === 'flash_forward'
                ? 'linear-gradient(180deg, #4A3E38 0%, #291F1A 100%)'
                : 'linear-gradient(180deg, #A47843 0%, #63431D 100%)'
            }}
          />

          {/* Interactive Objects on the Field */}

          {/* A. The Stubble Straw Pile (Position: ~65%) */}
          <div className="inworld-anchor straw-anchor" style={{ left: '65%' }}>
            <StrawPile isBurning={phase === 'burning' || burnProgress > 0.05} />
          </div>

          {/* B. Alternative In-World Objects (Appear after Rewind) */}
          {phase === 'choose_alternatives' && (
            <div className="alternatives-inworld-bar">
              <MulcherObject
                onSelect={() => handleChooseAlternative(alternativeChoices[0])}
                isSelected={selectedAlternative?.id === alternativeChoices[0]?.id}
              />
              <CompostPitObject
                onSelect={() => handleChooseAlternative(alternativeChoices[1])}
                isSelected={selectedAlternative?.id === alternativeChoices[1]?.id}
              />
              <BiomassTruckObject
                onSelect={() => handleChooseAlternative(alternativeChoices[2])}
                isSelected={selectedAlternative?.id === alternativeChoices[2]?.id}
              />
              <HappySeederObject
                onSelect={() => handleChooseAlternative(alternativeChoices[0])}
                isSelected={selectedAlternative?.id === alternativeChoices[0]?.id}
              />
            </div>
          )}

          {/* C. The Farmer Character */}
          <div
            className="inworld-farmer-wrapper"
            style={{
              left: `${farmerPos}%`,
              transition: isWalking ? 'left 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
            }}
          >
            <FarmerCharacter
              isWalking={isWalking}
              facing={farmerFacing}
              isLighting={isHoldingLight || phase === 'burning'}
            />
          </div>

          {/* D. Fire Particles & Smoke Canvas */}
          <FireParticlesCanvas
            isBurning={isHoldingLight || phase === 'burning'}
            burnProgress={burnProgress}
          />
        </div>

        {/* 3. Tap to Walk Touch Navigation Bar */}
        {(phase === 'field_exploration' || phase === 'choose_alternatives') && (
          <div className="walk-tap-nav-overlay">
            <button
              type="button"
              className="walk-arrow-btn left-arrow"
              onClick={() => walkTo(farmerPos - 18)}
              aria-label="Walk Left"
            >
              <span>◀</span>
            </button>
            <div
              className="field-tap-walkway"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const clickX = e.clientX - rect.left
                const percent = (clickX / rect.width) * 100
                walkTo(percent)
              }}
              title="Tap anywhere along the field to walk"
            >
              <span className="tap-walk-prompt">
                👣 {lang === 'te' ? 'నడవడానికి ఇరువైపులా తాకండి' : 'Tap field or arrows to walk'}
              </span>
            </div>
            <button
              type="button"
              className="walk-arrow-btn right-arrow"
              onClick={() => walkTo(farmerPos + 18)}
              aria-label="Walk Right"
            >
              <span>▶</span>
            </button>
          </div>
        )}

        {/* 4. Scene 0: Prologue Cinematic */}
        {phase === 'intro_cinematic' && (
          <StoryIntroCinematic
            lang={lang}
            onStart={() => {
              setPhase('field_exploration')
              walkTo(35)
            }}
            onSkip={() => {
              setPhase('field_exploration')
              walkTo(35)
            }}
          />
        )}

        {/* 5. Scene 1 Hold-to-Light Interactive Prompt (Near the straw pile) */}
        {phase === 'field_exploration' && farmerPos >= 45 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hold-to-light-modal"
          >
            <div className="hold-prompt-header">
              <span className="flame-icon">🔥</span>
              <div>
                <h4>{lang === 'te' ? 'పంట గడ్డిని కాల్చండి' : 'Light the Leftover Straw'}</h4>
                <p>
                  {lang === 'te'
                    ? 'మంట పెట్టడానికి వేలితో నొక్కి పట్టుకోండి (త్వరిత ఎంపిక)'
                    : 'Press and hold to strike a match and burn the field (Quick choice)'}
                </p>
              </div>
            </div>

            {/* Hold Button with Radial Progress Ring */}
            <button
              type="button"
              onMouseDown={startHoldToLight}
              onMouseUp={cancelHoldToLight}
              onMouseLeave={cancelHoldToLight}
              onTouchStart={startHoldToLight}
              onTouchEnd={cancelHoldToLight}
              onTouchCancel={cancelHoldToLight}
              className={`hold-action-button ${isHoldingLight ? 'holding' : ''}`}
            >
              <div
                className="hold-progress-fill"
                style={{ width: `${burnProgress * 100}%` }}
              />
              <span className="hold-btn-text">
                {isHoldingLight
                  ? `${Math.round(burnProgress * 100)}% ...`
                  : lang === 'te'
                  ? 'నొక్కి పట్టుకోండి 🔥'
                  : 'HOLD TO LIGHT 🔥'}
              </span>
            </button>
          </motion.div>
        )}

        {/* 6. Flash-Forward Screen: One Season Later (Grey sky, damaged village) */}
        {phase === 'flash_forward' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flashforward-overlay"
          >
            <div className="flashforward-banner">
              <span>⏳ {lang === 'te' ? 'ఒక కాలం తర్వాత...' : 'ONE SEASON LATER...'}</span>
            </div>

            <div className="consequences-cards-grid">
              {/* Soil card */}
              <div className="consequence-card">
                <span className="card-icon">🪱</span>
                <h5>{lang === 'te' ? 'నేల: సారం నాశనం' : 'Soil: Nutrient Loss'}</h5>
                <p>
                  {lang === 'te'
                    ? '70°C తీవ్ర వేడి నేలలోని వానపాములు, పోషకాలను నాశనం చేసింది.'
                    : 'High 70°C surface fire destroyed topsoil microbes and vaporized organic nitrogen.'}
                </p>
                <span className="card-stat-pill">
                  {mistakeChoice?.impact?.threeCards?.[0]?.stat?.value || '~100% Nitrogen Lost'}
                </span>
                <span className="verified-badge-label">
                  {mistakeChoice?.impact?.threeCards?.[0]?.stat?.verified ? '✓ Verified' : '⚠️ Unverified Benchmark'}
                </span>
              </div>

              {/* Air & Health card */}
              <div className="consequence-card">
                <span className="card-icon">💨</span>
                <h5>{lang === 'te' ? 'గాలి & ఆరోగ్యం: విష పొగ' : 'Air: Toxic Smog'}</h5>
                <p>
                  {lang === 'te'
                    ? 'దట్టమైన PM2.5 పొగ గ్రామంలోని వృద్ధులు, పిల్లలలో శ్వాసకోశ ఇబ్బందులను పెంచింది.'
                    : 'Dense particulate smoke spread into village homes, causing severe respiratory coughing.'}
                </p>
                <span className="card-stat-pill">
                  {getLocalized(mistakeChoice?.impact?.threeCards?.[1]?.stat?.value)}
                </span>
                <span className="verified-badge-label">
                  {mistakeChoice?.impact?.threeCards?.[1]?.stat?.verified ? '✓ Verified' : '⚠️ Unverified Benchmark'}
                </span>
              </div>

              {/* Money card */}
              <div className="consequence-card">
                <span className="card-icon">💸</span>
                <h5>{lang === 'te' ? 'డబ్బు: దాగి ఉన్న ఆర్థిక నష్టం' : 'Money: Hidden Costs'}</h5>
                <p>
                  {lang === 'te'
                    ? 'సారం తగ్గిన నేల కోసం అదనపు రసాయన ఎరువుల ఖర్చు మరియు కోల్పోయిన గడ్డి ఆదాయం.'
                    : 'Lost natural soil humus forced ₹3,000+ extra spending on urea/DAP chemical fertilizers.'}
                </p>
                <span className="card-stat-pill">
                  {mistakeChoice?.impact?.threeCards?.[2]?.stat?.value || '~₹3,000 to ₹4,500 / acre lost'}
                </span>
                <span className="verified-badge-label">
                  {mistakeChoice?.impact?.threeCards?.[2]?.stat?.verified ? '✓ Verified' : '⚠️ Unverified Benchmark'}
                </span>
              </div>
            </div>

            {/* The Rewind Action Button */}
            <motion.button
              type="button"
              onClick={triggerRewind}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="vhs-rewind-trigger-btn"
            >
              <span>⏪ {lang === 'te' ? 'మరి ఏంచేయాలి? (సమయాన్ని వెనక్కి తిప్పండి)' : 'What Else? (Rewind Time)'}</span>
            </motion.button>
          </motion.div>
        )}

        {/* 7. Rewind VHS Transition Screen */}
        {isRewinding && (
          <div className="vhs-rewind-visual-overlay">
            <div className="vhs-scanlines" />
            <div className="vhs-label">
              <span>⏪ REWINDING TO HARVEST MOMENT</span>
            </div>
          </div>
        )}

        {/* 8. Split-Screen Comparison Reveal */}
        {phase === 'split_screen' && (
          <SplitScreenComparison
            chosenAlternative={selectedAlternative}
            lang={lang}
            onProceedToPledge={() => setPhase('pledge')}
          />
        )}

        {/* 9. Final Pledge Screen & Village Celebration */}
        {phase === 'pledge' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="village-pledge-modal"
          >
            <div className="pledge-header-box">
              <span className="celebration-emoji">🤝</span>
              <h3>{lang === 'te' ? 'గ్రామ సుస్థిరత ప్రతిజ్ఞ' : 'Take the Village Sustainability Pledge'}</h3>
              <p>
                {lang === 'te'
                  ? 'మీ అభ్యాసాన్ని నిజ జీవిత బాధ్యతగా మార్చుకోండి:'
                  : 'Turn your learning into a personal real-world commitment for clean skies and rich soil:'}
              </p>
            </div>

            <div className="pledge-quote-card">
              <blockquote>
                "{lang === 'te' ? 'ఈ సీజన్‌లో నేను పంట వ్యర్థాలను కాల్చను' : 'I will not burn crop waste this season'}"
              </blockquote>
            </div>

            {!pledged ? (
              <motion.button
                type="button"
                onClick={handleTakePledge}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="start-action-btn pledge-confirm-btn"
              >
                <span>{lang === 'te' ? 'నేను ప్రతిజ్ఞ చేస్తున్నాను ✋ (+25 పాయింట్లు & బ్యాడ్జ్)' : 'I Pledge ✋ (+25 Pts & Pledge Keeper Badge)'}</span>
              </motion.button>
            ) : (
              <div className="pledged-celebration-box">
                <div className="success-pill">
                  <span>✓ {lang === 'te' ? 'ప్రతిజ్ఞ స్వీకరించబడింది! ప్రతిజ్ఞా రక్షకుడు బ్యాడ్జ్ సాధించారు' : 'Pledge Confirmed! Pledge Keeper Badge Unlocked 🌟'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', width: '100%' }}>
                  <button
                    type="button"
                    onClick={onOpenScorecard}
                    className="start-action-btn"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <span>📊 {lang === 'te' ? 'స్కోర్‌కార్డ్ చూడండి' : 'View Scorecard'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenBadges}
                    className="filter-tab"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <span>🏅 {lang === 'te' ? 'బ్యాడ్జీలు' : 'Badges'}</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* 4. Bottom Village Status Drawer */}
      <footer className="cinematic-footer-bar">
        <div className="footer-status-pill">
          <span>🎖️ {lang === 'te' ? 'స్థాయి' : 'Level'}: {t(`levels.${currentLevelKey}`)}</span>
        </div>
        <div className="footer-status-pill">
          <span>⭐ {lang === 'te' ? 'పాయింట్లు' : 'Points'}: <strong>{points}</strong></span>
        </div>
        <div className="footer-quick-links">
          <button type="button" onClick={onOpenAdvisor} className="footer-link-btn">
            <span>🤖 Ask AI</span>
          </button>
          <button type="button" onClick={onOpenScorecard} className="footer-link-btn">
            <span>📊 Scorecard</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
