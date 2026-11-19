# Browser end-to-end tests

Scripted walkthroughs of every user-facing workflow, driven with `playwright-core`
against a real browser, the real Next.js app and the real API.

| Suite | Covers |
| --- | --- |
| `auth-flow` | redirects with `?next`, validation, wrong password, HTTP-only cookie, refresh persistence, logout, forged-cookie recovery, mobile navigation |
| `doctors-flow` | debounced search, filters, Back button, sorting, pagination, create (409 duplicate email), add / reassign patient, delete policy, edit, mobile |
| `patients-flow` | search by name/phone, doctor + condition + date filters, shareable URLs, create/edit/reassign/delete, timezone-safe DOB, mobile |
| `dashboard-flow` | KPIs and charts vs API, tooltips, table view, period + granularity, live update after mutations, bar click-through, error + retry, empty state |

## Running

The suites expect the **seeded demo data**, so run them against a fresh in-memory API:

```bash
cd backend  && npm run dev:memory        # API on :5000, seeded
cd frontend && npm run dev               # or: npm run build && npm start
cd frontend && npm run test:e2e          # all suites
cd frontend && npm run test:e2e -- doctors   # one suite
```

| Variable | Default |
| --- | --- |
| `E2E_BASE_URL` | `http://localhost:3000` |
| `CHROME_PATH` | `/usr/bin/google-chrome` |
| `HEADED` | unset (set to `1` to watch the browser) |

Each suite cleans up the records it creates, including leftovers from an interrupted run.
