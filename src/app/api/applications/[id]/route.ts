import { NextResponse } from "next/server";
import { advanceApplication, getApplication } from "@/lib/db";

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
  return NextResponse.json({ application: app });
}
