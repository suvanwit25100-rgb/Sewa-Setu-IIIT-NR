import { NextResponse } from "next/server";
import { getCitizen, listAccessLog } from "@/lib/db";
import { computeEligibility } from "@/lib/eligibility";
import { dept } from "@/lib/reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Privacy / Trust dashboard (Feature 18). Synthetic data only.
export async function GET(req: Request) {
  const citizenId = new URL(req.url).searchParams.get("id") ?? "demo";
  const citizen = getCitizen(citizenId);
  if (!citizen) return NextResponse.json({ error: "not found" }, { status: 404 });
  const accessLog = listAccessLog(citizenId).map((a) => ({ ...a, departmentName: dept(a.departmentId).name_en }));
  const eligibility = computeEligibility(citizen);
  return NextResponse.json({ citizen, accessLog, eligibility });
}
