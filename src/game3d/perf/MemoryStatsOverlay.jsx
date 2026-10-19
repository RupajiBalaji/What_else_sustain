import React, { useState, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

// Shared stats ref to bridge R3F Canvas and 2D HTML overlay without state churn
export const renderStatsRef = {
  calls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  lines: 0,
  points: 0
}

/**
 * MemoryStatsSampler
 * R3F component mounted inside <Canvas> that samples gl.info metrics every 15 frames.
 */
export function MemoryStatsSampler() {
  const { gl } = useThree()
  const { showDevStats } = useGame3D()

  let frameCount = 0
  useFrame(() => {
    if (!showDevStats) return
    frameCount++
    if (frameCount % 15 === 0) {
      renderStatsRef.calls = gl.info.render.calls
      renderStatsRef.triangles = gl.info.render.triangles
      renderStatsRef.geometries = gl.info.memory.geometries
      renderStatsRef.textures = gl.info.memory.textures
      renderStatsRef.lines = gl.info.render.lines
      renderStatsRef.points = gl.info.render.points
    }
  })

  return null
}

/**
 * MemoryStatsOverlay
 * 2D DOM component mounted in HUDOverlay or FarmScene displaying real-time metrics.
 */
export default function MemoryStatsOverlay() {
  const { showDevStats, quality, dprScale } = useGame3D()
  const [stats, setStats] = useState({ ...renderStatsRef })

  useEffect(() => {
    if (!showDevStats) return
    console.log(`[3D Farm Metrics] Tier: ${quality?.toUpperCase()} | Draw Calls: ${renderStatsRef.calls} | Triangles: ${renderStatsRef.triangles} | Geometries: ${renderStatsRef.geometries} | Textures: ${renderStatsRef.textures}`)
    const interval = setInterval(() => {
      setStats({ ...renderStatsRef })
      console.log(`[3D Farm Metrics] Tier: ${quality?.toUpperCase()} | Draw Calls: ${renderStatsRef.calls} | Triangles: ${renderStatsRef.triangles} | Geometries: ${renderStatsRef.geometries} | Textures: ${renderStatsRef.textures}`)
    }, 1500)
    return () => clearInterval(interval)
  }, [showDevStats, quality])

  if (!showDevStats) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(70px + env(safe-area-inset-top, 0px))',
        left: 'calc(16px + env(safe-area-inset-left, 0px))',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        color: '#38BDF8',
        padding: '10px 14px',
        borderRadius: '12px',
        border: '1px solid #0284C7',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: '0.75rem',
        lineHeight: 1.5,
        zIndex: 90,
        pointerEvents: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        minWidth: '190px'
      }}
    >
      <div style={{ color: '#F1F5F9', fontWeight: 800, borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '6px' }}>
        ⚙️ GPU & Render Metrics <span style={{ color: '#94A3B8', fontSize: '0.68rem' }}>(G)</span>
      </div>
      <div>
        <span style={{ color: '#94A3B8' }}>Draw Calls:</span>{' '}
        <strong style={{ color: '#FACC15' }}>{stats.calls}</strong>
      </div>
      <div>
        <span style={{ color: '#94A3B8' }}>Triangles:</span>{' '}
        <strong style={{ color: '#4ADE80' }}>{stats.triangles.toLocaleString()}</strong>
      </div>
      <div>
        <span style={{ color: '#94A3B8' }}>Geometries:</span>{' '}
        <strong style={{ color: '#E2E8F0' }}>{stats.geometries}</strong>
      </div>
      <div>
        <span style={{ color: '#94A3B8' }}>Textures:</span>{' '}
        <strong style={{ color: '#E2E8F0' }}>{stats.textures}</strong>
      </div>
      <div style={{ marginTop: '4px', borderTop: '1px solid #334155', paddingTop: '4px', color: '#CBD5E1' }}>
        <span>Tier: </span>
        <strong style={{ color: '#38BDF8', textTransform: 'uppercase' }}>{quality}</strong>
        <span> | DPR: </span>
        <strong style={{ color: '#F472B6' }}>{Math.round(dprScale * 100)}%</strong>
      </div>
    </div>
  )
}
