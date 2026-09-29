import { getApplication, delayRisk } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dedicated Delay Risk endpoint (spec section 21) — a thin view over the
// same rule-based model used by /api/applications/:id/sla. This is a
// prototype decision-support score, not a scientifically validated
// prediction, and is labelled as such by the caller.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();

  const { id } = await params;
  const app = getApplication(id);
  if (!app) return Errors.notFound("Application");

  const { pct, reasons_en } = delayRisk(app);
  const risk = pct > 60 ? "HIGH" : pct > 35 ? "MEDIUM" : "LOW";
  return ok({ risk, score: pct, factors: reasons_en, disclaimer: "Prototype decision-support indicator, not a validated prediction." });
}
