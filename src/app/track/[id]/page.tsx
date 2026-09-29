"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { t } from "@/lib/i18n";
import { service, district, dept } from "@/lib/reference";
import { StatusBadge, ChannelBadge, DeptBadge } from "@/components/ui";
import { STATUS_STEPS, STATUS_LABEL, statusText, daysBetween } from "@/lib/labels";
import type { Application } from "@/lib/types";
import { CheckCircle2, Circle, Clock, ShieldCheck, ArrowRight, RefreshCw, MessageSquareWarning, Gauge } from "lucide-react";

const NEXT_STEP: Record<string, { en: string; hi: string }> = {
  submitted: { en: "Auto-verification against Aadhaar / department records", hi: "आधार / विभागीय रिकॉर्ड से स्वतः सत्यापन" },
  auto_verifying: { en: "Officer verification at the department", hi: "विभाग में अधिकारी सत्यापन" },
  in_review: { en: "Approval by the sanctioning authority", hi: "स्वीकृति अधिकारी द्वारा अनुमोदन" },
  approved: { en: "Certificate generation & delivery", hi: "प्रमाण पत्र निर्माण एवं वितरण" },
  delivered: { en: "None — completed", hi: "कोई नहीं — पूर्ण" },
};

const RISK_STYLE: Record<string, { label: string; color: string }> = {
  low: { label: "LOW", color: "var(--green)" },
  medium: { label: "MEDIUM", color: "var(--amber)" },
  high: { label: "HIGH", color: "var(--red)" },
  exceeded: { label: "SLA EXCEEDED", color: "var(--red)" },
};

