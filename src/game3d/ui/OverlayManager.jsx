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

    const choicePanelEl = document.querySelector('[data-testid="in-world-choice-panel"]')
    const isChoiceOpen = Boolean(choicePanelEl && window.getComputedStyle(choicePanelEl).display !== 'none' && window.getComputedStyle(choicePanelEl).visibility !== 'hidden')

    const hasLeftHud = Boolean(document.querySelector('[data-testid="consequence-callout-card"], [data-testid="smoke-meter-hud"]')) && !isMobile
    const calloutEl = document.querySelector('[data-testid="consequence-callout-card"]')
    const hasDockedCallout = Boolean(
      calloutEl &&
      window.getComputedStyle(calloutEl).display !== 'none' &&
      window.getComputedStyle(calloutEl).visibility !== 'hidden'
    )
    // Max 2 world cards visible at once, and docked consequence callout counts toward that 2-card budget
    const maxWorldCards = hasDockedCallout ? 1 : 2

    const safeTop = isMobile ? 84 : 76
    const safeBottom = isTouch ? (isChoiceOpen && isMobile ? 320 : 210) : 56
    const safeLeft = hasLeftHud ? 325 : 16
    const safeRight = (isChoiceOpen && !isMobile) ? 375 : (isMobile ? 24 : 36)

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
      '[data-testid="continue-to-report-button"]',
      '[data-testid="what-else-controls"]',
      '[data-testid="director-local-hint"]'
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

    // Exclusion zones for farmer center, mobile joystick/look pad, and ignited pile
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
    // Keep world cards out of center farmer region
    exclusionZones.push({
      left: winW * 0.42,
      right: winW * 0.58,
      top: winH * 0.38,
      bottom: winH * 0.65
    })
    // Keep world cards out of mobile joystick (bottom-left) and look pad (bottom-right)
    if (isMobile || isTouch) {
      exclusionZones.push(
        { left: 0, right: 176, top: winH - 184, bottom: winH },
        { left: winW - 176, right: winW, top: winH - 184, bottom: winH }
      )
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

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const rawRect = entry.getRect()
      if (!rawRect || rawRect.width === 0 || rawRect.height === 0) continue

      let offsetX = 0
      let offsetY = 0
      let shouldCollapse = false

      // At most 2 world labels visible at once (docked callout counts); queue/collapse lower priority
      if (visibleCount >= maxWorldCards) {
        shouldCollapse = true
      }

      // Unmount/collapse overlays that are off-screen so they don't update every frame
      if (
        rawRect.right < 0 ||
        rawRect.left > winW ||
        rawRect.bottom < 0 ||
        rawRect.top > winH
      ) {
        shouldCollapse = true
      }

      // Speech bubbles (cough/wave chips) must never displace awkwardly over docked HUD cards—collapse immediately
      if (
        (entry.id?.startsWith('villager_cough_') || entry.id?.startsWith('villager_wave_')) &&
        ((hasLeftHud && rawRect.left < safeLeft) || collidesWithAny(rawRect))
      ) {
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

      if (collidesWithAny(candidateRect)) {
        // Speech bubbles (cough/wave chips) must never displace awkwardly over docked HUD cards—collapse immediately
        if (entry.id?.startsWith('villager_cough_') || entry.id?.startsWith('villager_wave_')) {
          shouldCollapse = true
        } else {
          let resolved = false
          const SHIFT_MARGIN = 16

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
      }

      if (!shouldCollapse) {
        visibleCount++
        placedBoxes.push(candidateRect)
      }
      entry.setOffset({ x: Math.round(offsetX), y: Math.round(offsetY) })
      entry.setCollapsed(shouldCollapse, Math.round(offsetX), Math.round(offsetY))
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
    }, 40)
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
  const { isAnyModalOpen, showSeasonReport, showChoiceWheel, isChoicePanelOpen, isRewinding } = useGame3D()
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
      setCollapsed: (collapsed, ox = 0, oy = 0) => {
        if (containerRef.current) {
          containerRef.current.style.display = collapsed ? 'none' : ''
          if (!collapsed) {
            containerRef.current.style.transform = `translate3d(${ox}px, ${oy}px, 0)`
          }
        }
        setIsCollapsed(collapsed)
      }
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

  // Hide straw decision labels, soil cutaway plaque, village sign, and air station card while choice panel is open
  const isHiddenByChoicePanel = (showChoiceWheel || isChoicePanelOpen) && (
    id === 'straw_decision_label' ||
    id?.startsWith('straw_') ||
    id === 'soil_cutaway_plaque' ||
    id === 'village_air_station' ||
    id === 'village_sign' ||
    id === 'reputation_flag'
  )

  // Hide completely while ANY modal, season report, or rewind effect is active
  if (isRewinding || isAnyModalOpen || showSeasonReport || !visible) {
    return null
  }

  // When suppressed by choice panel: keep village_sign attached for director queries, unmount all others
  if (isHiddenByChoicePanel) {
    if (id === 'village_sign') {
      return (
        <group position={position}>
          <Html center={center} style={{ display: 'none', pointerEvents: 'none', visibility: 'hidden' }}>
            <div
              ref={containerRef}
              data-overlay-id={id}
              data-hidden-by-choice="true"
              style={{ display: 'none' }}
            >
              {children}
            </div>
          </Html>
        </group>
      )
    }
    return null
  }

  // Unmount <Html> completely when collapsed/off-screen for speech/floating tags so they do not update every frame
  if (
    isCollapsed &&
    (id?.startsWith('villager_cough_') ||
      id?.startsWith('villager_wave_') ||
      id === 'money_floating_tag' ||
      id === 'soil_cutaway_plaque' ||
      id === 'village_air_station' ||
      id === 'reputation_flag')
  ) {
    return <group position={position} />
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
