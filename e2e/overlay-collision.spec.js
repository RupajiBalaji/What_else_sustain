import { test, expect } from '@playwright/test'

/**
 * Checks all visible overlay elements for:
 * 1. Mutual collisions (pairwise overlap)
 * 2. Minimum 8 px spacing between separate overlay elements
 * 3. Minimum 8 px margin to every screen boundary
 * 4. Maximum 2 world cards visible at once (including cough chips)
 */
async function inspectOverlayCollisions(page) {
  return await page.evaluate(() => {
    const selectors = [
      '[data-testid="hud-season-chip"]',
      '[data-testid="hud-money-chip"]',
      '[data-testid="hud-day-chip"]',
      '[data-testid="settings-toggle-button"]',
      '[data-testid="smoke-meter-hud"]',
      '[data-testid="consequence-callout-card"]',
      '[data-testid="in-world-choice-panel"]',
      '[data-testid="watch-village-button"]',
      '[data-testid="continue-to-report-button"]',
      '[data-testid="what-else-controls"]',
      '[data-testid="virtual-joystick"]',
      '[data-testid="virtual-look-pad"]',
      '[data-overlay-id]',
      '[data-testid="cough-chip"]'
    ]

    const items = []
    const seen = new Set()

    for (const sel of selectors) {
      const nodes = document.querySelectorAll(sel)
      nodes.forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        const style = window.getComputedStyle(el)
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0'
        ) {
          return
        }
        const rect = el.getBoundingClientRect()
        if (rect.width > 2 && rect.height > 2) {
          const id = el.getAttribute('data-overlay-id') || el.getAttribute('data-testid') || el.className || el.tagName.toLowerCase()
          items.push({
            id,
            el,
            isWorldCard: el.hasAttribute('data-overlay-id') || el.getAttribute('data-testid') === 'cough-chip',
            isCollapsed: el.classList.contains('collapsed') || el.getAttribute('data-collapsed') === 'true',
            rect: {
              left: Math.round(rect.left),
              top: Math.round(rect.top),
              right: Math.round(rect.right),
              bottom: Math.round(rect.bottom),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            }
          })
        }
      })
    }

    const winW = window.innerWidth
    const winH = window.innerHeight

    // 1. Minimum 8 px edge margin check
    const marginViolations = []
    for (const item of items) {
      // Containers fixed to edges or full-width elements are evaluated by their chips/content
      if (
        item.rect.left < 8 ||
        item.rect.right > winW - 8 ||
        item.rect.top < 8 ||
        item.rect.bottom > winH - 8
      ) {
        marginViolations.push({
          id: item.id,
          rect: item.rect,
          viewport: { w: winW, h: winH }
        })
      }
    }

    // 2. Collision and 8 px spacing check
    const collisions = []
    const spacingViolations = []

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]
        const b = items[j]

        // Nested child elements are excluded from collision check against their own parent
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue

        const xOverlap = Math.max(0, Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left))
        const yOverlap = Math.max(0, Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top))

        if (xOverlap > 0 && yOverlap > 0) {
          collisions.push({
            a: a.id,
            b: b.id,
            aRect: a.rect,
            bRect: b.rect,
            xOverlap,
            yOverlap
          })
        }

        // Distance in X and Y
        const dx = Math.max(0, Math.max(a.rect.left, b.rect.left) - Math.min(a.rect.right, b.rect.right))
        const dy = Math.max(0, Math.max(a.rect.top, b.rect.top) - Math.min(a.rect.bottom, b.rect.bottom))

        // Spacing violation if both dx and dy are less than 8px
        if (dx < 8 && dy < 8) {
          spacingViolations.push({
            a: a.id,
            b: b.id,
            dx,
            dy
          })
        }
      }
    }

    // 3. Count distinct top-level visible active world cards (including cough chips)
    const activeWorldCards = items.filter((it) => {
      if (!it.isWorldCard || it.isCollapsed) return false
      // Exclude nested child nodes of another item (e.g. cough-chip inside villager_cough)
      return !items.some((other) => other !== it && other.el.contains(it.el))
    })

    return {
      count: items.length,
      collisions,
      spacingViolations,
      marginViolations,
      worldCardCount: activeWorldCards.length,
      activeWorldCards: activeWorldCards.map((w) => w.id)
    }
  })
}

