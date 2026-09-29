import { requireRole } from "@/lib/auth";
import { getCitizenDetail } from "@/lib/db";
import { ok, Errors } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRole(["admin"]);
  if (!gate.session) return gate.error;

  const { id } = await params;
  const detail = getCitizenDetail(id);
  if (!detail) return Errors.notFound("Citizen");
  return ok(detail);
}
