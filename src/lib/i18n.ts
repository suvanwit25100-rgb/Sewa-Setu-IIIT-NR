import type { Lang } from "./types";

// UI string dictionary. Chhattisgarhi (cg) intentionally falls back to Hindi
// for keys we haven't localised — mirroring how Bhashini covers scheduled
// languages while true last-mile dialects still need work.
type Dict = Record<string, { en: string; hi: string; cg?: string }>;

export const STR: Dict = {
  appName: { en: "Sewa Setu Next", hi: "सेवा सेतु नेक्स्ट", cg: "सेवा सेतु नेक्स्ट" },
  tagline: {
    en: "Don't search for a service. Tell us what happened.",
    hi: "सेवा मत खोजिए। बताइए क्या हुआ।",
  },
  prototype: { en: "Prototype", hi: "प्रोटोटाइप" },
  citizenPortal: { en: "Citizen", hi: "नागरिक", cg: "नागरिक" },
  officerPortal: { en: "Officer / MIS", hi: "अधिकारी / MIS" },
  goodDay: { en: "Namaste", hi: "नमस्ते", cg: "जय जोहार" },
  forYou: { en: "Recommended for you", hi: "आपके लिए अनुशंसित", cg: "तोर बर सुझाव" },
  forYouSub: {
    en: "Benefits you're entitled to but haven't claimed yet",
    hi: "लाभ जिनके आप पात्र हैं पर अभी तक नहीं लिए",
  },
  lifeEvents: { en: "Life events", hi: "जीवन की घटनाएँ", cg: "जिनगी के मौका" },
  lifeEventsSub: {
    en: "Tell us what happened — we bundle every service you need",
    hi: "बताइए क्या हुआ — हम सभी ज़रूरी सेवाएँ एक साथ जोड़ देंगे",
  },
  myApplications: { en: "My applications", hi: "मेरे आवेदन", cg: "मोर आवेदन" },
  allServices: { en: "All services", hi: "सभी सेवाएँ", cg: "जम्मो सेवा" },
  apply: { en: "Apply", hi: "आवेदन करें", cg: "आवेदन करव" },
  track: { en: "Track", hi: "ट्रैक करें", cg: "देखव" },
  claimNow: { en: "Claim now", hi: "अभी लें", cg: "अभी लेव" },
  startBundle: { en: "Start bundle", hi: "बंडल शुरू करें" },
  assistedMode: { en: "Assisted mode", hi: "सहायता मोड", cg: "मदद मोड" },
  assistedOn: {
    en: "Assisted mode ON — you are applying on behalf of a citizen",
    hi: "सहायता मोड चालू — आप नागरिक की ओर से आवेदन कर रहे हैं",
  },
  voice: { en: "Speak", hi: "बोलें", cg: "बोलव" },
  daysLeft: { en: "days left", hi: "दिन शेष", cg: "दिन बाकी" },
  overdue: { en: "SLA breached", hi: "समय-सीमा पार", cg: "समय पार" },
  autoVerified: { en: "Auto-verified", hi: "स्वतः सत्यापित", cg: "अपने आप जाँच" },
  askSahaayak: { en: "Ask Sahaayak", hi: "सहायक से पूछें", cg: "सहायक ले पूछव" },
  fee: { en: "Fee", hi: "शुल्क", cg: "फीस" },
  free: { en: "Free", hi: "नि:शुल्क", cg: "फोकट" },
  sla: { en: "Guaranteed in", hi: "गारंटी", cg: "गारंटी" },
  days: { en: "days", hi: "दिन", cg: "दिन" },
  askTitle: { en: "How can we help you today?", hi: "आज हम आपकी कैसे मदद करें?" },
  askSub: {
    en: "Don't search for a government service — tell us what happened in your life.",
    hi: "सरकारी सेवा मत खोजिए — बताइए आपकी ज़िंदगी में क्या हुआ।",
  },
  askPlaceholder: { en: "e.g. \"I am starting a small shop\"", hi: "जैसे \"मुझे दुकान शुरू करनी है\"" },
  askGo: { en: "Ask Sewa Setu", hi: "सेवा सेतु से पूछें" },
  yourJourneys: { en: "Your journeys", hi: "आपकी यात्राएँ" },
  profile: { en: "My Profile", hi: "मेरी प्रोफ़ाइल" },
  documents: { en: "My Documents", hi: "मेरे दस्तावेज़" },
  grievances: { en: "Grievances", hi: "शिकायतें" },
  privacy: { en: "Privacy / My Data", hi: "गोपनीयता / मेरा डेटा" },
  disasterMode: { en: "Disaster Mode", hi: "आपदा मोड" },
};

export function t(key: string, lang: Lang): string {
  const e = STR[key];
  if (!e) return key;
  if (lang === "cg") return e.cg ?? e.hi;
  return e[lang] ?? e.en;
}

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  hi: "हिंदी",
  cg: "छत्तीसगढ़ी",
};
