import { requireRole } from "@/lib/auth";
import { dbStats, computeMis, computeGovernance } from "@/lib/db";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The "clear backend page": DB row counts, catalog sizes, AI provider mode,
// and a quick governance snapshot — everything an admin needs to sanity
// check the system at a glance.
export async function GET() {
  const gate = await requireRole(["admin"]);
  if (!gate.session) return gate.error;

  const stats = dbStats();
  const mis = computeMis();
  const gov = computeGovernance();
  return ok({
    ...stats,
    applications: mis.totals,
    governance: { bottleneck: gov.bottleneck, todayAtRisk: gov.today.atRisk, todayDelayed: gov.today.delayed },
    endpoints: API_SURFACE,
  });
}

// A hand-written API reference — deliberately not a generated OpenAPI/Swagger
// spec (that's a heavier dependency + authoring cost than this prototype's
// remaining time budget warrants). Rendered by the admin "API Reference" tab.
export const API_SURFACE: { method: string; path: string; auth: string; purpose: string }[] = [
  { method: "GET", path: "/api/health", auth: "public", purpose: "Liveness/readiness + DB + AI provider status" },
  { method: "POST", path: "/api/auth/login", auth: "public", purpose: "Mock login — resolves the canonical demo account for a role" },
  { method: "POST", path: "/api/auth/logout", auth: "session", purpose: "Clears the session cookie" },
  { method: "GET", path: "/api/auth/me", auth: "session", purpose: "Current session's role + user record" },
  { method: "GET", path: "/api/citizen", auth: "session", purpose: "Citizen profile + eligibility + applications + notifications" },
  { method: "GET", path: "/api/services", auth: "session", purpose: "Service catalog, filterable by category/department/search" },
  { method: "GET", path: "/api/services/:id", auth: "session", purpose: "One service's full detail" },
  { method: "GET", path: "/api/services/:id/requirements", auth: "session", purpose: "Required docs, SLA, fee, eligibility rules for a service" },
  { method: "GET", path: "/api/life-events", auth: "session", purpose: "List of life events and their bundled services" },
  { method: "POST", path: "/api/life-events/detect", auth: "session", purpose: "Natural-language message → detected life event" },
  { method: "POST", path: "/api/ai/intent", auth: "session", purpose: "Full Journey Engine: intent + life event + services + journey" },
  { method: "GET", path: "/api/eligibility/services", auth: "session", purpose: "Explainable eligibility scoring for a citizen" },
  { method: "POST", path: "/api/documents", auth: "session", purpose: "Mock OCR upload → classify → extract → vault" },
  { method: "GET", path: "/api/documents", auth: "session", purpose: "A citizen's document vault + reuse graph" },
  { method: "GET", path: "/api/documents/reusable/:serviceId", auth: "session", purpose: "Which vault documents satisfy a service's requirements" },
  { method: "POST", path: "/api/applications", auth: "session", purpose: "Create (submit) an application" },
  { method: "GET", path: "/api/applications", auth: "session", purpose: "List applications, optionally by citizen" },
  { method: "GET/POST", path: "/api/applications/:id", auth: "session", purpose: "Fetch, or advance one workflow step" },
  { method: "POST", path: "/api/applications/:id/approve", auth: "officer/admin", purpose: "Force-approve (guards against terminal apps)" },
  { method: "POST", path: "/api/applications/:id/reject", auth: "officer/admin", purpose: "Reject (guards against terminal apps)" },
  { method: "POST", path: "/api/applications/:id/request-document", auth: "officer/admin", purpose: "Sends a DOCUMENT_REQUIRED notification to the citizen" },
  { method: "GET", path: "/api/applications/:id/health", auth: "session", purpose: "Application Health Check (docs/fields/consistency/eligibility)" },
  { method: "GET", path: "/api/applications/:id/sla", auth: "session", purpose: "SLA status + delay-risk score with reasons" },
  { method: "GET", path: "/api/notifications", auth: "session", purpose: "A citizen's notifications" },
  { method: "PATCH", path: "/api/notifications/:id/read", auth: "session", purpose: "Mark one notification read" },
  { method: "POST", path: "/api/notifications/read-all", auth: "session", purpose: "Mark all of a citizen's notifications read" },
  { method: "POST", path: "/api/grievances", auth: "session", purpose: "Auto-prepared grievance from a delayed application" },
  { method: "GET", path: "/api/grievances", auth: "session", purpose: "List grievances, optionally by citizen" },
  { method: "GET", path: "/api/grievances/:id", auth: "session", purpose: "One grievance's detail" },
  { method: "PATCH", path: "/api/grievances/:id", auth: "officer/admin", purpose: "Transition a grievance's status" },
  { method: "GET", path: "/api/mis", auth: "session", purpose: "Application-level MIS aggregates" },
  { method: "GET", path: "/api/governance", auth: "session", purpose: "Pipeline funnel, bottleneck, root cause, heatmap" },
  { method: "POST", path: "/api/copilot", auth: "session", purpose: "Government Copilot (also aliased at /api/government/copilot)" },
  { method: "GET", path: "/api/admin/stats", auth: "admin", purpose: "DB stats, catalog sizes, AI provider, this API reference" },
  { method: "GET", path: "/api/admin/citizens", auth: "admin", purpose: "Search/paginate the citizen pool" },
  { method: "GET", path: "/api/admin/citizens/:id", auth: "admin", purpose: "One citizen's full record: profile, docs, applications, grievances" },
  { method: "GET", path: "/api/admin/audit", auth: "admin", purpose: "Audit log of key actions across the system" },
];
