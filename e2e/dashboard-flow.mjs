// Browser end-to-end suite — run with `npm run test:e2e` (see e2e/README.md).
import { BASE_URL as BASE, launchBrowser } from './config.mjs';
const shots = process.argv[2];
const B = BASE;
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && !/status of (4|5)\d\d|net::ERR_FAILED/.test(m.text()) && errors.push(m.text().slice(0, 300)));
const step = (msg) => console.log('✔', msg);
async function until(fn, label, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { try { if (await fn()) return; } catch {} await page.waitForTimeout(100); }
  throw new Error('Timed out waiting for: ' + label);
}
const api = (path, init) => page.evaluate(async ([p, i]) => { const r = await fetch(p, i); return r.status === 204 ? null : r.json(); }, [path, init]);
const card = (title) => page.locator('[data-slot=card]').filter({ has: page.getByText(title, { exact: true }) });
const tileValue = async (label) => Number((await card(label).locator('p').nth(1).innerText()).replace(/,/g, ''));
const tz = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

await page.goto(`${B}/login`);
await page.getByLabel('Email address').fill('admin@doctortracker.dev');
await page.getByLabel('Password', { exact: true }).fill('Admin@12345');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL(`${B}/`);
// Remove leftovers from interrupted runs, then load fresh.
for (const p of (await api('/api/patients?search=dash.e2e@playwright.dev')).data) await api(`/api/patients/${p._id}`, { method: 'DELETE' });
await page.reload();
await page.locator('.recharts-surface').nth(3).waitFor({ timeout: 20000 });

// 1. KPI tiles match the API
const ov = (await api(`/api/dashboard/overview?tz=${tz}`)).data;
const kpis = { doctors: await tileValue('Total doctors'), patients: await tileValue('Total patients'), newDoctors: await tileValue('New doctors this month'), newPatients: await tileValue('New patients this month') };
const ok = kpis.doctors === ov.totals.doctors && kpis.patients === ov.totals.patients && kpis.newDoctors === ov.thisMonth.doctors && kpis.newPatients === ov.thisMonth.patients;
step(`KPI tiles match API: ${ok} ${JSON.stringify(kpis)}`);

// 2. Trend header total matches API sum
const trendDesc = async () => card('Patient registrations').locator('[data-slot=card-description]').innerText();
const trendTotal = async () => Number((await trendDesc()).match(/([\d,]+) new patient/)[1].replace(/,/g, ''));
const from12 = await page.evaluate(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth() - 11, 1).toISOString(); });
const apiTrend = (await api(`/api/dashboard/patient-trends?interval=month&tz=${tz}&from=${from12}`)).data;
step(`trend total ${await trendTotal()} = API ${apiTrend.total} (sum of ${apiTrend.points.length} buckets = ${apiTrend.points.reduce((s, p) => s + p.count, 0)})`);

// 3. Tooltip with crosshair on hover
const plot = card('Patient registrations').locator('.recharts-surface');
const box = await plot.boundingBox();
await page.mouse.move(box.x + box.width * 0.93, box.y + box.height * 0.5);
const tip = page.locator('.recharts-tooltip-wrapper').filter({ hasText: 'registration' }).first();
await tip.waitFor();
step(`trend hover tooltip: "${(await tip.innerText()).replace(/\s+/g, ' ')}"`);

// 4. Table view toggle (conditions → every condition listed)
await card('Medical conditions').getByRole('button', { name: 'Table view' }).click();
const condRows = await card('Medical conditions').locator('tbody tr').count();
const apiCond = (await api(`/api/dashboard/condition-distribution?tz=${tz}&from=${from12}`)).data;
step(`conditions table view: ${condRows} rows (API: ${apiCond.items.length} conditions; donut shows top 5 + Other)`);
await card('Medical conditions').getByRole('button', { name: 'Chart view' }).click();

// 5. Period filter scopes every chart
const before = { trend: await trendDesc(), spec: await card('Doctors by specialization').locator('[data-slot=card-description]').innerText() };
await page.getByLabel('Analytics period').click();
await page.getByRole('option', { name: 'Last 30 days' }).click();
await until(async () => page.url().includes('period=30d'), 'period url');
await until(async () => (await trendDesc()) !== before.trend, 'trend refetched');
const pts30 = (await api(`/api/dashboard/patient-trends?interval=day&tz=${tz}&from=${await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return d.toISOString(); })}`)).data;
await until(async () => (await trendTotal()) === pts30.total, 'trend 30d total');
step(`period → 30 days: trend "${await trendDesc()}" (API ${pts30.total} over ${pts30.points.length} daily buckets); Day granularity active: ${await card('Patient registrations').getByRole('radio', { name: 'Day' }).getAttribute('aria-checked')}`);
step(`specialization card rescoped: "${before.spec}" → "${await card('Doctors by specialization').locator('[data-slot=card-description]').innerText()}"`);

