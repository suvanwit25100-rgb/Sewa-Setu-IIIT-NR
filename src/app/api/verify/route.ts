import { NextResponse } from "next/server";
import { getCitizen } from "@/lib/db";
import { service } from "@/lib/reference";
import type { CitizenProfile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Departmental interoperability demo: instead of asking the citizen to upload
// documents, we "call" the source department systems and pull the field back.
export async function POST(req: Request) {
  const { serviceId, citizenId = "demo" } = (await req.json()) as { serviceId: string; citizenId?: string };
  const svc = service(serviceId);
  const citizen = getCitizen(citizenId);
  if (!svc || !citizen) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const checks = svc.autoVerify.map((v) => ({
    source: v.source,
    field: v.field,
    value: resolveValue(v.field, citizen),
    status: "verified" as const,
  }));

  return NextResponse.json({
    serviceId,
    docsSkipped: svc.requiredDocs.length,
    checks,
  });
}

function resolveValue(field: string, c: CitizenProfile): string {
  const f = field.toLowerCase();
  if (f.includes("name")) return c.name;
  if (f.includes("address")) return `Verified • ${cap(c.districtId)} district`;
  if (f.includes("age")) return `${c.age} yrs`;
  if (f.includes("income")) return `₹${c.annualIncome.toLocaleString("en-IN")} / yr (below limit)`;
  if (f.includes("caste") || f.includes("category")) return c.category.toUpperCase();
  if (f.includes("bank") || f.includes("dbt")) return "Aadhaar-seeded account found";
  if (f.includes("land") || f.includes("ror") || f.includes("khasra")) return `${c.landHectares} ha • RoR matched`;
  if (f.includes("family") || f.includes("member")) return `${c.household} members`;
  if (f.includes("disability")) return c.hasDisability ? "UDID matched" : "No record";
  if (f.includes("death") || f.includes("delivery") || f.includes("record")) return "Facility record matched";
  if (f.includes("duplicate")) return "No duplicate found";
  if (f.includes("registration") || f.includes("resolution") || f.includes("claim")) return "On file";
  return "Matched";
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
