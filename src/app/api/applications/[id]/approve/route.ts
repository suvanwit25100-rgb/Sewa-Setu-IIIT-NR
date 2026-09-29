import { approveApplication, logAudit } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRole(["officer", "admin"]);
  if (!gate.session) return gate.error;

  const { id } = await params;
  const { app, error } = approveApplication(id);
  if (error === "not_found") return Errors.notFound("Application");
  if (error === "already_terminal") return Errors.validation(`Application is already ${app?.status} and cannot be changed`);

  logAudit({ actorId: gate.session.userId, actorRole: gate.session.role, action: "application.approve", entityType: "application", entityId: id });
  return ok(app);
}
