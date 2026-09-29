import { getGrievance, updateGrievanceStatus, logAudit } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { GrievanceStatusSchema, parseBody } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = getGrievance(id);
  if (!g) return Errors.notFound("Grievance");
  return ok(g);
}

// Only officers/admins move a grievance through its lifecycle.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();
  if (session.role !== "officer" && session.role !== "admin") return Errors.forbidden();

  const { id } = await params;
  const parsed = parseBody(GrievanceStatusSchema, await req.json().catch(() => ({})));
  if (!parsed.ok) return Errors.validation(parsed.issue);
  const data = parsed.data;

  const { grievance, error } = updateGrievanceStatus(id, data.status);
  if (error === "not_found") return Errors.notFound("Grievance");
  if (error === "invalid_transition") return Errors.validation(`Cannot move a ${grievance?.status} grievance to ${data.status}`);

  logAudit({ actorId: session.userId, actorRole: session.role, action: "grievance.status_change", entityType: "grievance", entityId: id, metadata: { status: data.status } });
  return ok(grievance);
}
