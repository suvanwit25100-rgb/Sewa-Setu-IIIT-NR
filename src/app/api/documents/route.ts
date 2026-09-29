import { NextResponse } from "next/server";
import { listDocuments, createDocument, logAudit } from "@/lib/db";
import { servicesReusingDoc } from "@/lib/reference";
import { getSession } from "@/lib/auth";
import { CreateDocumentSchema, parseBody } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const citizenId = new URL(req.url).searchParams.get("citizenId") ?? "demo";
  const docs = listDocuments(citizenId);
  return NextResponse.json({
    documents: docs.map((d) => ({ ...d, reusableIn: servicesReusingDoc(d.type).map((s) => s.name_en) })),
  });
}

// Document Intelligence: UPLOAD -> mock OCR -> classification -> field
// extraction -> vault. No real OCR provider is wired up for the prototype;
// see extractDocument() in src/lib/ai.ts for the deterministic fallback.
export async function POST(req: Request) {
  const parsed = parseBody(CreateDocumentSchema, await req.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ error: parsed.issue }, { status: 422 });
  const data = parsed.data;

  const doc = createDocument(data.citizenId, data.fileName);

  const session = await getSession();
  logAudit({ actorId: session?.userId ?? data.citizenId, actorRole: session?.role ?? "citizen", action: "document.upload", entityType: "document", entityId: doc.id, metadata: { type: doc.type } });

  return NextResponse.json({ document: doc, reusableIn: servicesReusingDoc(doc.type).map((s) => s.name_en) });
}
