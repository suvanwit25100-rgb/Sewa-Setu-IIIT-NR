"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./providers";
import { t } from "@/lib/i18n";
import { service } from "@/lib/reference";
import { VoiceButton } from "./voice-button";
import { LandNavigator } from "./land-navigator";
import type { AiIntentResult } from "@/lib/types";
import { MessageCircle, X, Send, Sparkles, ArrowRight } from "lucide-react";

interface Msg { role: "user" | "bot"; text?: string; result?: AiIntentResult }

const SUGGESTIONS_EN = ["My father passed away", "I want to start a shop", "I need an income certificate", "Transfer my father's land"];
const SUGGESTIONS_HI = ["पिता का निधन हो गया", "दुकान शुरू करनी है", "आय प्रमाण पत्र चाहिए", "पिताजी की जमीन नाम करनी है"];

export function Sahaayak() {
  const { lang } = useApp();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  if (path.startsWith("/mis")) return null;

  const send = async (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: q, citizenId: "demo" }) });
      const d: AiIntentResult = await r.json();
      setMsgs((m) => [...m, { role: "bot", result: d }]);
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
        <div className="animate-in fixed bottom-20 right-5 z-50 flex h-[75vh] max-h-[620px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border bg-surface shadow-2xl">
          <div className="flex items-center gap-2 border-b bg-brand px-4 py-3 text-white">
            <MessageCircle size={18} />
            <div className="leading-tight">
              <div className="text-[14px] font-bold">{t("askSahaayak", lang)}</div>
              <div className="text-[11px] text-white/80">Government Journey Engine (demo AI)</div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.length === 0 && (
              <div className="text-[13px] text-muted">
                {lang === "en" ? "Describe your situation in plain words — I'll build your journey." : "अपनी बात सरल शब्दों में बताइए — मैं आपकी यात्रा बना दूँगा।"}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                {m.role === "user" && (
                  <div className="inline-block max-w-[85%] rounded-2xl bg-brand px-3 py-2 text-[13px] text-white">{m.text}</div>
                )}
                {m.role === "bot" && m.result && <BotReply result={m.result} lang={lang} onNavigate={() => setOpen(false)} />}
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

function BotReply({ result, lang, onNavigate }: { result: AiIntentResult; lang: "en" | "hi" | "cg"; onNavigate: () => void }) {
  const text = lang === "en" ? result.reply_en : result.reply_hi;
  return (
    <div className="space-y-2 text-left">
      <div className="inline-block max-w-[95%] rounded-2xl bg-surface-2 px-3 py-2 text-[13px]">{text}</div>

      {result.kind === "disaster" && (
        <Link href="/disaster" onClick={onNavigate} className="flex items-center gap-1.5 rounded-lg bg-red px-3 py-1.5 text-[12px] font-bold text-white" style={{ background: "var(--red)" }}>
          Open Disaster Mode <ArrowRight size={12} />
        </Link>
      )}

      {result.kind === "land" && (
        <div className="max-w-[95%]"><LandNavigator compact /></div>
      )}

      {result.kind === "lifeEvent" && result.journey && (
        <div className="max-w-[95%] space-y-1.5 rounded-xl border p-2.5">
          <div className="text-[12px] font-bold text-brand">{lang === "en" ? result.journey.title_en : result.journey.title_hi}</div>
          {result.journey.services.map((js) => {
            const s = service(js.serviceId);
            return (
              <Link key={js.serviceId} href={`/apply/${js.serviceId}`} onClick={onNavigate} className="flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[12px] hover:bg-brand-soft">
                {lang === "en" ? s.name_en : s.name_hi} <ArrowRight size={12} />
              </Link>
            );
          })}
        </div>
      )}

      {result.kind === "services" && result.serviceIds && result.serviceIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.serviceIds.map((id) => {
            const s = service(id);
            return (
              <Link key={id} href={`/apply/${id}`} onClick={onNavigate} className="chip border text-brand hover:bg-brand-soft">
                {lang === "en" ? s.name_en : s.name_hi} →
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
