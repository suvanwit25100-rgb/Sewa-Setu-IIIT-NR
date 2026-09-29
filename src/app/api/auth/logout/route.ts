import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (session) logAudit({ actorId: session.userId, actorRole: session.role, action: "logout", entityType: "user", entityId: session.userId });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("ss_role", "", { path: "/", maxAge: 0 });
  res.cookies.set("ss_user", "", { path: "/", maxAge: 0 });
  return res;
}
