import { test, expect } from '@playwright/test'

test.describe('Performance Readout (?perf=1) & Clock Deprecation Check (Item 7)', () => {
  test('shows corner perf readout with Copy Report button and zero THREE.Clock deprecation warnings', async ({ page }) => {
    const warnings = []
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text())
      }
    })

    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' })
      })
    })

    await page.goto('/?noFpsFallback=1&perf=1')

    const startBtn = page.locator('[data-testid="start-quick-play-button"], [data-testid="start-3d-button"]').first()
    await startBtn.waitFor({ state: 'visible', timeout: 60000 })
    await startBtn.click()

    const skipQuizBtn = page.locator('[data-testid="skip-quiz-button"]')
    try {
      await skipQuizBtn.waitFor({ state: 'visible', timeout: 4000 })
      await skipQuizBtn.click()
    } catch {}

    const perfOverlay = page.locator('[data-testid="perf-readout-overlay"]')
    await perfOverlay.waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForTimeout(800)

    const text = await perfOverlay.textContent()
    expect(text).toContain('FPS:')
    expect(text).toContain('p95:')
    expect(text).toContain('max5s:')
    expect(text).toContain('Calls:')
    expect(text).toContain('Tris:')
    expect(text).toContain('Geom:')
    expect(text).toContain('Tex:')
    expect(text).toContain('Overlays:')
    expect(text).toContain('JS Heap:')

    const copyBtn = page.locator('[data-testid="perf-copy-report-button"]')
    await copyBtn.click()
    await expect(copyBtn).toHaveText('Copied!')

    const copiedReport = await page.evaluate(() => window.__wes_lastPerfReport)
    expect(copiedReport).toContain('What Else Sustain Perf Report')
    expect(copiedReport).toContain('FPS:')

    const clockWarnings = warnings.filter((w) => w.includes('THREE.Clock') && w.includes('deprecated'))
    expect(clockWarnings).toEqual([])

    const vp = page.viewportSize()
    if (vp) {
      await page.screenshot({ path: `tests/screenshots/${vp.width}x${vp.height}-perf-readout.png` })
    }
  })
})
