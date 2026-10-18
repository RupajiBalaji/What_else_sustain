import React, { useState, useEffect } from 'react'
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

function SceneContent() {
  const { activeAlternative } = useGame3D()

  return (
    <>
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
      <WindFlag />
      <FarmerPlayer initialPosition={[-1.2, 0, 10.0]} />
      <FireSmokeSystem />
      <FpsMonitor />
    </>
  )
}

function FarmSceneInner({ onSwitchToLite }) {
  const { quality, startHarvestSequence } = useGame3D()
  const [hasStarted, setHasStarted] = useState(false)
  const [dpr, setDpr] = useState(1.0)

  useEffect(() => {
    // Cap devicePixelRatio at 1.5 for mid-range phone performance
    const pixelRatio = window.devicePixelRatio || 1
    setDpr(Math.min(pixelRatio, 1.5))

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
      {/* 3D Canvas */}
      <Canvas
        shadows={quality === 'high'}
        dpr={dpr}
        camera={{ position: [-1.78, 3.2, 4.23], fov: 50, near: 0.1, far: 200 }}
        gl={{
          antialias: quality === 'high',
          powerPreference: 'high-performance'
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <SceneContent />
      </Canvas>

      {/* Subtle Mobile-Friendly Golden Hour Color Grade & Vignette Overlay (Zero GPU Overhead) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, rgba(255, 236, 179, 0.04) 40%, rgba(62, 39, 35, 0.28) 100%)',
          mixBlendMode: 'multiply',
          zIndex: 10
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(230, 81, 0, 0.05) 0%, rgba(255, 179, 0, 0.03) 50%, rgba(0, 0, 0, 0.08) 100%)',
          mixBlendMode: 'soft-light',
          zIndex: 11
        }}
      />

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
    // Check WebGL availability safely
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
