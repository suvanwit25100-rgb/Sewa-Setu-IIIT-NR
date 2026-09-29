import { NextResponse } from "next/server";
import { listGrievances, createGrievance, logAudit } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CreateGrievanceSchema, parseBody } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const citizenId = new URL(req.url).searchParams.get("citizenId") ?? undefined;
  return NextResponse.json({ grievances: listGrievances(citizenId) });
}

// Smart Grievance / Escalation (Feature 17): the citizen never fills a
// separate grievance form from scratch — it is auto-prepared from the
// application record. They only review + submit.
export async function POST(req: Request) {
  const parsed = parseBody(CreateGrievanceSchema, await req.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ error: parsed.issue }, { status: 422 });
  const data = parsed.data;

  const g = createGrievance(data.applicationId, data.description ?? "Application has exceeded its guaranteed SLA.");
  if (!g) return NextResponse.json({ error: "application not found" }, { status: 404 });

  const session = await getSession();
  logAudit({ actorId: session?.userId ?? g.citizenId, actorRole: session?.role ?? "citizen", action: "grievance.create", entityType: "grievance", entityId: g.id, metadata: { applicationId: g.applicationId } });

  return NextResponse.json({ grievance: g });
}
