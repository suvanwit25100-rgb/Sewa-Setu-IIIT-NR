"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { district, service } from "@/lib/reference";
import { SectionHead, StatusBadge } from "@/components/ui";
import type { Application, CitizenDocument, CitizenProfile } from "@/lib/types";
import { IdCard, MapPin, Users, FileCheck2, Landmark, CircleCheck, CircleX, CircleDashed } from "lucide-react";

export default function ProfilePage() {
  const { lang } = useApp();
  const [citizen, setCitizen] = useState<CitizenProfile | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [docs, setDocs] = useState<CitizenDocument[]>([]);

  useEffect(() => {
    fetch("/api/citizen?id=demo").then((r) => r.json()).then((d) => { setCitizen(d.citizen); setApps(d.applications); });
    fetch("/api/documents?citizenId=demo").then((r) => r.json()).then((d) => setDocs(d.documents));
  }, []);

  if (!citizen) return <div className="py-20 text-center text-muted">Loading…</div>;
  const d = district(citizen.districtId);

  const pending = apps.filter((a) => !["delivered", "approved", "rejected"].includes(a.status));
  const approved = apps.filter((a) => a.status === "approved" || a.status === "delivered");
  const rejected = apps.filter((a) => a.status === "rejected");

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-ink">{citizen.name}</h1>
        <p className="text-[13px] text-muted">Citizen Service Profile — one identity, reused across every service.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Identity */}
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-brand"><IdCard size={16} /> Identity</div>
          <Row k="Name" v={citizen.name} />
          <Row k="Aadhaar (masked)" v={citizen.aadhaarMasked} />
          <Row k="Phone" v={citizen.phone} />
          <Row k="Age / Gender" v={`${citizen.age} • ${citizen.gender}`} />
          <Row k="Category" v={citizen.category.toUpperCase()} />
          <Row k="BPL status" v={citizen.isBPL ? "BPL" : "APL"} />
        </div>

        {/* Family & occupation */}
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-brand"><Users size={16} /> Family &amp; Occupation</div>
          <Row k="Household size" v={String(citizen.household)} />
          <Row k="Occupation" v={citizen.occupation.replace("_", " ")} />
          <Row k="Annual income" v={`₹${citizen.annualIncome.toLocaleString("en-IN")}`} />
          <Row k="Land held" v={`${citizen.landHectares} ha`} />
          <Row k="Forest dweller" v={citizen.isForestDweller ? "Yes" : "No"} />
          <Row k="Disability" v={citizen.hasDisability ? "Registered" : "None on file"} />
        </div>

        {/* Location */}
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-brand"><MapPin size={16} /> Location</div>
          <Row k="District" v={lang === "en" ? d.name_en : d.name_hi} />
          <Row k="Region" v={d.region} />
          <Row k="Digital readiness" v={`${d.digitalReadiness}/100`} />
          <div className="mt-3 rounded-lg bg-surface-2 p-2.5 text-[11px] text-muted">
            This profile is entered <b>once</b> and reused across every application — no re-typing, no re-uploading.
          </div>
        </div>
      </div>

      {/* Documents summary */}
      <section>
        <SectionHead
          title={<span className="flex items-center gap-2"><FileCheck2 size={17} /> Document vault</span>}
          sub={`${docs.length} documents on file`}
          right={<Link href="/documents" className="text-[13px] font-semibold text-brand">Manage →</Link>}
        />
        <div className="flex flex-wrap gap-2">
          {docs.map((doc) => (
            <span key={doc.id} className="chip border" style={{ color: "var(--muted)" }}>
              <FileCheck2 size={12} style={{ color: "var(--green)" }} /> {doc.label_en}
            </span>
          ))}
          {docs.length === 0 && <span className="text-[13px] text-muted">No documents uploaded yet.</span>}
        </div>
      </section>

      {/* Service history */}
      <section>
        <SectionHead title={<span className="flex items-center gap-2"><Landmark size={17} /> Service history</span>} sub="Applications and benefits across all departments" />
        <div className="grid gap-3 sm:grid-cols-3">
          <HistoryCol icon={<CircleDashed size={16} style={{ color: "var(--amber)" }} />} label="Pending" list={pending} lang={lang} color="var(--amber)" />
          <HistoryCol icon={<CircleCheck size={16} style={{ color: "var(--green)" }} />} label="Approved / Delivered" list={approved} lang={lang} color="var(--green)" />
          <HistoryCol icon={<CircleX size={16} style={{ color: "var(--red)" }} />} label="Rejected" list={rejected} lang={lang} color="var(--red)" />
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-1.5 text-[13px] last:border-0">
      <span className="text-muted">{k}</span>
      <span className="text-right font-semibold capitalize">{v}</span>
    </div>
  );
}

function HistoryCol({ icon, label, list, lang, color }: { icon: React.ReactNode; label: string; list: Application[]; lang: "en" | "hi" | "cg"; color: string }) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13px] font-bold">{icon} {label}</span>
        <span className="chip" style={{ background: `color-mix(in srgb, ${color} 14%, white)`, color }}>{list.length}</span>
      </div>
      <div className="space-y-1.5">
        {list.map((a) => (
          <Link key={a.id} href={`/track/${a.id}`} className="flex items-center justify-between rounded-lg bg-surface-2 px-2.5 py-1.5 text-[12px]">
            <span className="truncate">{service(a.serviceId).name_en}</span>
            <StatusBadge status={a.status} lang={lang} />
          </Link>
        ))}
        {list.length === 0 && <div className="text-[12px] text-muted">None</div>}
      </div>
    </div>
  );
}
