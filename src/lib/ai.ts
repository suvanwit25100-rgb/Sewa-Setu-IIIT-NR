// ---------------------------------------------------------------------------
// AIService — the Government Journey Engine
// ---------------------------------------------------------------------------
// This is a clean, swappable abstraction: every function returns a
// STRUCTURED, validated result. Nothing here lets raw model output drive a
// workflow directly. Today every function is a deterministic "DEMO AI" —
// rule-based, reproducible, and fully working with zero API keys — so the
// whole prototype runs offline. Swapping in a real LLM later means
// reimplementing the bodies of these functions; every caller (chat route,
// copilot route, apply flow) stays unchanged.
// ---------------------------------------------------------------------------

import { LIFE_EVENTS, SERVICES, DISTRICTS, service, servicesReusingDoc, DOC_TYPE_LABEL } from "./reference";
import type { AiIntentResult, CitizenDocument, CitizenProfile, DocType, Journey, Application } from "./types";
import type { MisData, GovernanceData } from "./db";

// ---------------------------------------------------------------------------
// 1. understandIntent + identifyLifeEvent + findRelevantServices
// ---------------------------------------------------------------------------
const LIFE_EVENT_KEYWORDS: Record<string, string[]> = {
  newborn: ["baby", "birth", "born", "child", "बच्चा", "जन्म", "शिशु"],
  bereavement: ["death", "died", "passed", "मृत्यु", "निधन", "मौत", "guzar"],
  shop: ["shop", "business", "dukan", "दुकान", "व्यापार", "व्यवसाय", "startup", "start a", "starting a"],
  education: ["student", "scholarship", "study", "college", "छात्र", "छात्रवृत्ति", "पढ़ाई"],
  marriage: ["marriage", "wedding", "shaadi", "विवाह", "शादी"],
  land_transfer: ["land transfer", "zameen", "जमीन", "जमीन नाम", "मुतेशन", "mutation", "father's land", "pitaji", "पिताजी की जमीन", "नामांतरण"],
  disaster: ["flood", "damage", "damaged", "collapsed", "बाढ़", "क्षति", "टूट", "तबाह", "disaster", "fire", "आग"],
};

const DEMO_MAPPINGS: { intent: string; lifeEventId: string }[] = [
  { intent: "start_business", lifeEventId: "shop" },
  { intent: "land_transfer", lifeEventId: "land_transfer" },
  { intent: "new_child", lifeEventId: "newborn" },
  { intent: "bereavement", lifeEventId: "bereavement" },
  { intent: "education_support", lifeEventId: "education" },
  { intent: "marriage", lifeEventId: "marriage" },
  { intent: "disaster_damage", lifeEventId: "disaster" },
];

