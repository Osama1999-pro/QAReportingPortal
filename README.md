# QA Portal

Customer Service QA Management System: evaluation scorecards, coaching, reporting, and role-based dashboards.

Data is stored in **`data/db.json`** (no MySQL required).

## Structure
```
├── server/       Express API
├── public/       HTML/CSS/JS frontend
├── data/         db.json (all app data)
├── database/     seed.js (reset sample data)
└── vercel.json   Vercel deploy config
```

## Local setup

```bash
npm install
npm run seed          # optional — reset sample data
npm run dev           # http://localhost:5000
```

Login: `admin@qaportal.test` / `Password123!`  
(Change this password after first login.)

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import the project in [vercel.com](https://vercel.com).
3. Add environment variables from `.env.example` (`JWT_SECRET`, `JWT_RESET_SECRET`, `APP_URL`, `CLIENT_URL`).
4. Deploy.

No database setup is needed — the app reads/writes `data/db.json`.

**Note:** On Vercel’s serverless platform, file writes go to `/tmp` and can reset when instances recycle. That is fine for demos and light use. For permanent production data, move to a hosted database later.

## Roles

| Role | Access |
|---|---|
| Super Admin | Full access |
| QA Evaluator | Create/edit evaluations, coaching, reports |
| Team Lead | Team evaluations and reports |
| Agent | Own evaluations and coaching |

## Security

- Passwords hashed with bcryptjs
- JWT auth (Bearer token)
- helmet, rate limiting, XSS sanitization
