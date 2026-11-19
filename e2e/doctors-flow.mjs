// Browser end-to-end suite — run with `npm run test:e2e` (see e2e/README.md).
import { BASE_URL as BASE, launchBrowser } from './config.mjs';
const shots = process.argv[2];
const B = BASE;
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('status of 4') && errors.push(m.text()));
const doctorRequests = [];
page.on('request', (r) => { const u = new URL(r.url()); if (u.pathname === '/api/doctors') doctorRequests.push(u.search); });
const step = (msg) => console.log('✔', msg);
const rows = () => page.locator('table tbody tr');
const waitIdle = () => page.waitForLoadState('networkidle');
async function until(fn, label, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { try { if (await fn()) return; } catch {} await page.waitForTimeout(100); }
  throw new Error('Timed out waiting for: ' + label);
}
const summary = async () => (await page.locator('p[aria-live=polite]').innerText()).replace(/\s+/g, ' ');

// Login
await page.goto(`${B}/login?next=/doctors`);
await page.getByLabel('Email address').fill('admin@doctortracker.dev');
await page.getByLabel('Password', { exact: true }).fill('Admin@12345');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL((u) => u.pathname === '/doctors');
// Remove leftovers from interrupted runs (patients first — doctors with patients can't be deleted).
await page.evaluate(async () => {
  const get = async (u) => { const r = await fetch(u); const j = await r.json(); if (!j.success) throw new Error(u + ' -> ' + r.status + ' ' + JSON.stringify(j.error)); return j; };
  const pats = await get('/api/patients?search=pat.e2e@playwright.dev');
  for (const p of pats.data) await fetch('/api/patients/' + p._id, { method: 'DELETE' });
  const docs = await get('/api/doctors?search=e2e.tester@playwright.dev');
  for (const d of docs.data) await fetch('/api/doctors/' + d._id, { method: 'DELETE' });
});
await page.reload();
await rows().first().waitFor();
const TOTAL = (await summary()).match(/of (\d+) doctors/)[1];
step(`list loaded: ${await rows().count()} rows, "${await summary()}"`);
await page.screenshot({ path: `${shots}/doctors-list.png` });

// Debounced search: typing "cardio" quickly should produce ONE search request
doctorRequests.length = 0;
await page.getByLabel('Search doctors').pressSequentially('cardio', { delay: 40 });
const t0 = Date.now();
await until(async () => (await summary()).includes('of 5 doctors'), 'search results');
await waitIdle();
console.log('  (results updated', Date.now() - t0, 'ms after last keystroke; includes 350ms debounce)');
const searchReqs = doctorRequests.filter((q) => q.includes('search='));
step(`debounced search → ${searchReqs.length} API request(s) for 6 keystrokes; ${await rows().count()} rows`);

// Specialization filter + clear
await page.getByLabel('Search doctors').fill('');
await page.waitForURL((u) => !u.search.includes('search='));
await page.getByLabel('Filter by specialization').click();
await page.getByRole('option', { name: 'Pediatrics' }).click();
await page.waitForURL(/specialization=Pediatrics/);
await until(async () => (await summary()).includes('of 3 doctors'), 'specialization filter');
const specs = await page.locator('table tbody tr td:nth-child(2)').allInnerTexts();
step(`specialization filter → ${specs.length} rows, all Pediatrics: ${specs.every((s) => s.includes('Pediatrics'))}`);
await page.goBack();
await until(async () => (await summary()).includes(`of ${TOTAL} doctors`) && !page.url().includes('specialization'), 'back button');
step('browser Back undoes the filter');
await page.goForward();
await until(async () => (await summary()).includes('of 3 doctors'), 'forward');
await page.getByRole('button', { name: 'Clear filters' }).first().click();
await until(async () => (await summary()).includes(`of ${TOTAL} doctors`), 'clear');
step('clear filters resets URL: ' + page.url());

