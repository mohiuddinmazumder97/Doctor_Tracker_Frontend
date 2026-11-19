// Regenerates the README screenshots: `npm run screenshots` (needs the seeded API + a running app,
// ideally `npm run build && npm start` so the dev-mode indicator isn't captured).
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_URL as B, launchBrowser } from './config.mjs';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'screenshots');
mkdirSync(out, { recursive: true });
const browser = await launchBrowser();

async function signIn(page) {
  await page.goto(`${B}/login`);
  await page.getByLabel('Email address').fill('admin@doctortracker.dev');
  await page.getByLabel('Password', { exact: true }).fill('Admin@12345');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(`${B}/`);
}
const settle = (page, ms = 700) => page.waitForTimeout(ms);
const shot = (page, name, fullPage = false) => page.screenshot({ path: join(out, `${name}.png`), fullPage });

// ---------- desktop, light
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
let page = await desk.newPage();
await page.goto(`${B}/login`);
await settle(page);
await shot(page, 'login');
await signIn(page);
await page.locator('.recharts-surface').nth(3).waitFor();
await settle(page, 1000);
await shot(page, 'dashboard', true);

await page.goto(`${B}/doctors`);
await page.locator('table tbody tr').filter({ visible: true }).first().waitFor();
await settle(page);
await shot(page, 'doctors');

const doctorId = await page.evaluate(async () => (await (await fetch('/api/doctors?sortBy=patientCount&order=desc&limit=1')).json()).data[0]._id);
await page.goto(`${B}/doctors/${doctorId}`);
await page.locator('#patients table tbody tr').first().waitFor();
await settle(page);
await shot(page, 'doctor-detail');
await page.getByRole('button', { name: 'Add patient' }).first().click();
await page.getByRole('dialog').waitFor();
await settle(page);
await shot(page, 'add-patient');
await page.keyboard.press('Escape');

await page.goto(`${B}/patients?condition=Asthma`);
await page.locator('table tbody tr').filter({ visible: true }).first().waitFor();
await settle(page);
await shot(page, 'patients');
await page.locator('table tbody tr').filter({ visible: true }).first().locator('a').first().click();
await page.getByText('Assigned doctor').waitFor();
await settle(page);
await shot(page, 'patient-detail');

// ---------- desktop, dark
const dark = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
page = await dark.newPage();
await page.goto(`${B}/login`);
await page.evaluate(() => localStorage.setItem('theme', 'dark'));
await signIn(page);
await page.locator('.recharts-surface').nth(3).waitFor();
await settle(page, 1000);
await shot(page, 'dashboard-dark');

// ---------- mobile
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page = await mobile.newPage();
await signIn(page);
await page.locator('.recharts-surface').first().waitFor();
await settle(page, 1000);
await shot(page, 'mobile-dashboard');
await page.getByRole('button', { name: 'Open navigation menu' }).click();
await page.getByRole('dialog').waitFor();
await settle(page);
await shot(page, 'mobile-nav');
await page.goto(`${B}/doctors`);
await page.locator('ul.divide-y li').first().waitFor();
await settle(page);
await shot(page, 'mobile-doctors');
await page.goto(`${B}/patients`);
await page.locator('ul.divide-y li a').first().click();
await page.getByText('Assigned doctor').waitFor();
await settle(page);
await shot(page, 'mobile-patient');

await browser.close();
console.log(`Screenshots written to ${out}`);
