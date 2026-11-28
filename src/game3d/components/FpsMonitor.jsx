import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'
import { renderStatsRef } from '../perf/MemoryStatsOverlay'

export default function FpsMonitor() {
  const { reportFps } = useGame3D()
  const frameCountRef = useRef(0)
  const lastSampleTimeRef = useRef(performance.now())
  const lastFrameTimeRef = useRef(performance.now())
  // Rolling 5-second window of { t, dt } for p95 and max frame time
  const windowSamplesRef = useRef([])

  useFrame(() => {
    const now = performance.now()
    const dt = now - lastFrameTimeRef.current
    lastFrameTimeRef.current = now

    if (dt > 0 && dt < 5000) {
      windowSamplesRef.current.push({ t: now, dt })
    }
    const cutoff = now - 5000
    while (windowSamplesRef.current.length > 0 && windowSamplesRef.current[0].t < cutoff) {
      windowSamplesRef.current.shift()
    }

    frameCountRef.current++
    const elapsed = now - lastSampleTimeRef.current

    // Update every 400ms for smooth readable metric
    if (elapsed >= 400) {
      const currentFps = Math.round((frameCountRef.current * 1000) / elapsed)
      const frameTime = parseFloat((elapsed / frameCountRef.current).toFixed(1))

      const dts = windowSamplesRef.current.map((s) => s.dt).sort((a, b) => a - b)
      const p95Idx = Math.min(dts.length - 1, Math.floor(dts.length * 0.95))
      const p95Ms = dts.length > 0 ? parseFloat(dts[p95Idx].toFixed(1)) : frameTime
      const maxMs = dts.length > 0 ? parseFloat(dts[dts.length - 1].toFixed(1)) : frameTime

      renderStatsRef.fps = currentFps
      renderStatsRef.p95Ms = p95Ms
      renderStatsRef.maxMs = maxMs

      reportFps(currentFps, frameTime)
      frameCountRef.current = 0
      lastSampleTimeRef.current = now
    }
  })

  return null
}
