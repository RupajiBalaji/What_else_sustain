import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGame3D } from '../context/Game3DContext'

export default function FpsMonitor() {
  const { reportFps } = useGame3D()
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useFrame(() => {
    frameCountRef.current++
    const now = performance.now()
    const elapsed = now - lastTimeRef.current

    // Update every 400ms for smooth readable metric
    if (elapsed >= 400) {
      const currentFps = Math.round((frameCountRef.current * 1000) / elapsed)
      const frameTime = parseFloat((elapsed / frameCountRef.current).toFixed(1))
      reportFps(currentFps, frameTime)
      frameCountRef.current = 0
      lastTimeRef.current = now
    }
  })

  return null
}
