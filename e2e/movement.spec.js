import { test, expect } from '@playwright/test'
import fs from 'fs'

test.describe('Camera-Relative Movement & End-to-End Direction Test', () => {
  test('verifies W, S, D, A and touch joystick directions align with camera heading across rotations', async ({ page }) => {
    // Ensure screenshot output directory exists
    if (!fs.existsSync('tests/screenshots')) {
      fs.mkdirSync('tests/screenshots', { recursive: true })
    }

    const vp = page.viewportSize() || { width: 1366, height: 768 }
    const isTouch = vp.width < 768 || Boolean(page.context()._options?.hasTouch)

    // Mock backend APIs
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

    // Reach the decision point via Quick Play
    const startQuickPlayBtn = page.locator('[data-testid="start-quick-play-button"], [data-testid="start-3d-button"]').first()
    await startQuickPlayBtn.waitFor({ state: 'visible', timeout: 90000 })
    await page.waitForTimeout(400)
    await startQuickPlayBtn.click()

    // Dismiss quiz if shown
    const skipQuizBtn = page.locator('button:has-text("Skip for now"), [data-testid="skip-quiz-button"]').first()
    try {
      await skipQuizBtn.waitFor({ state: 'visible', timeout: 4000 })
      await skipQuizBtn.click()
    } catch {}

    // Wait for 3D world to mount and debug hooks to be ready
    await page.waitForFunction(() => typeof window.__wes_debug?.getPlayerPos === 'function', { timeout: 30000 })

    // Helper to drive movement for duration ms
    const moveDirection = async (dir, durationMs = 600) => {
      if (isTouch) {
        // Drive virtual joystick: forward = (0, -1), backward = (0, 1), right = (1, 0), left = (-1, 0)
        let jx = 0, jy = 0
        if (dir === 'W') jy = -1
        else if (dir === 'S') jy = 1
        else if (dir === 'D') jx = 1
        else if (dir === 'A') jx = -1

        await page.evaluate(({ x, y }) => window.__wes_debug.driveJoystick(x, y), { x: jx, y: jy })
        await page.waitForTimeout(durationMs)
        await page.evaluate(() => window.__wes_debug.driveJoystick(0, 0))
        await page.waitForTimeout(100)
      } else {
        const keyMap = { W: 'KeyW', S: 'KeyS', D: 'KeyD', A: 'KeyA' }
        const key = keyMap[dir]
        await page.keyboard.down(key)
        await page.waitForTimeout(durationMs)
        await page.keyboard.up(key)
        await page.waitForTimeout(100)
      }
    }

    // Helper to measure displacement and compute dot product with camera forward/right
    const testMove = async (dir) => {
      const p0 = await page.evaluate(() => window.__wes_debug.getPlayerPos())
      const t0 = await page.evaluate(() => window.__wes_debug.getSimTime?.() || 0)
      const heading = await page.evaluate(() => window.__wes_debug.getCameraHeading())

      const fwd = { x: Math.sin(heading), z: Math.cos(heading) }
      const right = { x: -Math.cos(heading), z: Math.sin(heading) }

      await moveDirection(dir, 600)

      const p1 = await page.evaluate(() => window.__wes_debug.getPlayerPos())
      const t1 = await page.evaluate(() => window.__wes_debug.getSimTime?.() || 0)
      const elapsedSim = Math.max(0.05, t1 - t0)
      const disp = { x: p1[0] - p0[0], z: p1[2] - p0[2] }
      const dist = Math.hypot(disp.x, disp.z)

      const normDisp = dist > 0.001 ? { x: disp.x / dist, z: disp.z / dist } : { x: 0, z: 0 }
      const dotFwd = normDisp.x * fwd.x + normDisp.z * fwd.z
      const dotRight = normDisp.x * right.x + normDisp.z * right.z

      return { dist, dotFwd, dotRight, heading, p0, p1, elapsedSim }
    }

    // Helper to assert movement distance relative to elapsed simulation time (not fixed 0.2m)
    const expectSimDistance = (res) => {
      // Minimum distance scaled to elapsed simulation time: at least 0.8 m/s average speed
      const minExpected = Math.max(0.05, res.elapsedSim * 0.8)
      expect(res.dist).toBeGreaterThan(minExpected)
    }

    // 1. NEGATIVE CONTROL TEST: Prove old formula FAILS the forward test
    await page.evaluate(() => { window.__wes_debug.useOldMovement = true })
    const negResult = await testMove('W')
    await page.evaluate(() => { window.__wes_debug.useOldMovement = false })
    console.log(`[Negative Control] Old code W move dotFwd: ${negResult.dotFwd.toFixed(3)} (expected negative)`)
    expect(negResult.dotFwd).toBeLessThan(0) // Old code moved backward (< 0), failing the > 0.8 test

    // 2. POSITIVE TEST: Default Camera Heading
    const resW1 = await testMove('W')
    console.log(`[Default Heading] W: dotFwd=${resW1.dotFwd.toFixed(3)}, dist=${resW1.dist.toFixed(3)}, sim=${resW1.elapsedSim.toFixed(3)}s`)
    expectSimDistance(resW1)
    expect(resW1.dotFwd).toBeGreaterThan(0.8)

    const resS1 = await testMove('S')
    console.log(`[Default Heading] S: dotFwd=${resS1.dotFwd.toFixed(3)}, dist=${resS1.dist.toFixed(3)}, sim=${resS1.elapsedSim.toFixed(3)}s`)
    expectSimDistance(resS1)
    expect(resS1.dotFwd).toBeLessThan(-0.8)

    const resD1 = await testMove('D')
    console.log(`[Default Heading] D: dotRight=${resD1.dotRight.toFixed(3)}, dist=${resD1.dist.toFixed(3)}, sim=${resD1.elapsedSim.toFixed(3)}s`)
    expectSimDistance(resD1)
    expect(resD1.dotRight).toBeGreaterThan(0.8)

    const resA1 = await testMove('A')
    console.log(`[Default Heading] A: dotRight=${resA1.dotRight.toFixed(3)}, dist=${resA1.dist.toFixed(3)}, sim=${resA1.elapsedSim.toFixed(3)}s`)
    expectSimDistance(resA1)
    expect(resA1.dotRight).toBeLessThan(-0.8)

    // 3. ROTATE CAMERA 90 DEGREES (~PI/2 rad) via camera controller
    // Begin 90-degree test from an open position (no obstacle within 4 m) so sliding does not lower the measured dot
    await page.evaluate(() => {
      window.__wes_debug.setPlayerPos([-10.0, 0, 6.0])
    })
    await page.waitForTimeout(100)
    await page.evaluate(() => window.__wes_camera.rotate(Math.PI / 2))
    await page.waitForTimeout(600)

    const resW2 = await testMove('W')
    console.log(`[Rotated 90°] W: dotFwd=${resW2.dotFwd.toFixed(3)}, dist=${resW2.dist.toFixed(3)}, sim=${resW2.elapsedSim.toFixed(3)}s`)
    expectSimDistance(resW2)
    expect(resW2.dotFwd).toBeGreaterThan(0.8)

    const resS2 = await testMove('S')
    console.log(`[Rotated 90°] S: dotFwd=${resS2.dotFwd.toFixed(3)}, dist=${resS2.dist.toFixed(3)}, sim=${resS2.elapsedSim.toFixed(3)}s`)
    expectSimDistance(resS2)
    expect(resS2.dotFwd).toBeLessThan(-0.8)

    const resD2 = await testMove('D')
    console.log(`[Rotated 90°] D: dotRight=${resD2.dotRight.toFixed(3)}, dist=${resD2.dist.toFixed(3)}, sim=${resD2.elapsedSim.toFixed(3)}s`)
    expectSimDistance(resD2)
    expect(resD2.dotRight).toBeGreaterThan(0.8)

    const resA2 = await testMove('A')
    console.log(`[Rotated 90°] A: dotRight=${resA2.dotRight.toFixed(3)}, dist=${resA2.dist.toFixed(3)}, sim=${resA2.elapsedSim.toFixed(3)}s`)
    expectSimDistance(resA2)
    expect(resA2.dotRight).toBeLessThan(-0.8)

    // 4. ROTATE CAMERA 180 DEGREES (~PI rad) via pointer dragging across 3D canvas
    await page.evaluate(() => {
      window.__wes_debug.setPlayerPos([-10.0, 0, 6.0])
    })
    await page.waitForTimeout(100)
    const canvas = page.locator('canvas')
    const box = await canvas.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      // Drag horizontally to rotate camera orbit
      await page.mouse.move(box.x + box.width / 2 - 200, box.y + box.height / 2, { steps: 8 })
      await page.mouse.up()
      await page.waitForTimeout(400)
    }

    const resW3 = await testMove('W')
    console.log(`[Rotated 180° drag] W: dotFwd=${resW3.dotFwd.toFixed(3)}, dist=${resW3.dist.toFixed(3)}, sim=${resW3.elapsedSim.toFixed(3)}s`)
    expectSimDistance(resW3)
    expect(resW3.dotFwd).toBeGreaterThan(0.8)

    const resD3 = await testMove('D')
    console.log(`[Rotated 180° drag] D: dotRight=${resD3.dotRight.toFixed(3)}, dist=${resD3.dist.toFixed(3)}, sim=${resD3.elapsedSim.toFixed(3)}s`)
    expectSimDistance(resD3)
    expect(resD3.dotRight).toBeGreaterThan(0.8)

    // Save screenshot of player movement in field
    await page.screenshot({ path: `tests/screenshots/${vp.width}x${vp.height}-movement-verified.png` })
  })
})
