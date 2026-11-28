import React, { useState, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

// Shared stats ref to bridge R3F Canvas and 2D HTML overlay without state churn
export const renderStatsRef = {
  fps: 60,
  p95Ms: 16.6,
  maxMs: 16.6,
  calls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  lines: 0,
  points: 0,
  activeOverlays: 0,
  jsHeapMb: null
}

/**
 * MemoryStatsSampler
 * R3F component mounted inside <Canvas> that samples gl.info metrics every 5 frames.
 */
export function MemoryStatsSampler() {
  const { gl, scene } = useThree()
  const frameCountRef = React.useRef(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.__wes_debug) window.__wes_debug = {}
      window.__wes_debug.scene = scene
      window.__wes_debug.gl = gl
    }
  }, [scene, gl])

  useFrame(() => {
    frameCountRef.current++
    if (frameCountRef.current % 5 === 0 || (typeof window !== 'undefined' && !window.__WES_RENDER_STATS__)) {
      renderStatsRef.calls = gl.info.render.calls
      renderStatsRef.triangles = gl.info.render.triangles
      renderStatsRef.geometries = gl.info.memory.geometries
      renderStatsRef.textures = gl.info.memory.textures
      renderStatsRef.lines = gl.info.render.lines
      renderStatsRef.points = gl.info.render.points
      if (typeof document !== 'undefined') {
        renderStatsRef.activeOverlays = document.querySelectorAll('[data-overlay-id]').length
      }
      if (typeof performance !== 'undefined' && performance.memory) {
        renderStatsRef.jsHeapMb = Math.round(performance.memory.usedJSHeapSize / 1048576)
      }
      if (typeof window !== 'undefined') {
        window.__WES_RENDER_STATS__ = { ...renderStatsRef }
      }
    }
  })

  return null
}

/**
 * MemoryStatsOverlay
 * 2D DOM corner readout enabled via ?perf=1 or pressing G.
 */
export default function MemoryStatsOverlay() {
  const { showDevStats, quality, dprScale } = useGame3D()
  const [stats, setStats] = useState({ ...renderStatsRef })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!showDevStats) return
    setStats({ ...renderStatsRef })
    const interval = setInterval(() => {
      setStats({ ...renderStatsRef })
    }, 500)
    return () => clearInterval(interval)
  }, [showDevStats, quality])

  if (!showDevStats) return null

  const formatReportText = () => {
    const vp = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown'
    return [
      `What Else Sustain Perf Report (${vp}, tier=${quality}, dpr=${Math.round(dprScale * 100)}%)`,
      `FPS: ${stats.fps} | p95: ${stats.p95Ms}ms | max(5s): ${stats.maxMs}ms`,
      `Calls: ${stats.calls} | Tris: ${stats.triangles} | Geom: ${stats.geometries} | Tex: ${stats.textures}`,
      `Overlays: ${stats.activeOverlays} | JS Heap: ${stats.jsHeapMb !== null ? `${stats.jsHeapMb} MB` : 'N/A'}`
    ].join('\n')
  }

  const handleCopyReport = async () => {
    const text = formatReportText()
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      }
    } catch {
      // Clipboard fallback in restricted contexts
    }
    if (typeof window !== 'undefined') {
      window.__wes_lastPerfReport = text
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div
      data-testid="perf-readout-overlay"
      style={{
        position: 'absolute',
        top: 'calc(58px + env(safe-area-inset-top, 0px))',
        left: 'calc(12px + env(safe-area-inset-left, 0px))',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        color: '#38BDF8',
        padding: '8px 12px',
        borderRadius: '10px',
        border: '1px solid #0284C7',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: '0.68rem',
        lineHeight: 1.45,
        zIndex: 95,
        pointerEvents: 'auto',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        minWidth: '200px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '4px', gap: '8px' }}>
        <span style={{ color: '#F1F5F9', fontWeight: 800 }}>⚙️ Perf ({quality?.toUpperCase()})</span>
        <button
          type="button"
          data-testid="perf-copy-report-button"
          onClick={handleCopyReport}
          style={{
            backgroundColor: copied ? '#166534' : '#0284C7',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '0.64rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          {copied ? 'Copied!' : 'Copy Report'}
        </button>
      </div>
      <div>FPS: <strong style={{ color: '#4ADE80' }}>{stats.fps}</strong> | p95: <strong>{stats.p95Ms}ms</strong> | max5s: <strong style={{ color: '#FACC15' }}>{stats.maxMs}ms</strong></div>
      <div>Calls: <strong style={{ color: '#FACC15' }}>{stats.calls}</strong> | Tris: <strong style={{ color: '#4ADE80' }}>{stats.triangles.toLocaleString()}</strong></div>
      <div>Geom: <strong>{stats.geometries}</strong> | Tex: <strong>{stats.textures}</strong> | Overlays: <strong>{stats.activeOverlays}</strong></div>
      <div>JS Heap: <strong>{stats.jsHeapMb !== null ? `${stats.jsHeapMb} MB` : 'N/A'}</strong> | DPR: <strong>{Math.round(dprScale * 100)}%</strong></div>
    </div>
  )
}
