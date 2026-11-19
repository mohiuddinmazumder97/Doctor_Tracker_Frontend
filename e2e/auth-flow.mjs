// Browser end-to-end suite — run with `npm run test:e2e` (see e2e/README.md).
import { BASE_URL as BASE, launchBrowser } from './config.mjs';
const shots = process.argv[2];
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
const step = (msg) => console.log('✔', msg);

// 1. Protected deep link → login with ?next
await page.goto(`${BASE}/doctors?page=2`);
await page.waitForURL(/\/login\?next=/);
step(`redirected to ${new URL(page.url()).pathname}${new URL(page.url()).search}`);
await page.screenshot({ path: `${shots}/login-desktop.png` });

// 2. Client validation
await page.getByRole('button', { name: 'Sign in' }).click();
await page.getByText('Email is required').waitFor();
await page.getByText('Password is required').waitFor();
step('client-side validation messages shown');
await page.getByLabel('Email address').fill('not-an-email');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.getByText('Enter a valid email address').waitFor();
step('invalid email format rejected');

// 3. Wrong password → server error banner
await page.getByLabel('Email address').fill('admin@doctortracker.dev');
await page.getByLabel('Password', { exact: true }).fill('wrong-password');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.getByText('Invalid email or password').waitFor();
step('server error shown for wrong password');
await page.screenshot({ path: `${shots}/login-error.png` });

// 4. Password visibility toggle
await page.getByLabel('Password', { exact: true }).fill('Admin@12345');
await page.getByRole('button', { name: 'Show password' }).click();
if ((await page.getByLabel('Password', { exact: true }).getAttribute('type')) !== 'text') throw new Error('toggle failed');
step('password visibility toggle works');

// 5. Successful login → back to the deep link
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL('**/doctors?page=2');
step(`logged in and returned to ${new URL(page.url()).pathname}${new URL(page.url()).search}`);
const cookies = await ctx.cookies();
const c = cookies.find((x) => x.name === 'dt_access_token');
step(`cookie httpOnly=${c?.httpOnly} sameSite=${c?.sameSite}; readable by JS: ${await page.evaluate(() => document.cookie.includes('dt_access_token'))}`);

// 6. Shell: user menu shows admin, active nav, breadcrumbs
await page.getByRole('button', { name: 'Account menu' }).waitFor();
step(`top bar shows "${(await page.getByRole('button', { name: 'Account menu' }).innerText()).trim()}"`);
step(`active nav: ${await page.locator('nav[aria-label="Main"] a[aria-current="page"]').innerText()}`);
step(`breadcrumbs: ${(await page.locator('nav[aria-label="breadcrumb"]').innerText()).replace(/\s+/g, ' ')}`);
await page.screenshot({ path: `${shots}/shell-desktop.png` });

// 7. Refresh persists the session
await page.reload();
await page.getByRole('button', { name: 'Account menu' }).waitFor();
if (!page.url().includes('/doctors')) throw new Error('lost session on refresh');
step('session persists across refresh');

// 8. /login while logged in → dashboard
await page.goto(`${BASE}/login`);
await page.waitForURL(`${BASE}/`);
step('visiting /login while signed in redirects to dashboard');

// 9. Logout
await page.getByRole('button', { name: 'Account menu' }).click();
await page.getByRole('menuitem', { name: 'Sign out' }).click();
await page.waitForURL('**/login?signedOut=1');
await page.getByText('You have been signed out.').waitFor();
if (await page.getByText('Your session has ended').count()) throw new Error('expired notice shown on logout');
step('logout → login page with "signed out" notice (not "session ended")');
await page.goto(`${BASE}/patients`);
await page.waitForURL(/\/login/);
step('after logout, protected pages redirect to login');

// 10. Expired/invalid session mid-use → back to login with message
await ctx.addCookies([{ name: 'dt_access_token', value: 'forged.token.value', url: BASE }]);
await page.goto(`${BASE}/`);
await page.waitForURL(/\/login\?.*reason=expired/, { timeout: 15000 });
await page.getByText('Your session has ended').waitFor();
step('forged cookie → API 401 → cookie cleared → login with "session ended" notice (no loop)');

// 11. Mobile navigation
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const m = await mobile.newPage();
await m.goto(`${BASE}/login`);
await m.screenshot({ path: `${shots}/login-mobile.png` });
await m.getByLabel('Email address').fill('admin@doctortracker.dev');
await m.getByLabel('Password', { exact: true }).fill('Admin@12345');
await m.getByRole('button', { name: 'Sign in' }).click();
await m.waitForURL(`${BASE}/`);
await m.getByRole('button', { name: 'Account menu' }).waitFor();
await m.screenshot({ path: `${shots}/shell-mobile.png` });
await m.getByRole('button', { name: 'Open navigation menu' }).click();
await m.getByRole('dialog').waitFor();
await m.screenshot({ path: `${shots}/nav-mobile.png` });
await m.getByRole('dialog').getByRole('link', { name: 'Patients' }).click();
await m.waitForURL('**/patients');
await m.getByRole('dialog').waitFor({ state: 'detached' });
step('mobile: sheet opens, navigates, and closes');
const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
step(`mobile: horizontal overflow = ${overflow}`);

console.log(errors.length ? `Console errors:\n${errors.join('\n')}` : 'No console errors');
await browser.close();
