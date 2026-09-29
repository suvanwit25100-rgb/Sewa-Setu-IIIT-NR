import type { AppStatus, Channel, Lang } from "./types";

export const STATUS_LABEL: Record<AppStatus, { en: string; hi: string; color: string }> = {
  submitted: { en: "Submitted", hi: "जमा किया", color: "var(--muted)" },
  auto_verifying: { en: "Auto-verifying", hi: "स्वतः सत्यापन", color: "var(--brand)" },
  in_review: { en: "In review", hi: "समीक्षा में", color: "var(--amber)" },
  approved: { en: "Approved", hi: "स्वीकृत", color: "var(--green)" },
  delivered: { en: "Delivered", hi: "वितरित", color: "var(--green)" },
  rejected: { en: "Rejected", hi: "अस्वीकृत", color: "var(--red)" },
};

export const STATUS_STEPS: AppStatus[] = ["submitted", "auto_verifying", "in_review", "approved", "delivered"];

export const CHANNEL_LABEL: Record<Channel, { en: string; hi: string; icon: string }> = {
  web: { en: "Web", hi: "वेब", icon: "🖥️" },
  whatsapp: { en: "WhatsApp", hi: "व्हाट्सएप", icon: "💬" },
  assisted: { en: "Assisted", hi: "सहायता", icon: "🤝" },
  voice: { en: "Voice/IVR", hi: "आवाज़/IVR", icon: "🎙️" },
};

export function statusText(s: AppStatus, lang: Lang) {
  const l = STATUS_LABEL[s];
  return lang === "en" ? l.en : l.hi;
}

export function channelText(c: Channel, lang: Lang) {
  const l = CHANNEL_LABEL[c];
  return lang === "en" ? l.en : l.hi;
}

export function daysBetween(fromIso: string, toIso: string) {
  return Math.ceil((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 864e5);
}

export function fmtDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-IN" : "hi-IN", { day: "numeric", month: "short" });
}
