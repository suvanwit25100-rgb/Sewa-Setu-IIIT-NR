"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers";
import { t } from "@/lib/i18n";
import { service } from "@/lib/reference";
import { VoiceButton } from "@/components/voice-button";
import { Journey } from "@/components/journey";
import { LandNavigator } from "@/components/land-navigator";
import type { AiIntentResult } from "@/lib/types";
import {
  Sparkles, ArrowRight, Layers, Smartphone, Workflow, Database, Network,
  FileText, FileCheck2, User as UserIcon, Send,
} from "lucide-react";

const EXAMPLES_EN = ["I am starting a small shop", "I need a certificate", "I had a child", "I want to transfer land", "My application is delayed"];
const EXAMPLES_HI = ["मुझे दुकान शुरू करनी है", "मुझे प्रमाण पत्र चाहिए", "मेरे घर बच्चा हुआ", "जमीन नाम कराना है", "मेरा आवेदन विलंबित है"];

const FOCUS = [
  { icon: Sparkles, title: "Proactive & personalized", desc: "Eligibility engine surfaces benefits you never claimed.", href: "/citizen" },
  { icon: Layers, title: "Unified journeys", desc: "One profile, one journey, every relevant service.", href: "/citizen" },
  { icon: Smartphone, title: "Mobile-first & inclusive", desc: "Voice, Chhattisgarhi, Google-translated, assisted mode.", href: "/services" },
  { icon: Workflow, title: "Smart workflow & tracking", desc: "SLA countdown, delay risk, why-is-it-stuck explainers.", href: "/citizen" },
  { icon: Database, title: "Data-driven MIS", desc: "Bottleneck detection + AI root-cause analysis.", href: "/mis" },
  { icon: Network, title: "Interoperability", desc: "Auto-verify across departments; document reuse graph.", href: "/documents" },
];

export default function Home() {
  const { lang } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiIntentResult | null>(null);
  const [counts, setCounts] = useState({ applications: 0, documents: 0, eligible: 0 });

  useEffect(() => {
    fetch("/api/citizen?id=demo").then((r) => r.json()).then((d) =>
      setCounts((c) => ({ ...c, applications: d.applications?.length ?? 0, eligible: d.eligibility?.length ?? 0 }))
    );
    fetch("/api/documents?citizenId=demo").then((r) => r.json()).then((d) => setCounts((c) => ({ ...c, documents: d.documents?.length ?? 0 })));
  }, []);

  const ask = async (text: string) => {
    const query = text.trim();
    if (!query) return;
    setBusy(true);
    setQ(query);
    try {
      const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: query, citizenId: "demo" }) });
      const d: AiIntentResult = await r.json();
      if (d.kind === "disaster") { router.push("/disaster"); return; }
      setResult(d);
    } finally {
      setBusy(false);
    }
  };

  const examples = lang === "en" ? EXAMPLES_EN : EXAMPLES_HI;

  return (
    <div className="space-y-9">
      {/* Ask Sewa Setu — the core interaction */}
      <section className="card grid-bg relative overflow-hidden p-7 text-center sm:p-10" style={{ background: "linear-gradient(135deg,var(--brand-ink),var(--brand))" }}>
        <div className="relative z-10 mx-auto max-w-2xl text-white">
          <div className="chip mx-auto mb-3 w-fit bg-white/15 text-white">Chhattisgarh • {t("appName", lang)}</div>
          <h1 className="text-[26px] font-extrabold leading-tight sm:text-[34px]">{t("askTitle", lang)}</h1>
          <p className="mt-2 text-[14px] text-white/85">{t("askSub", lang)}</p>

          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-xl">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(q)}
              placeholder={t("askPlaceholder", lang)}
              className="flex-1 bg-transparent px-3 py-2.5 text-[14px] text-text outline-none"
            />
            <VoiceButton onResult={(txt) => ask(txt)} />
            <button onClick={() => ask(q)} className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-bold text-white">
              {busy ? "…" : <>{t("askGo", lang)} <Send size={14} /></>}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {examples.map((ex) => (
              <button key={ex} onClick={() => ask(ex)} className="chip bg-white/15 text-white hover:bg-white/25">{ex}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Result: journey / services / land navigator */}
      {result && (
        <section className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-muted">
              Intent: <span className="text-brand-ink">{result.intent}</span> · confidence {(result.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div className="card p-4 text-[13px]">{lang === "en" ? result.reply_en : result.reply_hi}</div>

          {result.kind === "land" && <LandNavigator />}
          {result.kind === "lifeEvent" && result.journey && <Journey journey={result.journey} />}
          {result.kind === "services" && result.serviceIds && (
            <div className="grid gap-2 sm:grid-cols-2">
              {result.serviceIds.map((id) => {
                const s = service(id);
                return (
                  <Link key={id} href={`/apply/${id}`} className="card flex items-center justify-between p-3.5 text-[13px] hover:bg-surface-2">
                    <span className="font-semibold">{lang === "en" ? s.name_en : s.name_hi}</span>
                    <ArrowRight size={14} className="text-brand" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Your journeys */}
      <section>
        <h2 className="mb-3 text-[17px] font-bold text-brand-ink">{t("yourJourneys", lang)}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/citizen" className="card flex items-center gap-3 p-4 hover:shadow-md">
            <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}><FileText size={18} /></span>
            <div><div className="text-lg font-extrabold">{counts.applications}</div><div className="text-[12px] text-muted">Applications</div></div>
          </Link>
          <Link href="/documents" className="card flex items-center gap-3 p-4 hover:shadow-md">
            <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "var(--green-soft)", color: "var(--green)" }}><FileCheck2 size={18} /></span>
            <div><div className="text-lg font-extrabold">{counts.documents}</div><div className="text-[12px] text-muted">Documents</div></div>
          </Link>
          <Link href="/citizen" className="card flex items-center gap-3 p-4 hover:shadow-md">
            <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "var(--saffron-soft)", color: "var(--saffron)" }}><Sparkles size={18} /></span>
            <div><div className="text-lg font-extrabold">{counts.eligible}</div><div className="text-[12px] text-muted">Potential services</div></div>
          </Link>
        </div>
      </section>

      {/* Focus areas → features */}
      <section>
        <h2 className="mb-1 text-[17px] font-bold text-brand-ink">How it addresses every focus area</h2>
        <p className="mb-4 text-[13px] text-muted">Each problem-statement focus area maps to a working part of this demo.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FOCUS.map((f) => (
            <Link key={f.title} href={f.href} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <f.icon size={19} />
              </span>
              <h3 className="mt-3 text-[15px] font-bold">{f.title}</h3>
              <p className="mt-1 text-[13px] text-muted">{f.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-brand opacity-0 transition group-hover:opacity-100">
                Open <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="flex justify-center gap-3">
        <Link href="/citizen" className="flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-[14px] font-bold text-white">
          <UserIcon size={17} /> Go to citizen dashboard <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
