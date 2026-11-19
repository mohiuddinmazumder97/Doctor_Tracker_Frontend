# Doctor Tracker — Frontend

Next.js (App Router) admin dashboard for the Doctor Tracker API.

```bash
cp .env.example .env.local   # BACKEND_URL=http://localhost:5000
npm install
npm run dev                  # http://localhost:3000
```

The backend must be running (see the backend repository). All `/api/*` requests are proxied
to `BACKEND_URL` via Next.js rewrites, so the auth cookie stays first-party.

Full documentation is added in a later phase.
