import { SERVICES, DOC_TYPE_LABEL } from "@/lib/reference";
import { listDocuments } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";
import type { DocType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ serviceId: string }> }) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();

  const { serviceId } = await params;
  const svc = SERVICES.find((s) => s.id === serviceId);
  if (!svc) return Errors.notFound("Service");

  const url = new URL(req.url);
  const citizenId = url.searchParams.get("citizenId") ?? session.userId;
  const vault = listDocuments(citizenId);

  const matches = svc.requiredDocs.map((requiredDocument) => {
    const hay = requiredDocument.toLowerCase();
    const existing = vault.find((d) => hay.includes(DOC_TYPE_LABEL[d.type as DocType].en.split(" ")[0].toLowerCase()));
    return {
      requiredDocument,
      existingDocument: existing ? { id: existing.id, type: existing.type, label: existing.label_en, uploadedAt: existing.uploadedAt } : null,
      status: existing ? "REUSABLE" : "MISSING",
    };
  });

  return ok({ serviceId, requirements: matches, reusableCount: matches.filter((m) => m.status === "REUSABLE").length });
}
