import { requireRole } from "@/lib/auth";
import { listCitizens } from "@/lib/db";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireRole(["admin"]);
  if (!gate.session) return gate.error;

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const search = url.searchParams.get("search") ?? undefined;
  const districtId = url.searchParams.get("districtId") ?? undefined;

  const { rows, total } = listCitizens({ page, limit, search, districtId });
  return ok({ rows, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
}
