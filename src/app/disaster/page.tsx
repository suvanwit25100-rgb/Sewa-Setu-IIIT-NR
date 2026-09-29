"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { service } from "@/lib/reference";
import { TriangleAlert, Phone, Tent, Camera, FileWarning, ArrowRight, CheckCircle2 } from "lucide-react";

const RELIEF_SERVICES = ["disaster_relief", "lost_document_assist"];

export default function DisasterPage() {
  useApp();
  const [step, setStep] = useState<"start" | "form" | "done">("start");
  const [note, setNote] = useState("");
  const [appId, setAppId] = useState<string | null>(null);

  const fileClaim = async () => {
    const res = await fetch("/api/applications", {
      method: "POST",
      body: JSON.stringify({ serviceId: "disaster_relief", citizenId: "demo", channel: "voice", assistedBy: null }),
    });
    const d = await res.json();
    setAppId(d.application.id);
    setStep("done");
  };

  return (
    <div className="space-y-7">
      <div className="card p-5" style={{ background: "linear-gradient(135deg, var(--red-soft), var(--surface))" }}>
        <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "var(--red)" }}>
          <TriangleAlert size={18} /> DISASTER MODE — DEMO
        </div>
        <h1 className="mt-1 text-2xl font-extrabold text-brand-ink">Bastar district: flood advisory active</h1>
        <p className="mt-1 text-[13px] text-muted">Demo scenario, relevant to Chhattisgarh&apos;s monsoon/flood-prone districts. Relief services below are prioritised and fast-tracked.</p>
        <a href="tel:1077" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red px-4 py-2 text-[13px] font-bold text-white" style={{ background: "var(--red)" }}>
          <Phone size={15} /> Emergency helpline 1077
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard icon={<Tent size={18} />} title="Relief camps" body="3 camps active near your district — food, shelter, medical aid." />
        <InfoCard icon={<FileWarning size={18} />} title="Lost documents?" body="Fast-tracked re-issue for Aadhaar-linked certificates lost to damage." />
        <InfoCard icon={<Camera size={18} />} title="Report damage" body="Photograph the damage — it strengthens your compensation claim." />
      </div>

      <section>
        <h2 className="mb-2 text-[15px] font-bold">Available assistance</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {RELIEF_SERVICES.map((id) => {
            const s = service(id);
            return (
              <div key={id} className="card p-4">
                <div className="text-[14px] font-bold">{s.name_en}</div>
                <div className="mt-1 text-[12px] text-muted">Guaranteed in {s.slaDays} days • {s.fee === 0 ? "Free" : `₹${s.fee}`}</div>
                <Link href={`/apply/${id}`} className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2 text-[13px] font-bold text-white">
                  Apply <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-[15px] font-bold">Report house damage</h2>
        <p className="mb-3 text-[12px] text-muted">System captures the incident → asks your location → prepares a claim automatically.</p>
        {step === "start" && (
          <button onClick={() => setStep("form")} className="rounded-xl bg-red px-4 py-2 text-[13px] font-bold text-white" style={{ background: "var(--red)" }}>
            My house was damaged
          </button>
        )}
        {step === "form" && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 text-[12px]">
              <Field label="District" value="Bastar (auto-detected)" />
              <Field label="Incident type" value="Flood damage" />
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Briefly describe the damage…" className="w-full rounded-xl border bg-surface-2 p-3 text-[13px] outline-none" />
            <button onClick={fileClaim} className="rounded-xl bg-brand px-4 py-2 text-[13px] font-bold text-white">Prepare &amp; submit claim</button>
          </div>
        )}
        {step === "done" && appId && (
          <div className="animate-in flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--green-soft)" }}>
            <CheckCircle2 size={20} style={{ color: "var(--green)" }} />
            <div className="text-[13px] font-semibold" style={{ color: "var(--green)" }}>
              Claim #{appId} filed. <Link href={`/track/${appId}`} className="underline">Track it →</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-4">
      <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "var(--red-soft)", color: "var(--red)" }}>{icon}</span>
      <div className="mt-2 text-[13px] font-bold">{title}</div>
      <div className="text-[12px] text-muted">{body}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-[13px] font-semibold">{value}</div>
    </div>
  );
}
