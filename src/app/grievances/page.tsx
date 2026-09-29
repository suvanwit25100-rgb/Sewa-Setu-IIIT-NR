"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useApp } from "@/components/providers";
import { SectionHead } from "@/components/ui";
import type { Application, Grievance } from "@/lib/types";
import { service, dept } from "@/lib/reference";
import { MessageSquareWarning, Send, CheckCircle2 } from "lucide-react";

function GrievancesInner() {
  useApp();
  const params = useSearchParams();
  const prefillAppId = params.get("applicationId") ?? "";

  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [app, setApp] = useState<Application | null>(null);
  const [desc, setDesc] = useState("");
  const [submitted, setSubmitted] = useState<Grievance | null>(null);

  useEffect(() => {
    fetch("/api/grievances?citizenId=demo").then((r) => r.json()).then((d) => setGrievances(d.grievances));
  }, []);

  useEffect(() => {
    if (!prefillAppId) return;
    fetch(`/api/applications/${prefillAppId}`).then((r) => r.json()).then((d) => {
      if (d.application) {
        setApp(d.application);
        const s = service(d.application.serviceId);
        setDesc(`My application #${d.application.id} for ${s.name_en} has exceeded its guaranteed processing time (${d.application.slaDays} days). Requesting escalation.`);
      }
    });
  }, [prefillAppId]);

  const submit = async () => {
    if (!app) return;
    const res = await fetch("/api/grievances", { method: "POST", body: JSON.stringify({ applicationId: app.id, description: desc }) });
    const d = await res.json();
    setSubmitted(d.grievance);
    setGrievances((g) => [d.grievance, ...g]);
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-ink">Grievances</h1>
        <p className="text-[13px] text-muted">Raised automatically from a delayed application — you only review and submit.</p>
      </div>

      {app && !submitted && (
        <div className="card animate-in space-y-3 p-5">
          <div className="flex items-center gap-2 text-[14px] font-bold"><MessageSquareWarning size={17} style={{ color: "var(--red)" }} /> Auto-prepared grievance</div>
          <div className="grid gap-1.5 rounded-xl bg-surface-2 p-3 text-[13px] sm:grid-cols-2">
            <Row k="Application" v={`#${app.id}`} />
            <Row k="Service" v={service(app.serviceId).name_en} />
            <Row k="Department" v={dept(service(app.serviceId).departmentId).name_en} />
            <Row k="Submitted" v={new Date(app.submittedAt).toLocaleDateString("en-IN")} />
            <Row k="SLA" v={`${app.slaDays} days`} />
            <Row k="Current status" v={app.status.replace("_", " ")} />
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="w-full rounded-xl border bg-surface p-3 text-[13px] outline-none"
          />
          <button onClick={submit} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-bold text-white">
            <Send size={15} /> Submit grievance
          </button>
        </div>
      )}

      {submitted && (
        <div className="card animate-in flex items-center gap-3 p-5" style={{ background: "var(--green-soft)" }}>
          <CheckCircle2 size={22} style={{ color: "var(--green)" }} />
          <div className="text-[13px] font-semibold" style={{ color: "var(--green)" }}>
            Grievance #{submitted.id} raised — escalated to the department for priority review.
          </div>
        </div>
      )}

      <section>
        <SectionHead title="Your grievances" sub={`${grievances.length} total`} />
        <div className="space-y-2">
          {grievances.map((g) => (
            <div key={g.id} className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold">{g.serviceName}</div>
                <div className="text-[12px] text-muted">#{g.id} • app #{g.applicationId} • {g.delayDays}d overdue</div>
              </div>
              <span className="chip" style={{ background: g.status === "resolved" ? "var(--green-soft)" : "var(--amber-soft)", color: g.status === "resolved" ? "var(--green)" : "var(--amber)" }}>
                {g.status}
              </span>
            </div>
          ))}
          {grievances.length === 0 && <div className="py-10 text-center text-muted">No grievances raised. From a delayed application, use &quot;Raise Grievance&quot;.</div>}
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-2"><span className="text-muted">{k}</span><span className="text-right font-semibold capitalize">{v}</span></div>;
}

export default function GrievancesPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">Loading…</div>}>
      <GrievancesInner />
    </Suspense>
  );
}
