import { NextResponse } from "next/server";
import { computeMis, computeGovernance } from "@/lib/db";
import { answerCopilot } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Government Copilot (Feature 14): decision-support for officers, always
// citing the exact dashboard sections it drew from — never a bare claim.
export async function POST(req: Request) {
  const { question } = (await req.json()) as { question: string };
  const mis = computeMis();
  const gov = computeGovernance();
  const result = answerCopilot(question ?? "", mis, gov);
  return NextResponse.json(result);
}
