import { SERVICES } from "@/lib/reference";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read-only service catalog API. The catalog itself is static reference
// data (src/lib/reference.ts) rather than a DB table — appropriate for a
// prototype where services/eligibility rules are part of the product
// design, not admin-editable content.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();

  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const department = url.searchParams.get("department");
  const search = url.searchParams.get("search")?.toLowerCase();

  let list = SERVICES;
  if (category) list = list.filter((s) => s.category === category);
  if (department) list = list.filter((s) => s.departmentId === department);
  if (search) list = list.filter((s) => `${s.name_en} ${s.name_hi} ${s.code}`.toLowerCase().includes(search));

  // isOnline / requiresPhysicalVerification are not modelled per-service in
  // this prototype's catalog — every service here is online, no physical
  // verification step exists in the demo workflow.
  return ok({ rows: list, total: list.length });
}
