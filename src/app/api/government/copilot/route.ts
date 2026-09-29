import { computeMis, computeGovernance } from "@/lib/db";
import { answerCopilot } from "@/lib/ai";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Spec-named alias of POST /api/copilot (which the /mis dashboard's
// Government Copilot panel calls directly) — same underlying analytics, no
// forked logic. The AI never invents a number here: answerCopilot() only
// ever quotes values already computed by computeMis()/computeGovernance().
export async function POST(req: Request) {
  const gate = await getSession();
  if (!gate) return Errors.unauthenticated();
  if (gate.role !== "officer" && gate.role !== "admin") return Errors.forbidden();

  const { question } = (await req.json().catch(() => ({}))) as { question?: string };
  const mis = computeMis();
  const gov = computeGovernance();
  const result = answerCopilot(question ?? "", mis, gov);

  return ok({ answer: result.answer, dataSources: result.citing, insights: gov.rootCause });
}
