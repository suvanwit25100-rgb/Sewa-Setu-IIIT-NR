import { NextResponse } from "next/server";
import { getCitizen, listApplications, listNotifications } from "@/lib/db";
import { computeEligibility } from "@/lib/eligibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "demo";
  const citizen = getCitizen(id);
  if (!citizen) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    citizen,
    eligibility: computeEligibility(citizen),
    applications: listApplications(id),
    notifications: listNotifications(id),
  });
}
