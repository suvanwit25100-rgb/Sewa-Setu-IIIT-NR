# Sewa Setu Next

**An AI-powered Government Service Orchestration and Governance Intelligence Layer for Chhattisgarh Sewa Setu.**

> "Don't search for a government service. Tell us what happened in your life."

Hackathon prototype for **Problem Statement 2 — Next-Generation Digital Governance Solution for Sewa Setu** (Chhattisgarh, India).

> ⚠️ Prototype / demonstration data only. Not affiliated with the Government of Chhattisgarh. No real citizen data, Aadhaar numbers, or government API integrations are used — everything is clearly synthetic and reproducible.

## The core idea

Existing portals (including today's real Seva Setu) already do service discovery, application submission, tracking, notifications, multilingual access and grievances. **Sewa Setu Next sits above that layer**:

```
Citizen need → Intent understanding → Life-event identification → Eligibility discovery
  → Document intelligence → Application preparation → Submission → Real-time tracking
  → SLA / delay prediction → Government bottleneck intelligence
```

Citizens never need to know department names, scheme names, or bureaucratic terminology. They describe what happened; the **Government Journey Engine** (`src/lib/ai.ts`) translates that into a concrete, ordered set of government workflow steps.

## Feature map

| # | Feature | Where |
|---|---|---|
| 1 | Life Event Engine | `/` (Ask Sewa Setu), `src/lib/ai.ts::understandIntent` |
| 2 | Eligibility Intelligence (explainable "why") | `/citizen`, `src/lib/eligibility.ts` |
| 3 | Citizen Service Profile | `/profile` |
| 4 | Document Intelligence (mock OCR, reuse graph) | `/documents` |
| 5 | AI Application Assistant | `/apply/[id]` (steps 0–1) |
| 6 | Application Health Check | `/apply/[id]` (step 2) |
| 7 | Application Journey Tracking | `/track/[id]` |
| 8 | "Why is my application stuck?" | `/track/[id]` |
| 9 | SLA Intelligence | `/track/[id]`, `/api/sla` |
| 10 | Delay Risk Prediction | `/track/[id]`, `src/lib/ai.ts::delayRisk` |
| 11 | Governance Intelligence Dashboard | `/mis` |
| 12 | AI Root Cause Analysis | `/mis`, `src/lib/db.ts::computeGovernance` |
| 13 | District × Service Heatmap | `/mis` (filterable table) |
| 14 | Government Copilot | `/mis`, `/api/copilot` |
| 15 | Kendra / Assisted Digital Mode | Assisted Mode toggle + Kendra Operator Copilot in `/apply/[id]` |
| 16 | Voice-first governance | Mic button everywhere (Web Speech API) → feeds the same Journey Engine |
| 17 | Smart Grievance / Escalation | `/grievances`, auto-prepared from a delayed application |
| 18 | Privacy / Trust Dashboard | `/privacy` |
| 19 | Disaster Mode | `/disaster` |
| 20 | Land / Revenue Service Navigator | Guided Q&A in `src/components/land-navigator.tsx`, used on `/` and in Ask Sahaayak |

Plus: **dark mode** (theme toggle, top-right) and **Google Translate integration** — the app's own dictionary covers English/Hindi/Chhattisgarhi chrome, and a hidden, custom-driven Google Translate widget (`src/components/google-translate.tsx`) translates the *entire* rendered page — including DB-driven content our dictionary doesn't cover — into 10 more Indian languages.

## AI architecture

`src/lib/ai.ts` is a clean `AIService`-style abstraction: `understandIntent`, `buildJourney`, `extractDocument`, `checkApplication`, `slaRisk`, `delayRisk`, `answerCopilot`. Every function returns a **structured, validated result** — nothing lets raw text drive a workflow directly. Every function today is a deterministic **"DEMO AI"** (rule-based, reproducible, zero API keys needed), so the whole prototype works fully offline. Swapping in a real LLM later means reimplementing these function bodies; every caller (chat route, copilot route, apply flow) stays unchanged.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** — chosen over a separate Vite+Express split because it already gave a working, cohesive full-stack app; rewriting a functioning stack mid-hackathon wasn't worth the risk (per "don't unnecessarily rewrite working code").
- **Tailwind CSS v4**, **Recharts**, **lucide-react**
- **better-sqlite3** — seeded, file-based SQLite (`data/sewasetu.db`), no external services
- **Web Speech API** for voice input; deterministic rule-based AI (see above)
- **Google Translate** (page-translation widget, custom-driven, default UI hidden)

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

The database seeds itself on first request: 16 districts, 18 services, ~225 synthetic applications over 90 days, a document vault, access log, and two demo citizens. Delete `data/` to re-seed from scratch.

## Suggested demo journey (~5 min)

1. **Home** → type *"I am starting a small shop"* → Journey Engine builds a 9-step government journey with 2 services, live.
2. Try *"Mere pitaji ki zameen mere naam transfer karni hai"* → routes into the **Land/Revenue Navigator**, a 5-question guided flow → generates a Land Mutation journey.
3. **Citizen dashboard** (`/citizen`) → proactive eligibility with **Match: High/Medium** and a visible "why" checklist.
4. **Apply** for a service → watch interoperability auto-verification → **Application Health Check** (catches a simulated address-mismatch) → submit.
5. **Track** → SLA countdown, delay-risk %, "why is my application stuck" explainer; if breached, **Raise Grievance** (auto-prepared).
6. Toggle **Assisted Mode** → re-open an apply flow → see the **Kendra Operator Copilot** panel (citizen has X, missing Y).
7. **Officer / MIS** (`/mis`) → pipeline funnel with bottleneck highlighted, AI root-cause breakdown, district×service heatmap, and the **Government Copilot** — ask "Why are applications delayed?" and watch it cite its data sources.
8. Flip to **dark mode**, then switch the language dropdown to any of the 10 Google-Translate languages — the whole page, not just app chrome, translates live.

## Project structure

```
src/
  app/
    page.tsx                landing — Ask Sewa Setu, Journey Engine result, focus-area map
    citizen/                proactive dashboard (eligibility, life events, applications)
    services/                catalogue + life-event bundles + voice search
    apply/[id]/              auto-verify → health check → submit wizard
    track/[id]/              SLA timeline, delay risk, grievance escalation
    profile/                 Citizen Service Profile
    documents/                Document Intelligence (mock OCR + reuse graph)
    grievances/               Smart Grievance / Escalation
    privacy/                  Privacy / Trust dashboard
    disaster/                 Disaster Mode
    mis/                      Governance Intelligence Dashboard + Government Copilot
    api/                      citizen, applications, verify, health-check, sla, mis,
                               governance, chat, copilot, documents, grievances, privacy
  lib/
    ai.ts                    AIService abstraction — the Government Journey Engine
    reference.ts              districts, departments, services, life events, doc types
    eligibility.ts            explainable proactive-eligibility rules engine
    db.ts                     SQLite schema, seed, MIS + governance aggregation
    i18n.ts / labels.ts       EN / HI / CG strings
  components/
    google-translate.tsx     hidden, custom-driven Google page-translation widget
    land-navigator.tsx        guided Land/Revenue Q&A (shared: homepage + chat)
    journey.tsx                Government Journey Engine result display
    sahaayak.tsx               floating AI assistant (chat + voice)
    providers.tsx               language / theme / assisted-mode state
```
