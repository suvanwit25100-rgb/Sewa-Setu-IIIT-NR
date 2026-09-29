import { listNotifications } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();
  const url = new URL(req.url);
  const citizenId = url.searchParams.get("citizenId") ?? session.userId;
  return ok({ rows: listNotifications(citizenId) });
}
