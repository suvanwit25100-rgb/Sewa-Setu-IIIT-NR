import { NextResponse } from "next/server";
import { checkApplication } from "@/lib/ai";
import { getCitizen, listDocuments } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Application Health Check (Feature 6): CHECK -> FIX -> APPLY, instead of
// APPLY -> REJECT -> DISCOVER ERROR.
export async function POST(req: Request) {
  const { serviceId, citizenId = "demo" } = (await req.json()) as { serviceId: string; citizenId?: string };
  const citizen = getCitizen(citizenId);
  if (!citizen) return NextResponse.json({ error: "citizen not found" }, { status: 404 });
  const vault = listDocuments(citizenId);
  const health = checkApplication(serviceId, citizen, vault);
  return NextResponse.json(health);
}
