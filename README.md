# QA Portal

A Customer Service QA Management System for e-commerce support teams: evaluation scorecards, coaching, reporting/analytics, disputes, and role-based dashboards for Super Admin, QA Evaluator, Team Lead, and Agent.

This app has been built and verified end-to-end against a real MySQL-compatible database in a test environment: login, dashboard aggregation, evaluation creation with auto-scoring, CSV/Excel/PDF export, and coaching all work as described below.

## What's inside
```
qa-app/
├── server/            Node.js + Express API (auth, evaluations, coaching, reports, exports, settings)
├── public/             The website itself — plain HTML/CSS/JS + Bootstrap 5, no build step
├── database/           schema.sql (full schema + sample data) and seed.js (real password hashing)
├── docs/                Installation, deployment, database import, and API reference
├── uploads/           Uploaded logos/avatars end up here at runtime
├── .env.example    Copy this to .env and fill in your real values
└── package.json
```

## Roles
| Role | Can do |
|---|---|
| **Super Admin** | Everything — manage users/teams/departments, all evaluations, settings, audit log |
| **QA Evaluator** | Create/edit/delete evaluations, log coaching, view all reports |
| **Team Lead** | View their team's evaluations, reports, and trends |
| **Agent** | View their own evaluations, feedback, and coaching history |

## Quick start (local machine)

```bash
# 1. Install dependencies
cd qa-app
npm install

# 2. Configure environment
cp .env.example .env
# open .env and set DB_USER / DB_PASSWORD / DB_NAME to match your MySQL

# 3. Create the database and import the schema
mysql -u root -p -e "CREATE DATABASE qa_portal CHARACTER SET utf8mb4;"
mysql -u root -p qa_portal < database/schema.sql

# 4. Generate real login passwords for the sample accounts
npm run seed

# 5. Run it
npm run dev        # auto-restarts on changes (nodemon)
# or: npm start

# 6. Open http://localhost:5000 and log in with:
#    admin@qaportal.test / Password123!
#    (change this password immediately — see Settings once logged in)
```

Full step-by-step instructions (including for non-technical users) are in:
- `docs/INSTALLATION.md` — installing Node.js, MySQL, and running locally
- `docs/DATABASE_IMPORT.md` — creating the database and importing the schema
- `docs/DEPLOYMENT_HOSTINGER.md` — putting this live on Hostinger, step by step
- `docs/API_DOCUMENTATION.md` — every API route, who can call it, and what it returns

## Security notes
- Passwords are hashed with `bcrypt` (12 salt rounds) — never stored in plain text.
- Auth uses short-lived JWTs (8h, or 30d with "Remember me").
- Every database query is parameterized (via `mysql2`) — this is what prevents SQL injection.
- `helmet` sets security headers; `express-rate-limit` throttles login attempts and general API traffic; `xss` sanitizes incoming text fields.
- CSRF: this API authenticates via a Bearer token in the `Authorization` header, not cookies, so classic cookie-based CSRF doesn't apply. See the comment in `server/middleware/security.js` if you ever switch to cookie-based auth.

## First admin account
The seed script creates `admin@qaportal.test` / `Password123!` as a Super Admin. **Log in and change this password the moment the app is live** (Settings → your profile, or ask another Super Admin to reset it from Employees).
