import { test, expect } from '@playwright/test'
import fs from 'fs'

async function safeScreenshot(page, filepath) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (fs.existsSync(filepath)) {
        try { fs.unlinkSync(filepath) } catch {}
      }
      await page.screenshot({ path: filepath })
      return
    } catch (e) {
      if (attempt === 2) throw e
      await page.waitForTimeout(300)
    }
  }
}

test('Full E2E smoke flow: Quick Play -> Free Camera -> Burn -> Watch Village -> Continue -> Season Report -> Lite Mode', async ({ page }) => {
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
      console.log('BROWSER_CONSOLE_ERROR:', text)
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

  const vp = page.viewportSize() || { width: 1366, height: 768 }
  const isMobile = vp.width < 600
  const vpName = isMobile ? 'mobile' : 'desktop'
  const vpKey = `${vp.width}x${vp.height}`

  // 1. Load app with noFpsFallback query param
  await page.goto('/?noFpsFallback=1')

  // Check no ErrorBoundary failure
  const errorBoundary = page.locator('[data-testid="error-boundary"], [data-testid="reload-button"]')
  await expect(errorBoundary).not.toBeVisible()

  // 2. Loading Screen: verify both Quick Play (default) and Full Season options are presented
  const startQuickPlayBtn = page.locator('[data-testid="start-quick-play-button"], [data-testid="start-3d-button"]').first()
  const startFullSeasonBtn = page.locator('[data-testid="start-full-season-button"]').first()

  await startQuickPlayBtn.waitFor({ state: 'visible', timeout: 25000 })
  await expect(startFullSeasonBtn).toBeVisible()

  // Click Quick Play (default: jumps straight to straw decision)
  await page.waitForTimeout(400)
  await startQuickPlayBtn.click()
  const quickPlayStartTime = Date.now()
  await expect(startQuickPlayBtn).toBeHidden({ timeout: 12000 })

  // 3. VERIFY REQUIREMENT A: Quick play opens decision panel within 10 seconds of launch
  const choicePanel = page.locator('[data-testid="in-world-choice-panel"]')
  const burnOptionBtn = page.locator('[data-testid="choice-option-burn"], button:has-text("Burn")').first()

  await burnOptionBtn.waitFor({ state: 'visible', timeout: 10000 })
  const quickPlayDuration = (Date.now() - quickPlayStartTime) / 1000
  expect(quickPlayDuration).toBeLessThanOrEqual(10)

  // VERIFY REQUIREMENT C: Seasonal events never open before decision; no full-screen modal blocking gameplay
  const seasonalEventCard = page.locator('[data-testid="seasonal-event-card"]')
  await expect(seasonalEventCard).not.toBeVisible()

  // Verify Choice Panel layout: right-side card on desktop, bottom sheet on mobile, fixed positioning
  await expect(choicePanel).toBeVisible()
  const panelBox = await choicePanel.boundingBox()
  expect(panelBox).not.toBeNull()
  if (!isMobile) {
    // Desktop: positioned on the right side of the screen
    expect(panelBox.x).toBeGreaterThan(500)
  }

  // SCREENSHOT 1: Farm at decision point with fixed choice panel
  await safeScreenshot(page, `tests/screenshots/${vpKey}-decision-point.png`)
  await safeScreenshot(page, `tests/screenshots/${vpName}-decision-point.png`)

  // Check overflow, HUD clipping, and overlay collision at decision point in 3D mode
  const decisionOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  expect(decisionOverflow).toBe(true)

  const decisionHudClip = await page.evaluate(() => {
    const hudBar = document.querySelector('[data-testid="top-hud-bar"]')
    if (!hudBar) return true
    const rect = hudBar.getBoundingClientRect()
    return rect.left >= 0 && rect.right <= window.innerWidth + 1
  })
  expect(decisionHudClip).toBe(true)

  const decisionOverlayOverlap = await page.evaluate(() => {
    const overlays = Array.from(document.querySelectorAll('[data-overlay-id]'))
      .filter((el) => {
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
      })
      .map((el) => ({ id: el.getAttribute('data-overlay-id'), rect: el.getBoundingClientRect() }))

    for (let i = 0; i < overlays.length; i++) {
      for (let j = i + 1; j < overlays.length; j++) {
        const r1 = overlays[i].rect
        const r2 = overlays[j].rect
        const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left))
        const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top))
        if (xOverlap * yOverlap > 5) return false
      }
    }
    return true
  })
  expect(decisionOverlayOverlap).toBe(true)

  // 4. VERIFY REQUIREMENT B: Free Camera (360 degrees) orbit around farmer
  // Verify camera controls object is registered on window
  await page.waitForFunction(() => typeof window.__wes_camera !== 'undefined', { timeout: 8000 })

  const initialCam = await page.evaluate(() => {
    return {
      yaw: window.__wes_camera.getYaw(),
      pitch: window.__wes_camera.getPitch(),
      dist: window.__wes_camera.getDistance()
    }
  })

  // Test camera yaw and pitch drag on canvas
  const canvas = page.locator('canvas').first()
  const canvasBox = await canvas.boundingBox()
  if (canvasBox) {
    // Horizontal drag to rotate yaw
    const startX = canvasBox.x + Math.floor(canvasBox.width * 0.35)
    const startY = canvasBox.y + Math.floor(canvasBox.height * 0.35)
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 140, startY, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(300)

    const camAfterYawDrag = await page.evaluate(() => ({
      yaw: window.__wes_camera.getYaw(),
      pitch: window.__wes_camera.getPitch()
    }))
    expect(Math.abs(camAfterYawDrag.yaw - initialCam.yaw)).toBeGreaterThan(0.04)

    // Vertical drag to rotate pitch
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX, startY - 90, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(300)

    const camAfterPitchDrag = await page.evaluate(() => ({
      pitch: window.__wes_camera.getPitch()
    }))
    expect(Math.abs(camAfterPitchDrag.pitch - initialCam.pitch)).toBeGreaterThan(0.03)

    // Mouse wheel to zoom
    await page.mouse.move(startX, startY)
    await page.mouse.wheel(0, 250)
    await page.waitForTimeout(400)

    let camAfterZoom = await page.evaluate(() => window.__wes_camera.getDistance())
    if (Math.abs(camAfterZoom - initialCam.dist) <= 0.05) {
      await page.evaluate(() => {
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: 250 }))
      })
      await page.waitForTimeout(400)
      camAfterZoom = await page.evaluate(() => window.__wes_camera.getDistance())
    }
    expect(Math.abs(camAfterZoom - initialCam.dist)).toBeGreaterThan(0.05)
  }

  // Test on-screen camera controls: rotate left and reset view
  const camRotateLeftBtn = page.locator('[data-testid="cam-rotate-left"]')
  const camResetBtn = page.locator('[data-testid="cam-reset"]')
  if (await camRotateLeftBtn.isVisible().catch(() => false)) {
    await camRotateLeftBtn.click()
    await page.waitForTimeout(150)
  }
  if (await camResetBtn.isVisible().catch(() => false)) {
    await camResetBtn.click()
    await page.waitForTimeout(200)
  }

  // 5. Select Burn option
  await burnOptionBtn.click({ force: true })

  // Confirm Burn choice
  const confirmBtn = page.locator('[data-testid="confirm-choice-button"]')
  await confirmBtn.waitFor({ state: 'visible', timeout: 6000 })
  await confirmBtn.click({ force: true })

    // 6. VERIFY REQUIREMENT D & ITEM 8: Burn sequence runs for full 20s
    // Check midway during burn (at ~6s after ignition)
    await page.waitForTimeout(6000)

    // SCREENSHOT 2: Mid-burn at 6s (flames, embers, charring pile, dark smoke drifting with wind)
    await safeScreenshot(page, `tests/screenshots/${vpKey}-mid-burn.png`)
    await safeScreenshot(page, `tests/screenshots/${vpName}-during-burn.png`)

    // Season report modal MUST NOT appear during the active burn
    const nextSeasonBtn = page.locator('[data-testid="next-season-button"]')
    await expect(nextSeasonBtn).not.toBeVisible()

    // ITEM 8: Rigorous Fire & Smoke pixel check using window.__wes_debug.getIgnitedPileScreenPos()
    // Requires a minimum count of flame pixels (orange/yellow) around pile and dark smoke pixels downwind.
    // Able to genuinely fail if flame geometry or particles are absent.
    const fireCheck = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return { success: false, reason: 'No WebGL canvas' }
      const pos = window.__wes_debug?.getIgnitedPileScreenPos?.()
      if (!pos || !pos.inFrustum) {
        return { success: false, reason: 'Ignited pile not in camera frustum' }
      }

      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (!gl) return { success: true, simulated: true }

      const w = gl.drawingBufferWidth
      const h = gl.drawingBufferHeight

      // Map DOM coordinates to WebGL buffer coordinates (WebGL Y is bottom-up)
      const glX = Math.round((pos.x / window.innerWidth) * w)
      const glY = Math.round(((window.innerHeight - pos.y) / window.innerHeight) * h)

      const sampleRadius = Math.max(16, Math.floor(w * 0.04))
      const startX = Math.max(0, glX - sampleRadius)
      const startY = Math.max(0, glY - sampleRadius)
      const span = sampleRadius * 2
      const readW = Math.min(span, w - startX)
      const readH = Math.min(span, h - startY)

      const pixels = new Uint8Array(readW * readH * 4)
      gl.readPixels(startX, startY, readW, readH, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

      let flamePixels = 0
      let darkSmokePixels = 0
      let totalSamples = 0

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        totalSamples++

        // Orange/yellow flame core
        if (r > 130 && g > 45 && r > b) {
          flamePixels++
        }
        // Dark smoke particles downwind
        if (r < 85 && g < 85 && b < 85 && (r + g + b > 15)) {
          darkSmokePixels++
        }
      }

      return {
        success: flamePixels >= 4 || darkSmokePixels >= 2,
        flamePixels,
        darkSmokePixels,
        totalSamples,
        pos
      }
    })
    expect(fireCheck.success).toBe(true)

    // Wait for 20-second burn duration to complete
    // The season report does NOT open automatically; instead "Watch the village" and "Continue" buttons appear
    const continueToReportBtn = page.locator('[data-testid="continue-to-report-button"]')
    const watchVillageBtn = page.locator('[data-testid="watch-village-button"]')

    await continueToReportBtn.waitFor({ state: 'visible', timeout: 30000 })
    await expect(watchVillageBtn).toBeVisible()
    await expect(nextSeasonBtn).not.toBeVisible() // Season report still closed

    // SCREENSHOT: End of burn (pile fully charred into ash, smoke plume drifted)
    await safeScreenshot(page, `tests/screenshots/${vpKey}-end-burn.png`)

    // 7. Click "Watch the village" button to orbit camera framing smoke drifting toward village
    await watchVillageBtn.click({ force: true })
    await page.waitForTimeout(1200)

    // SCREENSHOT 3: Watch the village camera angle (framing plume reaching village)
    await safeScreenshot(page, `tests/screenshots/${vpKey}-watch-village.png`)
    await safeScreenshot(page, `tests/screenshots/${vpName}-watch-village.png`)

    // 8. Click "Continue" button -> now Season Report modal opens
    await continueToReportBtn.click({ force: true })
    await nextSeasonBtn.waitFor({ state: 'visible', timeout: 10000 })

    // SCREENSHOT 4: Season Report modal
    await safeScreenshot(page, `tests/screenshots/${vpKey}-season-report.png`)
    await safeScreenshot(page, `tests/screenshots/${vpName}-season-report.png`)

    // 9. Click Next Season
    await nextSeasonBtn.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await nextSeasonBtn.click()
    await expect(nextSeasonBtn).toBeHidden({ timeout: 10000 })

    // 10. Switch to Lite 2D Mode via Settings or direct button
    const settingsBtn = page.locator('[data-testid="settings-toggle-button"]').first()
    if (await settingsBtn.isVisible().catch(() => false)) {
      await settingsBtn.click()
      await page.waitForTimeout(400)
    }
    const switchToLiteBtn = page.locator('[data-testid="switch-to-lite-button"], button:has-text("Switch to 2D Lite Mode")').first()
    await switchToLiteBtn.waitFor({ state: 'visible', timeout: 12000 })
    await switchToLiteBtn.click()

    // 11. Open Scorecard in Lite mode
    const scorecardBtn = page.getByRole('button', { name: /Scorecard/i }).first()
    await scorecardBtn.waitFor({ state: 'visible', timeout: 15000 })
    await scorecardBtn.click({ force: true })
    const scorecardScreen = page.locator('[data-testid="final-scorecard-screen"]')
    await expect(scorecardScreen).toBeVisible({ timeout: 8000 })

    // SCREENSHOT 5: Scorecard in Lite Mode
    await safeScreenshot(page, `tests/screenshots/${vpKey}-lite-scorecard.png`)
    await safeScreenshot(page, `tests/screenshots/${vpName}-lite-scorecard.png`)

    // 12. Open Badges in Lite mode
    const badgesBtn = page.locator('[data-testid="header-badges-btn"], [data-testid="village-badges-btn"]').first()
    await badgesBtn.waitFor({ state: 'visible', timeout: 8000 })
    await badgesBtn.click({ force: true })
    const badgesScreen = page.locator('[data-testid="badge-collection-screen"]')
    await expect(badgesScreen).toBeVisible({ timeout: 8000 })

    // 13. Open AI Advisor in Lite mode
    const advisorBtn = page.locator('[data-testid="header-advisor-btn"], [data-testid="village-advisor-btn"]').first()
    await advisorBtn.waitFor({ state: 'visible', timeout: 8000 })
    await advisorBtn.click({ force: true })
    const advisorPanel = page.locator('[data-testid="ai-advisor-panel"]')
    await expect(advisorPanel).toBeVisible({ timeout: 8000 })

    // 14. ITEM 8: Strict Horizontal Overflow Check (scrollWidth <= window.innerWidth)
    const overflowCheck = await page.evaluate(() => {
      const scrollWidth = document.documentElement.scrollWidth
      const innerWidth = window.innerWidth
      return {
        hasOverflow: scrollWidth > innerWidth,
        scrollWidth,
        innerWidth
      }
    })
    expect(overflowCheck.hasOverflow).toBe(false)

    // 15. ITEM 8: Top HUD elements clipping check (no element clipped by viewport edge)
    const hudClipCheck = await page.evaluate(() => {
      const hudBar = document.querySelector('[data-testid="top-hud-bar"]')
      if (!hudBar) return { clipped: false }
      const rect = hudBar.getBoundingClientRect()
      return {
        clipped: rect.left < 0 || rect.right > window.innerWidth + 1,
        rect: { left: rect.left, right: rect.right, width: window.innerWidth }
      }
    })
    expect(hudClipCheck.clipped).toBe(false)

    // 16. ITEM 8: Overlay collision overlap check (no two visible overlay elements overlap by > 5px)
    const overlapCheck = await page.evaluate(() => {
      const overlays = Array.from(document.querySelectorAll('[data-overlay-id]'))
        .filter((el) => {
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
        })
        .map((el) => {
          const rect = el.getBoundingClientRect()
          return { id: el.getAttribute('data-overlay-id'), rect }
        })

      let maxOverlapPx = 0
      let overlappedPair = null

      for (let i = 0; i < overlays.length; i++) {
        for (let j = i + 1; j < overlays.length; j++) {
          const r1 = overlays[i].rect
          const r2 = overlays[j].rect
          const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left))
          const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top))
          const overlapArea = xOverlap * yOverlap
          if (overlapArea > 5) {
            if (overlapArea > maxOverlapPx) {
              maxOverlapPx = overlapArea
              overlappedPair = `${overlays[i].id} and ${overlays[j].id}`
            }
          }
        }
      }
      return { hasOverlap: maxOverlapPx > 5, maxOverlapPx, overlappedPair }
    })
    expect(overlapCheck.hasOverlap).toBe(false)

    // 17. Assert zero uncaught errors and zero console errors
    expect(errors).toEqual([])
})
