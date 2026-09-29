import { requireRole } from "@/lib/auth";
import { listAuditLog } from "@/lib/db";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireRole(["admin"]);
  if (!gate.session) return gate.error;

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const actorRole = url.searchParams.get("actorRole") ?? undefined;
  return ok({ rows: listAuditLog({ limit, actorRole }) });
}
