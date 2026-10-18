import React, { useState, lazy, Suspense, useCallback } from 'react'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { GameProvider } from './context/GameContext'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/Header'
import NatureHealthBar from './components/NatureHealthBar'
import ScenarioList from './components/ScenarioList'
import Footer from './components/Footer'
import scenariosData from './data/scenarios.json'

// 3D Game World Mode
import FarmScene from './game3d/FarmScene'

// Lite Mode (2D Cartoon Map & Playable Scenarios)
import VillageMapHome from './game/VillageMapHome'
import PlayableFarmScenario from './game/PlayableFarmScenario'
import PlayablePlasticScenario from './game/PlayablePlasticScenario'
import KidPledgeScreen from './game/KidPledgeScreen'

// Lazy-load sub-screens for fast first load on slow 3G networks
const ScenarioPlayer = lazy(() => import('./components/ScenarioPlayer'))
const BadgeCollectionPage = lazy(() => import('./components/BadgeCollectionPage'))
const FinalScoreScreen = lazy(() => import('./components/FinalScoreScreen'))
const AskAdvisorPanel = lazy(() => import('./components/AskAdvisorPanel'))

function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: 'var(--color-deep-green)',
        fontSize: '0.95rem',
        fontWeight: 800,
        gap: '8px'
      }}
    >
      <span className="pulse-dot">🌱</span>
      <span>Loading What Else Sustain...</span>
    </div>
  )
}

