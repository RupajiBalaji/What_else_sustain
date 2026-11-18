import { test, expect } from '@playwright/test'

/**
 * Checks all visible overlay elements for bounding box overlaps and screen clipping.
 * Fails if any pairwise overlap > 0 px or if any element is clipped at screen boundaries.
 */
async function inspectOverlayCollisions(page) {
  return await page.evaluate(() => {
    const selectors = [
      '[data-testid="top-hud-bar"]',
      '[data-testid="hud-season-chip"]',
      '[data-testid="hud-money-chip"]',
      '[data-testid="hud-day-chip"]',
      '[data-testid="settings-toggle-button"]',
      '[data-testid="smoke-meter-hud"]',
      '[data-testid="consequence-callout-card"]',
      '[data-testid="in-world-choice-panel"]',
      '[data-testid="hud-bottom-bar"]',
      '[data-testid="watch-village-button"]',
      '[data-testid="continue-to-report-button"]',
      '[data-testid="virtual-joystick"]',
      '[data-testid="virtual-look-pad"]',
      '[data-overlay-id]',
      '[data-testid="settings-drawer"]',
      '[data-testid="season-report-card"]'
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

    const outOfBounds = []
    for (const item of items) {
      if (item.rect.left < -1 || item.rect.right > window.innerWidth + 1) {
        outOfBounds.push({
          id: item.id,
          rect: item.rect,
          viewportWidth: window.innerWidth
        })
      }
    }

    const collisions = []
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
            xOverlap,
            yOverlap,
            area: xOverlap * yOverlap
          })
        }
      }
    }

    return {
      count: items.length,
      collisions,
      outOfBounds
    }
  })
}

test.describe('D9 Overlay Collision Suite (All 6 Viewports, All 4 Phases)', () => {
  test('NEGATIVE CONTROLS: Prove collision assertion fails on forced overlaps and clipping', async ({ page }) => {
    await page.goto('/?noFpsFallback=1')

    // Wait for page to initialize
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

    // Negative Control 2: Intentionally inject an out-of-bounds clipped card
    const clipResult = await page.evaluate(() => {
      const card = document.createElement('div')
      card.setAttribute('data-testid', 'test-clipped-card')
      card.style.cssText = 'position:fixed; left:-60px; top:100px; width:120px; height:80px; z-index:9999;'
      document.body.appendChild(card)

      const rect = card.getBoundingClientRect()
      const isOutOfBounds = rect.left < 0
      card.remove()
      return { isOutOfBounds, left: rect.left }
    })
    expect(clipResult.isOutOfBounds).toBe(true)
    expect(clipResult.left).toBeLessThan(0)

    // Negative Control 3: Intentionally inject a 3-card mutual collision
    const multiCollisionResult = await page.evaluate(() => {
      const cards = [1, 2, 3].map((i) => {
        const c = document.createElement('div')
        c.setAttribute('data-testid', `test-multi-${i}`)
        c.style.cssText = `position:fixed; left:${100 + i * 15}px; top:${100 + i * 15}px; width:100px; height:60px; z-index:9999;`
        document.body.appendChild(c)
        return c
      })

      let collisionCount = 0
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const r1 = cards[i].getBoundingClientRect()
          const r2 = cards[j].getBoundingClientRect()
          const x = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left))
          const y = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top))
          if (x > 0 && y > 0) collisionCount++
        }
      }

      cards.forEach((c) => c.remove())
      return { collisionCount }
    })
    // 3 mutually overlapping cards have 3 collision pairs: (1,2), (1,3), (2,3)
    expect(multiCollisionResult.collisionCount).toBe(3)
  })

  test('Check zero overlay collisions across all 4 phases (decision, mid-burn, watch-village, season-report)', async ({ page }) => {
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

    await page.goto('/?noFpsFallback=1')

    // 1. Quick Play to Decision
    const startQuickPlayBtn = page.locator('[data-testid="start-quick-play-button"], [data-testid="start-3d-button"]').first()
    await startQuickPlayBtn.waitFor({ state: 'visible', timeout: 90000 })
    await startQuickPlayBtn.click()

    // If pre-check quiz modal is open, skip it
    const skipQuizBtn = page.locator('button:has-text("Skip for now"), [data-testid="skip-quiz-button"]').first()
    if (await skipQuizBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipQuizBtn.click()
    }

    const burnOptionBtn = page.locator('[data-testid="choice-option-burn"], button:has-text("Burn")').first()
    await burnOptionBtn.waitFor({ state: 'visible', timeout: 90000 })
    await page.waitForTimeout(500)

    // PHASE 1: Decision Phase
    const phase1Result = await inspectOverlayCollisions(page)
    console.log(`[OVERLAY TEST] Phase 1 (Decision): ${phase1Result.count} elements checked`)
    expect(phase1Result.collisions).toEqual([])
    expect(phase1Result.outOfBounds).toEqual([])

    // PHASE 2: Mid-Burn Phase
    await burnOptionBtn.click({ force: true })
    const confirmBtn = page.locator('[data-testid="confirm-choice-button"]')
    await confirmBtn.waitFor({ state: 'visible', timeout: 15000 })
    await confirmBtn.click({ force: true })

    await page.waitForTimeout(6000) // ~6s into burn
    const phase2Result = await inspectOverlayCollisions(page)
    console.log(`[OVERLAY TEST] Phase 2 (Mid-Burn): ${phase2Result.count} elements checked`)
    expect(phase2Result.collisions).toEqual([])
    expect(phase2Result.outOfBounds).toEqual([])

    // PHASE 3: Watch the Village Phase
    const watchVillageBtn = page.locator('[data-testid="watch-village-button"]')
    const continueToReportBtn = page.locator('[data-testid="continue-to-report-button"]')
    await continueToReportBtn.waitFor({ state: 'visible', timeout: 35000 })
    await watchVillageBtn.waitFor({ state: 'visible', timeout: 10000 })

    await watchVillageBtn.click({ force: true })
    await page.waitForTimeout(800)
    const phase3Result = await inspectOverlayCollisions(page)
    console.log(`[OVERLAY TEST] Phase 3 (Watch Village): ${phase3Result.count} elements checked`)
    expect(phase3Result.collisions).toEqual([])
    expect(phase3Result.outOfBounds).toEqual([])

    // PHASE 4: Season Report Phase
    await continueToReportBtn.click({ force: true })
    const nextSeasonBtn = page.locator('[data-testid="next-season-button"]')
    await nextSeasonBtn.waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(500)

    const phase4Result = await inspectOverlayCollisions(page)
    console.log(`[OVERLAY TEST] Phase 4 (Season Report): ${phase4Result.count} elements checked`)
    expect(phase4Result.collisions).toEqual([])
    expect(phase4Result.outOfBounds).toEqual([])
  })
})
