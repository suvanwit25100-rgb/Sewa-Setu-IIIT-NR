import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Mock authentication gate (per the spec's "mock auth is acceptable for a
// hackathon demo" rule) — no real credential validation happens anywhere;
// this only checks whether a session cookie was set by /api/auth/login.
const PROTECTED_PREFIXES = [
  "/citizen", "/profile", "/documents", "/grievances", "/privacy",
  "/apply", "/track", "/mis", "/disaster", "/services",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = req.cookies.get("ss_role")?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !role) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in and revisiting the login page: skip straight past it.
  if (pathname === "/" && role) {
    const url = req.nextUrl.clone();
    url.pathname = role === "officer" ? "/mis" : "/citizen";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
