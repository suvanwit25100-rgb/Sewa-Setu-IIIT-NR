import { cookies } from "next/headers";
import { getUser } from "./db";
import type { Role, UserRecord } from "./types";
import { Errors } from "./api";

export interface Session {
  role: Role;
  userId: string;
  user: UserRecord | null;
}

/** Reads the mock session cookies (see /api/auth/login). No JWT, no
 *  password — this is the "mock authentication is acceptable for a
 *  hackathon demo" path, made real enough to gate routes by role. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const role = store.get("ss_role")?.value as Role | undefined;
  const userId = store.get("ss_user")?.value;
  if (!role || !userId) return null;
  return { role, userId, user: getUser(userId) };
}

/** Route-handler guard: returns the session on success, or a ready-to-return
 *  NextResponse error otherwise. Usage:
 *    const gate = await requireRole(["admin"]);
 *    if (!gate.session) return gate.error;
 */
export async function requireRole(allowed: Role[]) {
  const session = await getSession();
  if (!session) return { session: null, error: Errors.unauthenticated() } as const;
  if (!allowed.includes(session.role)) return { session: null, error: Errors.forbidden() } as const;
  return { session, error: null } as const;
}
