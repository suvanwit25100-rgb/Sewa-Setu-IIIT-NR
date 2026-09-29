import { SERVICES, dept } from "@/lib/reference";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();

  const { id } = await params;
  const s = SERVICES.find((x) => x.id === id);
  if (!s) return Errors.notFound("Service");
  return ok({ ...s, department: dept(s.departmentId) });
}