function matchLifeEvent(q: string): string | null {
  const lower = q.toLowerCase();
  for (const [leId, words] of Object.entries(LIFE_EVENT_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return leId;
  }
  return null;
}

/** Builds the full Government Journey for a life event — the core USP:
 *  citizen intent -> a concrete, ordered set of government workflow steps. */
export function buildJourney(lifeEventId: string, citizen?: CitizenProfile | null, vault?: CitizenDocument[]): Journey {
  const le = LIFE_EVENTS.find((l) => l.id === lifeEventId)!;
  const svcServices = le.serviceIds.map(service);

  const haveDocs = new Set((vault ?? []).map((d) => d.type));
  const requiredDocSet = new Set(svcServices.flatMap((s) => s.requiredDocs));
  const missingDocs = [...requiredDocSet].filter((rd) => {
    // crude reuse check: if any vault doc's label overlaps the requirement text
    return ![...haveDocs].some((dt) => rd.toLowerCase().includes(DOC_TYPE_LABEL[dt].en.toLowerCase().split(" ")[0].toLowerCase()));
  });

  const steps: Journey["steps"] = [
    { label_en: "Understand your situation", label_hi: "आपकी स्थिति समझें", done: true },
    { label_en: `Identify relevant services (${svcServices.length} found)`, label_hi: `प्रासंगिक सेवाएँ पहचानें (${svcServices.length} मिलीं)`, done: true },
    { label_en: "Check eligibility", label_hi: "पात्रता जाँचें", done: !!citizen },
    { label_en: "Identify required documents", label_hi: "ज़रूरी दस्तावेज़ पहचानें", done: true },
    { label_en: missingDocs.length ? `Missing documents (${missingDocs.length})` : "All documents available", label_hi: missingDocs.length ? `अनुपलब्ध दस्तावेज़ (${missingDocs.length})` : "सभी दस्तावेज़ उपलब्ध", done: !citizen ? false : missingDocs.length === 0 },
    { label_en: "Prepare application", label_hi: "आवेदन तैयार करें", done: false },
    { label_en: "Submit", label_hi: "जमा करें", done: false },
    { label_en: "Track in real time", label_hi: "वास्तविक समय में ट्रैक करें", done: false },
    { label_en: "Escalate automatically if SLA is exceeded", label_hi: "SLA पार होने पर स्वतः एस्केलेशन", done: false },
  ];

  return {
    lifeEventId,
    title_en: le.name_en,
    title_hi: le.name_hi,
    steps,
    services: svcServices.map((s) => ({
      serviceId: s.id,
      reason_en: `Commonly required for "${le.name_en}"`,
      reason_hi: `"${le.name_hi}" के लिए सामान्यतः आवश्यक`,
    })),
  };
}

/** understandIntent() — deterministic DEMO AI. Never lets raw text drive a
 *  workflow: it only ever returns one of a fixed, validated set of intents. */
export function understandIntent(message: string, citizen?: CitizenProfile | null, vault?: CitizenDocument[]): AiIntentResult {
  const q = message.trim();
  const lower = q.toLowerCase();
  const leId = matchLifeEvent(q);

  if (leId === "disaster") {
    return {
      intent: "disaster_damage", confidence: 0.9, kind: "disaster",
      reply_en: "That sounds like disaster-related damage. I've switched you to Disaster Mode with relief services for your district.",
      reply_hi: "यह आपदा से जुड़ी क्षति लगती है। मैंने आपको आपके जिले की राहत सेवाओं वाले आपदा मोड में भेज दिया है।",
    };
  }
  if (leId === "land_transfer") {
    return {
      intent: "land_transfer", confidence: 0.92, kind: "land",
      reply_en: "This is a land / revenue matter. I'll ask a few quick questions to build your Land Service Journey.",
      reply_hi: "यह भूमि / राजस्व से जुड़ा मामला है। आपकी भूमि सेवा यात्रा बनाने के लिए मैं कुछ प्रश्न पूछूँगा।",
    };
  }
  if (leId) {
    const journey = buildJourney(leId, citizen, vault);
    const mapping = DEMO_MAPPINGS.find((m) => m.lifeEventId === leId);
    return {
      intent: mapping?.intent ?? leId, confidence: 0.88, kind: "lifeEvent",
      reply_en: `It sounds like: "${journey.title_en}". I've built a ${journey.steps.length}-step government journey with ${journey.services.length} services.`,
      reply_hi: `लगता है: "${journey.title_hi}"। मैंने ${journey.services.length} सेवाओं वाली ${journey.steps.length}-चरण की सरकारी यात्रा बनाई है।`,
      journey,
    };
  }

  // Direct service-name intent — score by keyword overlap.
  const matches = SERVICES.map((s) => {
    const hay = `${s.name_en} ${s.name_hi} ${s.category} ${s.code}`.toLowerCase();
    let score = 0;
    for (const w of lower.split(/\s+/).filter((w) => w.length > 2)) if (hay.includes(w)) score++;
    if (["income", "caste", "pension", "ration", "land", "birth", "death", "scholarship", "labour", "farmer", "kisan", "forest", "domicile"].some((k) => lower.includes(k) && hay.includes(k))) score += 2;
    return { s, score };
  }).filter((m) => m.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

  if (matches.length) {
    return {
      intent: "direct_service", confidence: 0.75, kind: "services",
      reply_en: "Here are the services that best match. Most documents are auto-verified.",
      reply_hi: "ये सेवाएँ सबसे उपयुक्त हैं। अधिकांश दस्तावेज़ स्वतः सत्यापित हैं।",
      serviceIds: matches.map((m) => m.s.id),
    };
  }

  return {
    intent: "unknown", confidence: 0.2, kind: "fallback",
    reply_en: "Tell me what happened (e.g. \"my father passed away\", \"I want to start a shop\", \"my house was damaged\") and I'll build your journey.",
    reply_hi: "बताइए क्या हुआ (जैसे \"पिता का निधन\", \"दुकान शुरू करनी है\", \"घर क्षतिग्रस्त हुआ\") — मैं आपकी यात्रा बना दूँगा।",
  };
}

// ---------------------------------------------------------------------------
// 2. extractDocument() — mock OCR / classification (Feature 4)
// ---------------------------------------------------------------------------
const MOCK_FIELDS: Record<DocType, () => Record<string, string>> = {
  income_certificate: () => ({ "Certificate No.": `INC-${rand4()}`, "Annual Income": "₹42,000", "Issued by": "Tehsildar Office", "Valid until": "1 year" }),
  caste_certificate: () => ({ "Certificate No.": `CST-${rand4()}`, Category: "ST", "Issued by": "SDM Office" }),
  domicile_certificate: () => ({ "Certificate No.": `DOM-${rand4()}`, Residence: ">15 years", "Issued by": "Tehsildar Office" }),
  aadhaar: () => ({ "Aadhaar No.": "XXXX XXXX 4821", "Name Match": "Verified", DOB: "XX/XX/XXXX" }),
  ration_card: () => ({ "Card No.": `RC-${rand4()}`, Category: "BPL", Members: "2" }),
  land_record: () => ({ "Khasra No.": `${100 + Math.floor(Math.random() * 800)}`, Area: "0.4 ha", "Owner Match": "Verified" }),
  bank_passbook: () => ({ "Account (masked)": `XXXX${rand4()}`, IFSC: "SBIN0DEMO1", "Aadhaar-seeded": "Yes" }),
  marksheet: () => ({ Board: "CGBSE", Class: "12th", Percentage: "71%" }),
  disability_certificate: () => ({ "UDID No.": `UDID-${rand4()}`, "Disability %": "40%" }),
  death_certificate: () => ({ "Certificate No.": `DTH-${rand4()}`, "Date of Death": "XX/XX/XXXX", "Issued by": "Health Dept." }),
};

function rand4() { return Math.floor(1000 + Math.random() * 9000); }

const FILENAME_HINTS: [RegExp, DocType][] = [
  [/income/i, "income_certificate"], [/caste|jati/i, "caste_certificate"], [/domicile|nivas/i, "domicile_certificate"],
  [/aadhaar|aadhar/i, "aadhaar"], [/ration/i, "ration_card"], [/land|khasra|ror/i, "land_record"],
  [/bank|passbook/i, "bank_passbook"], [/marksheet|mark_sheet|result/i, "marksheet"],
  [/disab|udid/i, "disability_certificate"], [/death/i, "death_certificate"],
];
const ALL_DOC_TYPES = Object.keys(DOC_TYPE_LABEL) as DocType[];

/** Mock OCR + classification pipeline: filename → type (best-effort), then
 *  deterministic-looking extracted fields. A real OCR provider can replace
 *  this function body without touching any caller. */
export function extractDocument(fileName: string): { type: DocType; label_en: string; fields: Record<string, string>; reusableIn: number } {
  const hit = FILENAME_HINTS.find(([re]) => re.test(fileName));
  const type = hit ? hit[1] : ALL_DOC_TYPES[Math.floor(Math.random() * ALL_DOC_TYPES.length)];
  const fields = MOCK_FIELDS[type]();
  const reusableIn = servicesReusingDoc(type).length;
  return { type, label_en: DOC_TYPE_LABEL[type].en, fields, reusableIn };
}

// ---------------------------------------------------------------------------
// 3. checkApplication() — Application Health Check (Feature 6)
// ---------------------------------------------------------------------------
export interface HealthCheck {
  docsOk: { have: number; need: number };
  fieldsOk: { have: number; need: number };
  quality: boolean;
  consistency: { ok: boolean; issue_en?: string; issue_hi?: string };
  eligibility: boolean;
  overallOk: boolean;
}

export function checkApplication(serviceId: string, citizen: CitizenProfile, vault: CitizenDocument[]): HealthCheck {
  const svc = service(serviceId);
  const need = svc.requiredDocs.length;
  const have = vault.length ? Math.min(need, vault.length + Math.ceil(need * 0.4)) : Math.max(0, need - 1);
  // Deterministic pseudo-random "consistency" flag, seeded by service+citizen
  // id so a demo run is reproducible rather than flaky.
  const seed = hashStr(serviceId + citizen.id);
  const hasIssue = seed % 5 === 0; // ~20% of the time, for a believable demo
  return {
    docsOk: { have, need },
    fieldsOk: { have: 11, need: 12 },
    quality: seed % 7 !== 0,
    consistency: hasIssue
      ? { ok: false, issue_en: "Your address on file does not exactly match your Aadhaar record.", issue_hi: "आपका दर्ज पता आधार रिकॉर्ड से पूरी तरह मेल नहीं खाता।" }
      : { ok: true },
    eligibility: true,
    overallOk: !hasIssue && have >= need,
  };
}

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// ---------------------------------------------------------------------------
// 4. SLA risk + delay prediction (Features 9 & 10)
// ---------------------------------------------------------------------------
export type SlaRisk = "low" | "medium" | "high" | "exceeded";

export function slaRisk(app: Application): { risk: SlaRisk; elapsedPct: number } {
  const total = app.slaDays * 864e5;
  const elapsed = Date.now() - new Date(app.submittedAt).getTime();
  const pct = Math.min(100, Math.round((elapsed / total) * 100));
  const done = app.status === "delivered" || app.status === "approved";
  if (done) return { risk: "low", elapsedPct: 100 };
  if (pct >= 100) return { risk: "exceeded", elapsedPct: pct };
  if (pct >= 75) return { risk: "high", elapsedPct: pct };
  if (pct >= 45) return { risk: "medium", elapsedPct: pct };
  return { risk: "low", elapsedPct: pct };
}

export function delayRisk(app: Application): { pct: number; reasons_en: string[]; reasons_hi: string[] } {
  const d = DISTRICTS.find((x) => x.id === app.districtId)!;
  const svc = service(app.serviceId);
  const { elapsedPct } = slaRisk(app);
  let pct = Math.round(elapsedPct * 0.4 + (100 - d.digitalReadiness) * 0.35 + (svc.popularity > 60 ? 15 : 5) + (app.autoVerified ? -10 : 10));
  pct = Math.max(4, Math.min(96, pct));

  const reasons_en: string[] = [];
  const reasons_hi: string[] = [];
  if (svc.popularity > 60) { reasons_en.push("Document verification queue is above normal for this high-volume service"); reasons_hi.push("इस अधिक-मांग सेवा में सत्यापन कतार सामान्य से अधिक है"); }
  if (d.digitalReadiness < 50) { reasons_en.push(`${d.name_en} has lower digital uptake — more manual processing`); reasons_hi.push(`${d.name_hi} में डिजिटल उपयोग कम है — अधिक मैनुअल प्रक्रिया`); }
  if (!app.autoVerified) { reasons_en.push("Some documents were not auto-verified and need manual checking"); reasons_hi.push("कुछ दस्तावेज़ स्वतः सत्यापित नहीं हुए, मैनुअल जाँच आवश्यक"); }
  if (elapsedPct > 60) { reasons_en.push("Application is already well into its SLA window"); reasons_hi.push("आवेदन पहले से ही अपनी समय-सीमा के अधिकांश भाग में है"); }
  if (!reasons_en.length) { reasons_en.push("No unusual risk factors detected"); reasons_hi.push("कोई असामान्य जोखिम कारक नहीं मिला"); }

  return { pct, reasons_en, reasons_hi };
}

// ---------------------------------------------------------------------------
// 5. Government Copilot (Feature 14) — cites the live dashboard data it uses
// ---------------------------------------------------------------------------
export function answerCopilot(question: string, mis: MisData, gov: GovernanceData): { answer: string; citing: string[] } {
  const q = question.toLowerCase();

  if (/delay|stuck|slow|bottleneck|why/.test(q)) {
    const top = gov.rootCause[0];
    const lines = [
      `Based on the live dataset (${gov.today.delayed + gov.today.atRisk} delayed/at-risk applications):`,
      ...gov.rootCause.filter((r) => r.pct > 0).map((r) => `• ${r.pct}% — ${r.reason}`),
      "",
      `The largest contributor is "${gov.bottleneck.stage}" — a ${gov.bottleneck.pctOfDelayed}% drop-off at that stage of the pipeline.`,
      "",
      "Suggested areas for review:",
      `1. ${top.reason} workload`,
      "2. Document completeness at intake",
      `3. Workflow for the top-volume service (${mis.byService[0]?.name ?? "—"})`,
    ];
    return { answer: lines.join("\n"), citing: ["Root Cause Analysis", "Pipeline Funnel", "Top Services"] };
  }

  if (/district/.test(q)) {
    const worst = mis.byDistrict.slice(0, 3);
    const lines = [
      "Highest SLA-breach districts in the current dataset:",
      ...worst.map((d) => `• ${d.name} (${d.region}) — ${d.breachRate}% breached, readiness ${d.readiness}/100`),
      "",
      worst[0]?.region !== "plains"
        ? "These are concentrated in tribal / LWE-affected districts — likely tied to lower digital readiness rather than officer performance alone."
        : "Breach is spread across plains districts — likely a workload issue rather than connectivity.",
    ];
    return { answer: lines.join("\n"), citing: ["District Breach Table"] };
  }

  if (/channel|whatsapp|voice|assisted/.test(q)) {
    const lines = mis.byChannel.map((c) => `• ${c.channel}: ${c.count}`);
    return { answer: ["Channel split for the current dataset:", ...lines, "", "Assisted + voice share is highest in tribal/LWE districts — this is the last-mile reach the platform is designed for."].join("\n"), citing: ["Channel Mix"] };
  }

  if (/department/.test(q)) {
    const top = gov.byDepartment.slice(0, 3);
    return {
      answer: ["Department load (current dataset):", ...top.map((d) => `• ${d.name}: ${d.total} applications, ${d.breachRate}% breached`)].join("\n"),
      citing: ["Department Breakdown"],
    };
  }

  if (/service/.test(q)) {
    const top = mis.byService.slice(0, 5);
    return { answer: ["Top services by volume:", ...top.map((s) => `• ${s.name}: ${s.total}`)].join("\n"), citing: ["Top Services"] };
  }

  return {
    answer: [
      `Today's snapshot: ${gov.today.submitted} submitted, ${gov.today.completed} completed, ${gov.today.pending} pending, ${gov.today.delayed} delayed, ${gov.today.atRisk} at risk.`,
      `Overall SLA breach rate: ${mis.totals.breachRate}%.`,
      "",
      "Ask me about: delays / bottlenecks, districts, departments, services, or channels.",
    ].join("\n"),
    citing: ["Today's Snapshot"],
  };
}
