"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { SectionHead } from "@/components/ui";
import type { CitizenProfile, EligibilityHit } from "@/lib/types";
import { service } from "@/lib/reference";
import { ShieldCheck, Eye, Sparkles } from "lucide-react";

interface AccessEntry { id: string; departmentId: string; departmentName: string; field: string; accessedAt: string }

export default function PrivacyPage() {
  const { lang } = useApp();
  const [citizen, setCitizen] = useState<CitizenProfile | null>(null);
  const [log, setLog] = useState<AccessEntry[]>([]);
  const [elig, setElig] = useState<EligibilityHit[]>([]);

  useEffect(() => {
    fetch("/api/privacy?id=demo").then((r) => r.json()).then((d) => { setCitizen(d.citizen); setLog(d.accessLog); setElig(d.eligibility); });
  }, []);

  if (!citizen) return <div className="py-20 text-center text-muted">Loading…</div>;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-brand-ink"><ShieldCheck size={22} /> My Data</h1>
        <p className="text-[13px] text-muted">Privacy-by-design: because proactive services use your information, you can see exactly how.</p>
      </div>

      <div className="card p-5">
        <div className="mb-2 text-[14px] font-bold">Information stored about you</div>
        <div className="flex flex-wrap gap-2">
          {["Identity", "Address", "Family & income", "Documents", "Application history"].map((c) => (
            <span key={c} className="chip border" style={{ color: "var(--muted)" }}>{c}</span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">Demo data — synthetic profile only, no real personal information.</p>
      </div>

      <section>
        <SectionHead title={<span className="flex items-center gap-2"><Eye size={17} /> Access history</span>} sub="Which department accessed what, and when" />
        <div className="card divide-y p-0">
          {log.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold">{a.departmentName}</div>
                <div className="text-[12px] text-muted">{a.field}</div>
              </div>
              <div className="text-[12px] text-muted">{new Date(a.accessedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
            </div>
          ))}
          {log.length === 0 && <div className="p-8 text-center text-muted">No access recorded yet.</div>}
        </div>
      </section>

      <section>
        <SectionHead title={<span className="flex items-center gap-2"><Sparkles size={17} /> Why am I seeing these services?</span>} sub="Every proactive suggestion is explainable — never a black box" />
        <div className="space-y-2">
          {elig.map((e) => (
            <div key={e.serviceId} className="card p-3.5">
              <div className="text-[13px] font-bold">{service(e.serviceId).name_en}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {e.criteria.map((c, i) => (
                  <span key={i} className="chip" style={{ background: "var(--green-soft)", color: "var(--green)" }}>✓ {lang === "en" ? c.label_en : c.label_hi}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
