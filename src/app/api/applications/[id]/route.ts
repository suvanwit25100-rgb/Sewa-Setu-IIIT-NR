import { NextResponse } from "next/server";
import { advanceApplication, getApplication, logAudit } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplication(id);
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ application: app });
}

// POST advances the application one workflow step (demo control).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = advanceApplication(id);
  if (!app) return NextResponse.json({ error: "not found" }, { status: 404 });

  const session = await getSession();
  logAudit({ actorId: session?.userId ?? "system", actorRole: session?.role ?? "anonymous", action: "application.advance", entityType: "application", entityId: id, metadata: { status: app.status } });

  return NextResponse.json({ application: app });
}
