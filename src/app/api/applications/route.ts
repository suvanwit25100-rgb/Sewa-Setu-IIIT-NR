import { NextResponse } from "next/server";
import { createApplication, listApplications, getCitizen, createNotification, logAudit } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CreateApplicationSchema, parseBody } from "@/lib/validation";
import { service } from "@/lib/reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const citizenId = new URL(req.url).searchParams.get("citizenId") ?? undefined;
  return NextResponse.json({ applications: listApplications(citizenId) });
}

export async function POST(req: Request) {
  const parsed = parseBody(CreateApplicationSchema, await req.json().catch(() => ({})));
  if (!parsed.ok) return NextResponse.json({ error: parsed.issue }, { status: 422 });
  const data = parsed.data;

  const citizen = getCitizen(data.citizenId);
  if (!citizen) return NextResponse.json({ error: "citizen not found" }, { status: 404 });
  if (!service(data.serviceId)) return NextResponse.json({ error: "service not found" }, { status: 404 });

  const app = createApplication({
    serviceId: data.serviceId, citizenId: data.citizenId,
    citizenName: citizen.name, districtId: citizen.districtId,
    channel: data.channel, assistedBy: data.assistedBy,
  });

  const svc = service(data.serviceId);
  createNotification({
    citizenId: citizen.id, applicationId: app.id, channel: "app", type: "APPLICATION_UPDATE",
    message_en: `Application #${app.id} for ${svc.name_en} submitted and auto-verifying.`,
    message_hi: `आवेदन #${app.id} (${svc.name_hi}) जमा हुआ, स्वतः सत्यापन जारी।`,
  });

  const session = await getSession();
  logAudit({ actorId: session?.userId ?? citizen.id, actorRole: session?.role ?? "citizen", action: "application.submit", entityType: "application", entityId: app.id, metadata: { serviceId: data.serviceId, channel: data.channel } });

  return NextResponse.json({ application: app });
}
