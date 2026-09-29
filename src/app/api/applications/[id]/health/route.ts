import { checkApplication } from "@/lib/ai";
import { getApplication, getCitizen, listDocuments } from "@/lib/db";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Health check for an EXISTING application (spec contract shape). The apply
// wizard's own pre-submission check lives at POST /api/health-check and
// takes a serviceId directly, since no application exists yet at that
// point — this route re-derives the same check from a submitted application.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();

  const { id } = await params;
  const app = getApplication(id);
  if (!app) return Errors.notFound("Application");
  const citizen = getCitizen(app.citizenId);
  if (!citizen) return Errors.notFound("Citizen");

  const h = checkApplication(app.serviceId, citizen, listDocuments(citizen.id));
  const checks = [
    { name: "Required Documents", status: h.docsOk.have >= h.docsOk.need ? "PASS" : "WARNING", message: `${h.docsOk.have}/${h.docsOk.need} on file` },
    { name: "Required Fields", status: h.fieldsOk.have >= h.fieldsOk.need - 1 ? "PASS" : "WARNING", message: `${h.fieldsOk.have}/${h.fieldsOk.need} complete` },
    { name: "Document Quality", status: h.quality ? "PASS" : "WARNING" },
    { name: "Information Consistency", status: h.consistency.ok ? "PASS" : "WARNING", message: h.consistency.issue_en },
    { name: "Eligibility", status: h.eligibility ? "PASS" : "FAIL" },
  ];
  const overallStatus = checks.some((c) => c.status === "FAIL") ? "FAIL" : checks.some((c) => c.status === "WARNING") ? "WARNING" : "PASS";

  return ok({ overallStatus, checks });
}
