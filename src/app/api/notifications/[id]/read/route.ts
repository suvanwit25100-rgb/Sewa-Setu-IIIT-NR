import { markNotificationRead } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();
  const { id } = await params;
  const found = markNotificationRead(id);
  if (!found) return Errors.notFound("Notification");
  return ok({ id, read: true });
}
