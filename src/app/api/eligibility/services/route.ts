import { getCitizen } from "@/lib/db";
import { assessEligibility } from "@/lib/eligibility";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Explainable eligibility scoring — every status is backed by a visible list
// of which rules matched and which didn't. Never presented as an official
// government determination (see the wording in each item's `reasons`).
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();

  const url = new URL(req.url);
  const citizenId = url.searchParams.get("citizenId") ?? session.userId;
  const citizen = getCitizen(citizenId);
  if (!citizen) return Errors.notFound("Citizen");

  return ok({ services: assessEligibility(citizen), note: "Potentially eligible based on available information — not an official determination." });
}
