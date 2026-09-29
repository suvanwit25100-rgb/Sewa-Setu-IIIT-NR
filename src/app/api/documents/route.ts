import { NextResponse } from "next/server";
import { listDocuments, createDocument } from "@/lib/db";
import { servicesReusingDoc } from "@/lib/reference";

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
  const { citizenId = "demo", fileName } = (await req.json()) as { citizenId?: string; fileName: string };
  if (!fileName) return NextResponse.json({ error: "fileName required" }, { status: 400 });
  const doc = createDocument(citizenId, fileName);
  return NextResponse.json({ document: doc, reusableIn: servicesReusingDoc(doc.type).map((s) => s.name_en) });
}
