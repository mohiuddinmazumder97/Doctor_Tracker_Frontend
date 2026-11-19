import { chromium } from 'playwright-core';

/** Where the frontend is running (dev server or `next start`). */
export const BASE_URL = (process.env.E2E_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

/**
 * Uses an installed Chrome/Chromium instead of downloading browsers.
 * Override with CHROME_PATH, e.g. "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome".
 */
export function launchBrowser() {
  return chromium.launch({
    executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
    headless: process.env.HEADED ? false : true,
  });
}
