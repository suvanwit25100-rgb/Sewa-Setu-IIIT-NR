import { describe, it, expect } from "vitest";
import { computeEligibility, assessEligibility } from "../src/lib/eligibility";
import type { CitizenProfile } from "../src/lib/types";

function citizen(overrides: Partial<CitizenProfile> = {}): CitizenProfile {
  return {
    id: "t1", name: "Test Citizen", aadhaarMasked: "XXXX XXXX 0000", phone: "+91 90000 00000",
    districtId: "raipur", age: 30, gender: "male", category: "general", annualIncome: 200000,
    isBPL: false, isStudent: false, occupation: "salaried", hasDisability: false,
    landHectares: 0, isForestDweller: false, household: 3,
    ...overrides,
  };
}

describe("computeEligibility (proactive dashboard)", () => {
  it("surfaces old-age pension only for a 60+ BPL citizen", () => {
    const elderly = citizen({ age: 63, isBPL: true });
    const hits = computeEligibility(elderly);
    expect(hits.some((h) => h.serviceId === "old_pension")).toBe(true);

    const young = citizen({ age: 30, isBPL: true });
    expect(computeEligibility(young).some((h) => h.serviceId === "old_pension")).toBe(false);
  });

  it("never fires a rule-gated service with zero matching rules", () => {
    const p = citizen({ age: 25, isBPL: false, category: "general", occupation: "salaried" });
    const hits = computeEligibility(p);
    // A salaried, non-BPL, general-category adult shouldn't match ST/BPL/student-only schemes.
    expect(hits.some((h) => h.serviceId === "forest_rights")).toBe(false);
    expect(hits.some((h) => h.serviceId === "scholarship")).toBe(false);
  });

  it("every hit carries a visible, non-empty criteria checklist (explainability)", () => {
    const p = citizen({ age: 63, isBPL: true, category: "st", isForestDweller: true, districtId: "bastar", occupation: "farmer", landHectares: 0.5 });
    const hits = computeEligibility(p);
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      expect(h.criteria.length).toBeGreaterThan(0);
      expect(h.criteria.every((c) => c.met)).toBe(true);
    }
  });

  it("ranks multi-rule (high match) services before single-rule (medium) ones", () => {
    const p = citizen({ age: 63, isBPL: true, gender: "female", household: 2 });
    const hits = computeEligibility(p);
    const firstMedium = hits.findIndex((h) => h.match === "medium");
    const lastHigh = hits.map((h) => h.match).lastIndexOf("high");
    if (firstMedium !== -1 && lastHigh !== -1) expect(lastHigh).toBeLessThan(firstMedium);
  });
});

describe("assessEligibility (GET /api/eligibility/services contract)", () => {
  it("marks a fully-qualifying multi-rule service LIKELY with matchScore 1", () => {
    const p = citizen({ age: 63, isBPL: true });
    const row = assessEligibility(p).find((r) => r.serviceId === "old_pension")!;
    expect(row.eligibilityStatus).toBe("LIKELY");
    expect(row.matchScore).toBe(1);
    expect(row.missingInformation).toHaveLength(0);
  });

  it("marks a partially-qualifying service MORE_INFORMATION_REQUIRED, not LIKELY", () => {
    // Scholarship needs is_student AND is_sc_st_obc — satisfy only one.
    const p = citizen({ isStudent: true, category: "general" });
    const row = assessEligibility(p).find((r) => r.serviceId === "scholarship")!;
    expect(row.eligibilityStatus).toBe("MORE_INFORMATION_REQUIRED");
    expect(row.missingInformation.length).toBeGreaterThan(0);
    expect(row.reasons.length).toBeGreaterThan(0);
  });

  it("marks a service the citizen matches none of the rules for NOT_ELIGIBLE", () => {
    const p = citizen({ age: 25, isStudent: false, category: "general", isBPL: false, hasDisability: false });
    const row = assessEligibility(p).find((r) => r.serviceId === "disability_pension")!;
    expect(row.eligibilityStatus).toBe("NOT_ELIGIBLE");
    expect(row.matchScore).toBe(0);
  });

  it("never claims an official determination — reasons stay descriptive, not authoritative", () => {
    const p = citizen({ age: 63, isBPL: true });
    const rows = assessEligibility(p);
    // Spot check: nothing in this dataset should read as a legal guarantee.
    for (const r of rows) {
      for (const reason of r.reasons) expect(reason.toLowerCase()).not.toContain("guaranteed");
    }
  });
});
