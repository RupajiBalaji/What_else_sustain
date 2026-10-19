import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    launchOptions: {
      args: ['--use-gl=swiftshader', '--enable-webgl', '--no-sandbox']
    }
  },
  projects: [
    {
      name: 'Desktop (1366x768)',
      use: {
        viewport: { width: 1366, height: 768 }
      }
    },
    {
      name: 'Mobile (390x844)',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true
      }
    }
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --host 127.0.0.1',
    port: 4173,
    reuseExistingServer: false,
    timeout: 60000
  }
})
