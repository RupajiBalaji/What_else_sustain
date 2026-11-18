import React, { useState, useEffect, useRef } from 'react'
import { useGame3D } from '../context/Game3DContext'

export default function DemoDirector3D({ enabled = false, onStopDemo }) {
  const {
    startHarvestSequence,
    jumpToDecisionPhase,
    startBurnSequence,
    watchVillage,
    triggerRewind,
    startAlternative,
    proceedToSeasonReport,
    setSeasonPhase
  } = useGame3D()

  const [active, setActive] = useState(enabled)
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef(null)
  const timersRef = useRef([])

  useEffect(() => {
    if (!enabled) {
      setActive(false)
      return
    }

    setActive(true)
    startTimeRef.current = Date.now()

    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed((Date.now() - startTimeRef.current) / 1000)
      }
    }, 500)

    // Schedule 90-second scripted flow
    // 0s: start in sowing
    setSeasonPhase('sowing')

    // 8s: harvest
    const t1 = setTimeout(() => {
      startHarvestSequence?.()
    }, 8000)

    // 16s: straw decision (burn)
    const t2 = setTimeout(() => {
      jumpToDecisionPhase?.()
      setTimeout(() => {
        startBurnSequence?.()
      }, 400)
    }, 16000)

    // 36s: consequence + watch village
    const t3 = setTimeout(() => {
      watchVillage?.()
    }, 36000)

    // 56s: rewind
    const t4 = setTimeout(() => {
      triggerRewind?.()
    }, 56000)

    // 68s: sustainable choice (Happy Seeder)
    const t5 = setTimeout(() => {
      startAlternative?.('happy_seeder')
    }, 68000)

    // 90s: season report
    const t6 = setTimeout(() => {
      proceedToSeasonReport?.()
      setActive(false)
      onStopDemo?.()
    }, 90000)

    timersRef.current = [t1, t2, t3, t4, t5, t6]

    return () => {
      clearInterval(interval)
      timersRef.current.forEach((t) => clearTimeout(t))
      timersRef.current = []
    }
  }, [
    enabled,
    startHarvestSequence,
    jumpToDecisionPhase,
    startBurnSequence,
    watchVillage,
    triggerRewind,
    startAlternative,
    proceedToSeasonReport,
    setSeasonPhase,
    onStopDemo
  ])

  const handleTakeControl = () => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
    setActive(false)
    onStopDemo?.()
  }

  if (!active) return null

  return (
    <div
      data-testid="demo-mode-pill"
      onClick={handleTakeControl}
      style={{
        position: 'fixed',
        top: 'calc(14px + env(safe-area-inset-top, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 120,
        backgroundColor: 'rgba(20, 26, 32, 0.94)',
        color: '#FFFFFF',
        border: '1.5px solid #81C784',
        borderRadius: '9999px',
        padding: '8px 20px',
        fontSize: '0.84rem',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        userSelect: 'none',
        pointerEvents: 'auto'
      }}
    >
      <span style={{ fontSize: '1rem' }}>🎬</span>
      <span>Demo mode (tap to take control)</span>
      <span
        style={{
          backgroundColor: 'rgba(129, 199, 132, 0.2)',
          color: '#A5D6A7',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '0.74rem',
          fontWeight: 900
        }}
      >
        {Math.min(90, Math.floor(elapsed))}s / 90s
      </span>
    </div>
  )
}
