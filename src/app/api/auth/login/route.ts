import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mock authentication — no real credential check happens here, per the
// prototype's explicit "mock authentication for hackathon purposes" rule.
// Any non-empty username/password, any OTP, or the DigiLocker button all
// succeed; the only thing that matters is which role tab was used.
export async function POST(req: Request) {
  const { role } = (await req.json()) as { role: "citizen" | "officer" };
  if (role !== "citizen" && role !== "officer") {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set("ss_role", role, { path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