// Sort by patients
await page.getByRole('button', { name: /^Patients/ }).click();
await page.waitForURL(/sortBy=patientCount&order=desc/);
await until(async () => (await page.locator('table tbody tr td:nth-child(4)').first().innerText()) === '22', 'sorted');
const counts = (await page.locator('table tbody tr td:nth-child(4)').allInnerTexts()).map(Number);
step(`sort by patients desc → ${counts.slice(0, 5).join(', ')}… sorted: ${counts.every((c, i) => i === 0 || counts[i - 1] >= c)}`);

// Pagination + page size, survives reload
await page.getByRole('button', { name: 'Page 2' }).click();
await page.waitForURL(/page=2/);
await until(async () => (await summary()).startsWith('11–20'), 'page 2');
const p2 = await summary();
await page.reload();
await rows().first().waitFor();
step(`page 2 → "${p2}"; after reload still "${await summary()}"`);
await page.getByLabel('Rows per page').click();
await page.getByRole('option', { name: '20' }).click();
await page.waitForURL((u) => u.searchParams.get('limit') === '20' && !u.searchParams.has('page'));
await until(async () => (await rows().count()) === 20, '20 rows');
step(`page size 20 → ${await rows().count()} rows, page reset to 1`);

// Create doctor: validation, duplicate email, success
const existingEmail = await page.locator('table tbody tr').first().locator('p.text-xs').innerText();
await page.goto(`${B}/doctors/new`);
await page.getByRole('button', { name: 'Create doctor' }).click();
await page.getByRole('alert').filter({ hasText: 'Select a specialization' }).waitFor();
for (const msg of ['Name must be at least 2 characters', 'Hospital must be at least 2 characters', 'Phone is required', 'Email is required']) await page.getByText(msg).waitFor();
step('create form: all client validation messages shown');
await page.screenshot({ path: `${shots}/doctor-form-errors.png` });
await page.getByLabel('Full name').fill('Dr. E2E Tester');
await page.getByLabel('Specialization').click();
await page.getByRole('option', { name: 'Neurology' }).click();
await page.getByLabel('Hospital').fill('Playwright General');
await page.getByLabel('Phone').fill('+1 (555) 010-2020');
await page.getByLabel('Email').fill(existingEmail.toUpperCase());
await page.getByRole('button', { name: 'Create doctor' }).click();
await page.getByText('This email is already in use').waitFor();
step(`duplicate email (${existingEmail}, typed uppercase) → server 409 shown on the email field`);
await page.getByLabel('Email').fill('e2e.tester@playwright.dev');
await page.getByRole('button', { name: 'Create doctor' }).click();
await page.waitForURL(/\/doctors\/[a-f0-9]{24}$/);
const doctorUrl = page.url();
await page.getByRole('heading', { name: 'Dr. E2E Tester' }).waitFor();
step(`created → detail page; breadcrumb: ${(await page.locator('nav[aria-label="breadcrumb"]').innerText()).replace(/\s+/g, ' ')}`);
await page.getByText('No patients yet').waitFor();
step('empty patients state shown');

// Add patient from doctor page
await page.getByRole('button', { name: 'Add patient' }).first().click();
const sheet = page.getByRole('dialog');
await sheet.getByRole('button', { name: 'Add patient' }).click();
await sheet.getByText('Full name must be at least 2 characters').waitFor();
await sheet.getByText('Select a medical condition').waitFor();
step('add-patient sheet validates');
await sheet.getByLabel('Full name').fill('Pat E2E');
await sheet.getByLabel('Email').fill('pat.e2e@playwright.dev');
await sheet.getByLabel('Phone').fill('555 123 4567');
await sheet.getByLabel('Date of birth').fill('1988-04-12');
await sheet.getByLabel('Female').check();
await sheet.getByLabel('Medical condition').click();
await page.getByRole('option', { name: 'Migraine' }).click();
await sheet.getByLabel('Street address').fill('1 Test Lane');
await sheet.getByLabel('City').fill('Boston');
await sheet.getByLabel('Country').fill('United States');
await page.screenshot({ path: `${shots}/add-patient-sheet.png` });
await sheet.getByRole('button', { name: 'Add patient' }).click();
await sheet.waitFor({ state: 'detached' });
await page.locator('#patients').getByText('Pat E2E').waitFor();
await page.getByText('1 patient under this doctor’s care').waitFor();
const statCount = await page.locator('main [data-slot=card-content]').filter({ hasText: /^Patients/ }).locator('p').last().innerText();
step(`patient added → appears in roster; stat card shows ${statCount}`);
await page.screenshot({ path: `${shots}/doctor-detail.png`, fullPage: true });

