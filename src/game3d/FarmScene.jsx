import React, { useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Game3DProvider, useGame3D } from './context/Game3DContext'
import WorldEnvironment from './components/WorldEnvironment'
import FarmField from './components/FarmField'
import GrassTufts from './components/GrassTufts'
import StubbleRows from './components/StubbleRows'
import StrawPiles from './components/StrawPiles'
import Farmhouse from './components/Farmhouse'
import Tractor from './components/Tractor'
import TreesInstanced from './components/TreesInstanced'
import VillageHousesInstanced from './components/VillageHousesInstanced'
import WindFlag from './components/WindFlag'
import FarmerPlayer from './components/FarmerPlayer'
import FpsMonitor from './components/FpsMonitor'
import HUDOverlay from './components/HUDOverlay'
import LoadingScreen from './components/LoadingScreen'
import FireSmokeSystem from './components/FireSmokeSystem'
import Villagers from './components/Villagers'
import BirdsFlying from './components/BirdsFlying'
import SeedlingsInstanced from './components/SeedlingsInstanced'
import HappySeederTractor from './components/HappySeederTractor'
import StrawBalerAndTruck from './components/StrawBalerAndTruck'
import MulchSoilEffect from './components/MulchSoilEffect'
import CompostSprayEffect from './components/CompostSprayEffect'
import StandingCropRows from './components/StandingCropRows'
import CombineHarvester from './components/CombineHarvester'
import SoilCutawayCrossSection from './components/SoilCutawayCrossSection'
import AirSensorPole from './components/AirSensorPole'
import ConsequenceCallouts from './components/ConsequenceCallouts'
import InWorldStatusProps from './components/InWorldStatusProps'
import CinematicCamera from './components/CinematicCamera'
import PerformanceGovernor from './perf/PerformanceGovernor'
import MemoryStatsOverlay, { MemoryStatsSampler } from './perf/MemoryStatsOverlay'
import { OverlayManagerProvider } from './ui/OverlayManager'

function SceneContent() {
  const { activeAlternative } = useGame3D()

  return (
    <OverlayManagerProvider>
      <PerformanceGovernor />
      <MemoryStatsSampler />
      <CinematicCamera />
      <WorldEnvironment />
      <BirdsFlying />
      <FarmField />
      <GrassTufts />
      <StandingCropRows />
      <CombineHarvester />
      <StubbleRows />
      <StrawPiles />
      <Farmhouse />
      {/* Hide parked tractor while Happy Seeder working tractor is active */}
      {activeAlternative !== 'happy_seeder' && <Tractor />}
      <HappySeederTractor />
      <SeedlingsInstanced />
      <StrawBalerAndTruck />
      <MulchSoilEffect />
      <CompostSprayEffect />
      <TreesInstanced />
      <VillageHousesInstanced />
      <Villagers />
      <AirSensorPole position={[-2.5, 0, 40.5]} />
      <SoilCutawayCrossSection position={[-4.0, 0, 8.2]} rotation={[0, 0.25, 0]} />
      <InWorldStatusProps />
      <ConsequenceCallouts />
      <WindFlag />
      <FarmerPlayer initialPosition={[-1.2, 0, 10.0]} />
      <FireSmokeSystem />
      <FpsMonitor />
    </OverlayManagerProvider>
  )
}

function FarmSceneInner({ onSwitchToLite }) {
  const { qualityConfig, startHarvestSequence, isFlyoverActive, skipFlyover, dprScale } = useGame3D()
  const [hasStarted, setHasStarted] = useState(false)

  // Dynamic pixel ratio based on quality tier cap * dynamic resolution scale
  const dpr = useMemo(() => {
    if (typeof window === 'undefined') return 1.0
    const nativeDpr = window.devicePixelRatio || 1
    const maxCap = qualityConfig.maxPixelRatio || 1.25
    return Math.min(nativeDpr, maxCap) * (dprScale || 1.0)
  }, [qualityConfig, dprScale])

  useEffect(() => {
    // Hide page scrollbars while in 3D world mode
    const origBodyOverflow = document.body.style.overflow
    const origHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = origBodyOverflow
      document.documentElement.style.overflow = origHtmlOverflow
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        zIndex: 5
      }}
    >
      {/* 3D Canvas with ACES Filmic Tone Mapping and Tuned Exposure */}
      <Canvas
        shadows={qualityConfig.shadows}
        dpr={dpr}
        camera={{ position: [5.0, 24.0, 58.0], fov: 50, near: 0.1, far: 220 }}
        gl={{
          antialias: qualityConfig.tier !== 'low',
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.94
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <SceneContent />
      </Canvas>

      {/* Flyover Skip Banner */}
      {hasStarted && isFlyoverActive && (
        <div
          data-testid="skip-flyover-button"
          onClick={skipFlyover}
          style={{
            position: 'absolute',
            top: 'calc(18px + env(safe-area-inset-top, 0px))',
            right: 'calc(18px + env(safe-area-inset-right, 0px))',
            backgroundColor: 'rgba(22, 56, 43, 0.88)',
            color: '#FFFFFF',
            border: '2px solid #81C784',
            borderRadius: '9999px',
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            zIndex: 65,
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            userSelect: 'none'
          }}
        >
          <span>⏭️</span>
          <span>Skip Intro (Space / Tap)</span>
        </div>
      )}

      {/* Clean Subtle Cinematic Vignette (Zero yellow wash) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, transparent 58%, rgba(15, 25, 20, 0.16) 100%)',
          zIndex: 10
        }}
      />

      {/* Subtle Organic Film Grain on High Tier (Zero post-processing bundle overhead) */}
      {qualityConfig.filmGrain && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            zIndex: 12
          }}
        />
      )}

      {/* Memory & Render Stats Overlay (toggled with G) */}
      <MemoryStatsOverlay />

      {/* 2D HUD UI Overlay */}
      {hasStarted && <HUDOverlay onSwitchToLite={onSwitchToLite} />}

      {/* Initial Loading Screen */}
      {!hasStarted && (
        <LoadingScreen
          onStart={() => {
            setHasStarted(true)
            startHarvestSequence()
          }}
          onSwitchToLite={onSwitchToLite}
        />
      )}
    </div>
  )
}

export default function FarmScene({ onSwitchToLite, onFallbackToLite }) {
  const [webglSupported, setWebglSupported] = useState(true)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) {
        setWebglSupported(false)
        if (onFallbackToLite) {
          onFallbackToLite('WebGL not supported on this browser/device.')
        }
      }
    } catch {
      setWebglSupported(false)
      if (onFallbackToLite) {
        onFallbackToLite('WebGL initialization error.')
      }
    }
  }, [onFallbackToLite])

  if (!webglSupported) {
    return null
  }

  return (
    <Game3DProvider onFallbackToLite={onFallbackToLite}>
      <FarmSceneInner onSwitchToLite={onSwitchToLite} />
    </Game3DProvider>
  )
}
