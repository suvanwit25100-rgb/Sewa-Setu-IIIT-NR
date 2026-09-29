import { getApplication, slaRisk, delayRisk } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_MAP = { low: "WITHIN_SLA", medium: "WITHIN_SLA", high: "AT_RISK", exceeded: "SLA_EXCEEDED" } as const;

// SLA contract per spec: elapsed/remaining days, percentage, and a
// WITHIN_SLA / AT_RISK / SLA_EXCEEDED status. The citizen-facing tracker
// calls GET /api/sla?applicationId=... (unchanged, different shape) — this
// route exists so the documented /api/applications/:id/sla path also works.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();

  const { id } = await params;
  const app = getApplication(id);
  if (!app) return Errors.notFound("Application");

  const elapsedDays = Math.floor((Date.now() - new Date(app.submittedAt).getTime()) / 864e5);
  const remainingDays = app.slaDays - elapsedDays;
  const { risk, elapsedPct } = slaRisk(app);
  const { pct, reasons_en } = delayRisk(app);

  return ok({
    slaDays: app.slaDays, elapsedDays, remainingDays,
    percentageElapsed: elapsedPct, status: STATUS_MAP[risk],
    delayRisk: { level: risk === "low" ? "LOW" : risk === "medium" ? "MEDIUM" : "HIGH", score: pct, factors: reasons_en },
  });
}
