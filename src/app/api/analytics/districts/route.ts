import { computeMis } from "@/lib/db";
import { ok } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireRole(["officer", "admin"]);
  if (!gate.session) return gate.error;
  return ok({ rows: computeMis().byDistrict });
}
