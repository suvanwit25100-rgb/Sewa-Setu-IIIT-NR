import { getCitizen, listApplications, listDocuments, listNotifications } from "@/lib/db";
import { computeEligibility } from "@/lib/eligibility";
import { SERVICES } from "@/lib/reference";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A single aggregated response the citizen frontend COULD render its whole
// dashboard from. The existing /citizen page still calls /api/citizen
// directly (unchanged, on purpose — see README) since that route already
// returns everything it needs; this route is the spec-named superset, adding
// profile completeness, pending-action counts, and document status that
// /api/citizen doesn't compute.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();

  const url = new URL(req.url);
  const citizenId = url.searchParams.get("citizenId") ?? session.userId;
  const citizen = getCitizen(citizenId);
  if (!citizen) return Errors.notFound("Citizen");

  const applications = listApplications(citizenId);
  const documents = listDocuments(citizenId);
  const notifications = listNotifications(citizenId);
  const eligibility = computeEligibility(citizen);

  const active = applications.filter((a) => !["delivered", "approved", "rejected"].includes(a.status));
  const pendingActions = notifications.filter((n) => n.read === 0).length;

  // Every field on CitizenProfile is required by this schema (no partial
  // profiles exist), so completeness is always 100 — included for contract
  // completeness rather than as a meaningful signal in this prototype.
  const profileCompleteness = 100;

  return ok({
    profile: citizen,
    profileCompleteness,
    applications: { active: active.length, total: applications.length, recent: applications.slice(0, 5) },
    notifications: { unread: pendingActions, recent: notifications.slice(0, 5) },
    documents: { count: documents.length, types: documents.map((d) => d.type) },
    potentialEligibility: eligibility.length,
    availableServices: SERVICES.length,
    pendingActions,
  });
}
