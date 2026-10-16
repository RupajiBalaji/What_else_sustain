import React, { useState, lazy, Suspense } from 'react'
import { LanguageProvider } from './context/LanguageContext'
import { GameProvider } from './context/GameContext'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/Header'
import NatureHealthBar from './components/NatureHealthBar'
import ScenarioList from './components/ScenarioList'
import Footer from './components/Footer'
import scenariosData from './data/scenarios.json'

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
        fontSize: '0.9rem',
        fontWeight: 700,
        gap: '8px'
      }}
    >
      <span className="pulse-dot">🌱</span>
      <span>Loading What Else Sustain...</span>
    </div>
  )
}

function MainContent() {
  // Views: 'list' | 'playing' | 'badges' | 'scorecard'
  const [view, setView] = useState('list')
  const [playingScenario, setPlayingScenario] = useState(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false)

  const handleStartScenario = (scenario) => {
    setIsDemoMode(false)
    setPlayingScenario(scenario)
    setView('playing')
  }

  const handleStartDemoMode = () => {
    // Demo mode auto-plays the farmer scenario (Scenario 1)
    const farmerScenario = scenariosData.find((s) => s.id === 'farm_crop_residue') || scenariosData[0]
    setIsDemoMode(true)
    setPlayingScenario(farmerScenario)
    setView('playing')
  }

  const handleExitToHome = () => {
    setIsDemoMode(false)
    setPlayingScenario(null)
    setView('list')
  }

  return (
    <div className="app-container">
      {/* Header with Navigation & Language Switcher */}
      <Header
        onOpenBadges={() => setView('badges')}
        onOpenScorecard={() => setView('scorecard')}
        onOpenAdvisor={() => setIsAdvisorOpen(true)}
      />

      {/* Persistent Nature Health Bar */}
      <NatureHealthBar />

      {/* Main Content View Switcher with Suspense */}
      <Suspense fallback={<LoadingFallback />}>
        {view === 'playing' && playingScenario && (
          <ScenarioPlayer
            scenario={playingScenario}
            onExit={handleExitToHome}
            onCompleteAll={() => setView('scorecard')}
            isDemoMode={isDemoMode}
          />
        )}

        {view === 'badges' && (
          <BadgeCollectionPage
            onBack={handleExitToHome}
            onOpenScorecard={() => setView('scorecard')}
          />
        )}

        {view === 'scorecard' && (
          <FinalScoreScreen
            onBackToScenarios={handleExitToHome}
            onOpenBadges={() => setView('badges')}
          />
        )}

        {view === 'list' && (
          <ScenarioList
            onSelectScenario={handleStartScenario}
            onStartDemoMode={handleStartDemoMode}
          />
        )}

        {/* AI Advisor Modal Drawer */}
        {isAdvisorOpen && (
          <AskAdvisorPanel onClose={() => setIsAdvisorOpen(false)} />
        )}
      </Suspense>

      <Footer />
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
