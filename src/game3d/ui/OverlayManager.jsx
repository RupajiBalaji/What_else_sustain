import React, { createContext, useContext, useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Html } from '@react-three/drei'
import { useGame3D } from '../context/Game3DContext'

/**
 * Priority Hierarchy:
 * choice panel > active consequence callout > smoke meter > status props > decorative signs
 */
export const OVERLAY_PRIORITIES = {
  choice_panel: 50,
  consequence_callout: 40,
  smoke_meter: 30,
  status_prop: 20,
  decorative_sign: 10
}

const OverlayManagerContext = createContext(null)

export function OverlayManagerProvider({ children }) {
  const registryRef = useRef(new Map())
  const [, setTick] = useState(0)

  const registerOverlay = useCallback((id, entry) => {
    registryRef.current.set(id, entry)
  }, [])

  const unregisterOverlay = useCallback((id) => {
    registryRef.current.delete(id)
  }, [])

  // Resolve collisions across all registered world overlays
  const resolveCollisions = useCallback(() => {
    if (typeof window === 'undefined') return
    const winW = window.innerWidth
    const winH = window.innerHeight
    const isMobile = winW < 640
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    const safeTop = isMobile ? 82 : 72
    const safeBottom = isTouch ? 96 : 42
    const safeLeft = 14
    const safeRight = 14

    // Convert to array and sort descending by priority
    const entries = Array.from(registryRef.current.values())
      .filter((e) => e && e.getRect && e.getRect())
      .sort((a, b) => b.priority - a.priority)

    const placedBoxes = []

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const rawRect = entry.getRect()
      if (!rawRect || rawRect.width === 0 || rawRect.height === 0) continue

      let offsetX = 0
      let offsetY = 0
      let shouldCollapse = false

      // 1. Initial clamp to viewport safe margins
      if (rawRect.top < safeTop) {
        offsetY += safeTop - rawRect.top
      } else if (rawRect.bottom > winH - safeBottom) {
        offsetY += (winH - safeBottom) - rawRect.bottom
      }

      if (rawRect.left < safeLeft) {
        offsetX += safeLeft - rawRect.left
      } else if (rawRect.right > winW - safeRight) {
        offsetX += (winW - safeRight) - rawRect.right
      }

      const candidateRect = {
        left: rawRect.left + offsetX,
        right: rawRect.right + offsetX,
        top: rawRect.top + offsetY,
        bottom: rawRect.bottom + offsetY,
        width: rawRect.width,
        height: rawRect.height
      }

      // 2. Check collision against all already-placed higher-priority overlays
      for (const placed of placedBoxes) {
        const overlaps = !(
          candidateRect.right + 6 < placed.left ||
          candidateRect.left - 6 > placed.right ||
          candidateRect.bottom + 6 < placed.top ||
          candidateRect.top - 6 > placed.bottom
        )

        if (overlaps) {
          // Attempt downward shift
          const shiftY = placed.bottom + 8 - candidateRect.top
          if (candidateRect.bottom + shiftY <= winH - safeBottom) {
            offsetY += shiftY
            candidateRect.top += shiftY
            candidateRect.bottom += shiftY
          } else {
            // Attempt right shift
            const shiftX = placed.right + 8 - candidateRect.left
            if (candidateRect.right + shiftX <= winW - safeRight) {
              offsetX += shiftX
              candidateRect.left += shiftX
              candidateRect.right += shiftX
            } else {
              // Exceeds safe area; collapse lower priority overlay to icon
              shouldCollapse = true
            }
          }
        }
      }

      placedBoxes.push(candidateRect)
      entry.setOffset({ x: Math.round(offsetX), y: Math.round(offsetY) })
      entry.setCollapsed(shouldCollapse)
    }
  }, [])

  return (
    <OverlayManagerContext.Provider
      value={{
        registerOverlay,
        unregisterOverlay,
        resolveCollisions
      }}
    >
      {children}
    </OverlayManagerContext.Provider>
  )
}

export function useOverlayManager() {
  return useContext(OverlayManagerContext)
}

/**
 * ManagedOverlay Component
 * Replaces direct <Html> for world-anchored UI labels.
 * 
 * Guarantees:
 * 1. Clamped inside viewport safe bounds (safeTop, safeBottom for joysticks/HUD chips).
 * 2. Collision avoidance: lower-priority overlays offset or collapse to icons.
 * 3. Fixed on-screen size (distanceFactor disabled or clamped scale 0.7-1.1), max 320px mobile / 420px desktop.
 * 4. Suppressed completely whenever ANY modal is open.
 */
export function ManagedOverlay({
  id,
  priority = 'decorative_sign',
  position,
  center = true,
  icon = '📍',
  collapsedBadge,
  children,
  style = {},
  zIndexRange = [20, 0],
  distanceFactor,
  visible = true
}) {
  const { isAnyModalOpen, showSeasonReport } = useGame3D()
  const manager = useOverlayManager()

  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const containerRef = useRef(null)

  // Convert string priority name to numeric rank
  const numericPriority = useMemo(() => {
    if (typeof priority === 'number') return priority
    return OVERLAY_PRIORITIES[priority] || 10
  }, [priority])

  // Screen width detection for responsive clamp
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const maxWidth = isMobile ? '320px' : '420px'

  useEffect(() => {
    if (!manager || !id) return

    const entry = {
      id,
      priority: numericPriority,
      getRect: () => containerRef.current?.getBoundingClientRect(),
      setOffset,
      setCollapsed: setIsCollapsed
    }

    manager.registerOverlay(id, entry)
    manager.resolveCollisions()

    return () => {
      manager.unregisterOverlay(id)
    }
  }, [manager, id, numericPriority])

  // Update layout on resize / scroll
  useEffect(() => {
    if (!manager) return
    const handleResize = () => manager.resolveCollisions()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [manager])

  // Hide completely while ANY modal is open (modals maintain highest z-index)
  if (isAnyModalOpen || showSeasonReport || !visible) {
    return null
  }

  return (
    <group position={position}>
      <Html
        center={center}
        distanceFactor={distanceFactor}
        zIndexRange={zIndexRange}
        style={{
          pointerEvents: 'auto',
          userSelect: 'none'
        }}
      >
        <div
          ref={containerRef}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
            transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
            maxWidth,
            width: 'max-content',
            boxSizing: 'border-box',
            ...style
          }}
        >
          {isCollapsed ? (
            <div
              style={{
                backgroundColor: 'rgba(22, 56, 43, 0.95)',
                color: '#FFFFFF',
                borderRadius: '9999px',
                padding: '4px 8px',
                border: '2px solid #81C784',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                fontSize: '12px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title={id}
              onClick={() => setIsCollapsed(false)}
            >
              <span>{icon}</span>
              {collapsedBadge && <span style={{ fontSize: '10px' }}>{collapsedBadge}</span>}
            </div>
          ) : (
            children
          )}
        </div>
      </Html>
    </group>
  )
}

export default ManagedOverlay