// 6. Granularity toggle
await card('Patient registrations').getByRole('radio', { name: 'Week' }).click();
await until(async () => page.url().includes('interval=week'), 'interval url');
const monthDisabled = await card('Patient registrations').getByRole('radio', { name: 'Month' }).isDisabled();
step(`granularity → week (URL updated); "Month" disabled for a 30-day period: ${monthDisabled}`);
await page.getByLabel('Analytics period').click();
await page.getByRole('option', { name: 'Last 12 months' }).click();
await until(async () => page.url().includes('period=12m') && !page.url().includes('interval='), 'reset');
await until(async () => (await trendTotal()) === apiTrend.total, 'back on the 12-month total');

// 7. Charts update when data changes (UI mutation → invalidation)
const topDoctor = apiTrend && (await api(`/api/dashboard/doctor-distribution?limit=1&tz=${tz}&from=${from12}`)).data.items[0];
const beforeChange = { patients: await tileValue('Total patients'), newPatients: await tileValue('New patients this month'), trend: await trendTotal() };
await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Doctors' }).click();
await page.waitForURL(`${B}/doctors`);
await page.goto(`${B}/doctors/${topDoctor.doctorId}`); // detail page, via the dashboard's top doctor
await page.getByRole('button', { name: 'Add patient' }).first().click();
const sheet = page.getByRole('dialog');
await sheet.getByLabel('Full name').fill('Dash E2E');
await sheet.getByLabel('Email').fill('dash.e2e@playwright.dev');
await sheet.getByLabel('Phone').fill('555 987 6543');
await sheet.getByLabel('Date of birth').fill('1990-02-02');
await sheet.getByLabel('Male', { exact: true }).check();
await sheet.getByLabel('Medical condition').click();
await page.getByRole('option', { name: 'Thyroid Disorder' }).click();
await sheet.getByLabel('Street address').fill('5 Oak St');
await sheet.getByLabel('City').fill('Denver');
await sheet.getByLabel('Country').fill('United States');
await sheet.getByRole('button', { name: 'Add patient' }).click();
await sheet.waitFor({ state: 'detached' });
await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Dashboard' }).click(); // client-side navigation, no reload
await page.waitForURL(`${B}/`);
await until(async () => (await tileValue('Total patients')) === beforeChange.patients + 1, 'total +1');
await until(async () => (await trendTotal()) === beforeChange.trend + 1, 'trend +1');
step(`after creating a patient in the UI: total ${beforeChange.patients}→${await tileValue('Total patients')}, new this month ${beforeChange.newPatients}→${await tileValue('New patients this month')}, trend ${beforeChange.trend}→${await trendTotal()} (no reload)`);

// 8. Delete it again via UI → dashboard decrements
await page.goto(`${B}/patients?search=dash.e2e@playwright.dev`);
await page.getByRole('button', { name: 'Actions for Dash E2E' }).click();
await page.getByRole('menuitem', { name: 'Delete' }).click();
await page.getByRole('button', { name: 'Delete patient' }).click();
await page.getByText('Dash E2E was deleted').waitFor();
await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Dashboard' }).click();
await until(async () => (await tileValue('Total patients')) === beforeChange.patients, 'total restored');
step(`after deleting it: total back to ${await tileValue('Total patients')}`);

// 9. Bar click-through
const firstBar = card('Patients per doctor').locator('.recharts-bar-rectangle').first();
await firstBar.scrollIntoViewIfNeeded();
const bb = await firstBar.boundingBox();
await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
await page.waitForTimeout(250);
await page.mouse.down();
await page.mouse.up();
await page.waitForURL(`**/doctors/${topDoctor.doctorId}`);
step(`clicking the top bar opens ${topDoctor.name}'s profile`);

// 10. Error state + retry (simulated API failure on one chart)
await page.route('**/api/dashboard/condition-distribution**', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Simulated outage' } }) }));
await page.goto(`${B}/`);
await card('Medical conditions').getByText('Couldn’t load this chart').waitFor({ timeout: 20000 });
const otherChartsOk = await card('Patients per doctor').locator('.recharts-surface').count();
step(`simulated 500 on one chart → its card shows an error; other charts still render: ${otherChartsOk > 0}`);
await page.screenshot({ path: `${shots}/dashboard-error.png` });
await page.unroute('**/api/dashboard/condition-distribution**');
await card('Medical conditions').getByRole('button', { name: 'Try again' }).click();
await card('Medical conditions').locator('.recharts-surface').waitFor();
step('"Try again" recovers the chart');

// 11. Empty state (simulated empty period)
await page.route('**/api/dashboard/patient-trends**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { interval: 'day', tz, from: '', to: '', total: 0, points: [] } }) }));
await page.goto(`${B}/?period=7d`);
await card('Patient registrations').getByText('No registrations in this period').waitFor();
step('empty period → empty state in the trend card');
await page.unroute('**/api/dashboard/patient-trends**');

console.log(errors.length ? `Errors:\n${errors.join('\n')}` : 'No page errors');
await browser.close();
