import { getSession } from "@/lib/auth";
import { ok, Errors } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();
  return ok({ role: session.role, user: session.user });
}
