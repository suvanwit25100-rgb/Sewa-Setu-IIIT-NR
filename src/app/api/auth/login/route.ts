import { NextResponse } from "next/server";
import { resolveDemoUser, logAudit } from "@/lib/db";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES: Role[] = ["citizen", "operator", "officer", "admin"];

// Mock authentication — no real credential check happens here, per the
// prototype's explicit "mock authentication for hackathon purposes" rule.
// Any non-empty username/password, any OTP, or the DigiLocker button all
// succeed; the only thing that matters is which role tab was used. Each
// role resolves to its one canonical demo account (see db.ts resolveDemoUser).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { role?: string };
  const role = body.role as Role;
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  const user = resolveDemoUser(role);
  logAudit({ actorId: user.id, actorRole: role, action: "login", entityType: "user", entityId: user.id });

  const res = NextResponse.json({ ok: true, role, user: { id: user.id, name: user.name, email: user.email } });
  res.cookies.set("ss_role", role, { path: "/", maxAge: 60 * 60 * 24 * 7 });
  res.cookies.set("ss_user", user.id, { path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
