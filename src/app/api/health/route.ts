import { getDb } from "@/lib/db";
import { ok, err } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let database: "connected" | "error" = "connected";
  try {
    getDb().prepare("SELECT 1").get();
  } catch {
    database = "error";
  }
  if (database === "error") return err("DB_UNAVAILABLE", "Database connection failed", 503);
  return ok({
    status: "ok",
    database,
    aiProvider: process.env.AI_PROVIDER ?? "mock",
    environment: process.env.NODE_ENV ?? "development",
  });
}
