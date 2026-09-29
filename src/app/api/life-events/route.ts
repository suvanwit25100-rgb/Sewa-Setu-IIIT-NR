import { LIFE_EVENTS } from "@/lib/reference";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();
  return ok({ rows: LIFE_EVENTS });
}
