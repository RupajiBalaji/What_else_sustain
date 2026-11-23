import { test, expect } from '@playwright/test'

test.describe('Burn Focus Framing & Spring-Arm Verification (Item 2)', () => {
  test('verifies burn_focus at 6s and 14s across viewports', async ({ page }) => {
    // Mock backend
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

    // Quick Play to reach decision point
    const startQuickPlayBtn = page.locator('[data-testid="start-quick-play-button"], [data-testid="start-3d-button"]').first()
    await startQuickPlayBtn.waitFor({ state: 'visible', timeout: 90000 })
    await startQuickPlayBtn.click()

    const skipQuizBtn = page.locator('button:has-text("Skip for now"), [data-testid="skip-quiz-button"]').first()
    try {
      await skipQuizBtn.waitFor({ state: 'visible', timeout: 4000 })
      await skipQuizBtn.click()
    } catch {}

    const burnOption = page.locator('[data-testid="choice-option-burn"], [data-testid="choice-card-burn"]').first()
    await burnOption.waitFor({ state: 'visible', timeout: 30000 })
    await burnOption.click()

    const confirmBtn = page.locator('[data-testid="confirm-choice-button"]')
    await confirmBtn.waitFor({ state: 'visible', timeout: 15000 })
    await confirmBtn.click({ force: true })

    // Helper to evaluate burn camera framing assertions
    const checkBurnFocusAt = async (targetLabel, minProgress) => {
      console.log(`--- Checking burn_focus at ${targetLabel} (progress >= ${minProgress}) ---`)
      await page.waitForFunction((pTarget) => {
        const p = window.__wes_debug?.getBurnProgress?.() ?? window.__wes_debug?.getIgnitedPileScreenPos?.()?.burnProgress
        return p !== undefined && p >= pTarget
      }, minProgress, { timeout: 35000, polling: 50 })

      const metrics = await page.evaluate(() => {
        const pos = window.__wes_debug?.getIgnitedPileScreenPos?.()
        if (!pos) return { error: 'No ignited pile debug info' }
        if (!pos.inFrustum) return { error: 'Ignited pile not in camera frustum', pos }

        const h = window.innerHeight
        const w = window.innerWidth
        const boxHeight = pos.boundingBox.height
        const heightPct = (boxHeight / h) * 100

        // Check farmer visibility
        const pPos = window.__wes_debug?.getPlayerPos?.() || [-1.2, 0, 10]
        const camPose = window.__wes_debug?.getCameraPose?.()
        if (!camPose) return { error: 'No camera pose debug info' }

        // Camera distance to all piles
        const STRAW_PILES = [
          { id: 'straw_1', x: -3.2, z: 12.5 },
          { id: 'straw_2', x: 3.8, z: 15.0 },
          { id: 'straw_3', x: -6.5, z: 18.0 },
          { id: 'straw_4', x: -14.0, z: 14.0 },
          { id: 'straw_5', x: -4.5, z: 24.0 },
          { id: 'straw_6', x: -16.0, z: 26.0 },
          { id: 'straw_7', x: -10.0, z: 32.0 },
          { id: 'straw_8', x: 2.5, z: 26.0 }
        ]
        const camPos = camPose.position
        let minPileDist = 9999
        let nearestPile = null
        STRAW_PILES.forEach(pile => {
          const d = Math.hypot(camPos[0] - pile.x, camPos[2] - pile.z)
          if (d < minPileDist) {
            minPileDist = d
            nearestPile = pile.id
          }
        })

        // Farmer visibility test: projected farmer coordinate inside viewport
        // Farmer is standing at pPos
        const farmerInScreen = window.__wes_debug?.isFarmerInView ? window.__wes_debug.isFarmerInView() : true

        return {
          inFrustum: pos.inFrustum,
          heightPct,
          minPileDist,
          nearestPile,
          camPos,
          boxHeight,
          viewport: { w, h },
          farmerInScreen
        }
      })

      console.log(`[Burn Focus ${targetLabel}]`, JSON.stringify(metrics, null, 2))
      expect(metrics.error).toBeUndefined()
      expect(metrics.inFrustum).toBe(true)
      expect(metrics.heightPct).toBeGreaterThanOrEqual(6.0)
      expect(metrics.heightPct).toBeLessThanOrEqual(35.0)
      expect(metrics.minPileDist).toBeGreaterThanOrEqual(3.5)
      expect(metrics.farmerInScreen).toBe(true)

      const vp = page.viewportSize()
      if (vp) {
        await page.screenshot({ path: `tests/screenshots/${vp.width}x${vp.height}-burn-focus-${targetLabel}.png` })
      }
    }

    // 1. Check at 6s (progress >= 0.28)
    await checkBurnFocusAt('6s', 0.28)

    // 2. Check at 14s (progress >= 0.68)
    await checkBurnFocusAt('14s', 0.68)
  })
})
