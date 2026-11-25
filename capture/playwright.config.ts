// Capture config: records app screens for the videos. Not a test suite — no retries, no reporters
// beyond the console, no Slack. Run from capture/ (see README.md):
//   npx playwright test postnord        (store = the test repo's .env)
import { defineConfig } from '@playwright/test';
import { loadCaptureEnv } from './flows/env';

// Loads the store's env file (APPURL, USER_EMAIL, ...) into process.env before any page object
// reads it. Runs in the runner and in every worker, because both evaluate this file. A bad setting
// is reported here; flows stop on it when they start (requireCaptureEnv).
try {
  loadCaptureEnv();
} catch (e) {
  console.warn(`⚠️  ${(e as Error).message}`);
}

export default defineConfig({
  testDir: './flows',
  testMatch: /.*\.flow\.ts$/,
  outputDir: './.out',
  timeout: 15 * 60_000, // a human may need to type an OTP or solve a CAPTCHA
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  // Browsers are launched by flows/fixtures.ts, not from `use`: sign-in runs headed (Shopify blocks
  // headless logins), capture runs headless in a real 1920x1080 window at 2x (see flows/lib.ts
  // launchCapture). `viewport: null` stops Playwright's emulated viewport from being merged in.
  use: {
    channel: 'chrome',
    viewport: null,
    screenshot: 'off',
    video: 'off',
    actionTimeout: 30_000,
  },
});
