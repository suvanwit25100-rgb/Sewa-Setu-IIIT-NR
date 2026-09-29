import { NextResponse } from "next/server";
import { listGrievances, createGrievance } from "@/lib/db";

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
  const { applicationId, description } = (await req.json()) as { applicationId: string; description?: string };
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });
  const g = createGrievance(applicationId, description ?? "Application has exceeded its guaranteed SLA.");
  if (!g) return NextResponse.json({ error: "application not found" }, { status: 404 });
  return NextResponse.json({ grievance: g });
}
