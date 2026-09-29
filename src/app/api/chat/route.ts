import { NextResponse } from "next/server";
import { understandIntent } from "@/lib/ai";
import { getCitizen, listDocuments } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Government Journey Engine entry point — the core USP. Every response is a
// validated, structured AiIntentResult (see src/lib/ai.ts); nothing here
// lets free-text drive a workflow directly.
export async function POST(req: Request) {
  const { message, citizenId = "demo" } = (await req.json()) as { message: string; citizenId?: string };
  const citizen = getCitizen(citizenId);
  const vault = citizen ? listDocuments(citizenId) : [];
  const result = understandIntent(message ?? "", citizen, vault);
  return NextResponse.json(result);
}
