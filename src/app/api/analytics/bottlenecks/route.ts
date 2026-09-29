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
    bottlenecks: [{
      stage: gov.bottleneck.stage,
      percentageOfDelayedApplications: gov.bottleneck.pctOfDelayed,
      averageWaitingDays: gov.heatmap.length ? Math.round((gov.heatmap.reduce((s, h) => s + h.avgDays, 0) / gov.heatmap.length) * 10) / 10 : 0,
      severity: gov.bottleneck.pctOfDelayed > 40 ? "HIGH" : gov.bottleneck.pctOfDelayed > 20 ? "MEDIUM" : "LOW",
    }],
    pipeline: gov.pipeline,
  });
}
