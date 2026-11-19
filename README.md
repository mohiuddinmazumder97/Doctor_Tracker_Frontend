# Doctor Tracker

**A secure healthcare administration dashboard for managing doctors, their patients, and practice analytics.**

Administrators sign in to a clean, responsive portal where they can register doctors, assign patients to them, search and filter thousands of records instantly, and follow how the practice is growing through live charts computed from the database — not hard-coded numbers.

> **Live demo:** _added after deployment_ · **Demo login:** `admin@doctortracker.dev` / `Admin@12345`
>
> This repository is the **frontend** (Next.js). The REST API lives in
> [Doctor_Tracker_Backend](https://github.com/mohiuddinmazumder97/Doctor_Tracker_Backend).

![Dashboard](docs/screenshots/dashboard.png)

---

## Contents

1. [Features](#features)
2. [Technology stack](#technology-stack)
3. [Screenshots](#screenshots)
4. [System architecture](#system-architecture)
5. [Database schema](#database-schema)
6. [API endpoints](#api-endpoints)
7. [Local installation](#local-installation)
8. [Environment variables](#environment-variables)
9. [Seeding the demo administrator](#seeding-the-demo-administrator)
10. [Running the apps](#running-the-apps)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Technical decisions](#technical-decisions)
14. [Project structure](#project-structure)

---

## Features

**Authentication & security**
- Admin login with JWT stored in an **HTTP-only, `SameSite=Lax` cookie** — never readable by JavaScript, never in `localStorage`
- Session persists across refreshes; protected routes redirect *before* rendering (`proxy.ts`), and deep links survive the round trip (`/login?next=/doctors?page=2`)
- Expired or forged sessions are detected by the API, the cookie is cleared, and the user lands on login with a clear notice — no redirect loops
- Open-redirect-safe `?next` handling, rate-limited login, server-side validation of every input

**Doctors**
- Create, view, edit and delete, with duplicate-email detection mapped onto the form field
- Search by name, email, hospital or specialization; filter by specialization and joined date; sort by any column, including patient count
- Doctor profile with contact details and a patient roster: **add a patient in place**, **reassign** a patient to another doctor (searchable picker), or delete
- **No orphaned patients:** a doctor with patients cannot be deleted — the UI explains why and links to the roster

**Patients**
- Full CRUD with a structured address, date of birth (time-zone safe), gender and medical condition
- Search by name, email or phone; filter by assigned doctor, condition, gender and registration date
- Patient profile links to the assigned doctor; reassign from either side

**Dashboard & analytics**
- KPI tiles: total doctors and patients, new this month with change vs last month, average patients per doctor
- Registration trend (day / week / month), patients per doctor, condition distribution, doctors by specialization
- All figures come from **MongoDB aggregation pipelines**; a single period filter scopes every chart; buckets use the admin's own time zone
- Every chart has loading, empty and error states, tooltips and an accessible **table view**; charts refresh automatically after any change

**UX details**
- List state (search, filters, sort, page, page size) lives in the URL: shareable, survives refresh, Back button works
- Debounced search (one request per pause), server-side pagination with next-page prefetch, no skeleton flash when paging
- Responsive from 360 px phones to wide desktops: table ↔ card list, slide-out navigation, mobile sort menus
- Toasts, confirmation dialogs, skeletons, empty and error states throughout; light, dark and system themes

---

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | **Next.js 16** (App Router, Cache Components, partial prerendering), **React 19**, **TypeScript** (strict) |
| UI | **Tailwind CSS 4**, **shadcn/ui** (Radix primitives), **Lucide** icons, Sonner toasts |
| Data | **TanStack Query 5** (server-state cache, invalidation, prefetching) |
| Forms | **React Hook Form** + **Zod 4** schemas (mirroring the API rules) |
| Charts | **Recharts 3** (lazy-loaded) |
| Backend | **Node.js**, **Express 5**, **TypeScript 7**, **Zod 4**, **Mongoose 9** |
| Auth | **JWT** in HTTP-only cookies, **bcrypt** (cost 12), `express-rate-limit`, `helmet` |
| Database | **MongoDB Atlas** |
| Testing | Vitest + Supertest + mongodb-memory-server (API, 33 tests) · Playwright browser suites (4 suites, ~70 checks) |
| Hosting | **Vercel** (frontend) · **Render** (API) · **MongoDB Atlas** (database) |

---

## Screenshots

### Desktop

| | |
| --- | --- |
| ![Login](docs/screenshots/login.png) **Login** | ![Dashboard (dark)](docs/screenshots/dashboard-dark.png) **Dashboard — dark theme** |
| ![Doctors](docs/screenshots/doctors.png) **Doctors list** | ![Doctor details](docs/screenshots/doctor-detail.png) **Doctor profile & patient roster** |
| ![Patients](docs/screenshots/patients.png) **Patients, filtered by condition** | ![Patient details](docs/screenshots/patient-detail.png) **Patient profile** |
| ![Add patient](docs/screenshots/add-patient.png) **Adding a patient from a doctor's page** | |

### Mobile

| | | | |
| --- | --- | --- | --- |
| ![Mobile dashboard](docs/screenshots/mobile-dashboard.png) | ![Mobile navigation](docs/screenshots/mobile-nav.png) | ![Mobile doctors](docs/screenshots/mobile-doctors.png) | ![Mobile patient](docs/screenshots/mobile-patient.png) |
| Dashboard | Navigation | Doctors | Patient profile |

Screenshots are generated from the running app with `npm run screenshots`.

---

## System architecture

```mermaid
flowchart LR
    B["Browser"] -- "pages + /api/* (same origin)" --> V["Next.js on Vercel<br/>proxy.ts route guard<br/>/api rewrite"]
    V -- "/api/* proxied server-side" --> R["Express API on Render<br/>auth · validation · services"]
    R -- "Mongoose" --> M[("MongoDB Atlas")]
```

- **The browser only ever talks to the frontend's origin.** `next.config.ts` rewrites `/api/*` to the Express API, so the auth cookie is first-party (see [Decision 1](#decision-1-same-origin-api-proxy-for-cookie-authentication)).
- **`proxy.ts`** (Next 16's name for middleware) redirects visitors without a session cookie before any protected page renders. It only checks that the cookie exists; the API verifies the JWT on every request, so the signing secret never leaves the backend.
- **Pages are static shells** (prerendered); client components read URL state and fetch through **TanStack Query**. Query keys are hierarchical (`["doctors", "list", params]`), so one mutation invalidates exactly the lists, details and dashboard widgets it affects.
- **The API is layered:** routes → controllers (HTTP only) → services (business rules such as the deletion policy) → repositories (queries and aggregation pipelines) → Mongoose models.

---

## Database schema

```mermaid
erDiagram
    ADMIN {
        ObjectId _id
        string name
        string email "unique"
        string passwordHash "bcrypt, never selected by default"
        string role "admin"
        date createdAt
        date updatedAt
    }
    DOCTOR ||--o{ PATIENT : "treats"
    DOCTOR {
        ObjectId _id
        string name
        string specialization "enum (14)"
        string hospital
        string phone
        string email "unique"
        date createdAt
        date updatedAt
    }
    PATIENT {
        ObjectId _id
        string fullName
        string email "unique"
        string phone
        date dateOfBirth
        string gender "male | female | other"
        string condition "enum (14)"
        ObjectId doctor "required, ref Doctor"
        object address "street, city, state, postalCode, country"
        date createdAt
        date updatedAt
    }
```

| Collection | Indexes | Serves |
| --- | --- | --- |
| `doctors` | `{ email: 1 }` unique | duplicate prevention, enforced by the database |
| | `{ createdAt: -1, _id: -1 }` | default list order, joined-date filters |
| | `{ specialization: 1, createdAt: -1, _id: -1 }` | specialization filter + sort |
| | `{ name: 1, _id: 1 }` | sort by name |
| `patients` | `{ email: 1 }` unique | duplicate prevention |
| | `{ doctor: 1, createdAt: -1, _id: -1 }` | a doctor's roster, patient counts, patients-per-doctor chart |
| | `{ condition: 1, createdAt: -1, _id: -1 }` | condition filter, condition chart |
| | `{ createdAt: -1, _id: -1 }` | default order, date filters, registration trends |
| | `{ fullName: 1, _id: 1 }` | sort by name |

- **Every sort index ends in `_id`** — the same tiebreaker the API adds to every sort — so paginated pages are stable *and* MongoDB never sorts in memory (verified with `explain()`: each query examines exactly the documents it returns).
- **Specializations and conditions are controlled vocabularies** (enums shared by API and UI) so filters and charts aren't fragmented by free-text variants.
- **Deletion policy:** deleting a doctor with assigned patients returns `409 Conflict`; patients must be reassigned or removed first, so every patient always references a valid doctor.

---

## API endpoints

All responses use one envelope: `{ "success": true, "data": …, "meta"?: { page, limit, total, totalPages } }` or `{ "success": false, "error": { code, message, details? } }`. Full reference with examples: **[backend README → API reference](https://github.com/mohiuddinmazumder97/Doctor_Tracker_Backend#api-reference)**. Interactive Swagger UI docs are served by the API at `/api/docs`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Sign in; sets the HTTP-only session cookie (rate-limited) |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/auth/me` | Current administrator |
| `GET` | `/api/doctors` | List — `search`, `specialization`, `from`, `to`, `page`, `limit`, `sortBy`, `order` |
| `POST` | `/api/doctors` | Create (409 on duplicate email) |
| `GET` | `/api/doctors/:id` | Details incl. `patientCount` |
| `PATCH` | `/api/doctors/:id` | Partial update |
| `DELETE` | `/api/doctors/:id` | Delete (409 while patients are assigned) |
| `GET` | `/api/doctors/:id/patients` | The doctor's patients (paginated, searchable) |
| `GET` | `/api/patients` | List — `search`, `doctorId`, `condition`, `gender`, `from`, `to`, `page`, `limit`, `sortBy`, `order` |
| `POST` | `/api/patients` | Create (doctor must exist) |
| `GET` | `/api/patients/:id` | Details with doctor summary |
| `PATCH` | `/api/patients/:id` | Partial update / reassign doctor |
| `DELETE` | `/api/patients/:id` | Delete |
| `GET` | `/api/dashboard/overview` | Totals, this/last month, averages, recent registrations (`tz`) |
| `GET` | `/api/dashboard/patient-trends` | Zero-filled registrations per `day`/`week`/`month` (`from`, `to`, `tz`) |
| `GET` | `/api/dashboard/doctor-distribution` | Top doctors by patients + "others" (`from`, `to`, `limit`) |
| `GET` | `/api/dashboard/condition-distribution` | Patients per condition (`from`, `to`) |
| `GET` | `/api/dashboard/specialization-distribution` | Doctors (and their patients) per specialization (`from`, `to`) |
| `GET` | `/api/health` | Liveness + database readiness |

---

## Local installation

**Prerequisites:** Node.js ≥ 20 (developed on 24), npm, and either a MongoDB Atlas cluster **or nothing at all** (the API can run on a seeded in-memory MongoDB).

```bash
# 1. Clone both repositories side by side
git clone https://github.com/mohiuddinmazumder97/Doctor_Tracker_Backend.git backend
git clone https://github.com/mohiuddinmazumder97/Doctor_Tracker_Frontend.git frontend

# 2. Install
cd backend  && npm install && cp .env.example .env    # then edit .env (see below)
cd ../frontend && npm install && cp .env.example .env.local
```

> npm 11 asks before running dependency install scripts. The backend's `package.json`
> already allow-lists the two that are needed (`bcrypt`'s native binding and `esbuild`).

---

## Environment variables

**Backend — `backend/.env`** (template: `.env.example`)

| Variable | Required | Example / default | Purpose |
| --- | --- | --- | --- |
| `MONGODB_URI` | yes | `mongodb+srv://user:pass@cluster.mongodb.net/` | Atlas connection string |
| `MONGODB_DB_NAME` | no | `doctor_tracker` | Database name |
| `JWT_SECRET` | yes | 48+ random bytes, hex | Signs session tokens (min. 32 chars, validated at startup) |
| `JWT_EXPIRES_IN` | no | `1d` | Session lifetime (`15m`, `12h`, `1d`) — also the cookie `Max-Age` |
| `CORS_ORIGINS` | no | `http://localhost:3000` | Comma-separated allowed browser origins |
| `PORT` | no | `5000` | HTTP port (Render sets this) |
| `NODE_ENV` | no | `development` | `production` enables `Secure` cookies |
| `TRUST_PROXY` | no | `1` | Proxy hops to trust for client IPs (rate limiting) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | no | `admin@doctortracker.dev` / `Admin@12345` | Demo admin created by the seed script |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Invalid configuration fails fast at startup with a readable list of problems.

**Frontend — `frontend/.env.local`** (template: `.env.example`)

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `BACKEND_URL` | yes | `http://localhost:5000` | Where `/api/*` is proxied. **Server-only** (no `NEXT_PUBLIC_` prefix) — never shipped to the browser |

No secrets exist in the frontend at all.

---

## Seeding the demo administrator

```bash
cd backend
npm run seed                 # upserts the demo admin; adds demo data only if there are no doctors yet
npm run seed -- --reset      # wipes doctors/patients and regenerates the demo dataset
npm run seed -- --admin-only # only (re)creates the admin
```

The demo dataset is **deterministic** (seeded PRNG): 24 doctors and 180 patients with registration dates spread over the past 12 months, so every chart has meaningful data.

**Demo credentials:** `admin@doctortracker.dev` / `Admin@12345` (configurable via `SEED_ADMIN_*`).

---

## Running the apps

```bash
# Terminal 1 — API on http://localhost:5000
cd backend
npm run dev            # against MongoDB Atlas (.env)
# or
npm run dev:memory     # zero-config: in-memory MongoDB, auto-seeded (data resets on restart)

# Terminal 2 — app on http://localhost:3000
cd frontend
npm run dev
```

| Backend scripts | | Frontend scripts | |
| --- | --- | --- | --- |
| `npm run dev` | watch mode | `npm run dev` | Next dev server |
| `npm run dev:memory` | in-memory DB + seed | `npm run build` / `start` | production build / server |
| `npm test` | API test suite | `npm run lint` / `typecheck` | ESLint / `tsc` |
| `npm run build` / `start` | compile / run `dist` | `npm run test:e2e` | browser suites |
| `npm run seed` | demo data | `npm run screenshots` | regenerate README images |

> **Tip:** if a style change doesn't appear in development, delete `frontend/.next` — Turbopack's
> persistent dev cache can occasionally serve a stale stylesheet.

---

## Testing

**API (backend):** `npm test` — 40 integration tests on an in-memory MongoDB covering login/logout/me, cookie flags, timing-safe errors, rate limiting, protected routes, CRUD, duplicate emails, the deletion policy, search (including regex-injection), filters, pagination, projections, every dashboard aggregation, time-zone/DST bucketing, and an OpenAPI contract test that validates real responses against the Swagger spec.

**Browser (frontend):** `npm run test:e2e` — four Playwright suites driving a real Chrome against the real app and API (details in [`e2e/README.md`](e2e/README.md)). They cover every workflow in the brief:

| # | Requirement | Verified by |
| --- | --- | --- |
| 1 | Admin can log in and log out | `auth-flow` |
| 2 | Unauthenticated users can't reach pages or APIs | `auth-flow`, API tests |
| 3 | Create, edit, view, delete doctors | `doctors-flow` |
| 4 | Search, filter, paginate doctors | `doctors-flow` |
| 5 | Create patients under a doctor | `doctors-flow` |
| 6 | Edit and delete patients | `patients-flow` |
| 7 | Search, filter, paginate patients | `patients-flow` |
| 8 | Doctor details list their patients | `doctors-flow` |
| 9 | Dashboard reflects real records | `dashboard-flow` (every figure compared with the API) |
| 10 | Charts update when data changes | `dashboard-flow` (create → +1, delete → −1, no reload) |
| 11 | Forms show validation errors | all suites (client + server errors) |
| 12 | Mobile navigation and layouts | `auth-flow`, `doctors-flow`, `patients-flow` |
| 13 | API failures handled gracefully | `dashboard-flow` (simulated 500 → error + retry), `auth-flow` |

---

## Deployment

**1. MongoDB Atlas**
- Create a cluster and a database user.
- **Network Access → Add IP → `0.0.0.0/0`** (Render's free tier has no fixed outbound IPs; access stays protected by the database credentials).
- Copy the `mongodb+srv://…` connection string.

**2. API on Render** (Web Service from the backend repo)
- Build command: `npm ci && npm run build` · Start command: `npm start` · Health check path: `/api/health`
- Environment: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS=https://<your-app>.vercel.app`, `TRUST_PROXY` (see backend README)
- Seed once from your machine: `MONGODB_URI=… npm run seed` (or Render's shell).

**3. Frontend on Vercel** (import the frontend repo)
- Framework preset: Next.js (defaults are correct)
- Environment: `BACKEND_URL=https://<your-api>.onrender.com`
- Deploy. Because `/api/*` is rewritten through Vercel, the session cookie is first-party on the Vercel domain.

> Render's free instances sleep when idle; the first request after a pause can take ~30–50 s.

---

## Technical decisions

### Decision 1: Same-origin API proxy for cookie authentication

**Problem.** The brief requires JWTs in HTTP-only cookies, with the frontend on Vercel (`*.vercel.app`) and the API on Render (`*.onrender.com`). Those are different *sites*, so a cookie set by the API would be a **third-party cookie**. It would need `SameSite=None`, and Safari (ITP) — and Chrome's third-party-cookie restrictions — would drop it: login would silently fail for some users. The Next.js route guard also couldn't see a cookie that belongs to another domain.

**Decision.** The browser never calls the API directly. `next.config.ts` **rewrites `/api/*` to the API server-side**, so from the browser's point of view the API lives on the app's own origin.

**Consequences.**
- The cookie is first-party: `HttpOnly; Secure; SameSite=Lax` works in every browser, and Lax also blocks cross-site form CSRF by default.
- `proxy.ts` can read the cookie and redirect unauthenticated visitors **before** a protected page renders (no flash of private UI). It only checks presence; the API verifies the JWT on every request, so the secret stays on the backend.
- CORS is effectively unused (it remains locked to the frontend origin as defense in depth), and the API URL is a server-only variable — no API address or secret is shipped to the browser.
- Trade-off: one extra network hop through Vercel, and client IPs reach the API via proxy headers — hence the `TRUST_PROXY` setting for rate limiting. An invalid cookie is cleared by the API whenever it is rejected, so the edge guard and the API can never disagree into a redirect loop.

### Decision 2: Offset pagination with escaped-regex search, backed by `_id`-terminated compound indexes

**Problem.** Admin tables need numbered pages ("page 7 of 12"), page-size options, sorting by several columns, and *partial-match* search as you type ("joh" → "John").

**Options considered.**
- **Cursor pagination** scales best but cannot jump to an arbitrary page or show totals cheaply.
- **MongoDB `$text` search** is indexed but matches whole words only, so "joh" finds nothing.
- **Atlas Search** solves both, but adds infrastructure that a few thousand records don't need.

**Decision.** `skip`/`limit` with `countDocuments` run **in parallel**, and case-insensitive "contains" search built from **regex-escaped** input (so `.*` or `(a+)+` are matched literally — no regex injection or ReDoS). Every sort appends `_id` as a tiebreaker, and every compound index ends in `_id` so MongoDB satisfies the sort from the index.

**Consequences.**
- Stable pages (no duplicated/skipped rows when many records share a timestamp) and **no in-memory sorts** — `explain()` shows each query examining exactly the documents it returns, even on page 3.
- The doctor list's per-doctor patient counts come from a single `$lookup` aggregation over just the current page (no N+1).
- Trade-off: deep offsets and unanchored regexes grow linearly with the collection. At admin scale (thousands of rows) that is milliseconds; beyond ~100k documents the next step would be Atlas Search for text and keyset pagination for infinite scrolling.

---

## Project structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/login/            # static login page
│   │   ├── (dashboard)/             # authenticated shell: dashboard, doctors/*, patients/*
│   │   ├── layout.tsx, globals.css  # providers, theme tokens (incl. validated chart palette)
│   │   └── icon.svg
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitives
│   │   ├── layout/                  # sidebar, top bar, breadcrumbs, mobile nav, user menu
│   │   ├── shared/                  # tables, pagination, search, filters, dialogs, states
│   │   ├── dashboard/               # KPI tiles, chart cards, lazily loaded charts
│   │   ├── doctors/ · patients/     # feature views, forms, dialogs
│   │   └── auth/
│   ├── hooks/                       # useUrlState, useDebouncedValue
│   ├── lib/
│   │   ├── api/                     # typed fetch client + per-resource endpoints
│   │   ├── queries/                 # TanStack Query hooks + query-key factory
│   │   └── validations/             # Zod form schemas
│   ├── constants/ · types/
│   └── proxy.ts                     # route guard (Next 16 "middleware")
├── e2e/                             # Playwright browser suites + screenshot script
└── docs/screenshots/
```
