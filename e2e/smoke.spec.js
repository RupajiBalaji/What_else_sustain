import { test, expect } from '@playwright/test'
import fs from 'fs'

test('Full E2E smoke flow: 3D -> Decision -> Burn -> Report -> Next Season -> Lite -> Scorecard, Badges & AI Advisor', async ({ page }) => {
  const errors = []

  // Ensure screenshot output directory exists
  if (!fs.existsSync('tests/screenshots')) {
    fs.mkdirSync('tests/screenshots', { recursive: true })
  }

  // Capture uncaught exceptions and page crashes
  page.on('pageerror', (err) => {
    errors.push(`PageError: ${err.message}`)
  })

  // Capture console errors (filtering harmless blocked fonts and offline resource load notices)
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (
        text.includes('Failed to decode downloaded font') ||
        text.includes('OTS parsing error') ||
        text.includes('favicon.ico') ||
        text.includes('Failed to load resource') ||
        text.includes('net::ERR_') ||
        (text.includes('net::ERR_') && text.includes('font'))
      ) {
        return
      }
      errors.push(`ConsoleError: ${text}`)
    }
  })

  // Mock API endpoints to simulate full backend responses during automated tests
  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/api/simulate/smoke')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exposure_index: 68,
          player_smoke_index: 82,
          village_smoke_index: 58,
          pm25_concentration: 280,
          aqi_category: 'Unhealthy',
          verified: false,
          source: 'simulated_game_model'
        })
      })
    } else if (url.includes('/api/sessions')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', session_id: 'test-session-123' })
      })
    } else if (url.includes('/api/advisor')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'Mulching with stubble retains 40% more soil moisture and protects earthworms.',
          source: 'gemini'
        })
      })
    } else if (url.includes('/api/health')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'healthy' })
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' })
      })
    }
  })

  const isMobile = (page.viewportSize()?.width || 1366) < 600
  const vpName = isMobile ? 'mobile' : 'desktop'

  // 1. Load app with noFpsFallback query param
  await page.goto('/?noFpsFallback=1')

  // Check no ErrorBoundary failure
  const errorBoundary = page.locator('[data-testid="error-boundary"], [data-testid="reload-button"]')
  await expect(errorBoundary).not.toBeVisible()

  // 2. Start 3D Farm from loading screen
  const start3DBtn = page.locator('[data-testid="start-3d-button"]')
  await start3DBtn.waitFor({ state: 'visible', timeout: 25000 })
  await page.waitForTimeout(400)
  await start3DBtn.click()
  if (await start3DBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await start3DBtn.click({ force: true })
  }
  await expect(start3DBtn).toBeHidden({ timeout: 12000 })

  // 3. Skip flyover if banner is present
  const skipFlyover = page.locator('[data-testid="skip-flyover-button"]')
  if (await skipFlyover.isVisible({ timeout: 4000 }).catch(() => false)) {
    await skipFlyover.click({ force: true })
  }

  // 4. Skip harvest sequence if active
  const skipHarvestBtn = page.getByRole('button', { name: /Skip/i })
  if (await skipHarvestBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await skipHarvestBtn.click({ force: true })
  }

  // 5. Open In-World Choice Panel & Select Burn
  // If panel is not yet open, press 'E'
  const burnOptionBtn = page.getByRole('button', { name: /Burn/i }).first()
  if (!(await burnOptionBtn.isVisible({ timeout: 4000 }).catch(() => false))) {
    await page.keyboard.press('KeyE')
  }

  await burnOptionBtn.waitFor({ state: 'visible', timeout: 12000 })

  // SCREENSHOT 1: Farm at decision point (farmer, pile and village framed)
  await page.screenshot({ path: `tests/screenshots/${vpName}-decision-point.png` })

  await burnOptionBtn.click({ force: true })

  // 6. Confirm Burn choice
  const confirmBtn = page.locator('[data-testid="confirm-choice-button"]')
  await confirmBtn.waitFor({ state: 'visible', timeout: 6000 })
  await confirmBtn.click({ force: true })

  // SCREENSHOT 2: During burn (flames, embers, rising smoke drifting towards village)
  await page.waitForTimeout(4200)
  await page.screenshot({ path: `tests/screenshots/${vpName}-during-burn.png` })

  // 7. Wait for consequence and Season Report modal
  const nextSeasonBtn = page.locator('[data-testid="next-season-button"]')
  await nextSeasonBtn.waitFor({ state: 'visible', timeout: 30000 })

  // SCREENSHOT 3: Season Report modal
  await page.screenshot({ path: `tests/screenshots/${vpName}-season-report.png` })

  // 8. Click Next Season
  await nextSeasonBtn.click({ force: true })

  // 9. Switch to Lite 2D Mode
  const switchToLiteBtn = page.locator('[data-testid="switch-to-lite-button"]')
  await switchToLiteBtn.waitFor({ state: 'visible', timeout: 12000 })
  await switchToLiteBtn.click({ force: true })

  // 10. Open Scorecard in Lite mode
  const scorecardBtn = page.getByRole('button', { name: /Scorecard/i }).first()
  await scorecardBtn.waitFor({ state: 'visible', timeout: 15000 })
  await scorecardBtn.click({ force: true })
  const scorecardScreen = page.locator('[data-testid="final-scorecard-screen"]')
  await expect(scorecardScreen).toBeVisible({ timeout: 8000 })

  // 11. Open Badges in Lite mode
  const badgesBtn = page.locator('[data-testid="header-badges-btn"], [data-testid="village-badges-btn"]').first()
  await badgesBtn.waitFor({ state: 'visible', timeout: 8000 })
  await badgesBtn.click({ force: true })
  const badgesScreen = page.locator('[data-testid="badge-collection-screen"]')
  await expect(badgesScreen).toBeVisible({ timeout: 8000 })

  // 12. Open AI Advisor in Lite mode
  const advisorBtn = page.locator('[data-testid="header-advisor-btn"], [data-testid="village-advisor-btn"]').first()
  await advisorBtn.waitFor({ state: 'visible', timeout: 8000 })
  await advisorBtn.click({ force: true })
  const advisorPanel = page.locator('[data-testid="ai-advisor-panel"]')
  await expect(advisorPanel).toBeVisible({ timeout: 8000 })

  // 13. Ensure no element viewport overflow
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 4
  })
  expect(hasOverflow).toBe(false)

  // 14. Assert zero uncaught errors and zero console errors
  expect(errors).toEqual([])
})
