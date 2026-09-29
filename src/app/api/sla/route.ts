import { NextResponse } from "next/server";
import { getApplication } from "@/lib/db";
import { slaRisk, delayRisk } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SLA Intelligence (Feature 9) + Delay Prediction (Feature 10).
export async function GET(req: Request) {
  const applicationId = new URL(req.url).searchParams.get("applicationId");
  if (!applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });
  const app = getApplication(applicationId);
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ risk: slaRisk(app), delay: delayRisk(app) });
}
