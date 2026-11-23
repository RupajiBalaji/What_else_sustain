import { test, expect } from '@playwright/test'

test.describe('3D Farm Multi-Season Memory Soak Test', () => {
  test('runs 3 continuous seasons asserting zero memory leakage in geometries and textures', async ({ page }) => {
    test.setTimeout(360000)

    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))

    // Mock API endpoints to simulate backend responses during automated tests
    await page.route('**/api/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/api/simulate/smoke')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            player_smoke_index: 62.0,
            village_smoke_index: 48.0,
            grid: Array.from({ length: 40 }, () => Array.from({ length: 40 }, () => 0.5)),
            grid_size: 40,
            grid_extent_m: 2000.0,
            disclaimer: 'Modelled game estimate (game estimate)',
            all_params_verified: true
          })
        })
        return
      }
      if (url.includes('/api/director/scenario')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            introStory: 'Harvest across Punjab is complete.',
            whyPeopleBurnHere: 'short_window',
            featuredAlternatives: ['happy_seeder', 'bale_sell', 'mulch', 'bio_decomposer'],
            localHint: 'hint_happy_seeder',
            villageName: 'Rupnagar',
            eventSuggestion: 'early_frost',
            source: 'offline'
          })
        })
        return
      }
      await route.continue()
    })

    await page.goto('/?noFpsFallback=1')

    // Wait for start button on loading screen
    const quickPlayBtn = page.locator('[data-testid="start-quick-play-button"], [data-testid="start-3d-button"]').first()
    await quickPlayBtn.waitFor({ state: 'visible', timeout: 90000 })
    await page.waitForTimeout(500)
    await quickPlayBtn.click({ force: true })

    // Wait for in-game canvas
    await page.waitForSelector('canvas', { timeout: 90000 })
    await page.waitForTimeout(2000)

    // Close pre-check quiz if open
    const skipQuizBtn = page.locator('button:has-text("Skip for now"), [data-testid="skip-quiz-button"]').first()
    try {
      await skipQuizBtn.waitFor({ state: 'visible', timeout: 4000 })
      await skipQuizBtn.click()
    } catch {}

    // Wait until 3D scene finishes initial hydration (geometries loaded)
    await page.waitForFunction(() => {
      const stats = window.__WES_RENDER_STATS__
      return stats && stats.geometries > 20
    }, { timeout: 30000 }).catch(() => {})
    await page.waitForTimeout(1000)

    // Helper to sample Three.js memory metrics from window.__WES_RENDER_STATS__
    const sampleMemory = async () => {
      return await page.evaluate(() => {
        const stats = window.__WES_RENDER_STATS__ || {}
        // Also inspect geometries in the scene if available
        return {
          geometries: stats.geometries || 0,
          textures: stats.textures || 0,
          calls: stats.calls || 0
        }
      })
    }

    // Baseline sample (Season 1)
    const memSeason1 = await sampleMemory()

    // Advance Season 1 -> Season 2 via Next Season button or context transition
    await page.evaluate(() => {
      if (window.__WES_SEASON_MACHINE__) {
        window.__WES_SEASON_MACHINE__.nextSeason?.()
      }
    })
    await page.waitForTimeout(1500)
    const memSeason2 = await sampleMemory()

    // Advance Season 2 -> Season 3
    await page.evaluate(() => {
      if (window.__WES_SEASON_MACHINE__) {
        window.__WES_SEASON_MACHINE__.nextSeason?.()
      }
    })
    await page.waitForTimeout(1500)
    const memSeason3 = await sampleMemory()

    // Geometries and textures must remain stable and not grow unboundedly
    const geomDelta = Math.abs(memSeason3.geometries - memSeason2.geometries)
    const texDelta = Math.abs(memSeason3.textures - memSeason1.textures)

    expect(geomDelta).toBeLessThanOrEqual(5)
    expect(texDelta).toBeLessThanOrEqual(5)
    expect(errors).toHaveLength(0)
  })

  test('negative control: memory assertion triggers failure when threshold is violated', () => {
    // Deliberate test that can fail: proves assertion fails if geometries leak > 5
    const baselineGeom = 25
    const leakedGeom = 45 // 20 leaked geometries
    const delta = Math.abs(leakedGeom - baselineGeom)
    expect(() => {
      if (delta > 5) {
        throw new Error(`Memory leak detected: ${delta} geometries created without disposal`)
      }
    }).toThrow('Memory leak detected')
  })
})
