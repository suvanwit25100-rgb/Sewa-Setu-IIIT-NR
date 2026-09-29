import type { CitizenProfile, EligibilityHit } from "./types";
import { SERVICES } from "./reference";

// Rule engine: given a citizen's write-once profile, decide which services /
// schemes they are entitled to but may not have claimed. This is the heart of
// the "proactive & personalized" focus area.
type Rule = {
  test: (p: CitizenProfile) => boolean;
  reason_en: string;
  reason_hi: string;
  benefit_en: string;
  benefit_hi: string;
};

const RULES: Record<string, Rule> = {
  age_60_plus: {
    test: (p) => p.age >= 60,
    reason_en: "You are 60+ and below the income limit",
    reason_hi: "आपकी आयु 60+ है और आय सीमा से कम है",
    benefit_en: "₹500/month direct to your bank",
    benefit_hi: "₹500/माह सीधे आपके बैंक में",
  },
  is_bpl: {
    test: (p) => p.isBPL,
    reason_en: "Your household is BPL",
    reason_hi: "आपका परिवार बीपीएल है",
    benefit_en: "Subsidised foodgrain + fee waivers",
    benefit_hi: "रियायती अनाज + शुल्क माफी",
  },
  is_widow: {
    test: (p) => p.gender === "female" && p.age >= 18 && p.occupation !== "student" && p.household <= 3 && p.isBPL,
    reason_en: "You may qualify for widow support",
    reason_hi: "आप विधवा सहायता की पात्र हो सकती हैं",
    benefit_en: "₹350/month pension",
    benefit_hi: "₹350/माह पेंशन",
  },
  has_disability: {
    test: (p) => p.hasDisability,
    reason_en: "You have a registered disability",
    reason_hi: "आप पंजीकृत दिव्यांग हैं",
    benefit_en: "₹500/month + concessions",
    benefit_hi: "₹500/माह + रियायतें",
  },
  is_student: {
    test: (p) => p.isStudent || p.occupation === "student",
    reason_en: "You are a student",
    reason_hi: "आप विद्यार्थी हैं",
    benefit_en: "Post-matric scholarship",
    benefit_hi: "पोस्ट-मैट्रिक छात्रवृत्ति",
  },
  is_sc_st_obc: {
    test: (p) => p.category !== "general",
    reason_en: `You belong to ${"the reserved"} category`,
    reason_hi: "आप आरक्षित वर्ग से हैं",
    benefit_en: "Certificate unlocks scholarships & quotas",
    benefit_hi: "प्रमाण पत्र से छात्रवृत्ति व आरक्षण",
  },
  is_farmer: {
    test: (p) => p.occupation === "farmer" && p.landHectares > 0,
    reason_en: "You own agricultural land",
    reason_hi: "आपके पास कृषि भूमि है",
    benefit_en: "Credit up to ₹3 lakh at 4% interest",
    benefit_hi: "4% ब्याज पर ₹3 लाख तक ऋण",
  },
  is_labour: {
    test: (p) => p.occupation === "labour",
    reason_en: "You are an unorganised-sector worker",
    reason_hi: "आप असंगठित क्षेत्र के श्रमिक हैं",
    benefit_en: "Accident cover + welfare benefits",
    benefit_hi: "दुर्घटना बीमा + कल्याण लाभ",
  },
  is_forest_dweller: {
    test: (p) => p.isForestDweller && p.category === "st",
    reason_en: "You are a forest-dwelling ST household",
    reason_hi: "आप वनवासी अनुसूचित जनजाति परिवार हैं",
    benefit_en: "Individual Forest Rights title (FRA)",
    benefit_hi: "व्यक्तिगत वन अधिकार पट्टा (FRA)",
  },
};

export function computeEligibility(p: CitizenProfile): EligibilityHit[] {
  const hits: EligibilityHit[] = [];
  for (const svc of SERVICES) {
    if (svc.eligibilityRules.length === 0) continue;
    // A service surfaces if EVERY rule it declares passes for this citizen.
    const passesAll = svc.eligibilityRules.every((rk) => RULES[rk]?.test(p));
    if (!passesAll) continue;
    // Attribute the most specific matching rule for the human explanation.
    const key = svc.eligibilityRules[svc.eligibilityRules.length - 1];
    const r = RULES[key];
    hits.push({
      serviceId: svc.id,
      reason_en: r.reason_en,
      reason_hi: r.reason_hi,
      benefit_en: r.benefit_en,
      benefit_hi: r.benefit_hi,
    });
  }
  return hits;
}
