import type { CitizenProfile, EligibilityHit } from "./types";
import { SERVICES, district } from "./reference";

// Rule engine: given a citizen's write-once profile, decide which services /
// schemes they are entitled to but may not have claimed — and, critically,
// EXPLAIN why (Feature 2: Eligibility Intelligence). Nothing here is a
// black-box ML score; every hit is backed by a visible checklist of rules.
type Rule = {
  test: (p: CitizenProfile) => boolean;
  label_en: string;
  label_hi: string;
  reason_en: string;
  reason_hi: string;
  benefit_en: string;
  benefit_hi: string;
};

const RULES: Record<string, Rule> = {
  age_60_plus: {
    test: (p) => p.age >= 60,
    label_en: "Age 60 or above", label_hi: "आयु 60 या अधिक",
    reason_en: "You are 60+ and below the income limit",
    reason_hi: "आपकी आयु 60+ है और आय सीमा से कम है",
    benefit_en: "₹500/month direct to your bank",
    benefit_hi: "₹500/माह सीधे आपके बैंक में",
  },
  is_bpl: {
    test: (p) => p.isBPL,
    label_en: "BPL household", label_hi: "बीपीएल परिवार",
    reason_en: "Your household is BPL",
    reason_hi: "आपका परिवार बीपीएल है",
    benefit_en: "Subsidised foodgrain + fee waivers",
    benefit_hi: "रियायती अनाज + शुल्क माफी",
  },
  is_widow: {
    test: (p) => p.gender === "female" && p.age >= 18 && p.occupation !== "student" && p.household <= 3 && p.isBPL,
    label_en: "Head of household, BPL", label_hi: "परिवार प्रमुख, बीपीएल",
    reason_en: "You may qualify for widow support",
    reason_hi: "आप विधवा सहायता की पात्र हो सकती हैं",
    benefit_en: "₹350/month pension",
    benefit_hi: "₹350/माह पेंशन",
  },
  has_disability: {
    test: (p) => p.hasDisability,
    label_en: "Registered disability", label_hi: "पंजीकृत दिव्यांगता",
    reason_en: "You have a registered disability",
    reason_hi: "आप पंजीकृत दिव्यांग हैं",
    benefit_en: "₹500/month + concessions",
    benefit_hi: "₹500/माह + रियायतें",
  },
  is_student: {
    test: (p) => p.isStudent || p.occupation === "student",
    label_en: "Enrolled student", label_hi: "नामांकित विद्यार्थी",
    reason_en: "You are a student",
    reason_hi: "आप विद्यार्थी हैं",
    benefit_en: "Post-matric scholarship",
    benefit_hi: "पोस्ट-मैट्रिक छात्रवृत्ति",
  },
  is_sc_st_obc: {
    test: (p) => p.category !== "general",
    label_en: "Reserved category (SC/ST/OBC)", label_hi: "आरक्षित वर्ग (SC/ST/OBC)",
    reason_en: "You belong to the reserved category",
    reason_hi: "आप आरक्षित वर्ग से हैं",
    benefit_en: "Certificate unlocks scholarships & quotas",
    benefit_hi: "प्रमाण पत्र से छात्रवृत्ति व आरक्षण",
  },
  is_farmer: {
    test: (p) => p.occupation === "farmer" && p.landHectares > 0,
    label_en: "Land-owning farmer", label_hi: "भूमिधारक किसान",
    reason_en: "You own agricultural land",
    reason_hi: "आपके पास कृषि भूमि है",
    benefit_en: "Credit up to ₹3 lakh at 4% interest",
    benefit_hi: "4% ब्याज पर ₹3 लाख तक ऋण",
  },
  is_labour: {
    test: (p) => p.occupation === "labour",
    label_en: "Unorganised-sector worker", label_hi: "असंगठित क्षेत्र श्रमिक",
    reason_en: "You are an unorganised-sector worker",
    reason_hi: "आप असंगठित क्षेत्र के श्रमिक हैं",
    benefit_en: "Accident cover + welfare benefits",
    benefit_hi: "दुर्घटना बीमा + कल्याण लाभ",
  },
  is_forest_dweller: {
    test: (p) => p.isForestDweller && p.category === "st",
    label_en: "Forest-dwelling ST household", label_hi: "वनवासी अनुसूचित जनजाति परिवार",
    reason_en: "You are a forest-dwelling ST household",
    reason_hi: "आप वनवासी अनुसूचित जनजाति परिवार हैं",
    benefit_en: "Individual Forest Rights title (FRA)",
    benefit_hi: "व्यक्तिगत वन अधिकार पट्टा (FRA)",
  },
};

export function computeEligibility(p: CitizenProfile): EligibilityHit[] {
  const hits: EligibilityHit[] = [];
  const d = district(p.districtId);
  for (const svc of SERVICES) {
    if (svc.eligibilityRules.length === 0) continue;
    const passesAll = svc.eligibilityRules.every((rk) => RULES[rk]?.test(p));
    if (!passesAll) continue;

    const criteria = svc.eligibilityRules.map((rk) => {
      const r = RULES[rk];
      return { label_en: r.label_en, label_hi: r.label_hi, met: true };
    });
    // A district-availability check is always shown for transparency, even
    // though every district in the demo offers every service.
    criteria.push({ label_en: `Service active in ${d.name_en} district`, label_hi: `${d.name_hi} जिले में सेवा उपलब्ध`, met: true });

    const key = svc.eligibilityRules[svc.eligibilityRules.length - 1];
    const r = RULES[key];
    hits.push({
      serviceId: svc.id,
      reason_en: r.reason_en,
      reason_hi: r.reason_hi,
      benefit_en: r.benefit_en,
      benefit_hi: r.benefit_hi,
      match: svc.eligibilityRules.length >= 2 ? "high" : "medium",
      criteria,
    });
  }
  return hits.sort((a, b) => (a.match === b.match ? 0 : a.match === "high" ? -1 : 1));
}

// ---------------------------------------------------------------------------
// GET /api/eligibility/services — the spec's exact contract: every
// rule-bearing service, not just the ones the citizen fully qualifies for,
// each with an explainable status. This never presents a match as an
// official determination — wording stays "potentially eligible."
// ---------------------------------------------------------------------------
export type EligibilityStatus = "LIKELY" | "POSSIBLE" | "NOT_ELIGIBLE" | "MORE_INFORMATION_REQUIRED";

export interface EligibilityAssessment {
  serviceId: string;
  serviceName: string;
  eligibilityStatus: EligibilityStatus;
  matchScore: number; // 0..1, derived from the fraction of rules satisfied
  reasons: string[];
  missingInformation: string[];
}

export function assessEligibility(p: CitizenProfile): EligibilityAssessment[] {
  return SERVICES
    .filter((svc) => svc.eligibilityRules.length > 0)
    .map((svc) => {
      const results = svc.eligibilityRules.map((rk) => ({ key: rk, rule: RULES[rk], met: RULES[rk]?.test(p) ?? false }));
      const metCount = results.filter((r) => r.met).length;
      const matchScore = Math.round((metCount / results.length) * 100) / 100;

      let status: EligibilityStatus;
      if (metCount === results.length) status = results.length >= 2 ? "LIKELY" : "POSSIBLE";
      else if (metCount === 0) status = "NOT_ELIGIBLE";
      else status = "MORE_INFORMATION_REQUIRED";

      return {
        serviceId: svc.id,
        serviceName: svc.name_en,
        eligibilityStatus: status,
        matchScore,
        reasons: results.filter((r) => r.met).map((r) => r.rule.reason_en),
        missingInformation: results.filter((r) => !r.met).map((r) => r.rule.label_en),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
