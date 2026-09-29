import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@/lib/types";

// Mock authentication + RBAC gate (per the spec's "mock auth is acceptable
// for a hackathon demo" rule) — no real credential validation happens
// anywhere; this only checks the session cookie set by /api/auth/login and
// enforces which roles may reach which portal.
const CITIZEN_AREA = ["/citizen", "/profile", "/documents", "/grievances", "/privacy", "/apply", "/track", "/disaster", "/services"];
const OFFICER_AREA = ["/mis"];
const ADMIN_AREA = ["/admin"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const HOME_FOR: Record<Role, string> = { citizen: "/citizen", operator: "/citizen", officer: "/mis", admin: "/admin" };

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get("ss_role")?.value as Role | undefined;

  const needsAuth = matches(pathname, [...CITIZEN_AREA, ...OFFICER_AREA, ...ADMIN_AREA]);
  if (needsAuth && !role) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (role) {
    // Least-privilege: a citizen/operator can't reach the officer or admin
    // portal, and an officer can't reach the admin portal. Admins may reach
    // everywhere for oversight.
    const deniedOfficerArea = matches(pathname, OFFICER_AREA) && role !== "officer" && role !== "admin";
    const deniedAdminArea = matches(pathname, ADMIN_AREA) && role !== "admin";
    if (deniedOfficerArea || deniedAdminArea) {
      const url = req.nextUrl.clone();
      url.pathname = HOME_FOR[role];
      return NextResponse.redirect(url);
    }

    // Already signed in and revisiting the login page: skip straight past it.
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = HOME_FOR[role];
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
