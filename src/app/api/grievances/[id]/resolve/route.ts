import { getGrievance, updateGrievanceStatus, logAudit } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();
  if (session.role !== "officer" && session.role !== "admin") return Errors.forbidden();

  const { id } = await params;
  if (!getGrievance(id)) return Errors.notFound("Grievance");

  const { grievance, error } = updateGrievanceStatus(id, "resolved");
  if (error === "invalid_transition") return Errors.validation(`Cannot resolve a ${grievance?.status} grievance directly`);

  logAudit({ actorId: session.userId, actorRole: session.role, action: "grievance.resolve", entityType: "grievance", entityId: id });
  return ok(grievance);
}
