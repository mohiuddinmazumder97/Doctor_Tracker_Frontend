// Browser end-to-end suite — run with `npm run test:e2e` (see e2e/README.md).
import { BASE_URL as BASE, launchBrowser } from './config.mjs';
const shots = process.argv[2];
const B = BASE;
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('status of 4') && errors.push(m.text().slice(0, 400)));
const step = (msg) => console.log('✔', msg);
const rows = () => page.locator('table tbody tr').filter({ visible: true });
const summary = async () => (await page.locator('p[aria-live=polite]').filter({ visible: true }).innerText()).replace(/\s+/g, ' ');
async function until(fn, label, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { try { if (await fn()) return; } catch {} await page.waitForTimeout(100); }
  throw new Error('Timed out waiting for: ' + label);
}
const api = (path, init) => page.evaluate(async ([p, i]) => { const r = await fetch(p, i); return r.status === 204 ? null : r.json(); }, [path, init]);

await page.goto(`${B}/login?next=/patients`);
await page.getByLabel('Email address').fill('admin@doctortracker.dev');
await page.getByLabel('Password', { exact: true }).fill('Admin@12345');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL((u) => u.pathname === '/patients');
// cleanup leftovers
for (const p of (await api('/api/patients?search=e2e.patient')).data) await api(`/api/patients/${p._id}`, { method: 'DELETE' });
await page.reload();
await rows().first().waitFor();
const TOTAL = Number((await summary()).match(/of ([\d,]+) patients/)[1].replace(',', ''));
step(`list loaded: ${await rows().count()} rows, "${await summary()}"`);
await page.screenshot({ path: `${shots}/patients-list.png` });

// Search by phone fragment & name
const sample = (await api('/api/patients?limit=1&sortBy=fullName&order=asc')).data[0];
await page.getByLabel('Search patients').pressSequentially(sample.fullName.split(' ')[1].toLowerCase(), { delay: 30 });
await until(async () => (await rows().count()) > 0 && (await rows().allInnerTexts()).every((t) => t.toLowerCase().includes(sample.fullName.split(' ')[1].toLowerCase())), 'name search');
step(`search by last name "${sample.fullName.split(' ')[1]}" → ${await rows().count()} rows, all matching`);
await page.getByLabel('Search patients').fill(sample.phone.slice(-4));
const phoneExpected = (await api(`/api/patients?search=${sample.phone.slice(-4)}`)).meta.total;
await until(async () => new URL(page.url()).searchParams.get('search') === sample.phone.slice(-4), 'phone search url');
await until(async () => (await summary()).includes(`of ${phoneExpected} patient`), 'phone results');
const phones = await page.locator('table tbody tr').filter({ visible: true }).allInnerTexts();
step(`search by phone fragment "${sample.phone.slice(-4)}" → ${phones.length} row(s) (API: ${phoneExpected}); includes ${sample.fullName}: ${phones.some((t) => t.includes(sample.fullName))}`);
await page.getByLabel('Search patients').fill('');
await until(async () => (await summary()).includes(`of ${TOTAL.toLocaleString()} patients`), 'search cleared');

// Doctor filter via searchable picker
const doc = (await api('/api/doctors?sortBy=patientCount&order=desc&limit=1')).data[0];
await page.getByRole('combobox').filter({ hasText: 'All doctors' }).click();
await page.getByPlaceholder('Search doctors…').fill(doc.name.split(' ').pop());
await page.getByRole('option', { name: new RegExp(doc.name) }).click();
await until(async () => (await summary()).includes(`of ${doc.patientCount} patients`), 'doctor filter');
const docCol = await page.locator('table tbody tr td:nth-child(3)').filter({ visible: true }).allInnerTexts();
step(`doctor filter "${doc.name}" → ${doc.patientCount} patients; all rows show that doctor: ${docCol.every((t) => t.includes(doc.name))}`);

