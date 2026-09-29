"use client";

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useApp } from "./providers";
import { t } from "@/lib/i18n";

// Minimal typings for the Web Speech API (not in lib.dom for all TS targets).
type SpeechRecognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onerror: () => void; onend: () => void; start: () => void; stop: () => void;
};

const LANG_CODE = { en: "en-IN", hi: "hi-IN", cg: "hi-IN" } as const;

export function VoiceButton({ onResult }: { onResult: (text: string) => void }) {
  const { lang } = useApp();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SpeechRecognition | null>(null);

  const toggle = () => {
    if (listening) { recRef.current?.stop(); return; }
    const Ctor = (typeof window !== "undefined" && ((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition)) as (new () => SpeechRecognition) | undefined;
    if (!Ctor) { setSupported(false); return; }
    const rec = new Ctor();
    rec.lang = LANG_CODE[lang];
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => { onResult(e.results[0][0].transcript); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <button
      onClick={toggle}
      title={supported ? "Voice input" : "Voice not supported in this browser"}
      className={`card flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold ${listening ? "text-white" : "text-brand"}`}
      style={listening ? { background: "var(--red)", borderColor: "var(--red)" } : undefined}
    >
      {supported ? (listening ? <MicOff size={16} /> : <Mic size={16} />) : <MicOff size={16} className="text-muted" />}
      <span className="hidden sm:inline">{listening ? (lang === "en" ? "Listening…" : "सुन रहे…") : t("voice", lang)}</span>
      {listening && <span className="pulse-dot h-2 w-2 rounded-full bg-white" />}
    </button>
  );
}