export default function TrackPage() {
  const { lang } = useApp();
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [risk, setRisk] = useState<{ risk: string; elapsedPct: number } | null>(null);
  const [delay, setDelay] = useState<{ pct: number; reasons_en: string[]; reasons_hi: string[] } | null>(null);

  const load = useCallback(() => {
    fetch(`/api/applications/${id}`).then((r) => r.json()).then((d) => setApp(d.application ?? null));
  }, [id]);
  useEffect(load, [load]);

  useEffect(() => {
    if (!app) return;
    fetch(`/api/sla?applicationId=${app.id}`).then((r) => r.json()).then((d) => { setRisk(d.risk); setDelay(d.delay); });
  }, [app]);

  const advance = async () => {
    await fetch(`/api/applications/${id}`, { method: "POST" });
    load();
  };

  if (!app) return <div className="py-20 text-center text-muted">Loading…</div>;
  const s = service(app.serviceId);
  const d = district(app.districtId);
  const name = lang === "en" ? s.name_en : lang === "cg" ? s.name_cg : s.name_hi;

  const isRejected = app.status === "rejected";
  const currentIdx = isRejected ? STATUS_STEPS.indexOf("in_review") : STATUS_STEPS.indexOf(app.status);
  const done = app.status === "delivered" || app.status === "approved";
  const left = daysBetween(new Date().toISOString(), app.dueAt);
  const waitingDays = daysBetween(app.submittedAt, new Date().toISOString());
  const breached = !done && !isRejected && left < 0;
  const pct = Math.min(100, Math.max(6, ((currentIdx + 1) / STATUS_STEPS.length) * 100));
  const nextStep = NEXT_STEP[app.status];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/citizen" className="text-[13px] font-semibold text-brand">← {t("myApplications", lang)}</Link>

      <div className="card p-5">
        <div className="flex items-center justify-between gap-2">
          <DeptBadge id={s.departmentId} />
          <span className="text-[11px] font-mono text-muted">#{app.id}</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-brand-ink">{name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={app.status} lang={lang} />
          <ChannelBadge channel={app.channel} lang={lang} />
          {app.autoVerified === 1 && <span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>⚡ {t("autoVerified", lang)}</span>}
          {app.assistedBy && <span className="chip border text-muted">🤝 {app.assistedBy}</span>}
        </div>
      </div>

      {/* Why is my application stuck? */}
      {!done && !isRejected && (
        <div className="card p-5">
          <div className="mb-2 text-[13px] font-bold text-brand-ink">Why is my application here?</div>
          <div className="grid gap-2 text-[13px] sm:grid-cols-2">
            <InfoLine k="Current stage" v={statusText(app.status, lang)} />
            <InfoLine k="Department" v={dept(s.departmentId).name_en} />
            <InfoLine k="Submitted" v={new Date(app.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
            <InfoLine k="Waiting" v={`${waitingDays} day${waitingDays === 1 ? "" : "s"}`} />
            <InfoLine k="Expected next step" v={lang === "en" ? nextStep.en : nextStep.hi} />
            <InfoLine k="Citizen action needed" v="No action required" />
          </div>
        </div>
      )}

      {/* SLA + risk */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ background: breached ? "var(--red-soft)" : done ? "var(--green-soft)" : "var(--brand-soft)" }}>
            {done ? <CheckCircle2 size={26} style={{ color: "var(--green)" }} /> : <Clock size={26} style={{ color: breached ? "var(--red)" : "var(--brand)" }} />}
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-muted">{t("sla", lang)} — Lok Seva Guarantee</div>
            {done ? (
              <div className="text-[15px] font-bold" style={{ color: "var(--green)" }}>Delivered within guaranteed time ✓</div>
            ) : breached ? (
              <div className="text-[15px] font-bold" style={{ color: "var(--red)" }}>{t("overdue", lang)} — auto-penalty &amp; escalation eligible</div>
            ) : (
              <div className="text-[15px] font-bold text-brand-ink">{left} {t("daysLeft", lang)} <span className="text-[12px] font-normal text-muted">• due {new Date(app.dueAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></div>
            )}
          </div>
          <ShieldCheck size={22} className="text-muted" />
        </div>
        {risk && (
          <>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full" style={{ width: `${risk.elapsedPct}%`, background: RISK_STYLE[risk.risk].color }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
              <span>Elapsed {risk.elapsedPct}%</span>
              <span className="chip" style={{ background: `color-mix(in srgb, ${RISK_STYLE[risk.risk].color} 15%, white)`, color: RISK_STYLE[risk.risk].color }}>Risk: {RISK_STYLE[risk.risk].label}</span>
            </div>
          </>
        )}
      </div>

      {/* Delay prediction */}
      {delay && !done && (
        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-bold"><Gauge size={16} /> Delay risk indicator</span>
            <span className="text-lg font-extrabold" style={{ color: delay.pct > 60 ? "var(--red)" : delay.pct > 35 ? "var(--amber)" : "var(--green)" }}>{delay.pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full" style={{ width: `${delay.pct}%`, background: delay.pct > 60 ? "var(--red)" : delay.pct > 35 ? "var(--amber)" : "var(--green)" }} />
          </div>
          <ul className="mt-2 space-y-1 text-[12px] text-muted">
            {(lang === "en" ? delay.reasons_en : delay.reasons_hi).map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
          <div className="mt-2 text-[10px] italic text-muted">Risk indicator, not a guaranteed outcome — simulated model for this prototype.</div>
        </div>
      )}

      {/* Timeline */}
      <div className="card p-5">
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: breached ? "var(--red)" : "var(--brand)" }} />
        </div>
        <ol className="space-y-4">
          {STATUS_STEPS.map((st, i) => {
            const reached = i <= currentIdx;
            const isNow = i === currentIdx && !done;
            return (
              <li key={st} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {reached ? <CheckCircle2 size={20} style={{ color: STATUS_LABEL[st].color }} /> : <Circle size={20} className="text-muted opacity-40" />}
                  {i < STATUS_STEPS.length - 1 && <span className="mt-1 h-6 w-px" style={{ background: reached ? STATUS_LABEL[st].color : "var(--border)" }} />}
                </div>
                <div className="pb-1">
                  <div className={`text-[14px] font-semibold ${reached ? "" : "text-muted"}`}>{statusText(st, lang)}</div>
                  {isNow && <div className="text-[12px] pulse-dot" style={{ color: STATUS_LABEL[st].color }}>● in progress</div>}
                  {st === "auto_verifying" && reached && <div className="text-[12px] text-muted">Aadhaar, {d.name_en} records & PFMS matched automatically</div>}
                </div>
              </li>
            );
          })}
        </ol>
        {isRejected && <div className="mt-3 rounded-xl px-3 py-2 text-[13px] font-semibold" style={{ background: "var(--red-soft)", color: "var(--red)" }}>Application rejected — reason sent via WhatsApp with re-apply link.</div>}
      </div>

      {breached && (
        <Link href={`/grievances?applicationId=${app.id}`} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-bold text-white" style={{ background: "var(--red)" }}>
          <MessageSquareWarning size={16} /> Raise Grievance
        </Link>
      )}

      {!done && !isRejected && (
        <button onClick={advance} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-[13px] font-bold text-brand">
          <RefreshCw size={15} /> Advance workflow (demo) <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function InfoLine({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted">{k}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}
