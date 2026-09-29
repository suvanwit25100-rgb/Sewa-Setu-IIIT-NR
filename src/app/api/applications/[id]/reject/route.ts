import { rejectApplication, createNotification, logAudit } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRole(["officer", "admin"]);
  if (!gate.session) return gate.error;

  const { id } = await params;
  const { reason } = (await req.json().catch(() => ({}))) as { reason?: string };
  const { app, error } = rejectApplication(id, reason);
  if (error === "not_found") return Errors.notFound("Application");
  if (error === "already_terminal") return Errors.validation(`Application is already ${app?.status} and cannot be changed`);

  if (app) {
    createNotification({
      citizenId: app.citizenId, applicationId: app.id, channel: "app", type: "APPLICATION_UPDATE",
      message_en: `Application #${app.id} was rejected.${reason ? ` Reason: ${reason}` : ""}`,
      message_hi: `आवेदन #${app.id} अस्वीकृत किया गया।${reason ? ` कारण: ${reason}` : ""}`,
    });
  }
  logAudit({ actorId: gate.session.userId, actorRole: gate.session.role, action: "application.reject", entityType: "application", entityId: id, metadata: { reason } });
  return ok(app);
}
