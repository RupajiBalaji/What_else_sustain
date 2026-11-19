import { test, expect } from '@playwright/test'

test.describe('Scenario Director E2E Suite (Item 3)', () => {
  test('picks two different farms and asserts village sign and first featured alternative differ (AI mocked)', async ({ page }) => {
    // 1. Mock API fallbacks
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) })
    })

    // 2. Mock the Director API dynamically
    await page.route('**/api/director/scenario', async (route) => {
      const postData = route.request().postDataJSON() || {}
      const state = postData.state || 'Punjab'

      if (state === 'Telangana') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            villageName: 'Warangal',
            introStory: 'Paddy harvest across Telangana has concluded. Heat requires moisture retention.',
            whyPeopleBurnHere: 'traditional_habit',
            featuredAlternatives: ['mulch', 'bio_decomposer', 'bale_sell', 'happy_seeder'],
            localHint: 'hint_soil_moisture',
            eventSuggestion: 'air_quality_alert'
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            villageName: 'Rupnagar',
            introStory: 'Combine harvesters across Punjab have left tall standing stubble.',
            whyPeopleBurnHere: 'short_window',
            featuredAlternatives: ['happy_seeder', 'bale_sell', 'mulch', 'bio_decomposer'],
            localHint: 'hint_happy_seeder',
            eventSuggestion: 'early_frost'
          })
        })
      }
    })

    // Test Farm 1: Default Punjab
    await page.goto('/?noFpsFallback=1')

    // Verify intro story card on loading screen
    const introStory = page.locator('[data-testid="season-intro-story"]')
    await introStory.waitFor({ state: 'visible', timeout: 30000 })
    await expect(introStory).toContainText('Punjab')

    // Start Quick Play
    const quickPlayBtn = page.locator('[data-testid="start-quick-play-button"]').first()
    await quickPlayBtn.click()

    console.log('[DIRECTOR TEST] Quick Play clicked')
    // If Pre-Check Quiz appears, skip for now to proceed with director assertions
    const skipQuizBtn = page.locator('[data-testid="skip-quiz-button"]')
    try {
      await skipQuizBtn.waitFor({ state: 'visible', timeout: 5000 })
      await skipQuizBtn.click()
      console.log('[DIRECTOR TEST] Quiz skipped')
    } catch {
      // Quiz was not shown or already skipped
    }

    console.log('[DIRECTOR TEST] Waiting for village sign...')
    // Verify Village Sign on Arch
    const villageSign = page.locator('[data-testid="village-sign-text"]').first()
    await villageSign.waitFor({ state: 'attached', timeout: 30000 })
    console.log('[DIRECTOR TEST] Village sign attached, checking text...')
    const punjabVillage = await villageSign.textContent()
    expect(punjabVillage).toContain('Rupnagar')
    console.log('[DIRECTOR TEST] Village sign text verified:', punjabVillage)

    console.log('[DIRECTOR TEST] Waiting for choice panel...')
    // Verify Choice Panel has Happy Seeder as top featured suggestion
    const choicePanel = page.locator('[data-testid="in-world-choice-panel"]')
    await choicePanel.waitFor({ state: 'visible', timeout: 30000 })
    console.log('[DIRECTOR TEST] Choice panel visible')
    const happySeederBtn = page.locator('[data-testid="choice-option-happy_seeder"]')
    await expect(happySeederBtn).toBeVisible()
    await expect(happySeederBtn.locator('[data-testid="suggested-badge"]')).toBeVisible()
    console.log('[DIRECTOR TEST] Happy seeder verified')

    // Verify Local Advisory Hint card is present and dismissible
    console.log('[DIRECTOR TEST] Checking hint card...')
    const hintCard = page.locator('[data-testid="director-local-hint"]')
    await hintCard.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
    if (await hintCard.isVisible()) {
      console.log('[DIRECTOR TEST] Hint card is visible, taking screenshot & clicking dismiss...')
      const vp = page.viewportSize()
      if (vp && vp.width === 360) {
        await page.screenshot({ path: 'tests/screenshots/360x640-local-hint.png' })
      }
      const dismissBtn = page.locator('[data-testid="dismiss-local-hint-button"]')
      await dismissBtn.waitFor({ state: 'visible', timeout: 5000 })
      await dismissBtn.click({ force: true })
      await expect(hintCard).toBeHidden({ timeout: 5000 })
      console.log('[DIRECTOR TEST] Hint card dismissed successfully!')
    }

    // Now change to Farm 2: Telangana
    console.log('[DIRECTOR TEST] Opening settings drawer...')
    const settingsBtn = page.locator('[data-testid="settings-toggle-button"]').first()
    await settingsBtn.click()
    const settingsDrawer = page.locator('[data-testid="settings-drawer"]')
    await settingsDrawer.waitFor({ state: 'visible', timeout: 10000 })
    console.log('[DIRECTOR TEST] Settings drawer visible')

    console.log('[DIRECTOR TEST] Clicking change farm button...')
    const changeFarmBtn = page.locator('[data-testid="settings-change-farm-btn"]')
    await changeFarmBtn.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await changeFarmBtn.click()

    console.log('[DIRECTOR TEST] Waiting for your farm modal...')
    const yourFarmModal = page.locator('[data-testid="your-farm-modal"]')
    await yourFarmModal.waitFor({ state: 'visible', timeout: 10000 })

    console.log('[DIRECTOR TEST] Selecting Telangana...')
    const stateSelect = page.locator('[data-testid="your-farm-state-select"]')
    await stateSelect.selectOption('Telangana')
    const confirmFarmBtn = page.locator('[data-testid="your-farm-confirm-btn"]')
    await confirmFarmBtn.scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    await confirmFarmBtn.click()
    await expect(yourFarmModal).toBeHidden()

    console.log('[DIRECTOR TEST] Closing settings drawer...')
    const closeBtn = page.locator('button[aria-label="Close settings"]')
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click()
    }
    await expect(settingsDrawer).toBeHidden()

    console.log('[DIRECTOR TEST] Asserting village sign is Warangal...')
    await expect(villageSign).toContainText('Warangal', { timeout: 15000 })
    const telanganaVillage = await villageSign.textContent()

    // Assert the two village signs differ
    expect(punjabVillage).not.toEqual(telanganaVillage)
    console.log('[DIRECTOR TEST] Farm 1 and Farm 2 village names differ:', punjabVillage, 'vs', telanganaVillage)

    // Assert Choice Panel first alternative is now Mulch with Suggested badge
    const mulchBtn = page.locator('[data-testid="choice-option-mulch"]')
    await expect(mulchBtn.locator('[data-testid="suggested-badge"]')).toBeVisible()
    console.log('[DIRECTOR TEST] Test 1 passed successfully!')
  })

  test('asserts fallback loads cleanly and offline scenario tag appears when AI is unreachable', async ({ page }) => {
    // API fallbacks
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) })
    })

    // Force director API to fail
    await page.route('**/api/director/scenario', async (route) => {
      await route.abort('failed')
    })

    // Set initial farm profile in localStorage to Uttar Pradesh
    await page.addInitScript(() => {
      localStorage.setItem('wes_farm_config', JSON.stringify({ state: 'Uttar Pradesh', crop: 'Paddy', acres: 5 }))
    })

    await page.goto('/?noFpsFallback=1')

    // Verify fallback village name on loading screen / sign
    const quickPlayBtn = page.locator('[data-testid="start-quick-play-button"]').first()
    await quickPlayBtn.waitFor({ state: 'visible', timeout: 30000 })
    await quickPlayBtn.click()

    const skipQuizBtn = page.locator('[data-testid="skip-quiz-button"]')
    try {
      await skipQuizBtn.waitFor({ state: 'visible', timeout: 5000 })
      await skipQuizBtn.click()
    } catch {
      // Quiz was not shown or already skipped
    }

    // Verify village sign defaulted to Meerut (UP fallback)
    const villageSign = page.locator('[data-testid="village-sign-text"]').first()
    await villageSign.waitFor({ state: 'visible', timeout: 30000 })
    await expect(villageSign).toContainText('Meerut')

    // Open settings drawer and verify "offline scenario" tag appears
    const settingsBtn = page.locator('[data-testid="settings-toggle-button"]').first()
    await settingsBtn.click()
    const offlineTag = page.locator('[data-testid="offline-scenario-tag"]')
    await expect(offlineTag).toBeVisible({ timeout: 10000 })
  })
})
