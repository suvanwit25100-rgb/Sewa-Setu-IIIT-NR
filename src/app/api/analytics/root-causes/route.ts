import { computeGovernance } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireRole(["officer", "admin"]);
  if (!gate.session) return gate.error;
  const gov = computeGovernance();
  return ok({
    rootCauses: gov.rootCause.map((r) => ({
      cause: r.reason.toUpperCase().replace(/\s+/g, "_"),
      impactPercentage: r.pct,
      evidence: [`${r.pct}% of currently delayed/at-risk applications are attributable to ${r.reason.toLowerCase()}.`],
    })),
    insight: gov.insight_en,
  });
}
