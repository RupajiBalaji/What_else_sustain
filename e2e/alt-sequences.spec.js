import { test, expect } from '@playwright/test'

test.describe('Alternative Sequence Framing, Machine Visibility & Farmer Pose (Item 5)', () => {
  test('frames machine/action (5-40% height) and farmer cleanly with camera >= 3.5m from colliders at 5s and 12s for all 4 alternatives', async ({ page }) => {
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

    const skipQuizBtn = page.locator('[data-testid="skip-quiz-button"]')
    try {
      await skipQuizBtn.waitFor({ state: 'visible', timeout: 4000 })
      await skipQuizBtn.click()
    } catch {}

    const choicePanel = page.locator('[data-testid="in-world-choice-panel"]')
    await choicePanel.waitFor({ state: 'visible', timeout: 30000 })

    const alts = ['happy_seeder', 'bale_sell', 'mulch', 'compost']
    const vp = page.viewportSize()

    for (const altKey of alts) {
      await page.locator(`[data-testid="choice-option-${altKey}"]`).click({ force: true })
      const confirmBtn = page.locator('[data-testid="confirm-choice-button"]')
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 })
      await confirmBtn.click({ force: true })

      for (const tSec of [5, 12]) {
        const waitMs = tSec === 5 ? 5000 : 7000
        await page.waitForTimeout(waitMs)

        const metrics = await page.evaluate((key) => {
          const actionInfo = window.__wes_debug?.getAltActionScreenPos?.(key)
          const farmerInfo = window.__wes_debug?.getFarmerScreenPos?.()
          const camPose = window.__wes_debug?.getCameraPose?.()
          const minColliderDist = window.__wes_debug?.getMinCameraColliderDist?.()
          const poseCheck = window.__wes_debug?.getFarmerPoseHealth?.()
          return { actionInfo, farmerInfo, camPose, minColliderDist, poseCheck }
        }, altKey)

        expect(metrics.actionInfo, `${altKey} @ ${tSec}s getAltActionScreenPos missing`).toBeTruthy()
        expect(metrics.actionInfo.inFrustum, `${altKey} @ ${tSec}s machine/action not in frustum`).toBe(true)
        expect(metrics.actionInfo.heightPct, `${altKey} @ ${tSec}s heightPct >= 5%`).toBeGreaterThanOrEqual(5)
        expect(metrics.actionInfo.heightPct, `${altKey} @ ${tSec}s heightPct <= 40%`).toBeLessThanOrEqual(40)

        expect(metrics.farmerInfo?.inFrustum, `${altKey} @ ${tSec}s farmer not visible`).toBe(true)
        expect(metrics.minColliderDist, `${altKey} @ ${tSec}s camera < 3.5m from collider`).toBeGreaterThanOrEqual(3.5)
        expect(metrics.poseCheck?.detached, `${altKey} @ ${tSec}s farmer limbs detached`).toBe(false)
        expect(metrics.poseCheck?.insidePile, `${altKey} @ ${tSec}s farmer inside pile`).toBe(false)
      }

      if (vp && altKey === 'happy_seeder') {
        await page.screenshot({ path: `tests/screenshots/${vp.width}x${vp.height}-alt-happy-seeder.png` })
      }
      if (vp && altKey === 'bale_sell') {
        await page.screenshot({ path: `tests/screenshots/${vp.width}x${vp.height}-alt-bale-sell.png` })
      }

      // Rewind to test next alternative (handle Comparison modal / Season Report / mid-sequence rewind)
      const closeCompBtn = page.locator('[data-testid="close-comparison-button"], button:has-text("Close")').first()
      if (await closeCompBtn.isVisible().catch(() => false)) {
        await closeCompBtn.click({ force: true })
      }
      const reportReplayBtn = page.locator('[data-testid="season-report-replay-button"], button:has-text("Replay")').first()
      const hudRewindBtn = page.locator('[data-testid="what-else-rewind-button"], [data-testid="rewind-button"], button:has-text("What else?")').first()
      await page.waitForTimeout(3000)
      if (await closeCompBtn.isVisible().catch(() => false)) {
        await closeCompBtn.click({ force: true })
      }
      if (await reportReplayBtn.isVisible().catch(() => false)) {
        await reportReplayBtn.click({ force: true })
      } else {
        await hudRewindBtn.waitFor({ state: 'visible', timeout: 10000 })
        await hudRewindBtn.click({ force: true })
      }
      await choicePanel.waitFor({ state: 'visible', timeout: 15000 })
    }
  })
})