function MainContent() {
  // Mode: '3d' (default when supported) | 'lite' (fallback & 2D experience)
  const [mode, setMode] = useState(() => {
    // Check if user previously explicitly requested Lite mode
    try {
      if (localStorage.getItem('wes_prefer_lite') === 'true') {
        return 'lite'
      }
    } catch {
      // Safe fallback
    }
    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return gl ? '3d' : 'lite'
    } catch {
      return 'lite'
    }
  })

  // Lite Mode Views:
  // - 'game_home': Animated Village Map Home (Lite Mode default)
  // - 'game_farm': Playable Farm Scenario
  // - 'game_plastic': Playable Plastic Scenario
  // - 'game_pledge': Kid Pledge Screen
  // - 'list': Classic Mode scenario list
  // - 'playing': Classic Scenario Player / Demo Mode
  // - 'badges': Badge Collection Page
  // - 'scorecard': Final Score Screen
  const [liteView, setLiteView] = useState('game_home')
  const [playingScenario, setPlayingScenario] = useState(null)
  const [pledgeScenarioId, setPledgeScenarioId] = useState('farm_crop_residue')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false)
  const [fallbackMessage, setFallbackMessage] = useState(null)

  const { language, t } = useLanguage()

  const handleStartScenario = (scenario) => {
    setIsDemoMode(false)
    setPlayingScenario(scenario)
    setLiteView('playing')
  }

  const handleStartDemoMode = () => {
    const farmerScenario = scenariosData.find((s) => s.id === 'farm_crop_residue') || scenariosData[0]
    setIsDemoMode(true)
    setPlayingScenario(farmerScenario)
    setLiteView('playing')
  }

  const handleExitToGameHome = () => {
    setIsDemoMode(false)
    setPlayingScenario(null)
    setLiteView('game_home')
  }

  const handleSwitchToLite = useCallback(() => {
    try {
      localStorage.setItem('wes_prefer_lite', 'true')
    } catch {
      // Safe fallback
    }
    setMode('lite')
  }, [])

  const handleSwitchTo3D = useCallback(() => {
    try {
      localStorage.removeItem('wes_prefer_lite')
    } catch {
      // Safe fallback
    }
    setFallbackMessage(null)
    setMode('3d')
  }, [])

  const handleFallbackToLite = useCallback((reason) => {
    console.warn('[App] 3D fallback to Lite mode:', reason)
    setFallbackMessage(
      reason || (language === 'te'
        ? 'ఈ పరికరంలో వేగం కోసం లైట్ మోడ్‌కు మార్చబడింది.'
        : 'Switched to Lite mode for optimal performance on your device.')
    )
    setMode('lite')
  }, [language])

  // 1. PRIMARY 3D GAME MODE (Scene: The Farm - Fullscreen fixed 100dvh)
  if (mode === '3d') {
    return (
      <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        <FarmScene
          onSwitchToLite={handleSwitchToLite}
          onFallbackToLite={handleFallbackToLite}
        />

        {/* AI Advisor Modal Drawer */}
        <Suspense fallback={null}>
          {isAdvisorOpen && (
            <AskAdvisorPanel onClose={() => setIsAdvisorOpen(false)} />
          )}
        </Suspense>
      </div>
    )
  }

  // 2. LITE MODE (2D Cartoon Map & Playable Scenarios)
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Fallback notification toast if switched automatically */}
      {fallbackMessage && (
        <div
          style={{
            backgroundColor: '#FFF8E1',
            borderBottom: '2px solid #FFC107',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem',
            color: '#8D6E63',
            fontWeight: 700,
            zIndex: 100,
            position: 'relative'
          }}
        >
          <span>📱 {fallbackMessage}</span>
          <button
            type="button"
            onClick={() => setFallbackMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              color: '#8D6E63'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2A. LITE VILLAGE MAP HOME */}
      {liteView === 'game_home' && (
        <div style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
          <VillageMapHome
            onSelectFarm={() => setLiteView('game_farm')}
            onSelectPlastic={() => setLiteView('game_plastic')}
            onOpenClassicMode={() => setLiteView('list')}
            onOpenBadges={() => setLiteView('badges')}
            onOpenScorecard={() => setLiteView('scorecard')}
            onOpenAdvisor={() => setIsAdvisorOpen(true)}
            onSwitchTo3D={handleSwitchTo3D}
          />

          <Suspense fallback={null}>
            {isAdvisorOpen && (
              <AskAdvisorPanel onClose={() => setIsAdvisorOpen(false)} />
            )}
          </Suspense>
        </div>
      )}

      {/* 2B. LITE PLAYABLE FARM SCENARIO */}
      {liteView === 'game_farm' && (
        <div style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
          <PlayableFarmScenario
            onExit={handleExitToGameHome}
            onTakePledge={() => {
              setPledgeScenarioId('farm_crop_residue')
              setLiteView('game_pledge')
            }}
          />

          <Suspense fallback={null}>
            {isAdvisorOpen && (
              <AskAdvisorPanel onClose={() => setIsAdvisorOpen(false)} />
            )}
          </Suspense>
        </div>
      )}

      {/* 2C. LITE PLAYABLE PLASTIC SCENARIO */}
      {liteView === 'game_plastic' && (
        <div style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
          <PlayablePlasticScenario
            onExit={handleExitToGameHome}
            onTakePledge={() => {
              setPledgeScenarioId('home_plastic_bottle')
              setLiteView('game_pledge')
            }}
          />

          <Suspense fallback={null}>
            {isAdvisorOpen && (
              <AskAdvisorPanel onClose={() => setIsAdvisorOpen(false)} />
            )}
          </Suspense>
        </div>
      )}

      {/* 2D. LITE PLEDGE SCREEN */}
      {liteView === 'game_pledge' && (
        <div style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
          <KidPledgeScreen
            scenarioId={pledgeScenarioId}
            onExitToMap={handleExitToGameHome}
            onOpenScorecard={() => setLiteView('scorecard')}
          />

          <Suspense fallback={null}>
            {isAdvisorOpen && (
              <AskAdvisorPanel onClose={() => setIsAdvisorOpen(false)} />
            )}
          </Suspense>
        </div>
      )}

      {/* 2E. CLASSIC LIST VIEW & SUB-PAGES */}
      {(liteView === 'list' || liteView === 'playing' || liteView === 'badges' || liteView === 'scorecard') && (
        <div className="app-container">
          {/* Header with Navigation & 3D Mode Toggle */}
          <Header
            onOpenStoryMode={handleSwitchTo3D}
            onOpenBadges={() => setLiteView('badges')}
            onOpenScorecard={() => setLiteView('scorecard')}
            onOpenAdvisor={() => setIsAdvisorOpen(true)}
          />

          {/* Persistent Nature Health Bar */}
          <NatureHealthBar />

          <Suspense fallback={<LoadingFallback />}>
            {liteView === 'playing' && playingScenario && (
              <ScenarioPlayer
                scenario={playingScenario}
                onExit={handleExitToGameHome}
                onCompleteAll={() => setLiteView('scorecard')}
                isDemoMode={isDemoMode}
              />
            )}

            {liteView === 'badges' && (
              <BadgeCollectionPage
                onBack={handleExitToGameHome}
                onOpenScorecard={() => setLiteView('scorecard')}
              />
            )}

            {liteView === 'scorecard' && (
              <FinalScoreScreen
                onBackToScenarios={handleExitToGameHome}
                onOpenBadges={() => setLiteView('badges')}
              />
            )}

            {liteView === 'list' && (
              <div>
                {/* Banner to switch back to 3D World or Village Map */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #1B5E20, #0277BD)',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 18px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-md)',
                    border: '2px solid #81C784',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#B3E5FC', fontWeight: 800 }}>
                      🌐 {language === 'te' ? '3D గేమ్ ప్రపంచం సిద్ధంగా ఉంది' : 'IMMERSIVE 3D WORLD READY'}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '2px 0 0 0' }}>
                      🌾 {language === 'te' ? '3D పొలం అన్వేషణ' : 'The Farm in 3D'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchTo3D}
                    className="start-action-btn"
                    style={{
                      padding: '10px 18px',
                      fontSize: '0.9rem',
                      minHeight: '48px',
                      whiteSpace: 'nowrap',
                      backgroundColor: '#FFD54F',
                      color: '#16382B',
                      fontWeight: 900
                    }}
                  >
                    <span>🚀 {language === 'te' ? '3D లో ఆడండి' : 'Launch 3D World'}</span>
                  </button>
                </div>

                <ScenarioList
                  onSelectScenario={handleStartScenario}
                  onStartDemoMode={handleStartDemoMode}
                />
              </div>
            )}

            {isAdvisorOpen && (
              <AskAdvisorPanel onClose={() => setIsAdvisorOpen(false)} />
            )}
          </Suspense>

          <Footer />
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <GameProvider>
          <MainContent />
        </GameProvider>
      </LanguageProvider>
    </ErrorBoundary>
  )
}
