import { NextResponse } from "next/server";
import { createApplication, listApplications } from "@/lib/db";
import { getCitizen } from "@/lib/db";
import type { Channel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const citizenId = new URL(req.url).searchParams.get("citizenId") ?? undefined;
  return NextResponse.json({ applications: listApplications(citizenId) });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { serviceId, citizenId = "demo", channel = "web", assistedBy = null } = body as {
    serviceId: string; citizenId?: string; channel?: Channel; assistedBy?: string | null;
  };
  if (!serviceId) return NextResponse.json({ error: "serviceId required" }, { status: 400 });
  const citizen = getCitizen(citizenId);
  if (!citizen) return NextResponse.json({ error: "citizen not found" }, { status: 404 });
  const app = createApplication({
    serviceId, citizenId,
    citizenName: citizen.name, districtId: citizen.districtId,
    channel, assistedBy,
  });
  return NextResponse.json({ application: app });
}
