import { test, expect } from '@playwright/test'

test.describe('Rewind State Restoration (Item 1)', () => {
  test('rewinding restores persistent state to decision snapshot and prevents money/XP snowball across all 5 options', async ({ page }) => {
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
    const startMoney = snapshot.money

    // 1. Play option A (Bale & Sell) -> triggers immediate/consequence flow
    const baleBtn = page.locator('[data-testid="choice-option-bale_sell"]')
    await baleBtn.click({ force: true })
    const confirmBtn = page.locator('[data-testid="confirm-choice-button"]')
    await confirmBtn.waitFor({ state: 'visible', timeout: 10000 })
    await confirmBtn.click({ force: true })

    // Wait for Season Report to appear for bale_sell (~14.5s) and verify Replay from Season Report
    const reportReplayBtn = page.locator('[data-testid="season-report-replay-button"], button:has-text("Replay")').first()
    const hudRewindBtn = page.locator('[data-testid="rewind-button"], button:has-text("What else?")').first()
    await reportReplayBtn.waitFor({ state: 'visible', timeout: 30000 })

    const afterSeasonReport = await readState()
    expect(afterSeasonReport.money).toBeGreaterThan(startMoney)

    // Trigger Replay from Season Report
    await reportReplayBtn.click({ force: true })

    // Wait for choice panel to return after 1.35s rewind
    await choicePanel.waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(200)

    const afterRewind = await readState()
    expect(afterRewind.money).toBe(snapshot.money)
    expect(afterRewind.soilHealth).toBe(snapshot.soilHealth)
    expect(afterRewind.villageHealth).toBe(snapshot.villageHealth)
    expect(afterRewind.reputation).toBe(snapshot.reputation)
    expect(afterRewind.farmerXP).toBe(snapshot.farmerXP)
    expect(afterRewind.streak).toBe(snapshot.streak)

    // 2. Play remaining options with rewinds and verify money never snowballs beyond start + 1 season max
    const options = ['happy_seeder', 'mulch', 'compost', 'burn']
    let maxObservedMoney = Math.max(afterSeasonReport.money, afterRewind.money)
    for (const optId of options) {
      await page.locator(`[data-testid="choice-option-${optId}"]`).click({ force: true })
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 })
      await confirmBtn.click({ force: true })

      await page.waitForTimeout(2500)
      const cur = await readState()
      maxObservedMoney = Math.max(maxObservedMoney, cur.money)

      // Rewind back to decision
      if (await reportReplayBtn.isVisible().catch(() => false)) {
        await reportReplayBtn.click({ force: true })
      } else {
        await hudRewindBtn.waitFor({ state: 'visible', timeout: 25000 })
        await hudRewindBtn.click({ force: true })
      }
      await choicePanel.waitFor({ state: 'visible', timeout: 15000 })
      const post = await readState()
      expect(post.money).toBe(startMoney)
      expect(post.soilHealth).toBe(snapshot.soilHealth)
      expect(post.villageHealth).toBe(snapshot.villageHealth)
      expect(post.farmerXP).toBe(snapshot.farmerXP)
    }

    // Balance must never exceed startMoney + one season's max result (39000)
    expect(maxObservedMoney).toBeLessThanOrEqual(startMoney + 39000)
    await page.screenshot({ path: 'tests/screenshots/rewind-state-verified.png' })
  })
})
