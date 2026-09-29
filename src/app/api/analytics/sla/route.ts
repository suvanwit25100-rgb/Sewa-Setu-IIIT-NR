import { computeMis } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireRole(["officer", "admin"]);
  if (!gate.session) return gate.error;
  const mis = computeMis();
  return ok({
    breachRate: mis.totals.breachRate, breached: mis.totals.breached,
    within: mis.totals.total - mis.totals.breached, byDistrict: mis.byDistrict.map((d) => ({ district: d.name, breachRate: d.breachRate })),
  });
}
