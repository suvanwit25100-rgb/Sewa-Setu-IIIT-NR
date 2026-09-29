import { getApplication, createNotification, logAudit } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireRole(["officer", "admin"]);
  if (!gate.session) return gate.error;

  const { id } = await params;
  const app = getApplication(id);
  if (!app) return Errors.notFound("Application");

  const { documentName } = (await req.json().catch(() => ({}))) as { documentName?: string };
  const what = documentName?.trim() || "an additional document";

  const notification = createNotification({
    citizenId: app.citizenId, applicationId: app.id, channel: "app", type: "DOCUMENT_REQUIRED",
    message_en: `Please upload ${what} for application #${app.id}.`,
    message_hi: `कृपया आवेदन #${app.id} हेतु ${what} अपलोड करें।`,
  });

  logAudit({ actorId: gate.session.userId, actorRole: gate.session.role, action: "application.request_document", entityType: "application", entityId: id, metadata: { documentName: what } });
  return ok({ notification });
}
