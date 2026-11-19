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
  smoke_meter: 35,
  cough_chip: 30,
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

    const safeTop = isMobile ? 84 : 76
    const safeBottom = isTouch ? 160 : 46
    const safeLeft = 16
    const safeRight = isMobile ? 24 : 36

    // Convert to array and sort descending by priority
    const entries = Array.from(registryRef.current.values())
      .filter((e) => e && e.getRect && e.getRect())
      .sort((a, b) => b.priority - a.priority)

    const placedBoxes = []
    let visibleCount = 0

    // Seed placedBoxes with active docked 2D HUD cards so world overlays never collide with them
    const hudSelectors = [
      '[data-testid="consequence-callout-card"]',
      '[data-testid="smoke-meter-hud"]',
      '[data-testid="in-world-choice-panel"]',
      '[data-testid="watch-village-button"]',
      '[data-testid="continue-to-report-button"]'
    ]
    for (const sel of hudSelectors) {
      const el = document.querySelector(sel)
      if (el) {
        const style = window.getComputedStyle(el)
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          const r = el.getBoundingClientRect()
          if (r.width > 2 && r.height > 2) {
            placedBoxes.push({
              left: r.left,
              right: r.right,
              top: r.top,
              bottom: r.bottom,
              width: r.width,
              height: r.height
            })
          }
        }
      }
    }

    // Exclusion zones for farmer head and ignited pile
    const ignitedPilePos = window.__wes_debug?.getIgnitedPileScreenPos?.()
    const exclusionZones = []
    if (ignitedPilePos?.inFrustum) {
      exclusionZones.push({
        left: ignitedPilePos.x - 48,
        right: ignitedPilePos.x + 48,
        top: ignitedPilePos.y - 48,
        bottom: ignitedPilePos.y + 48
      })
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const rawRect = entry.getRect()
      if (!rawRect || rawRect.width === 0 || rawRect.height === 0) continue

      let offsetX = 0
      let offsetY = 0
      let shouldCollapse = false

      // At most 2 world labels visible at once; lower priority collapse to icon
      if (visibleCount >= 2) {
        shouldCollapse = true
      }

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

      // 2. Check collision against exclusion zones (ignited pile / farmer)
      for (const zone of exclusionZones) {
        const overlapsZone = !(
          candidateRect.right < zone.left ||
          candidateRect.left > zone.right ||
          candidateRect.bottom < zone.top ||
          candidateRect.top > zone.bottom
        )
        if (overlapsZone) {
          offsetY -= (candidateRect.bottom - zone.top + 8)
          candidateRect.top += offsetY
          candidateRect.bottom += offsetY
        }
      }

      // Helper: check if a candidate box overlaps or violates 8px margin with any already placed box
      const collidesWithAny = (box, ignoreBox = null) => {
        for (const p of placedBoxes) {
          if (p === ignoreBox) continue
          const separated =
            box.right + 8 <= p.left ||
            box.left >= p.right + 8 ||
            box.bottom + 8 <= p.top ||
            box.top >= p.bottom + 8
          if (!separated) return true
        }
        return false
      }

      if (collidesWithAny(candidateRect)) {
        let resolved = false
        const SHIFT_MARGIN = 14

        for (const placed of placedBoxes) {
          const overlaps = !(
            candidateRect.right + 8 <= placed.left ||
            candidateRect.left >= placed.right + 8 ||
            candidateRect.bottom + 8 <= placed.top ||
            candidateRect.top >= placed.bottom + 8
          )
          if (!overlaps) continue

          // Candidate shift 1: Left of placed
          const dxLeft = placed.left - SHIFT_MARGIN - candidateRect.right
          const testLeft = {
            ...candidateRect,
            left: candidateRect.left + dxLeft,
            right: candidateRect.right + dxLeft
          }
          if (testLeft.left >= safeLeft && !collidesWithAny(testLeft, placed)) {
            offsetX += dxLeft
            candidateRect.left = testLeft.left
            candidateRect.right = testLeft.right
            resolved = true
            break
          }

          // Candidate shift 2: Downward below placed
          const dyDown = placed.bottom + SHIFT_MARGIN - candidateRect.top
          const testDown = {
            ...candidateRect,
            top: candidateRect.top + dyDown,
            bottom: candidateRect.bottom + dyDown
          }
          if (testDown.bottom <= winH - safeBottom && !collidesWithAny(testDown, placed)) {
            offsetY += dyDown
            candidateRect.top = testDown.top
            candidateRect.bottom = testDown.bottom
            resolved = true
            break
          }

          // Candidate shift 3: Upward above placed
          const dyUp = placed.top - SHIFT_MARGIN - candidateRect.bottom
          const testUp = {
            ...candidateRect,
            top: candidateRect.top + dyUp,
            bottom: candidateRect.bottom + dyUp
          }
          if (testUp.top >= safeTop && !collidesWithAny(testUp, placed)) {
            offsetY += dyUp
            candidateRect.top = testUp.top
            candidateRect.bottom = testUp.bottom
            resolved = true
            break
          }

          // Candidate shift 4: Right of placed
          const dxRight = placed.right + SHIFT_MARGIN - candidateRect.left
          const testRight = {
            ...candidateRect,
            left: candidateRect.left + dxRight,
            right: candidateRect.right + dxRight
          }
          if (testRight.right <= winW - safeRight && !collidesWithAny(testRight, placed)) {
            offsetX += dxRight
            candidateRect.left = testRight.left
            candidateRect.right = testRight.right
            resolved = true
            break
          }
        }

        if (!resolved) {
          shouldCollapse = true
        }
      }

      if (!shouldCollapse) {
        visibleCount++
        placedBoxes.push(candidateRect)
      }
      entry.setOffset({ x: Math.round(offsetX), y: Math.round(offsetY) })
      entry.setCollapsed(shouldCollapse)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.__wes_debug) window.__wes_debug = {}
      window.__wes_debug.getVisibleOverlays = () => {
        return Array.from(registryRef.current.keys())
      }
      window.__wes_debug.resolveCollisions = resolveCollisions
    }
    const interval = setInterval(() => {
      resolveCollisions()
    }, 200)
    return () => clearInterval(interval)
  }, [resolveCollisions])

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
  const { isAnyModalOpen, showSeasonReport, showChoiceWheel, isChoicePanelOpen } = useGame3D()
  const manager = useOverlayManager()

  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const offsetRef = useRef({ x: 0, y: 0 })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const containerRef = useRef(null)

  const handleSetOffset = useCallback((newOffset) => {
    offsetRef.current = newOffset
    setOffset(newOffset)
  }, [])

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
      getRect: () => {
        const r = containerRef.current?.getBoundingClientRect()
        if (!r) return null
        return {
          left: r.left - offsetRef.current.x,
          right: r.right - offsetRef.current.x,
          top: r.top - offsetRef.current.y,
          bottom: r.bottom - offsetRef.current.y,
          width: r.width,
          height: r.height
        }
      },
      setOffset: handleSetOffset,
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

  // Hide straw decision labels and soil cutaway plaque while choice panel is open
  const isHiddenByChoicePanel = (showChoiceWheel || isChoicePanelOpen) && (
    id === 'straw_decision_label' ||
    id?.startsWith('straw_') ||
    id === 'soil_cutaway_plaque'
  )

  // Hide completely while ANY modal is open (modals maintain highest z-index)
  if (isAnyModalOpen || showSeasonReport || !visible || isHiddenByChoicePanel) {
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
          data-overlay-id={id}
          data-collapsed={isCollapsed ? 'true' : 'false'}
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
            id?.startsWith('villager_cough_') ? null : (
              <div
              data-testid={id === 'village_sign' ? 'village-sign-text' : undefined}
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
            )
          ) : (
            children
          )}
        </div>
      </Html>
    </group>
  )
}

export default ManagedOverlay