// Delete blocked while patient assigned
await page.getByRole('button', { name: 'Delete' }).click();
await page.getByText('can’t be deleted yet').waitFor();
step('delete blocked dialog: "' + (await page.getByRole('alertdialog').locator('p').first().innerText()).slice(0, 60) + '…"');
await page.getByRole('alertdialog').getByRole('button', { name: 'Close', exact: true }).click();

// Reassign patient away
await page.getByRole('button', { name: 'Actions for Pat E2E' }).click();
await page.getByRole('menuitem', { name: 'Reassign to another doctor' }).click();
const dlg = page.getByRole('dialog');
await dlg.getByRole('combobox').click();
await page.getByPlaceholder('Search doctors…').fill('miller');
const option = page.getByRole('option').first();
await option.waitFor();
const targetName = (await option.locator('p').first().innerText()).trim();
await option.click();
await dlg.getByRole('button', { name: 'Reassign patient' }).click();
await dlg.waitFor({ state: 'detached' });
await page.getByText('No patients yet').waitFor();
step(`reassigned to "${targetName}" (server search) → roster empty again`);

// Edit doctor
await page.getByRole('link', { name: 'Edit' }).click();
await page.waitForURL(/\/edit$/);
const save = page.getByRole('button', { name: 'Save changes' }).filter({ visible: true });
step(`edit form: save disabled until changed = ${await save.isDisabled()}`);
await page.getByLabel('Hospital').filter({ visible: true }).fill('Playwright Medical Center');
await save.click();
await page.waitForURL(doctorUrl);
await page.getByText('Playwright Medical Center').first().waitFor();
step('edit saved → detail shows updated hospital');

// Delete doctor (now allowed)
await page.getByRole('button', { name: 'Delete' }).click();
await page.getByRole('button', { name: 'Delete doctor' }).click();
await page.waitForURL(`${B}/doctors`);
await page.getByText('Dr. E2E Tester was deleted').waitFor();
step('delete → back to list with toast');
await page.goto(doctorUrl);
await page.getByText('Doctor not found').waitFor();
step('deleted doctor URL shows not-found state');

// Cleanup: remove the test patient via the API (same-origin, cookie auth)
const cleanup = await page.evaluate(async () => {
  const r = await fetch('/api/patients?search=pat.e2e@playwright.dev').then((x) => x.json());
  for (const p of r.data) await fetch(`/api/patients/${p._id}`, { method: 'DELETE' });
  return r.data.map((p) => p.doctor.name);
});
step(`cleanup: test patient (was under ${cleanup.join(', ')}) deleted`);

// Mobile list
const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await ctx.storageState() })).newPage();
await m.goto(`${B}/doctors`);
await m.locator('ul.divide-y li').first().waitFor();
await m.screenshot({ path: `${shots}/doctors-mobile.png`, fullPage: false });
step(`mobile: ${await m.locator('ul.divide-y li').count()} cards, horizontal overflow = ${await m.evaluate(() => document.documentElement.scrollWidth > innerWidth)}`);

console.log(errors.length ? `Errors:\n${errors.join('\n')}` : 'No page errors');
await browser.close();
