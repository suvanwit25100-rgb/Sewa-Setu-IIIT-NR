"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { t } from "@/lib/i18n";
import { service } from "@/lib/reference";
import { DeptBadge } from "@/components/ui";
import type { Application } from "@/lib/types";
import { Clock, ShieldCheck, Loader2, CheckCircle2, ArrowRight, Fingerprint, FileCheck2 } from "lucide-react";

interface Check { source: string; field: string; value: string; status: string }

export default function ApplyPage() {
  const { lang, assisted } = useApp();
  const { id } = useParams<{ id: string }>();
  const s = service(id);

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [consent, setConsent] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [app, setApp] = useState<Application | null>(null);

  const name = lang === "en" ? s.name_en : lang === "cg" ? s.name_cg : s.name_hi;

  // Run auto-verification when entering step 1.
  useEffect(() => {
    if (step !== 1) return;
    setChecks([]); setRevealed(0);
    fetch("/api/verify", { method: "POST", body: JSON.stringify({ serviceId: s.id, citizenId: "demo" }) })
      .then((r) => r.json())
      .then((d) => setChecks(d.checks));
  }, [step, s.id]);

  // Reveal checks one-by-one for effect.
  useEffect(() => {
    if (step !== 1 || checks.length === 0) return;
    if (revealed >= checks.length) return;
    const timer = setTimeout(() => setRevealed((v) => v + 1), 650);
    return () => clearTimeout(timer);
  }, [step, checks, revealed]);

  const submit = async () => {
    const res = await fetch("/api/applications", {
      method: "POST",
      body: JSON.stringify({ serviceId: s.id, citizenId: "demo", channel: assisted ? "assisted" : "web", assistedBy: assisted ? "CHOICE Op. Rekha" : null }),
    });
    const d = await res.json();
    setApp(d.application);
    setStep(3);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
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

      {/* Stepper */}
      <div className="flex items-center gap-1 px-1 text-[11px] font-semibold text-muted">
        {["Start", "Auto-verify", "Submit", "Done"].map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-1">
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${i <= step ? "bg-brand text-white" : "bg-surface-2 text-muted"}`}>{i + 1}</span>
            <span className={i <= step ? "text-brand-ink" : ""}>{label}</span>
            {i < 3 && <span className="mx-1 h-px flex-1" style={{ background: i < step ? "var(--brand)" : "var(--border)" }} />}
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
                <Fingerprint size={16} /> Citizen consent required
              </div>
              <p className="mt-1 text-[12px]" style={{ color: "var(--amber)" }}>
                You (operator) are applying on the citizen&apos;s behalf. Capture their consent to proceed — recorded in an audit trail.
              </p>
              <label className="mt-2 flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>Citizen consent captured (OTP / biometric) — demo</span>
              </label>
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

      {/* Step 2 — review */}
      {step === 2 && (
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

      {/* Step 3 — success */}
      {step === 3 && app && (
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}
