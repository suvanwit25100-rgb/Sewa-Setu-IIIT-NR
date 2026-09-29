import { computeMis } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireRole(["officer", "admin"]);
  if (!gate.session) return gate.error;
  const mis = computeMis();
  return ok({ totals: mis.totals, byStatus: mis.byStatus, byChannel: mis.byChannel, trend: mis.trend });
}
