"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";
import { t } from "@/lib/i18n";
import { User, BarChart3, Sparkles, Layers, Smartphone, Workflow, Database, Network, ArrowRight } from "lucide-react";

const FOCUS = [
  { icon: Sparkles, title: "Proactive & personalized", desc: "Eligibility engine surfaces benefits you never claimed.", href: "/citizen" },
  { icon: Layers, title: "Unified journeys", desc: "Life-event bundles + a write-once data locker.", href: "/citizen" },
  { icon: Smartphone, title: "Mobile-first & inclusive", desc: "Voice, Chhattisgarhi, and assisted operator mode.", href: "/services" },
  { icon: Workflow, title: "Smart workflow & tracking", desc: "Live status + Lok Seva Guarantee SLA countdown.", href: "/citizen" },
  { icon: Database, title: "Data-driven MIS", desc: "Collector dashboard flags where to send camps.", href: "/mis" },
  { icon: Network, title: "Interoperability", desc: "Auto-verify from Aadhaar, Bhuiyan, PFMS, e-Shram.", href: "/services" },
];

export default function Home() {
  const { lang } = useApp();
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="card grid-bg relative overflow-hidden p-7 sm:p-10" style={{ background: "linear-gradient(135deg,var(--brand-ink),var(--brand))" }}>
        <div className="relative z-10 max-w-2xl text-white">
          <div className="chip mb-3 w-fit bg-white/15 text-white">Chhattisgarh • {t("prototype", lang)}</div>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-[40px]">
            {t("appName", lang)}
          </h1>
          <p className="mt-3 text-[15px] text-white/85 sm:text-base">
            A next-generation layer on Seva Setu: services that <b>find the citizen</b>, work in
            their language and offline, verify across departments automatically, and give
            officers a live MIS — keeping citizen simplicity and government operability at the centre.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/citizen" className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[14px] font-bold text-brand-ink">
              <User size={17} /> {t("citizenPortal", lang)} portal <ArrowRight size={15} />
            </Link>
            <Link href="/mis" className="flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-[14px] font-bold text-white ring-1 ring-white/30">
              <BarChart3 size={17} /> {t("officerPortal", lang)}
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-white/70">
            <span>441 services live on Seva Setu today</span>
            <span>•</span>
            <span>3.2 cr+ transactions</span>
            <span>•</span>
            <span>Backed by Lok Seva Guarantee Act, 2011</span>
          </div>
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
    </div>
  );
}
