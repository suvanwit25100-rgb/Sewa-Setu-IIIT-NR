"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { t } from "@/lib/i18n";
import { SERVICES, LIFE_EVENTS, service } from "@/lib/reference";
import { DeptBadge, SectionHead } from "@/components/ui";
import type { ServiceCategory } from "@/lib/types";
import { VoiceButton } from "@/components/voice-button";
import { ArrowRight, Clock, Search } from "lucide-react";

const CATS: { id: ServiceCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "certificate", label: "Certificates" },
  { id: "welfare", label: "Welfare" },
  { id: "pension", label: "Pensions" },
  { id: "land", label: "Land" },
  { id: "license", label: "Licenses" },
];

function Catalog() {
  const { lang } = useApp();
  const params = useSearchParams();
  const eventId = params.get("event");
  const event = eventId ? LIFE_EVENTS.find((e) => e.id === eventId) : null;

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ServiceCategory | "all">("all");

  const list = useMemo(() => {
    let base = event ? event.serviceIds.map(service) : SERVICES;
    if (cat !== "all") base = base.filter((s) => s.category === cat);
    if (q.trim()) {
      const needle = q.toLowerCase();
      base = base.filter((s) => `${s.name_en} ${s.name_hi} ${s.name_cg} ${s.code}`.toLowerCase().includes(needle));
    }
    return base;
  }, [event, cat, q]);

  return (
    <div className="space-y-6">
      {event ? (
        <div className="card animate-in p-5" style={{ background: "linear-gradient(135deg,var(--brand-soft),white)" }}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{event.emoji}</span>
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wide text-brand">{t("lifeEvents", lang)}</div>
              <h1 className="text-xl font-extrabold text-brand-ink">{lang === "en" ? event.name_en : event.name_hi}</h1>
              <p className="text-[13px] text-muted">{lang === "en" ? event.desc_en : event.desc_hi}</p>
            </div>
            <Link href="/services" className="ml-auto text-[13px] font-semibold text-brand">{t("allServices", lang)} →</Link>
          </div>
          <p className="mt-3 text-[12px] text-muted">These {event.serviceIds.length} services are applied together — shared details are filled once and reused.</p>
        </div>
      ) : (
        <SectionHead title={`🗂️ ${t("allServices", lang)}`} sub="Search, or speak in your language. Most documents are auto-verified across departments." />
      )}

      {/* Search + voice */}
      <div className="flex gap-2">
        <div className="card flex flex-1 items-center gap-2 px-3 py-2">
          <Search size={17} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={lang === "en" ? "Search services…" : "सेवा खोजें…"}
            className="w-full bg-transparent text-[14px] outline-none"
          />
        </div>
        <VoiceButton onResult={setQ} />
      </div>

      {/* Categories */}
      {!event && (
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`chip border px-3 py-1.5 text-[12px] ${cat === c.id ? "text-white" : "text-muted"}`}
              style={cat === c.id ? { background: "var(--brand)", borderColor: "var(--brand)" } : undefined}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <div key={s.id} className="card flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <DeptBadge id={s.departmentId} />
              <span className="text-[11px] font-mono text-muted">{s.code}</span>
            </div>
            <h3 className="mt-2 text-[15px] font-bold leading-snug">
              {lang === "en" ? s.name_en : lang === "cg" ? s.name_cg : s.name_hi}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted">
              <span className="flex items-center gap-1"><Clock size={13} /> {t("sla", lang)} {s.slaDays} {t("days", lang)}</span>
              <span>•</span>
              <span>{s.fee === 0 ? t("free", lang) : `${t("fee", lang)} ₹${s.fee}`}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {s.autoVerify.slice(0, 2).map((v, i) => (
                <span key={i} className="chip" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>⚡ {v.source}</span>
              ))}
            </div>
            <Link href={`/apply/${s.id}`} className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2 text-[13px] font-bold text-white">
              {t("apply", lang)} <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
      {list.length === 0 && <div className="py-14 text-center text-muted">No services match.</div>}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">Loading…</div>}>
      <Catalog />
    </Suspense>
  );
}
