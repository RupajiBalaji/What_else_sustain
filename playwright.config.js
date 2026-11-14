import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 400000,
  expect: {
    timeout: 15000
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROME_PATH || undefined,
      args: ['--use-gl=swiftshader', '--enable-webgl', '--no-sandbox']
    }
  },
  projects: [
    {
      name: 'Phone (360x640)',
      use: {
        viewport: { width: 360, height: 640 },
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: 'Phone (390x844)',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: 'Phone (412x915)',
      use: {
        viewport: { width: 412, height: 915 },
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: 'Desktop (1366x768)',
      use: {
        viewport: { width: 1366, height: 768 }
      }
    },
    {
      name: 'Desktop (1920x1080)',
      use: {
        viewport: { width: 1920, height: 1080 }
      }
    }
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --host 127.0.0.1',
    port: 4173,
    reuseExistingServer: false,
    timeout: 120000
  }
})
