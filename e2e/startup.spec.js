import { test, expect } from '@playwright/test'

test.describe('Clean Startup & Runtime Verification (Item 1)', () => {
  test('App loads built bundle without any ReferenceError, page error, or ErrorBoundary crash', async ({ page }) => {
    const pageErrors = []
    const consoleErrors = []

    page.on('pageerror', (err) => {
      pageErrors.push(err.message)
    })

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Filter benign font/favicon/offline-api network messages in headless mode
        if (
          text.includes('Failed to decode downloaded font') ||
          text.includes('OTS parsing error') ||
          text.includes('favicon.ico') ||
          text.includes('net::ERR_') ||
          text.includes('the server responded with a status of 50') ||
          text.includes('/api/')
        ) {
          return
        }
        consoleErrors.push(text)
      }
    })

    // Navigate to root
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    // Wait 3 seconds for initial React mount and any lazy component / hook execution
    await page.waitForTimeout(3000)

    // Assert no ErrorBoundary container or crash text is visible
    await expect(page.locator('#error-boundary')).toHaveCount(0)
    await expect(page.getByText('Something went wrong')).toHaveCount(0)
    await expect(page.getByText('ReferenceError')).toHaveCount(0)

    // Check for "Something went wrong" in body text
    const bodyText = await page.innerText('body')
    expect(bodyText).not.toContain('Something went wrong')
    expect(bodyText).not.toContain('ReferenceError')

    // Assert strictly zero page errors and console errors
    expect(pageErrors, `Uncaught page errors on startup: ${pageErrors.join(', ')}`).toEqual([])
    expect(consoleErrors, `Browser console errors on startup: ${consoleErrors.join(', ')}`).toEqual([])
  })
})
