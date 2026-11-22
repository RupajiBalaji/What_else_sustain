import { test, expect } from '@playwright/test'
import fs from 'fs'

test.describe('Camera Stability & Spring-Arm Collision Test', () => {
  test('asserts largest single-frame camera displacement is < 0.5m during 6s walk and proves old code fails', async ({ page }) => {
    if (!fs.existsSync('tests/screenshots')) {
      fs.mkdirSync('tests/screenshots', { recursive: true })
    }

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

    // Quick Play to decision point
    const startQuickPlayBtn = page.locator('[data-testid="start-quick-play-button"], [data-testid="start-3d-button"]').first()
    await startQuickPlayBtn.waitFor({ state: 'visible', timeout: 90000 })
    await page.waitForTimeout(400)
    await startQuickPlayBtn.click()

    const skipQuizBtn = page.locator('button:has-text("Skip for now"), [data-testid="skip-quiz-button"]').first()
    try {
      await skipQuizBtn.waitFor({ state: 'visible', timeout: 4000 })
      await skipQuizBtn.click()
    } catch {}

    await page.waitForFunction(() => typeof window.__wes_debug?.getCameraPose === 'function', { timeout: 30000 })
    await page.waitForTimeout(1000)

    // Helper to start tracking camera frame-by-frame
    const startTracking = async () => {
      await page.evaluate(() => {
        window.__camTrajectory = []
        let lastTime = performance.now()
        let lastPos = null
        const track = () => {
          const now = performance.now()
          const dt = (now - lastTime) / 1000
          lastTime = now
          const pose = window.__wes_debug.getCameraPose()
          const pos = pose.position
          if (lastPos && dt > 0.001) {
            const dx = pos[0] - lastPos[0]
            const dy = pos[1] - lastPos[1]
            const dz = pos[2] - lastPos[2]
            const rawDisp = Math.sqrt(dx * dx + dy * dy + dz * dz)
            // Normalise to 60 fps frame (1/60s ≈ 0.01667s)
            const normDisp = rawDisp * ((1 / 60) / dt)
            window.__camTrajectory.push({ rawDisp, normDisp, dt, pos })
          }
          lastPos = [pos[0], pos[1], pos[2]]
          window.__camTrackId = requestAnimationFrame(track)
        }
        window.__camTrackId = requestAnimationFrame(track)
      })
    }

    // Helper to stop tracking and return max single-frame displacement
    const stopTracking = async () => {
      return await page.evaluate(() => {
        cancelAnimationFrame(window.__camTrackId)
        let maxNormDisp = 0
        let maxRawDisp = 0
        let minY = Infinity
        const sorted = [...window.__camTrajectory].sort((a, b) => b.rawDisp - a.rawDisp)
        for (const pt of window.__camTrajectory) {
          if (pt.normDisp > maxNormDisp) maxNormDisp = pt.normDisp
          if (pt.rawDisp > maxRawDisp) maxRawDisp = pt.rawDisp
          if (pt.pos[1] < minY) minY = pt.pos[1]
        }
        return {
          count: window.__camTrajectory.length,
          maxNormDisp,
          maxRawDisp,
          minY,
          top3Raw: sorted.slice(0, 3)
        }
      })
    }

    // 1. NEGATIVE CONTROL TEST: Old Teleporting Collision
    console.log('--- Running Negative Control with Old Collision ---')
    await page.evaluate(() => { window.__wes_debug.useOldCameraCollision = true })
    await startTracking()

    // Move player so camera intersects the tractor collider boundary
    await page.evaluate(() => window.__wes_debug.setPlayerPos([8.0, 0, 19.5]))
    await page.waitForTimeout(600)

    const oldStats = await stopTracking()
    await page.evaluate(() => { window.__wes_debug.useOldCameraCollision = false })
    console.log(`[Negative Control] Old code stats:`, JSON.stringify(oldStats, null, 2))

    // Assert that the old teleporting collision caused a jump > 0.5m
    expect(oldStats.maxRawDisp).toBeGreaterThan(0.5)

    // Reset player & camera to initial position
    await page.evaluate(() => {
      window.__wes_debug.setPlayerPos([-1.2, 0, 10.0])
      window.__wes_camera.reset()
    })
    await page.waitForTimeout(600)

    // 2. POSITIVE TEST: Spring-Arm Smooth Collision during 6-second Walk
    console.log('--- Running Positive Spring-Arm Collision Test ---')
    await startTracking()

    // 6-second walk circling straw piles, hugging farmhouse and tree line
    // Leg 1: Walk W towards piles (1.5s)
    await page.keyboard.down('KeyW')
    await page.waitForTimeout(1500)
    await page.keyboard.up('KeyW')

    // Leg 2: Walk D circling around piles (1.5s)
    await page.keyboard.down('KeyD')
    await page.waitForTimeout(1500)
    await page.keyboard.up('KeyD')

    // Leg 3: Walk S towards tree line (1.5s)
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(1500)
    await page.keyboard.up('KeyS')

    // Leg 4: Walk A back towards field (1.5s)
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(1500)
    await page.keyboard.up('KeyA')

    const springArmStats = await stopTracking()
    console.log(`[Spring-Arm] Frames recorded: ${springArmStats.count}`)
    console.log(`[Spring-Arm] Max normalized displacement: ${springArmStats.maxNormDisp.toFixed(4)}m (must be < 0.5m)`)
    console.log(`[Spring-Arm] Minimum camera Y: ${springArmStats.minY.toFixed(3)}m (must be >= 0.65m)`)

    // Verify camera stability: no teleportation jumps!
    expect(springArmStats.maxNormDisp).toBeLessThan(0.5)
    // Verify ground safety: never under ground
    expect(springArmStats.minY).toBeGreaterThanOrEqual(0.65)

    await page.screenshot({ path: 'tests/screenshots/camera-spring-arm-verified.png' })
  })
})
