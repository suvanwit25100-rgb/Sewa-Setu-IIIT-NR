import { understandIntent } from "@/lib/ai";
import { getCitizen, listDocuments } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scoped life-event-only view of the Journey Engine (the full engine also
// lives at /api/ai/intent and /api/chat, which additionally handle direct
// service lookups, land-transfer, and disaster intents).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();

  const { message } = (await req.json().catch(() => ({}))) as { message?: string };
  if (!message?.trim()) return Errors.validation("message is required");

  const citizen = session.role === "citizen" ? getCitizen(session.userId) : null;
  const vault = citizen ? listDocuments(citizen.id) : [];
  const result = understandIntent(message, citizen, vault);

  return ok({
    lifeEvent: result.journey?.lifeEventId ?? (result.kind === "land" ? "land_transfer" : result.kind === "disaster" ? "disaster" : null),
    intent: result.intent,
    confidence: result.confidence,
    services: result.journey?.services ?? (result.serviceIds ?? []).map((serviceId) => ({ serviceId })),
  });
}