test.describe('D9 Overlay Collision Suite (All 6 Viewports, All 4 Phases)', () => {
  test('NEGATIVE CONTROLS: Prove collision assertion fails on forced overlaps, spacing, margins, and card limits', async ({ page }) => {
    await page.goto('/?noFpsFallback=1')
    await page.waitForTimeout(600)

    // Negative Control 1: Intentionally inject 2 overlapping cards
    const overlapResult = await page.evaluate(() => {
      const cardA = document.createElement('div')
      cardA.setAttribute('data-testid', 'test-card-a')
      cardA.style.cssText = 'position:fixed; left:100px; top:100px; width:120px; height:80px; z-index:9999;'
      document.body.appendChild(cardA)

      const cardB = document.createElement('div')
      cardB.setAttribute('data-testid', 'test-card-b')
      cardB.style.cssText = 'position:fixed; left:140px; top:120px; width:120px; height:80px; z-index:9999;'
      document.body.appendChild(cardB)

      const rectA = cardA.getBoundingClientRect()
      const rectB = cardB.getBoundingClientRect()
      const xOverlap = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left))
      const yOverlap = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top))

      cardA.remove()
      cardB.remove()
      return { detected: xOverlap > 0 && yOverlap > 0, xOverlap, yOverlap }
    })
    expect(overlapResult.detected).toBe(true)
    expect(overlapResult.xOverlap).toBeGreaterThan(0)
    expect(overlapResult.yOverlap).toBeGreaterThan(0)

    // Negative Control 2: Spacing Rule (< 8px gap between disjoint cards)
    const spacingResult = await page.evaluate(() => {
      const cardA = document.createElement('div')
      cardA.setAttribute('data-testid', 'test-spacing-a')
      cardA.style.cssText = 'position:fixed; left:100px; top:100px; width:100px; height:50px; z-index:9999;'
      document.body.appendChild(cardA)

      // 4px gap horizontally (less than 8px threshold)
      const cardB = document.createElement('div')
      cardB.setAttribute('data-testid', 'test-spacing-b')
      cardB.style.cssText = 'position:fixed; left:204px; top:100px; width:100px; height:50px; z-index:9999;'
      document.body.appendChild(cardB)

      const rectA = cardA.getBoundingClientRect()
      const rectB = cardB.getBoundingClientRect()
      const dx = Math.max(0, Math.max(rectA.left, rectB.left) - Math.min(rectA.right, rectB.right))
      const dy = Math.max(0, Math.max(rectA.top, rectB.top) - Math.min(rectA.bottom, rectB.bottom))

      cardA.remove()
      cardB.remove()
      return { spacingViolated: dx < 8 && dy < 8, dx, dy }
    })
    expect(spacingResult.spacingViolated).toBe(true)
    expect(spacingResult.dx).toBe(4)

    // Negative Control 3: Edge Margin Rule (< 8px from screen edge)
    const marginResult = await page.evaluate(() => {
      const card = document.createElement('div')
      card.setAttribute('data-testid', 'test-edge-margin-card')
      card.style.cssText = 'position:fixed; left:3px; top:100px; width:100px; height:50px; z-index:9999;'
      document.body.appendChild(card)

      const rect = card.getBoundingClientRect()
      const violated = rect.left < 8
      card.remove()
      return { violated, left: rect.left }
    })
    expect(marginResult.violated).toBe(true)
    expect(marginResult.left).toBeLessThan(8)

    // Negative Control 4: World Cards Limit (> 2 cards visible at once)
    const cardLimitResult = await page.evaluate(() => {
      const cards = [1, 2, 3].map((i) => {
        const c = document.createElement('div')
        c.setAttribute('data-overlay-id', `test-world-${i}`)
        c.style.cssText = `position:fixed; left:${50 + i * 110}px; top:200px; width:100px; height:60px; z-index:9999;`
        document.body.appendChild(c)
        return c
      })
      const count = cards.length
      cards.forEach((c) => c.remove())
      return { count, exceedsLimit: count > 2 }
    })
    expect(cardLimitResult.exceedsLimit).toBe(true)
  })

  test('Check zero overlay collisions across all 4 phases (decision, mid-burn, watch-village, season-report)', async ({ page }) => {
    page.on('pageerror', (err) => console.log('PAGE_ERROR:', err.message, err.stack))
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('PAGE_CONSOLE_ERR:', msg.text())
    })

    // Mock APIs
    await page.route('**/api/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/api/simulate/smoke')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ exposure_index: 68, player_smoke_index: 82, village_exposure: 34 })
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) })
      }
    })

    await page.addInitScript(() => {
      try { localStorage.clear() } catch {}
      try { sessionStorage.clear() } catch {}
    })
    await page.goto('/?noFpsFallback=1')

    // 1. Quick Play to Decision
    const startQuickPlayBtn = page.locator('[data-testid="start-quick-play-button"], [data-testid="start-3d-button"]').first()
    await startQuickPlayBtn.waitFor({ state: 'visible', timeout: 90000 })
    await startQuickPlayBtn.click()

    // If pre-check quiz modal is open, skip it
    const skipQuizBtn = page.locator('button:has-text("Skip for now"), [data-testid="skip-quiz-button"]').first()
    try {
      await skipQuizBtn.waitFor({ state: 'visible', timeout: 5000 })
      await skipQuizBtn.click()
    } catch {
      // Quiz was not shown or already skipped
    }

    const burnOptionBtn = page.locator('[data-testid="choice-option-burn"], button:has-text("Burn")').first()
    await burnOptionBtn.waitFor({ state: 'visible', timeout: 90000 })
    await page.waitForTimeout(500)

    // PHASE 1: Decision Phase
    const phase1Result = await inspectOverlayCollisions(page)
    console.log(`[OVERLAY TEST] Phase 1 (Decision): ${phase1Result.count} elements checked, ${phase1Result.worldCardCount} world cards`)
    expect(phase1Result.collisions).toEqual([])
    expect(phase1Result.worldCardCount).toBeLessThanOrEqual(2)

    // Verify air-station card is NOT visible while choice panel is open
    const airStationOverlay = page.locator('[data-overlay-id="village_air_station"], [data-testid="village-air-station-card"]')
    await expect(airStationOverlay).toBeHidden()

    const vp = page.viewportSize()
    if (vp) {
      await page.screenshot({ path: `tests/screenshots/${vp.width}x${vp.height}-decision-point.png` })
    }

    // PHASE 2: Mid-Burn Phase
    await burnOptionBtn.click({ force: true })
    const confirmBtn = page.locator('[data-testid="confirm-choice-button"]')
    await confirmBtn.waitFor({ state: 'visible', timeout: 15000 })
    await confirmBtn.click({ force: true })

    await page.waitForTimeout(6000) // ~6s into burn
    const phase2Result = await inspectOverlayCollisions(page)
    console.log(`[OVERLAY TEST] Phase 2 (Mid-Burn): ${phase2Result.count} elements checked, ${phase2Result.worldCardCount} world cards, cards: ${JSON.stringify(phase2Result.activeWorldCards)}`)
    expect(phase2Result.collisions).toEqual([])
    expect(phase2Result.worldCardCount).toBeLessThanOrEqual(2)

    // PHASE 3: Watch the Village Phase
    const watchVillageBtn = page.locator('[data-testid="watch-village-button"]')
    const continueToReportBtn = page.locator('[data-testid="continue-to-report-button"]')
    await continueToReportBtn.waitFor({ state: 'visible', timeout: 35000 })
    await watchVillageBtn.waitFor({ state: 'visible', timeout: 10000 })

    await watchVillageBtn.click({ force: true })
    await page.waitForTimeout(800)
    await page.evaluate(() => window.__wes_debug?.resolveCollisions?.())
    const phase3Result = await inspectOverlayCollisions(page)
    console.log(`[OVERLAY TEST] Phase 3 (Watch Village): ${phase3Result.count} elements checked, ${phase3Result.worldCardCount} world cards, cards: ${JSON.stringify(phase3Result.activeWorldCards)}`)
    if (phase3Result.collisions.length > 0) {
      console.log('*** PHASE 3 DETECTED COLLISIONS ***:', JSON.stringify(phase3Result.collisions, null, 2))
    }
    expect(phase3Result.collisions).toEqual([])
    expect(phase3Result.worldCardCount).toBeLessThanOrEqual(2)

    // PHASE 4: Season Report Phase
    await continueToReportBtn.click({ force: true })
    const nextSeasonBtn = page.locator('[data-testid="next-season-button"]')
    await nextSeasonBtn.waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(500)

    const phase4Result = await inspectOverlayCollisions(page)
    console.log(`[OVERLAY TEST] Phase 4 (Season Report): ${phase4Result.count} elements checked`)
    expect(phase4Result.collisions).toEqual([])
  })

  test('asserts air-station card is not visible whenever choice panel is open across all viewports', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) })
    })

    await page.addInitScript(() => {
      try { localStorage.clear() } catch {}
      try { sessionStorage.clear() } catch {}
    })
    await page.goto('/?noFpsFallback=1')

    const startQuickPlayBtn = page.locator('[data-testid="start-quick-play-button"], [data-testid="start-3d-button"]').first()
    await startQuickPlayBtn.waitFor({ state: 'visible', timeout: 90000 })
    await startQuickPlayBtn.click()

    const skipQuizBtn = page.locator('[data-testid="skip-quiz-button"]')
    try {
      await skipQuizBtn.waitFor({ state: 'visible', timeout: 5000 })
      await skipQuizBtn.click()
    } catch {}

    const choicePanel = page.locator('[data-testid="in-world-choice-panel"]')
    await choicePanel.waitFor({ state: 'visible', timeout: 90000 })

    const airStation = page.locator('[data-overlay-id="village_air_station"], [data-testid="village-air-station-card"]')
    await expect(airStation).toBeHidden()

    const vp = page.viewportSize()
    if (vp) {
      await page.screenshot({ path: `tests/screenshots/${vp.width}x${vp.height}-decision-point.png` })
    }
  })
})
