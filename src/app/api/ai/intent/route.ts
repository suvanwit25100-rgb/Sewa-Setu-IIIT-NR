import { understandIntent } from "@/lib/ai";
import { getCitizen, listDocuments } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The full Government Journey Engine entry point, per the spec's exact
// contract shape. Functionally identical to /api/chat (which the citizen
// UI's Ask Sewa Setu box + Sahaayak widget call) — this route exists so the
// documented POST /api/ai/intent contract is honoured too, without forking
// the underlying logic.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();

  const { message } = (await req.json().catch(() => ({}))) as { message?: string; language?: string };
  if (!message?.trim()) return Errors.validation("message is required");

  const citizen = session.role === "citizen" ? getCitizen(session.userId) : null;
  const vault = citizen ? listDocuments(citizen.id) : [];
  const result = understandIntent(message, citizen, vault);

  return ok({
    intent: result.intent,
    lifeEvent: result.journey?.lifeEventId ?? null,
    confidence: result.confidence,
    suggestedServices: result.journey?.services ?? (result.serviceIds ?? []).map((serviceId) => ({ serviceId })),
    journey: result.journey ?? null,
    reply: { en: result.reply_en, hi: result.reply_hi },
  });
}
