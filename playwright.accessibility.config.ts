import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

const reporter = process.env.CI
  ? [['list'] as const, ['json', { outputFile: 'audit-output/accessibility.json' }] as const]
  : [['list'] as const, ['html', { outputFolder: 'audit-output/accessibility-report', open: 'never' }] as const];

export default defineConfig({
  testDir: './e2e',
  testMatch: /accessibility\.spec\.ts/,
  outputDir: 'test-results/accessibility-tests',
  fullyParallel: true,
  workers: Number(process.env.PLAYWRIGHT_A11Y_WORKERS ?? 1),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter,
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: 'npm --prefix server run dev',
          cwd: ROOT,
          port: 3001,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
        {
          command: 'npx vite --port 5173',
          cwd: ROOT,
          port: 5173,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
