"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { t } from "@/lib/i18n";
import { service } from "@/lib/reference";
import { DeptBadge } from "@/components/ui";
import type { Application, CitizenDocument } from "@/lib/types";
import {
  Clock, ShieldCheck, Loader2, CheckCircle2, ArrowRight, Fingerprint, FileCheck2,
  ClipboardCheck, TriangleAlert, X,
} from "lucide-react";

interface Check { source: string; field: string; value: string; status: string }
interface Health {
  docsOk: { have: number; need: number };
  fieldsOk: { have: number; need: number };
  quality: boolean;
  consistency: { ok: boolean; issue_en?: string; issue_hi?: string };
  eligibility: boolean;
  overallOk: boolean;
}

const STEP_LABELS = ["Start", "Auto-verify", "Health check", "Submit", "Done"];

export default function ApplyPage() {
  const { lang, assisted } = useApp();
  const { id } = useParams<{ id: string }>();
  const s = service(id);

  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [consent, setConsent] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [app, setApp] = useState<Application | null>(null);
  const [vault, setVault] = useState<CitizenDocument[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [forceContinue, setForceContinue] = useState(false);

  const name = lang === "en" ? s.name_en : lang === "cg" ? s.name_cg : s.name_hi;

  useEffect(() => {
    fetch("/api/documents?citizenId=demo").then((r) => r.json()).then((d) => setVault(d.documents));
  }, []);

  useEffect(() => {
    if (step !== 1) return;
    setChecks([]); setRevealed(0);
    fetch("/api/verify", { method: "POST", body: JSON.stringify({ serviceId: s.id, citizenId: "demo" }) })
      .then((r) => r.json())
      .then((d) => setChecks(d.checks));
  }, [step, s.id]);

  useEffect(() => {
    if (step !== 1 || checks.length === 0) return;
    if (revealed >= checks.length) return;
    const timer = setTimeout(() => setRevealed((v) => v + 1), 650);
    return () => clearTimeout(timer);
  }, [step, checks, revealed]);

  useEffect(() => {
    if (step !== 2) return;
    fetch("/api/health-check", { method: "POST", body: JSON.stringify({ serviceId: s.id, citizenId: "demo" }) })
      .then((r) => r.json())
      .then(setHealth);
  }, [step, s.id]);

  const submit = async () => {
    const res = await fetch("/api/applications", {
      method: "POST",
      body: JSON.stringify({ serviceId: s.id, citizenId: "demo", channel: assisted ? "assisted" : "web", assistedBy: assisted ? "CHOICE Op. Rekha" : null }),
    });
    const d = await res.json();
    setApp(d.application);
    setStep(4);
  };

  const haveTypes = new Set(vault.map((v) => v.label_en.toLowerCase()));
  const requiredWithStatus = s.requiredDocs.map((doc) => ({
    doc, have: [...haveTypes].some((h) => doc.toLowerCase().includes(h.split(" ")[0].toLowerCase())),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between gap-2">
          <DeptBadge id={s.departmentId} />
          <span className="text-[11px] font-mono text-muted">{s.code}</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-brand-ink">{name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-muted">
          <span className="flex items-center gap-1"><Clock size={14} /> {t("sla", lang)} <b className="text-text">{s.slaDays} {t("days", lang)}</b></span>
          <span>•</span>
          <span>{s.fee === 0 ? t("free", lang) : `${t("fee", lang)} ₹${s.fee}`}</span>
          <span>•</span>
          <span className="flex items-center gap-1" style={{ color: "var(--green)" }}><ShieldCheck size={14} /> Lok Seva Guarantee</span>
        </div>
      </div>

      <div className="flex items-center gap-1 px-1 text-[11px] font-semibold text-muted">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-1">
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${i <= step ? "bg-brand text-white" : "bg-surface-2 text-muted"}`}>{i + 1}</span>
            <span className={i <= step ? "text-brand-ink" : ""}>{label}</span>
            {i < STEP_LABELS.length - 1 && <span className="mx-1 h-px flex-1" style={{ background: i < step ? "var(--brand)" : "var(--border)" }} />}
          </div>
        ))}
      </div>

      {/* Step 0 */}
      {step === 0 && (
        <div className="card animate-in space-y-4 p-5">
          <div>
            <h2 className="text-[15px] font-bold">What we would normally ask for</h2>
            <p className="text-[13px] text-muted">With interoperability, most of these are fetched for you — no uploads.</p>
          </div>
          <ul className="space-y-1.5">
            {s.requiredDocs.map((doc) => (
              <li key={doc} className="flex items-center gap-2 text-[13px]">
                <FileCheck2 size={15} style={{ color: "var(--green)" }} />
                <span className="text-muted line-through">{doc}</span>
                <span className="chip" style={{ background: "var(--green-soft)", color: "var(--green)" }}>auto-fetch</span>
              </li>
            ))}
          </ul>

          {assisted && (
            <div className="rounded-xl border p-3" style={{ background: "var(--amber-soft)", borderColor: "transparent" }}>
              <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "var(--amber)" }}>
                <ClipboardCheck size={16} /> Kendra Operator Copilot
              </div>
              <div className="mt-2 space-y-1">
                {requiredWithStatus.map(({ doc, have }) => (
                  <div key={doc} className="flex items-center gap-2 text-[12px]" style={{ color: "var(--amber)" }}>
                    {have ? "✓" : "✗"} {doc} {have ? "(citizen already has)" : "(missing — collect before submission)"}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[11px]" style={{ color: "var(--amber)" }}>
                Estimated processing: {s.slaDays} days.
              </div>
              <div className="mt-3 flex items-center gap-2 border-t pt-2 text-[13px]" style={{ borderColor: "color-mix(in srgb, var(--amber) 30%, transparent)" }}>
                <Fingerprint size={16} style={{ color: "var(--amber)" }} />
                <label className="flex items-center gap-2" style={{ color: "var(--amber)" }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  Citizen consent captured (OTP / biometric) — demo
                </label>
              </div>
            </div>
          )}

          <button
            disabled={assisted && !consent}
            onClick={() => setStep(1)}
            className="w-full rounded-xl bg-brand py-3 text-[14px] font-bold text-white disabled:opacity-40"
          >
            {t("apply", lang)} →
          </button>
        </div>
      )}

      {/* Step 1 — auto verification */}
      {step === 1 && (
        <div className="card animate-in space-y-3 p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand">⚡</span>
            <div>
              <h2 className="text-[15px] font-bold">Departmental interoperability</h2>
              <p className="text-[12px] text-muted">Pulling verified data from source systems…</p>
            </div>
          </div>
          <div className="space-y-2">
            {checks.map((c, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl border p-3 transition ${i < revealed ? "opacity-100" : "opacity-30"}`}>
                {i < revealed ? <CheckCircle2 size={18} style={{ color: "var(--green)" }} /> : <Loader2 size={18} className="animate-spin text-muted" />}
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold">{c.field}</div>
                  <div className="text-[12px] text-muted">via {c.source}</div>
                </div>
                {i < revealed && <div className="max-w-[45%] truncate text-right text-[12px] font-medium" style={{ color: "var(--green)" }}>{c.value}</div>}
              </div>
            ))}
          </div>
          {checks.length > 0 && revealed >= checks.length && (
            <div className="animate-in space-y-3">
              <div className="rounded-xl px-3 py-2 text-[13px] font-semibold" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
                ✓ {checks.length} fields verified • {s.requiredDocs.length} document uploads skipped
              </div>
              <button onClick={() => setStep(2)} className="w-full rounded-xl bg-brand py-3 text-[14px] font-bold text-white">Continue →</button>
            </div>
          )}
        </div>
      )}

      {/* Step 2 — application health check */}
      {step === 2 && (
        <div className="card animate-in space-y-4 p-5">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-brand" />
            <h2 className="text-[15px] font-bold">Application health check</h2>
          </div>
          {!health ? (
            <div className="flex items-center gap-2 text-[13px] text-muted"><Loader2 size={16} className="animate-spin" /> Checking…</div>
          ) : (
            <div className="animate-in space-y-2.5">
              <HealthRow label="Documents" ok={health.docsOk.have >= health.docsOk.need} detail={`${Math.min(health.docsOk.have, health.docsOk.need)}/${health.docsOk.need}`} />
              <HealthRow label="Required fields" ok={health.fieldsOk.have >= health.fieldsOk.need - 1} detail={`${health.fieldsOk.have}/${health.fieldsOk.need}`} />
              <HealthRow label="Document quality" ok={health.quality} />
              <HealthRow label="Information consistency" ok={health.consistency.ok} />
              <HealthRow label="Eligibility" ok={health.eligibility} />

              {!health.consistency.ok && (
                <div className="flex items-start gap-2 rounded-xl p-3 text-[12px]" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>
                  <TriangleAlert size={15} className="mt-0.5 shrink-0" />
                  <span>{lang === "en" ? health.consistency.issue_en : health.consistency.issue_hi}</span>
                </div>
              )}

              {(health.overallOk || forceContinue) ? (
                <button onClick={() => setStep(3)} className="w-full rounded-xl bg-brand py-3 text-[14px] font-bold text-white">Continue to review →</button>
              ) : (
                <div className="flex gap-2">
                  <Link href="/documents" className="flex-1 rounded-xl border py-3 text-center text-[13px] font-bold text-brand">Fix before submission</Link>
                  <button onClick={() => setForceContinue(true)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-surface-2 py-3 text-[13px] font-bold text-muted">
                    Continue anyway <X size={13} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — review */}
      {step === 3 && (
        <div className="card animate-in space-y-4 p-5">
          <h2 className="text-[15px] font-bold">Review &amp; submit</h2>
          <div className="space-y-2 rounded-xl bg-surface-2 p-3 text-[13px]">
            <Row k="Service" v={name} />
            <Row k="Applicant" v="Sukhmati Kashyap • Bastar" />
            <Row k="Channel" v={assisted ? "Assisted (CHOICE Op. Rekha)" : "Self-service (web)"} />
            <Row k="Documents" v={`${s.requiredDocs.length} auto-verified`} />
            <Row k="Guaranteed by" v={`+${s.slaDays} days (Lok Seva Guarantee)`} />
            <Row k="Fee" v={s.fee === 0 ? "Free" : `₹${s.fee}`} />
          </div>
          <button onClick={submit} className="w-full rounded-xl bg-brand py-3 text-[14px] font-bold text-white">Submit application</button>
        </div>
      )}

      {/* Step 4 — success */}
      {step === 4 && app && (
        <div className="card animate-in space-y-4 p-6 text-center">
          <CheckCircle2 size={52} className="mx-auto" style={{ color: "var(--green)" }} />
          <div>
            <h2 className="text-xl font-extrabold text-brand-ink">Application submitted</h2>
            <p className="text-[13px] text-muted">A confirmation is on its way via WhatsApp &amp; SMS.</p>
          </div>
          <div className="mx-auto max-w-sm space-y-2 rounded-xl bg-surface-2 p-4 text-left text-[13px]">
            <Row k="Reference" v={`#${app.id}`} />
            <Row k="Status" v="Auto-verified → in review" />
            <Row k="Guaranteed by" v={new Date(app.dueAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={`/track/${app.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-3 text-[14px] font-bold text-white">
              {t("track", lang)} <ArrowRight size={15} />
            </Link>
            <Link href="/citizen" className="flex-1 rounded-xl border py-3 text-center text-[14px] font-bold text-brand">Dashboard</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function HealthRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-[13px]">
      <span>{label}</span>
      <span className="flex items-center gap-1.5 font-semibold" style={{ color: ok ? "var(--green)" : "var(--amber)" }}>
        {detail && <span className="text-[11px] text-muted">{detail}</span>} {ok ? "✓" : "⚠"}
      </span>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}
