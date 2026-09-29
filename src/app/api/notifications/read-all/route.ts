import { markAllNotificationsRead } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();
  const { citizenId } = (await req.json().catch(() => ({}))) as { citizenId?: string };
  const count = markAllNotificationsRead(citizenId ?? session.userId);
  return ok({ updated: count });
}
