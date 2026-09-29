# SewaSetu Sahaayak — Chhattisgarh

**A next-generation _proactive layer_ on top of Chhattisgarh's Seva Setu** — hackathon prototype for Problem Statement 2 (Next-Generation Digital Governance).

Seva Setu already does single-window, WhatsApp, Bhashini and Aadhaar/DigiLocker well (441 services, 3.2 cr+ transactions, backed by the **Lok Seva Guarantee Act, 2011**). This prototype adds the layer it doesn't yet have: services that **find the citizen**, work in **their language and offline**, **auto-verify across departments**, and give officers a **live, actionable MIS** — keeping citizen simplicity and government operability at the centre.

> ⚠️ Prototype / concept demo. Not affiliated with the Government of Chhattisgarh. Data is synthetic and seeded locally.

## How it maps to the problem statement

| Focus area | Where it lives |
|---|---|
| Proactive & personalized services | Eligibility engine → `/citizen` "Recommended for you" (`src/lib/eligibility.ts`) |
| Unified experience & simplified journeys | Life-event bundles + write-once profile (`/services?event=…`) |
| Mobile-first, assisted, inclusive | Responsive UI, EN/HI/**Chhattisgarhi** toggle, **voice input**, **Assisted Mode** (operator + consent) |
| Smart workflow, tracking, communication | Status timeline + **Lok Seva Guarantee SLA countdown** (`/track/[id]`) + WhatsApp/SMS feed |
| Data-driven governance & MIS | Collector dashboard + **"where to send a camp"** alerts (`/mis`) |
| Departmental interoperability & emerging tech | Auto-verify from Aadhaar / Bhuiyan / PFMS / e-Shram (`/api/verify`) + AI Sahaayak assistant |

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling, **Recharts** for the MIS
- **better-sqlite3** — seeded SQLite database (`src/lib/db.ts`), no external services
- Web Speech API for voice; rule-based AI assistant (pluggable to an LLM + Bhashini)

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

The SQLite DB is created and seeded on first request (`data/sewasetu.db`) with 16 districts, 16 services, and ~220 applications spread over 90 days. Delete `data/` to re-seed.

## Suggested demo storyline (≈4 min)

1. **Landing** → the six focus areas map to real screens.
2. **Citizen** → "Sukhmati Kashyap" (elderly, tribal, BPL, Bastar) sees **6 benefits she never claimed** — proactive discovery.
3. Switch language to **छत्तीसगढ़ी**, use the **mic** to search, open **AI Sahaayak** and type _"my father passed away"_ → it bundles the **Bereavement** life-event.
4. **Apply** for Old Age Pension → watch **departmental interoperability** auto-verify Aadhaar + PFMS, **4 uploads skipped** → submit.
5. **Track** → SLA countdown under the Lok Seva Guarantee; hit _Advance workflow_ to move it live.
6. Toggle **Assisted Mode** → re-apply as a CHOICE operator with a **consent trail** (the last-mile story).
7. **Officer / MIS** → KPIs, **19% breach rate**, breach-by-district (LWE districts in red), channel mix (assisted+voice = last-mile), and **auto-generated camp recommendations** for Sukma/Bastar. Clear the **triage queue** one click at a time.

## Project structure

```
src/
  app/
    page.tsx              landing / focus-area map
    citizen/              proactive dashboard
    services/             catalogue + life-event bundles + voice search
    apply/[id]/           auto-verify → submit wizard
    track/[id]/           SLA timeline
    mis/                  officer + Collector MIS
    api/                  citizen, applications, verify, mis, chat
  lib/
    reference.ts          districts, departments, services, life events
    eligibility.ts        proactive rules engine
    db.ts                 SQLite schema, seed, MIS aggregation
    i18n.ts / labels.ts   EN / HI / CG strings
  components/             top-bar, sahaayak, voice-button, ui primitives
```
