"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers";
import { t } from "@/lib/i18n";
import { service, district, LIFE_EVENTS } from "@/lib/reference";
import { StatusBadge, ChannelBadge, SectionHead } from "@/components/ui";
import { daysBetween } from "@/lib/labels";
import { VoiceButton } from "@/components/voice-button";
import { Journey } from "@/components/journey";
import { LandNavigator } from "@/components/land-navigator";
import type { Application, CitizenProfile, EligibilityHit, Notification, AiIntentResult } from "@/lib/types";
import { Sparkles, ArrowRight, ShieldCheck, IdCard, MapPin, Bell, Send } from "lucide-react";

const EXAMPLES_EN = ["I am starting a small shop", "I need a certificate", "I had a child", "I want to transfer land", "My application is delayed"];
const EXAMPLES_HI = ["मुझे दुकान शुरू करनी है", "मुझे प्रमाण पत्र चाहिए", "मेरे घर बच्चा हुआ", "जमीन नाम कराना है", "मेरा आवेदन विलंबित है"];

interface Data {
  citizen: CitizenProfile;
  eligibility: EligibilityHit[];
  applications: Application[];
  notifications: Notification[];
}

export default function CitizenDashboard() {
  const { lang } = useApp();
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState("");
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<AiIntentResult | null>(null);

  useEffect(() => {
    fetch("/api/citizen?id=demo").then((r) => r.json()).then(setData);
  }, []);

  const ask = async (text: string) => {
    const query = text.trim();
    if (!query) return;
    setAsking(true);
    setQ(query);
    try {
      const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: query, citizenId: "demo" }) });
      const d: AiIntentResult = await r.json();
      if (d.kind === "disaster") { router.push("/disaster"); return; }
      setResult(d);
    } finally {
      setAsking(false);
    }
  };

  if (!data) return <div className="py-20 text-center text-muted">Loading…</div>;
  const { citizen, eligibility, applications, notifications } = data;
  const d = district(citizen.districtId);
  const examples = lang === "en" ? EXAMPLES_EN : EXAMPLES_HI;

  return (
    <div className="space-y-8">
      {/* Ask Sewa Setu — the Government Journey Engine */}
      <section className="card grid-bg relative overflow-hidden p-6 text-center sm:p-8" style={{ background: "linear-gradient(135deg,var(--brand-ink),var(--brand))" }}>
        <div className="relative z-10 mx-auto max-w-2xl text-white">
          <h1 className="text-[22px] font-extrabold leading-tight sm:text-[28px]">{t("askTitle", lang)}</h1>
          <p className="mt-1 text-[13px] text-white/85">{t("askSub", lang)}</p>
          <div className="mx-auto mt-5 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-xl">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(q)}
              placeholder={t("askPlaceholder", lang)}
              className="flex-1 bg-transparent px-3 py-2.5 text-[14px] text-text outline-none"
            />
            <VoiceButton onResult={(txt) => ask(txt)} />
            <button onClick={() => ask(q)} className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-bold text-white">
              {asking ? "…" : <>{t("askGo", lang)} <Send size={14} /></>}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {examples.map((ex) => (
              <button key={ex} onClick={() => ask(ex)} className="chip bg-white/15 text-white hover:bg-white/25">{ex}</button>
            ))}
          </div>
        </div>
      </section>

      {result && (
        <section className="mx-auto max-w-3xl space-y-3">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-muted">
            Intent: <span className="text-brand-ink">{result.intent}</span> · confidence {(result.confidence * 100).toFixed(0)}%
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

      {/* Profile / data locker */}
      <section className="card animate-in flex flex-wrap items-center gap-4 p-5">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-xl font-bold text-brand">
          {citizen.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] text-muted">{t("goodDay", lang)},</div>
          <div className="text-xl font-extrabold text-brand-ink">{citizen.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
            <span className="flex items-center gap-1"><IdCard size={13} /> {citizen.aadhaarMasked}</span>
            <span className="flex items-center gap-1"><MapPin size={13} /> {lang === "en" ? d.name_en : d.name_hi}</span>
            <span className="chip" style={{ background: "var(--green-soft)", color: "var(--green)" }}>{citizen.category.toUpperCase()}</span>
            {citizen.isBPL && <span className="chip" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>BPL</span>}
          </div>
        </div>
        <div className="ml-auto hidden max-w-[220px] items-center gap-2 rounded-xl bg-surface-2 p-3 text-[12px] text-muted sm:flex">
          <ShieldCheck size={22} className="shrink-0 text-green" style={{ color: "var(--green)" }} />
          <span>Your details are entered <b>once</b> and reused across all services — no re-uploading.</span>
        </div>
      </section>

      {/* Proactive eligibility */}
      <section>
        <SectionHead
          title={`✨ ${t("forYou", lang)}`}
          sub={t("forYouSub", lang)}
          right={<span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>{eligibility.length} matches</span>}
        />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {eligibility.map((e) => {
            const s = service(e.serviceId);
            return (
              <div key={e.serviceId} className="card animate-in flex flex-col p-4" style={{ borderColor: "color-mix(in srgb, var(--brand) 25%, white)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: "var(--saffron)" }} />
                    <div className="text-[14px] font-bold">{lang === "en" ? s.name_en : lang === "cg" ? s.name_cg : s.name_hi}</div>
                  </div>
                  <span className="chip shrink-0" style={{ background: e.match === "high" ? "var(--green-soft)" : "var(--amber-soft)", color: e.match === "high" ? "var(--green)" : "var(--amber)" }}>
                    Match: {e.match === "high" ? "High" : "Medium"}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {e.criteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted">
                      <span style={{ color: "var(--green)" }}>✓</span> {lang === "en" ? c.label_en : c.label_hi}
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg bg-green-soft px-2.5 py-1.5 text-[12px] font-semibold" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
                  ✓ {lang === "en" ? e.benefit_en : e.benefit_hi}
                </div>
                <Link href={`/apply/${s.id}`} className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2 text-[13px] font-bold text-white">
                  {t("claimNow", lang)} <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Life events */}
      <section>
        <SectionHead title={`🧭 ${t("lifeEvents", lang)}`} sub={t("lifeEventsSub", lang)} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LIFE_EVENTS.map((le) => (
            <Link key={le.id} href={`/services?event=${le.id}`} className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="text-3xl">{le.emoji}</span>
              <div className="min-w-0">
                <div className="text-[14px] font-bold">{lang === "en" ? le.name_en : le.name_hi}</div>
                <div className="truncate text-[12px] text-muted">{lang === "en" ? le.desc_en : le.desc_hi}</div>
                <div className="mt-1 text-[11px] font-semibold text-brand">{le.serviceIds.length} services bundled →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Applications */}
        <section className="lg:col-span-2">
          <SectionHead title={`📄 ${t("myApplications", lang)}`} right={<Link href="/services" className="text-[13px] font-semibold text-brand">{t("allServices", lang)} →</Link>} />
          <div className="space-y-2.5">
            {applications.map((a) => {
              const s = service(a.serviceId);
              const left = daysBetween(new Date().toISOString(), a.dueAt);
              const done = a.status === "delivered" || a.status === "approved";
              const breached = !done && left < 0;
              return (
                <Link key={a.id} href={`/track/${a.id}`} className="card flex items-center gap-3 p-4 transition hover:shadow-md">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-bold">{lang === "en" ? s.name_en : s.name_hi}</span>
                      <StatusBadge status={a.status} lang={lang} />
                      {a.autoVerified === 1 && <span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>⚡ {t("autoVerified", lang)}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted">
                      <span>#{a.id}</span>
                      <ChannelBadge channel={a.channel} lang={lang} />
                      {a.assistedBy && <span>• {a.assistedBy}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    {done ? (
                      <span className="chip" style={{ background: "var(--green-soft)", color: "var(--green)" }}>✓ {lang === "en" ? "Done" : "पूर्ण"}</span>
                    ) : breached ? (
                      <span className="chip" style={{ background: "var(--red-soft)", color: "var(--red)" }}>{t("overdue", lang)}</span>
                    ) : (
                      <span className="text-[13px] font-bold text-brand-ink">{left} <span className="text-[11px] font-normal text-muted">{t("daysLeft", lang)}</span></span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <SectionHead title={<span className="flex items-center gap-2"><Bell size={16} /> {lang === "en" ? "Updates" : "सूचनाएँ"}</span>} />
          <div className="card divide-y p-0">
            {notifications.map((n) => (
              <div key={n.id} className="flex gap-3 p-4">
                <span className="text-lg">{n.channel === "whatsapp" ? "💬" : n.channel === "sms" ? "📩" : "🔔"}</span>
                <div>
                  <div className="text-[13px]">{lang === "en" ? n.message_en : n.message_hi}</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted">{n.channel} • {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                </div>
              </div>
            ))}
            <div className="p-3 text-center text-[11px] text-muted">Delivered via WhatsApp / SMS / app — {lang === "en" ? "citizen's choice" : "नागरिक की पसंद"}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
