"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { t } from "@/lib/i18n";
import { service, district } from "@/lib/reference";
import { StatusBadge, ChannelBadge, DeptBadge } from "@/components/ui";
import { STATUS_STEPS, STATUS_LABEL, statusText, daysBetween } from "@/lib/labels";
import type { Application } from "@/lib/types";
import { CheckCircle2, Circle, Clock, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";

export default function TrackPage() {
  const { lang } = useApp();
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);

  const load = useCallback(() => {
    fetch(`/api/applications/${id}`).then((r) => r.json()).then((d) => setApp(d.application ?? null));
  }, [id]);
  useEffect(load, [load]);

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
  const breached = !done && !isRejected && left < 0;
  const pct = Math.min(100, Math.max(6, ((currentIdx + 1) / STATUS_STEPS.length) * 100));

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

      {/* SLA banner */}
      <div className="card flex items-center gap-4 p-5">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ background: breached ? "var(--red-soft)" : done ? "var(--green-soft)" : "var(--brand-soft)" }}>
          {done ? <CheckCircle2 size={26} style={{ color: "var(--green)" }} /> : <Clock size={26} style={{ color: breached ? "var(--red)" : "var(--brand)" }} />}
        </div>
        <div className="flex-1">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-muted">{t("sla", lang)} — Lok Seva Guarantee</div>
          {done ? (
            <div className="text-[15px] font-bold" style={{ color: "var(--green)" }}>Delivered within guaranteed time ✓</div>
          ) : breached ? (
            <div className="text-[15px] font-bold" style={{ color: "var(--red)" }}>
              {t("overdue", lang)} — auto-penalty & escalation triggered
            </div>
          ) : (
            <div className="text-[15px] font-bold text-brand-ink">
              {left} {t("daysLeft", lang)} <span className="text-[12px] font-normal text-muted">• due {new Date(app.dueAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </div>
          )}
        </div>
        <ShieldCheck size={22} className="text-muted" />
      </div>

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

      {/* Demo control */}
      {!done && !isRejected && (
        <button onClick={advance} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-[13px] font-bold text-brand">
          <RefreshCw size={15} /> Advance workflow (demo) <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