// Condition filter combined
await page.getByLabel('Filter by medical condition').click();
const condition = (await api(`/api/patients?doctorId=${doc._id}&limit=1`)).data[0].condition;
await page.getByRole('option', { name: condition, exact: true }).click();
const expected = (await api(`/api/patients?doctorId=${doc._id}&condition=${encodeURIComponent(condition)}`)).meta.total;
await until(async () => (await summary()).includes(`of ${expected} patient`), 'condition filter');
step(`+ condition "${condition}" → ${expected} (matches API), URL: ${decodeURIComponent(new URL(page.url()).search)}`);

// Reload keeps doctor label resolved from the URL id
await page.reload();
await page.getByRole('combobox').filter({ hasText: doc.name }).waitFor();
step('reload: doctor filter label resolved from ?doctorId (shareable URL)');

// "Add patient" from a doctor-filtered list pre-assigns that doctor
await page.getByRole('link', { name: 'Add patient' }).click();
await page.waitForURL(/\/patients\/new\?doctorId=/);
await page.getByText(`Register a new patient under ${doc.name}`).waitFor();
step('Add patient from filtered list → pre-assigned doctor');
await page.goto(`${B}/patients`);
await rows().first().waitFor();

// Date filter: registered this year preset
await page.getByRole('button', { name: 'Registered date' }).click();
await page.getByRole('button', { name: 'Last 30 days' }).click();
await until(async () => page.url().includes('from='), 'date url');
const u = new URL(page.url());
const iso = (d, end) => { const [y, m, dd] = d.split('-').map(Number); const x = new Date(y, m - 1, dd); if (end) x.setHours(23, 59, 59, 999); return x.toISOString(); };
const exp30 = (await api(`/api/patients?from=${iso(u.searchParams.get('from'))}&to=${iso(u.searchParams.get('to'), true)}`)).meta.total;
await until(async () => (await summary()).includes(`of ${exp30} patients`), 'date filter');
step(`"Last 30 days" → ${exp30} patients (matches API for local-day range)`);
await page.getByRole('button', { name: 'Clear date filter' }).click();

// Sort by age (dateOfBirth desc = youngest first)
await page.getByRole('button', { name: /^Age/ }).click();
await until(async () => page.url().includes('sortBy=dateOfBirth'), 'sort');
await page.waitForTimeout(800);
const ages = (await page.locator('table tbody tr td:nth-child(4)').filter({ visible: true }).allInnerTexts()).map((t) => parseInt(t));
step(`sort by age → ${ages.slice(0, 6).join(', ')}… ascending ages: ${ages.every((a, i) => i === 0 || ages[i - 1] <= a)}`);

// Create patient with full validation path
await page.goto(`${B}/patients/new`);
await page.getByRole('button', { name: 'Create patient' }).click();
for (const msg of ['Full name must be at least 2 characters', 'Email is required', 'Phone is required', 'Date of birth is required', 'Select a gender', 'Select a medical condition', 'Assign a doctor', 'Street is required', 'City is required', 'Country is required']) {
  await page.getByRole('alert').filter({ hasText: msg }).first().waitFor();
}
step('create form: 10 validation messages shown');
await page.screenshot({ path: `${shots}/patient-form-errors.png`, fullPage: true });
const f = (label) => page.getByLabel(label, { exact: true }).filter({ visible: true });
await f('Full name').fill('Erin E2E');
await f('Email').fill(sample.email); // duplicate
await f('Phone').fill('+1 555 222 3333');
await f('Date of birth').fill('2999-01-01');
await page.getByLabel('Other').filter({ visible: true }).check();
await f('Medical condition').click();
await page.getByRole('option', { name: 'Asthma' }).click();
await f('Assigned doctor').click();
await page.getByPlaceholder('Search doctors…').fill(doc.name.split(' ').pop());
await page.getByRole('option', { name: new RegExp(doc.name) }).click();
await f('Street address').fill('9 Elm St');
await f('City').fill('Austin');
await f('Country').fill('United States');
await page.getByRole('button', { name: 'Create patient' }).click();
await page.getByText('Date of birth cannot be in the future').waitFor();
step('future date of birth rejected client-side');
await f('Date of birth').fill('1975-06-30');
await page.getByRole('button', { name: 'Create patient' }).click();
await page.getByText('This email is already in use').waitFor();
step('duplicate patient email → 409 mapped to the email field');
await f('Email').fill('e2e.patient@playwright.dev');
await page.getByRole('button', { name: 'Create patient' }).click();
await page.waitForURL(/\/patients\/[a-f0-9]{24}$/);
const patientUrl = page.url();
await page.getByRole('heading', { name: 'Erin E2E' }).waitFor();
const dob = await page.getByText('Jun 30, 1975').count();
step(`created → detail page; DOB shown as "Jun 30, 1975" (timezone-safe): ${dob > 0}`);
await page.screenshot({ path: `${shots}/patient-detail.png`, fullPage: true });

