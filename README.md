# Sewa Setu Next

**An AI-powered Government Service Orchestration and Governance Intelligence Layer for Chhattisgarh Sewa Setu.**

> "Don't search for a government service. Tell us what happened in your life."

Hackathon prototype for **Problem Statement 2 — Next-Generation Digital Governance Solution for Sewa Setu** (Chhattisgarh, India).

> ⚠️ Prototype / demonstration data only. Not affiliated with the Government of Chhattisgarh. No real citizen data, Aadhaar numbers, or government API integrations are used — everything is clearly synthetic and reproducible. Mock authentication only — see "Known limitations" before using any of this beyond a demo.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000 — DB auto-seeds on first request
```

```bash
npm run db:seed       # explicit re-seed (wipes data/, rebuilds deterministically)
npm run test           # vitest — core business logic + workflow guards
npm run lint
npm run build
```

Four portals, one login gate at `/`:

| Login tab | Role | Lands on |
|---|---|---|
| नागरिक लॉगिन / सेवा सेतु लॉगिन | `citizen` | `/citizen` |
| शासकीय | `officer` | `/mis` |
| एडमिन लॉगिन | `admin` | `/admin` |

Auth is **entirely mock** — any username/password/OTP succeeds; the tab you click decides the role. See "Demo accounts" below.

## Architecture

```
Next.js 16 App Router (routes ARE the API — no separate Express server)
  route handler (src/app/api/**)
    → src/lib/auth.ts        (session + RBAC guard)
    → src/lib/validation.ts  (Zod schemas for the highest-traffic writes)
    → src/lib/ai.ts          (AIService — deterministic "DEMO AI" intent/eligibility/risk/copilot)
    → src/lib/eligibility.ts (rule-based eligibility engine)
    → src/lib/db.ts          (schema, seed, and every query — no ORM)
        → better-sqlite3 → data/sewasetu.db
```

This intentionally stays a **Next.js full-stack app on SQLite**, not the spec's suggested Express+Prisma+Postgres split. It was already a working, cohesive app before this pass — rewriting a working stack mid-hackathon for architectural purity wasn't worth the risk, per "do not unnecessarily rewrite working code." `src/lib/db.ts` plays the repository-layer role; route handlers play the controller role; `src/lib/ai.ts` / `eligibility.ts` play the service layer.

### Response envelope

Every route added in this backend pass returns `{ success: true, data }` or `{ success: false, error: { code, message } }` (`src/lib/api.ts`). Routes that shipped in earlier passes and that the frontend already depends on (`/api/citizen`, `/api/applications`, `/api/documents`, `/api/grievances`, `/api/mis`, `/api/governance`, `/api/sla`, `/api/health-check`, `/api/verify`, `/api/chat`, `/api/copilot`, `/api/privacy`) **keep their original flat shapes** — changing them would have broken working UI for no benefit, so they were left alone and the new envelope was applied only to genuinely new endpoints.

## Domain model (SQLite tables)

`citizens`, `applications`, `documents`, `grievances`, `notifications`, `access_log`, `users`, `audit_log` — plus a static reference catalog (`src/lib/reference.ts`: districts, departments, services, life events) that isn't a DB table, since it's product content, not admin-editable data, in this prototype.

## Auth / RBAC

Four roles: `citizen`, `operator`, `officer`, `admin`. `src/proxy.ts` (Next 16's renamed `middleware.ts`) gates every route by cookie (`ss_role`, `ss_user`) — unauthenticated visits redirect to `/` with `?next=`, and a role visiting a portal above its privilege (citizen → `/mis`, officer → `/admin`) is bounced to its own home. API routes additionally check role via `requireRole()` (`src/lib/auth.ts`) — verified live: a citizen session gets `403` from `/api/admin/*` and from officer-only actions like approve/reject.

**No JWT, no password hashing** — see "Known limitations."

### Demo accounts

| Email | Role | Notes |
|---|---|---|
| `citizen@demo.com` | citizen | **is** the seeded citizen "Sukhmati Kashyap" (`id: "demo"`) — every citizen-side page is built around this one profile |
| `operator@demo.com` | operator | Kendra/CHOICE operator persona |
| `officer@demo.com` | officer | Department officer — can approve/reject/request-document, sees `/mis` |
| `admin@demo.com` | admin | Sees `/admin` and `/mis` |

Login doesn't take a password — any input on the form works. Each role tab resolves to its one canonical account above.

## The Admin Portal (`/admin`, admin role only)

The "clear backend page" you asked for:

- **Overview** — live DB table row counts, catalog sizes, AI provider mode, environment, top bottleneck. Real numbers from `dbStats()`, not decoration.
- **Citizens** — searchable list of all 62 seeded citizens, each with a full drill-down (`/admin/citizens/:id`): profile fields, documents, applications, grievances, notifications. This is "inspect the data from the user."
- **Applications** — every application in the system, filterable by status, linking to both the citizen's admin record and the public tracker.
- **Audit log** — every login, application submit/approve/reject, document upload, and grievance action, with actor + role + entity + timestamp.
- **API reference** — every route this backend exposes, its auth requirement, and its purpose (hand-written, not generated — see below).

## AI architecture

`src/lib/ai.ts` — `understandIntent`, `buildJourney`, `extractDocument`, `checkApplication`, `slaRisk`, `delayRisk`, `answerCopilot`. Every function returns a **structured, validated result**; nothing lets raw text drive a workflow directly. All of it is a deterministic **"DEMO AI"** — rule-based, reproducible, zero API keys required (`AI_PROVIDER=mock`, the only mode actually implemented). Swapping in a real LLM later means reimplementing these function bodies; every caller stays unchanged.

## API surface

~65 routes. The full list with auth requirements lives at `/admin` → API reference (or `GET /api/admin/stats`, admin-only). Highlights:

- **Journey Engine**: `POST /api/ai/intent`, `POST /api/life-events/detect`, `GET /api/life-events`
- **Eligibility**: `GET /api/eligibility/services` — returns `LIKELY / POSSIBLE / NOT_ELIGIBLE / MORE_INFORMATION_REQUIRED` per service, each with visible reasons and missing-information, never presented as an official determination
- **Documents**: `POST /api/documents` (mock OCR), `GET /api/documents/reusable/:serviceId` (reuse engine)
- **Applications**: `POST /api/applications`, `POST /api/applications/:id/{approve,reject,request-document}` (officer/admin only, with transition guards — see below), `GET /api/applications/:id/{health,sla,risk,timeline}`
- **Grievances**: `POST /api/grievances` (auto-prepared from a delayed application), `PATCH /api/grievances/:id`, `POST /api/grievances/:id/resolve` (officer/admin only, status-machine guarded)
- **Analytics**: `/api/analytics/{overview,applications,sla,departments,districts,bottlenecks,root-causes,service-performance,trends}`, plus the aggregated `/api/government/dashboard` and `/api/citizen/dashboard`
- **Government Copilot**: `POST /api/government/copilot` — every answer cites the analytics it was computed from, never a bare claim
- **Admin**: `/api/admin/{stats,citizens,citizens/:id,audit}`
- **Health**: `GET /api/health`

### Workflow transition guards (tested)

- `advanceApplication` walks the linear pipeline and no-ops once `delivered`/`rejected`.
- `approveApplication` / `rejectApplication` refuse to act on an application that's already `approved`, `rejected`, or `delivered` — verified live and in `tests/application-workflow.test.ts` (an earlier version of this guard let an officer "re-approve" an already-approved application; the test suite is what caught it).
- `updateGrievanceStatus` enforces `open → acknowledged → resolved`; a `resolved → acknowledged` request is rejected with `VALIDATION_ERROR`.

## Seed data

62 synthetic citizens (2 rich named ones + ~60 procedurally generated, at least 2 per district, demographics weighted by district region), 20 services, 7 departments, 16 districts, ~225 applications spread across 90 days and every workflow stage/SLA state — **and every application now references a real citizen row** (an earlier version generated orphan `citizenId`s with no matching citizen record, which would have made the admin portal's citizen drill-down incomplete; fixed as part of this pass). Deterministic (seeded PRNG) — the same `npm run db:seed` always produces the same dataset.

## Tests

```bash
npm run test
```

26 tests across 4 files (`tests/`): the eligibility engine (both the dashboard-facing and spec-contract-facing shapes), SLA risk banding, delay-risk scoring bounds, the application workflow engine's transition guards, the grievance status machine, and basic analytics sanity (funnel monotonicity, percentage bounds). Tests run against an isolated temp SQLite file (`SEWASETU_DB_DIR`), never the dev database.

**Not covered** (see "Known limitations"): RBAC middleware itself (tested manually via curl + browser, documented above, not in the automated suite), the citizen-facing UI, and the AI copilot's natural-language matching.

## Known limitations

Being direct about what a from-scratch enterprise backend (the kind the original spec describes) would additionally have, that this pass does not:

- **No real authentication.** No passwords, no JWT, no bcrypt — a cookie holding a role string, checked server-side. Fine for a hackathon demo; not something to expose publicly as-is.
- **No ORM/migrations.** Raw SQL via `better-sqlite3`, hand-written schema in `migrate()`. A real production build would want Prisma/Drizzle + versioned migrations.
- **Analytics filters are unimplemented.** The spec's `districtId/departmentId/serviceId/startDate/endDate` query params are accepted by convention on `/api/analytics/*` but not yet wired to filter the underlying aggregation — every analytics endpoint computes over the full dataset.
- **No generated OpenAPI/Swagger spec.** The Admin Portal's API Reference tab is hand-written and kept in sync manually (`src/app/api/admin/stats/route.ts`), not generated from route code.
- **Single-citizen citizen-side UI.** The citizen-facing pages (`/citizen`, `/profile`, `/documents`, …) are still hardcoded to `citizenId: "demo"` — logging in as "citizen" always resolves to the same seeded profile. The 61 other seeded citizens exist for the admin portal and the MIS/governance aggregates, not for multi-user citizen login. Making every seeded citizen individually loggable would mean threading a real `citizenId` through every citizen-facing page instead of the literal string `"demo"` — a larger frontend refactor than this pass covers.
- **No rate limiting, no CORS config beyond same-origin default, no request logging middleware.**
- **Audit log covers the highest-value actions** (login, application submit/approve/reject, document upload, grievance create/status-change) — not literally every mutation.

None of this blocks the demo flows described below; all of it would matter before this became a real production system.

## Demo journeys (verified working end-to-end)

**A — Start a business**: `/citizen` → "I am starting a small shop" → Journey Engine builds a 9-step journey with 2 services → apply → auto-verify → health check → submit → track → SLA/risk.

**B — Land transfer**: same box → "Mere pitaji ki zameen mere naam transfer karni hai" → routes into the guided Land/Revenue Navigator → 5 questions → Land Mutation journey.

**C — Government analytics**: log in as officer or admin → `/mis` → pipeline funnel with bottleneck highlighted → AI root-cause breakdown → Government Copilot ("Why are applications delayed?" — cites its data sources) → (admin only) `/admin` → inspect any of the 62 real citizens' full record, or the audit trail of everything that just happened.

## Project structure

```
src/
  app/
    page.tsx                 login/landing gate (role-based redirect)
    citizen/, profile/, documents/, grievances/, privacy/, services/, apply/[id]/, track/[id]/, disaster/
    mis/                      Governance Intelligence Dashboard + Government Copilot
    admin/                    Admin Portal (overview/citizens/applications/audit/api) + citizen drill-down
    api/                      ~65 routes — see "API surface" above
  lib/
    ai.ts                    AIService abstraction — the Government Journey Engine
    db.ts                    schema, seed, every query, MIS + governance aggregation
    eligibility.ts            explainable eligibility (dashboard shape + spec-contract shape)
    auth.ts                   session + RBAC guard
    api.ts                    response envelope helpers
    validation.ts              Zod schemas for the highest-traffic write routes
    reference.ts               districts, departments, services, life events, doc types
  proxy.ts                    RBAC route gate (Next 16's renamed middleware.ts)
  components/                  (see prior sections of this README's git history for the citizen-side UI)
tests/                         vitest — eligibility, SLA/risk, workflow guards, grievance machine, analytics sanity
scripts/seed.ts                 npm run db:seed entrypoint
```
