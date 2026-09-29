"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./providers";
import { t } from "@/lib/i18n";
import { service, LIFE_EVENTS } from "@/lib/reference";
import { VoiceButton } from "./voice-button";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

interface Msg { role: "user" | "bot"; text: string; serviceIds?: string[]; lifeEventId?: string }

const SUGGESTIONS_EN = ["My father passed away", "I want to start a shop", "I need an income certificate", "Scholarship for my son"];
const SUGGESTIONS_HI = ["पिता का निधन हो गया", "दुकान शुरू करनी है", "आय प्रमाण पत्र चाहिए", "बेटे के लिए छात्रवृत्ति"];

export function Sahaayak() {
  const { lang } = useApp();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  // Hide on officer/MIS surfaces — this assistant is citizen-facing.
  if (path.startsWith("/mis") || path.startsWith("/officer")) return null;

  const send = async (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: q }) });
      const d = await r.json();
      setMsgs((m) => [...m, { role: "bot", text: lang === "en" ? d.reply_en : d.reply_hi, serviceIds: d.serviceIds, lifeEventId: d.lifeEventId }]);
    } finally {
      setBusy(false);
    }
  };

  const suggestions = lang === "en" ? SUGGESTIONS_EN : SUGGESTIONS_HI;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-[14px] font-bold text-white shadow-lg shadow-brand/30"
      >
        {open ? <X size={18} /> : <><Sparkles size={18} /> {t("askSahaayak", lang)}</>}
      </button>

      {open && (
        <div className="animate-in fixed bottom-20 right-5 z-50 flex h-[70vh] max-h-[560px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border bg-surface shadow-2xl">
          <div className="flex items-center gap-2 border-b bg-brand px-4 py-3 text-white">
            <MessageCircle size={18} />
            <div className="leading-tight">
              <div className="text-[14px] font-bold">{t("askSahaayak", lang)}</div>
              <div className="text-[11px] text-white/80">AI + Bhashini (demo)</div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.length === 0 && (
              <div className="text-[13px] text-muted">
                {lang === "en"
                  ? "Describe your situation in plain words — I'll find the right services."
                  : "अपनी बात सरल शब्दों में बताइए — मैं सही सेवाएँ ढूँढ दूँगा।"}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <div className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-[13px] ${m.role === "user" ? "bg-brand text-white" : "bg-surface-2"}`}>
                  {m.text}
                </div>
                {m.lifeEventId && (
                  <div className="mt-2">
                    <Link href={`/services?event=${m.lifeEventId}`} onClick={() => setOpen(false)} className="inline-flex items-center gap-1 rounded-lg bg-saffron px-3 py-1.5 text-[12px] font-bold text-white" style={{ background: "var(--saffron)" }}>
                      {LIFE_EVENTS.find((l) => l.id === m.lifeEventId)?.emoji} {t("startBundle", lang)}
                    </Link>
                  </div>
                )}
                {m.serviceIds && m.serviceIds.length > 0 && !m.lifeEventId && (
                  <div className="mt-2 flex flex-wrap justify-start gap-1.5">
                    {m.serviceIds.map((id) => {
                      const s = service(id);
                      return (
                        <Link key={id} href={`/apply/${id}`} onClick={() => setOpen(false)} className="chip border text-brand hover:bg-brand-soft">
                          {lang === "en" ? s.name_en : s.name_hi} →
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="text-[12px] text-muted">…</div>}
          </div>

          {msgs.length === 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="chip border text-muted hover:text-brand">{s}</button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border-t p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder={lang === "en" ? "Type your situation…" : "अपनी बात लिखें…"}
              className="flex-1 rounded-xl bg-surface-2 px-3 py-2 text-[13px] outline-none"
            />
            <VoiceButton onResult={(txt) => send(txt)} />
            <button onClick={() => send(input)} className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