// Navigate to assigned doctor and back
await page.getByRole('link', { name: new RegExp(doc.name) }).first().click();
await page.waitForURL(`**/doctors/${doc._id}`);
await page.locator('#patients').getByText('Erin E2E').waitFor();
step(`patient → doctor profile; new patient visible in ${doc.name}'s roster (count ${doc.patientCount + 1}: ${(await page.locator('main [data-slot=card-content]').filter({ hasText: /^Patients/ }).locator('p').last().innerText()) === String(doc.patientCount + 1)})`);
await page.goBack();
await page.waitForURL(patientUrl);

// Edit: change condition and address only
await page.getByRole('link', { name: 'Edit' }).click();
await page.waitForURL(/\/edit$/);
await f('Medical condition').click();
await page.getByRole('option', { name: 'Diabetes' }).click();
await f('City').fill('Dallas');
await page.getByRole('button', { name: 'Save changes' }).filter({ visible: true }).click();
await page.waitForURL(patientUrl);
await page.getByText('Dallas', { exact: false }).first().waitFor();
await page.locator('main').getByText('Diabetes').first().waitFor();
step('edit saved → condition & city updated on detail page');

// Reassign from patient page
await page.getByRole('button', { name: 'Reassign' }).click();
const dlg = page.getByRole('dialog');
await dlg.getByRole('combobox').click();
const opt = page.getByRole('option').first();
await opt.waitFor();
const newDoc = (await opt.locator('p').first().innerText()).trim();
await opt.click();
await dlg.getByRole('button', { name: 'Reassign patient' }).click();
await dlg.waitFor({ state: 'detached' });
await page.locator('main').getByText(newDoc).first().waitFor();
step(`reassigned from patient page → now under ${newDoc}`);

// Delete
await page.getByRole('button', { name: 'Delete' }).click();
await page.getByRole('button', { name: 'Delete patient' }).click();
await page.waitForURL(`${B}/patients`);
await page.getByText('Erin E2E was deleted').waitFor();
await until(async () => (await summary()).includes(`of ${TOTAL.toLocaleString()} patients`), 'count restored');
step(`delete → back to list, total back to ${TOTAL}`);
await page.goto(patientUrl);
await page.getByText('Patient not found').waitFor();
step('deleted patient URL → not-found state');

// Mobile
const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await ctx.storageState() })).newPage();
await m.goto(`${B}/patients`);
await m.locator('ul.divide-y li').first().waitFor();
await m.screenshot({ path: `${shots}/patients-mobile.png` });
await m.locator('ul.divide-y li a').first().click();
await m.waitForURL(/\/patients\/[a-f0-9]{24}$/);
await m.getByText('Assigned doctor').waitFor();
await m.screenshot({ path: `${shots}/patient-detail-mobile.png`, fullPage: true });
step(`mobile: list cards + detail; overflow = ${await m.evaluate(() => document.documentElement.scrollWidth > innerWidth)}`);

console.log(errors.length ? `Errors:\n${errors.join('\n')}` : 'No page errors');
await browser.close();
