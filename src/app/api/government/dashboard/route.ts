import { computeMis, computeGovernance } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One aggregated response for the whole Governance Dashboard — the /mis
// page itself calls the more granular /api/mis + /api/governance directly
// (already a single round-trip each), but this route exists for any
// external consumer that wants everything in one call, per the spec.
export async function GET() {
  const gate = await requireRole(["officer", "admin"]);
  if (!gate.session) return gate.error;

  const mis = computeMis();
  const gov = computeGovernance();
  return ok({
    overview: { ...mis.totals, atRisk: gov.today.atRisk, slaComplianceRate: 100 - mis.totals.breachRate },
    applications: { byStatus: mis.byStatus, byChannel: mis.byChannel },
    sla: { pipeline: gov.pipeline, bottleneck: gov.bottleneck },
    bottlenecks: [gov.bottleneck],
    rootCauses: gov.rootCause,
    departments: gov.byDepartment,
    districts: mis.byDistrict,
    trends: mis.trend,
    campAlerts: mis.campAlerts,
  });
}
