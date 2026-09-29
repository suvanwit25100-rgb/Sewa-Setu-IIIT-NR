import { computeMis, computeGovernance } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/analytics/overview — the Governance Dashboard's headline numbers.
// Filters (districtId/departmentId/serviceId/startDate/endDate) named in the
// spec are not implemented here — this prototype's aggregation functions
// compute over the full dataset rather than a filtered subset. See README
// "Known limitations" for what a non-prototype iteration would add.
export async function GET() {
  const gate = await requireRole(["officer", "admin"]);
  if (!gate.session) return gate.error;

  const mis = computeMis();
  const gov = computeGovernance();
  return ok({
    totalApplications: mis.totals.total,
    completedApplications: mis.totals.delivered,
    pendingApplications: mis.totals.pending,
    delayedApplications: mis.totals.breached,
    atRiskApplications: gov.today.atRisk,
    slaComplianceRate: 100 - mis.totals.breachRate,
    topBottlenecks: [gov.bottleneck],
    topDelayedServices: mis.byService.slice(0, 5),
    departmentPerformance: gov.byDepartment,
    districtPerformance: mis.byDistrict,
  });
}
