import { test, expect } from '@playwright/test'

function inspectOverlaysInPage() {
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
    '[data-testid="director-local-hint"]',
    '[data-testid="money-floating-tag"]',
    '[data-overlay-id]',
    '[data-testid="cough-chip"]',
    '[data-testid="wave-chip"]'
  ]

  const items = []
  const seen = new Set()
  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach((el) => {
      if (seen.has(el)) return
      seen.add(el)
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return
      const rect = el.getBoundingClientRect()
      if (rect.width > 2 && rect.height > 2) {
        const id = el.getAttribute('data-overlay-id') || el.getAttribute('data-testid') || el.className
        items.push({
          id,
          el,
          isWorldCard: el.hasAttribute('data-overlay-id') || el.getAttribute('data-testid') === 'cough-chip',
          isCollapsed: el.classList.contains('collapsed') || el.getAttribute('data-collapsed') === 'true',
          rect: {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom)
          }
        })
      }
    })
  }

  const collisions = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      const xOverlap = Math.max(0, Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left))
      const yOverlap = Math.max(0, Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top))
      if (xOverlap > 0 && yOverlap > 0) {
        collisions.push({ a: a.id, b: b.id, xOverlap, yOverlap })
      }
    }
  }

  const activeWorldCards = items.filter((it) => {
    const isDockedCallout = it.id === 'consequence-callout-card'
    if ((!it.isWorldCard && !isDockedCallout) || it.isCollapsed) return false
    return !items.some((other) => other !== it && other.el.contains(it.el))
  })
  const waveCardCount = activeWorldCards.filter((w) => w.id.startsWith('villager_wave_')).length

  return {
    collisions,
    worldCardCount: activeWorldCards.length,
    waveCardCount
  }
}

test.describe('Full 5-Option Playthrough with Rewinds (Item 8)', () => {
  test('plays all 5 options with rewinds, verifying economy snapshot, overlays, framing, and consistent end-of-sequence', async ({ page }) => {
    test.setTimeout(180000)

    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' })
      })
    })

    await page.addInitScript(() => {
      try { localStorage.clear() } catch {}
      try { sessionStorage.clear() } catch {}
    })

    await page.goto('/?noFpsFallback=1')

    const startBtn = page.locator('[data-testid="start-quick-play-button"], [data-testid="start-3d-button"]').first()
    await startBtn.waitFor({ state: 'visible', timeout: 60000 })
    await startBtn.click()

    const skipQuizBtn = page.locator('button:has-text("Skip for now"), [data-testid="skip-quiz-button"]').first()
    try {
      await skipQuizBtn.waitFor({ state: 'visible', timeout: 4000 })
      await skipQuizBtn.click()
    } catch {}

    const choicePanel = page.locator('[data-testid="in-world-choice-panel"]')
    await choicePanel.waitFor({ state: 'visible', timeout: 30000 })

    const readState = () =>
      page.evaluate(() => {
        if (window.__wes_debug?.getPersistentState) {
          return window.__wes_debug.getPersistentState()
        }
        const raw = localStorage.getItem('wes_season_save')
        return raw ? JSON.parse(raw) : { money: 12000, soilHealth: 70, villageHealth: 75, reputation: 50, farmerXP: 0, streak: 0 }
      })

    const snapshot = await readState()
    const log = []
    const options = ['bale_sell', 'happy_seeder', 'mulch', 'compost', 'burn']
    const vp = page.viewportSize() || { width: 1366, height: 768 }

    for (let idx = 0; idx < options.length; idx++) {
      const opt = options[idx]
      await page.locator(`[data-testid="choice-option-${opt}"]`).click({ force: true })
      const confirmBtn = page.locator('[data-testid="confirm-choice-button"]')
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 })
      await confirmBtn.click({ force: true })

      // Wait 5s into sequence and check overlay rules + machine visibility
      await page.waitForTimeout(5000)

      const midCheck = await page.evaluate(inspectOverlaysInPage)
      expect(midCheck.worldCardCount, `${opt} @5s worldCardCount <= 2`).toBeLessThanOrEqual(2)
      expect(midCheck.waveCardCount, `${opt} @5s waveCardCount <= 1`).toBeLessThanOrEqual(1)
      expect(midCheck.collisions, `${opt} @5s overlay collisions`).toEqual([])

      if (opt !== 'burn') {
        const actionInfo = await page.evaluate((k) => window.__wes_debug?.getAltActionScreenPos?.(k), opt)
        expect(actionInfo?.inFrustum, `${opt} @5s machine/action must be in frustum`).toBe(true)
      }

      // Wait for consistent end-of-sequence controls (no auto-opened Season Report)
      const continueBtn = page.locator('[data-testid="continue-to-report-button"]')
      const reportReplayBtn = page.locator('[data-testid="season-report-replay-button"], button:has-text("Replay")').first()
      await continueBtn.waitFor({ state: 'visible', timeout: 45000 })
      await expect(reportReplayBtn).toBeHidden()

      const endCheck = await page.evaluate(inspectOverlaysInPage)
      expect(endCheck.worldCardCount, `${opt} end worldCardCount <= 2`).toBeLessThanOrEqual(2)
      expect(endCheck.waveCardCount, `${opt} end waveCardCount <= 1`).toBeLessThanOrEqual(1)
      expect(endCheck.collisions, `${opt} end overlay collisions`).toEqual([])

      const afterOpt = await readState()
      log.push({
        option: opt,
        money: afterOpt.money,
        soilHealth: afterOpt.soilHealth,
        villageHealth: afterOpt.villageHealth,
        worldCards: endCheck.worldCardCount,
        waveCards: endCheck.waveCardCount
      })

      if (idx < options.length - 1) {
        const rewindBtn = page.locator('[data-testid="what-else-rewind-button"]').first()
        await rewindBtn.waitFor({ state: 'visible', timeout: 10000 })
        await rewindBtn.click({ force: true })
        await choicePanel.waitFor({ state: 'visible', timeout: 15000 })
        await page.waitForTimeout(200)

        const restored = await readState()
        expect(restored.money, `rewind after ${opt} restores money`).toBe(snapshot.money)
        expect(restored.soilHealth, `rewind after ${opt} restores soilHealth`).toBe(snapshot.soilHealth)
        expect(restored.villageHealth, `rewind after ${opt} restores villageHealth`).toBe(snapshot.villageHealth)
        expect(restored.reputation, `rewind after ${opt} restores reputation`).toBe(snapshot.reputation)
        expect(restored.farmerXP, `rewind after ${opt} restores farmerXP`).toBe(snapshot.farmerXP)
        expect(restored.streak, `rewind after ${opt} restores streak`).toBe(snapshot.streak)
      }
    }

    await page.screenshot({ path: `tests/screenshots/${vp.width}x${vp.height}-playthrough-end.png` })
    console.log('PLAYTHROUGH_LOG:', JSON.stringify(log))
  })
})
