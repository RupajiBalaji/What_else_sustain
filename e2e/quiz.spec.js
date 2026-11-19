// @ts-check
import { test, expect } from '@playwright/test'

test.describe('Quiz Comparability & Flow (ITEM-4)', () => {
  test('verifies pre-check 5 questions, post-check 5 questions, and honest results view', async ({ page }) => {
    // Collect console errors (excluding benign offline backend 500s)
    const errors = []
    page.on('pageerror', (err) => {
      const msg = err.message || String(err)
      if (!msg.includes('/api/') && !msg.includes('Failed to load resource') && !msg.includes('500')) {
        errors.push(`PageError: ${msg}`)
      }
    })
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (!text.includes('/api/') && !text.includes('Failed to load resource') && !text.includes('500')) {
          errors.push(`ConsoleError: ${text}`)
        }
      }
    })

    await page.goto('/?noFpsFallback=1')

    // Quick Play to Straw Decision
    const quickPlayBtn = page.locator('[data-testid="start-quick-play-button"]').first()
    await expect(quickPlayBtn).toBeVisible({ timeout: 25000 })
    await quickPlayBtn.click()

    // Pre-check quiz must open before the decision
    const quizModal = page.locator('[data-testid="quiz-modal"]')
    await expect(quizModal).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=Question 1 of 5')).toBeVisible()

    // Answer 5 questions in pre-check (intentionally get 2 right)
    for (let q = 1; q <= 5; q++) {
      await expect(page.locator(`text=Question ${q} of 5`)).toBeVisible()
      // Pick option 1 for all
      const opt = page.locator('[data-testid="quiz-option-0"]')
      await opt.click()
      const nextBtn = page.locator('[data-testid="quiz-next-button"]')
      await nextBtn.click()
    }

    // Modal should close and decision phase should be reachable
    await expect(quizModal).toBeHidden({ timeout: 5000 })

    // Dismiss director local hint if visible
    const hintDismiss = page.locator('[data-testid="dismiss-local-hint-button"]')
    if (await hintDismiss.isVisible({ timeout: 2000 }).catch(() => false)) {
      await hintDismiss.click()
    }

    // Select Burn option and confirm
    const burnBtn = page.locator('[data-testid="choice-option-burn"], button:has-text("Burn")').first()
    await expect(burnBtn).toBeVisible({ timeout: 15000 })
    await burnBtn.click({ force: true })

    const confirmChoiceBtn = page.locator('[data-testid="confirm-choice-button"]')
    if (await confirmChoiceBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmChoiceBtn.click({ force: true })
    }

    // Wait for burn to complete and continue to report
    const continueBtn = page.locator('[data-testid="continue-to-report-button"]')
    await expect(continueBtn).toBeVisible({ timeout: 35000 })
    await continueBtn.click({ force: true })

    // Season Report opens
    const nextSeasonBtn = page.locator('[data-testid="next-season-button"]')
    await expect(nextSeasonBtn).toBeVisible({ timeout: 15000 })
    await nextSeasonBtn.click()

    // Post-check quiz modal must automatically appear
    await expect(quizModal).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Question 1 of 5')).toBeVisible()

    // Answer 5 questions in post-check
    for (let q = 1; q <= 5; q++) {
      await expect(page.locator(`text=Question ${q} of 5`)).toBeVisible()
      const opt = page.locator('[data-testid="quiz-option-0"]')
      await opt.click()
      const nextBtn = page.locator('[data-testid="quiz-next-button"]')
      await nextBtn.click()
    }

    // Results card must be rendered
    const resultsCard = page.locator('[data-testid="quiz-results-card"]')
    await expect(resultsCard).toBeVisible({ timeout: 10000 })

    // Assert pre-score and post-score out of 5
    const preScore = page.locator('[data-testid="quiz-pre-score"]')
    const postScore = page.locator('[data-testid="quiz-post-score"]')
    const deltaScore = page.locator('[data-testid="quiz-delta-score"]')
    const feedbackMsg = page.locator('[data-testid="quiz-feedback-message"]')

    await expect(preScore).toContainText('/ 5')
    await expect(postScore).toContainText('/ 5')
    await expect(deltaScore).toBeVisible()
    await expect(feedbackMsg).toBeVisible()

    // Capture screenshot of results card
    await page.screenshot({ path: 'tests/screenshots/quiz-results.png' })

    // Finish results view
    const finishBtn = page.locator('[data-testid="finish-quiz-results-btn"]')
    await finishBtn.click()
    await expect(quizModal).toBeHidden({ timeout: 5000 })

    expect(errors).toHaveLength(0)
  })
})
