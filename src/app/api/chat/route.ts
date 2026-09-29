import { NextResponse } from "next/server";
import { SERVICES, LIFE_EVENTS } from "@/lib/reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AI Sahaayak — rule-based intent matcher over the service catalogue.
// (Demo stub: pluggable to an LLM + Bhashini for production.)
export async function POST(req: Request) {
  const { message } = (await req.json()) as { message: string };
  const q = (message ?? "").toLowerCase();

  // Life-event intent
  const KEYWORDS: Record<string, string[]> = {
    newborn: ["baby", "birth", "born", "child", "बच्चा", "जन्म", "शिशु"],
    bereavement: ["death", "died", "passed", "मृत्यु", "निधन", "मौत"],
    shop: ["shop", "business", "dukan", "दुकान", "व्यापार", "व्यवसाय"],
    education: ["student", "scholarship", "study", "college", "छात्र", "छात्रवृत्ति", "पढ़ाई"],
    marriage: ["marriage", "wedding", "shaadi", "विवाह", "शादी"],
  };
  for (const le of LIFE_EVENTS) {
    if (KEYWORDS[le.id]?.some((k) => q.includes(k))) {
      return NextResponse.json({
        kind: "lifeEvent",
        lifeEventId: le.id,
        reply_en: `It sounds like: "${le.name_en}". I've bundled ${le.serviceIds.length} services you'll need.`,
        reply_hi: `लगता है: "${le.name_hi}"। मैंने ${le.serviceIds.length} ज़रूरी सेवाएँ जोड़ दी हैं।`,
        serviceIds: le.serviceIds,
      });
    }
  }

  // Direct service intent — score by name/keyword overlap.
  const matches = SERVICES.map((s) => {
    const hay = `${s.name_en} ${s.name_hi} ${s.category} ${s.code}`.toLowerCase();
    let score = 0;
    for (const w of q.split(/\s+/).filter((w) => w.length > 2)) if (hay.includes(w)) score++;
    if (["income", "caste", "pension", "ration", "land", "birth", "death", "scholarship", "labour", "farmer", "kisan", "forest"].some((k) => q.includes(k) && hay.includes(k))) score += 2;
    return { s, score };
  })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (matches.length) {
    return NextResponse.json({
      kind: "services",
      reply_en: "Here are the services that best match. Tap to apply — most documents are auto-verified.",
      reply_hi: "ये सेवाएँ सबसे उपयुक्त हैं। आवेदन के लिए टैप करें — अधिकांश दस्तावेज़ स्वतः सत्यापित।",
      serviceIds: matches.map((m) => m.s.id),
    });
  }

  return NextResponse.json({
    kind: "fallback",
    reply_en: "Tell me what happened (e.g. \"my father passed away\", \"I want to start a shop\", \"I need an income certificate\") and I'll find the right services.",
    reply_hi: "बताइए क्या हुआ (जैसे \"पिता का निधन\", \"दुकान शुरू करनी है\", \"आय प्रमाण पत्र चाहिए\") — मैं सही सेवाएँ ढूँढ दूँगा।",
    serviceIds: [],
  });
}
