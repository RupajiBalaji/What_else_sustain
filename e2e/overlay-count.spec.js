import { test, expect } from '@playwright/test'

/**
 * Counts ACTUAL visible on-screen overlay cards in the DOM using getComputedStyle
 * and getBoundingClientRect (independent of OverlayManager's internal registry).
 */
async function countVisibleOverlayCards(page) {
  return await page.evaluate(() => {
    const selectors = [
      '[data-overlay-id]',
      '[data-testid="consequence-callout-card"]',
      '[data-testid="cough-chip"]',
      '[data-testid="wave-chip"]',
      '.overlay-card'
    ]
    const winW = window.innerWidth
    const winH = window.innerHeight
    const seen = new Set()
    const candidates = []

    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        if (el.getAttribute('data-collapsed') === 'true' || el.classList.contains('collapsed')) return
        const st = window.getComputedStyle(el)
        if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return
        const r = el.getBoundingClientRect()
        if (r.width <= 2 || r.height <= 2) return
        if (r.right <= 0 || r.left >= winW || r.bottom <= 0 || r.top >= winH) return
        candidates.push({
          el,
          id: el.getAttribute('data-overlay-id') || el.getAttribute('data-testid') || el.className
        })
      })
    }

    // Top-level visible cards only (exclude child chips nested inside a ManagedOverlay container)
    const topLevel = candidates.filter(
      (item) => !candidates.some((other) => other !== item && other.el.contains(item.el))
    )
    return topLevel.map((item) => item.id)
  })
}

test.describe('Actual Visible Overlay Card Count (R2-6)', () => {
  test('counts <= 2 visible DOM world cards at burn & happy_seeder end-of-sequence, with negative control', async ({ page }) => {
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

    // 1. Happy Seeder end-of-sequence screen
    await page.locator('[data-testid="choice-option-happy_seeder"]').click({ force: true })
    const confirmBtn = page.locator('[data-testid="confirm-choice-button"]')
    await confirmBtn.waitFor({ state: 'visible', timeout: 10000 })
    await confirmBtn.click({ force: true })

    const continueBtn = page.locator('[data-testid="continue-to-report-button"]')
    await continueBtn.waitFor({ state: 'visible', timeout: 45000 })
    const hsCards = await countVisibleOverlayCards(page)
    expect(hsCards.length, `happy_seeder end visible cards: ${JSON.stringify(hsCards)}`).toBeLessThanOrEqual(2)

    // Rewind to decision phase
    const rewindBtn = page.locator('[data-testid="what-else-rewind-button"]').first()
    await rewindBtn.waitFor({ state: 'visible', timeout: 10000 })
    await rewindBtn.click({ force: true })
    await choicePanel.waitFor({ state: 'visible', timeout: 15000 })

    // 2. Burn end-of-sequence screen
    await page.locator('[data-testid="choice-option-burn"]').click({ force: true })
    await confirmBtn.waitFor({ state: 'visible', timeout: 10000 })
    await confirmBtn.click({ force: true })
    await continueBtn.waitFor({ state: 'visible', timeout: 45000 })

    const burnCards = await countVisibleOverlayCards(page)
    expect(burnCards.length, `burn end visible cards: ${JSON.stringify(burnCards)}`).toBeLessThanOrEqual(2)

    // 3. Negative control: inject 3 visible overlay cards into DOM and prove assertion fails
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        const div = document.createElement('div')
        div.className = 'overlay-card'
        div.setAttribute('data-overlay-id', `injected_card_${i}`)
        div.textContent = `Injected Card ${i}`
        Object.assign(div.style, {
          position: 'fixed',
          left: `${20 + i * 20}px`,
          top: `${80 + i * 30}px`,
          width: '120px',
          height: '28px',
          zIndex: '9999'
        })
        document.body.appendChild(div)
      }
    })
    const injectedCards = await countVisibleOverlayCards(page)
    expect(injectedCards.length).toBeGreaterThanOrEqual(3)
    expect(() => expect(injectedCards.length).toBeLessThanOrEqual(2)).toThrow()
  })
})
