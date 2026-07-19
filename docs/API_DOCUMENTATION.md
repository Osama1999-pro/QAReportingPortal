# API Documentation

Base URL: `/api`. All responses are JSON shaped like `{ "success": true|false, "message": "...", ... }`.

Authenticated routes require a header: `Authorization: Bearer <token>` (the token you get back from `/auth/login`).

Roles: `super_admin`, `qa_evaluator`, `team_lead`, `agent`.

---
## Auth — `/api/auth`

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/login` | none | `{ email, password, rememberMe? }` | Returns `{ token, user, expiresIn }` |
| GET | `/me` | any | — | Current user's profile |
| POST | `/forgot-password` | none | `{ email }` | Always returns success (doesn't reveal if the email exists) |
| POST | `/reset-password` | none | `{ token, newPassword }` | `token` comes from the emailed reset link |
| POST | `/logout` | any | — | Client should also discard its stored token |

## Users / Employees — `/api/users`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | super_admin, qa_evaluator, team_lead | Query: `role, teamId, departmentId, status, search` |
| GET | `/:id` | super_admin, qa_evaluator, team_lead | |
| POST | `/` | super_admin | Body: `{ name, email, role, password?, department_id?, team_id?, designation?, manager_id?, phone?, employee_code? }` |
| PUT | `/:id` | super_admin | Partial update, same fields |
| PATCH | `/:id/status` | super_admin | `{ status: "active"|"inactive" }` |
| POST | `/:id/reset-password` | super_admin | `{ newPassword }` |
| POST | `/:id/avatar` | super_admin | multipart/form-data, field `avatar` |
| DELETE | `/:id` | super_admin | |

## Departments — `/api/departments`
GET (any authenticated role) · POST/PUT/DELETE (super_admin) — body `{ name }`.

## Teams — `/api/teams`
GET (any authenticated role) · POST/PUT (super_admin) — body `{ name, department_id }` · DELETE (super_admin).

## Evaluations — `/api/evaluations`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/scorecard-template` | any | Returns the 11 scorecard sections + channel list |
| GET | `/` | any (auto-scoped) | Agents see only their own; team leads only their team. Query: `agentId, evaluatorId, teamId, departmentId, channel, status, passFail, dateFrom, dateTo, search, page, pageSize` |
| GET | `/:id` | any (scoped) | Includes `scorecard` array |
| POST | `/` | super_admin, qa_evaluator | Body: `{ agent_id, channel, evaluation_date, ticket_number?, order_number?, team_id?, overall_comments?, scorecard: [{section_key, section_label, max_score, obtained_score, comments?}] }` — total/percentage/pass-fail are calculated server-side against the configured QA pass percentage |
| PUT | `/:id` | super_admin, qa_evaluator | Same body shape, all fields optional |
| DELETE | `/:id` | super_admin, qa_evaluator | |
| POST | `/:id/dispute` | super_admin, team_lead, agent | `{ reason? }` |
| POST | `/:id/reopen` | super_admin, qa_evaluator | |
| POST | `/:id/complete` | super_admin, qa_evaluator | |

## Coaching — `/api/coaching`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | any (scoped) | Query: `employeeId, coachId, status` |
| GET | `/:id` | any | |
| POST | `/` | super_admin, qa_evaluator, team_lead | `{ employee_id, coaching_date, reason, action_plan, follow_up_date?, evaluation_id? }` |
| PUT | `/:id` | super_admin, qa_evaluator, team_lead | |
| DELETE | `/:id` | super_admin, qa_evaluator | |

## Dashboard — `/api/dashboard`
`GET /summary` (any, auto-scoped) → `{ summary, monthlyTrend, teamPerformance, topPerformers, lowestPerformers }`.

## Reports — `/api/reports`
`GET /` (any, auto-scoped). Query: `period` (`daily|weekly|monthly|quarterly|yearly`, default `monthly`), plus the same filters as evaluations. Returns `{ rows: [{ period, evaluations, averageScore, passed, failed, passRate }] }`.

## Export — `/api/export`
`GET /csv`, `GET /excel`, `GET /pdf` (any, auto-scoped) — accept the same filters as `/evaluations`, stream a file download of the filtered set.

## Settings — `/api/settings`
`GET /` (any) · `PUT /` (super_admin) body `{ company_name?, qa_pass_percentage?, theme? }` · `POST /logo` (super_admin) multipart field `logo`.

## Audit Log — `/api/audit`
`GET /?limit=100` (super_admin only).

## Search — `/api/search`
`GET /?q=...` (any, auto-scoped, min 2 characters) → `{ users, evaluations }` matching results.

## Health check
`GET /api/health` (no auth) → confirms the server and its environment are up.

---
## Error responses
```json
{ "success": false, "message": "Human-readable explanation." }
```
Validation errors additionally include an `errors` array from `express-validator`. A `401` means your token is missing/expired — the frontend automatically redirects to login on this. A `403` means you're authenticated but not allowed to do that specific thing (wrong role, or outside your data scope).
