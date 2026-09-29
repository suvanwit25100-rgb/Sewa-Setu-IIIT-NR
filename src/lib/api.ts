import { NextResponse } from "next/server";
import type { ApiOk, ApiErr } from "./types";

// Consistent response envelope for every route added after the initial
// build — see types.ts for why older routes are exempt.
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } satisfies ApiOk<T>, { status });
}

export function err(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } } satisfies ApiErr, { status });
}

export const Errors = {
  unauthenticated: () => err("UNAUTHENTICATED", "Sign in required", 401),
  forbidden: () => err("FORBIDDEN", "You do not have permission to do this", 403),
  notFound: (what: string) => err("NOT_FOUND", `${what} not found`, 404),
  validation: (message: string) => err("VALIDATION_ERROR", message, 422),
  server: (message = "Something went wrong") => err("SERVER_ERROR", message, 500),
};
