"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge, ChannelBadge } from "@/components/ui";
import { service, district } from "@/lib/reference";
import type { Application, CitizenDocument, CitizenProfile, Grievance, Notification } from "@/lib/types";
import { ArrowLeft, IdCard, MapPin, Users, FileCheck2, ScrollText } from "lucide-react";

interface Detail {
  citizen: CitizenProfile;
  applications: Application[];
  documents: CitizenDocument[];
  grievances: Grievance[];
  notifications: Notification[];
}

export default function AdminCitizenDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/citizens/${id}`).then((r) => r.json()).then((d) => {
      if (!d.success) { setError(true); return; }
      setData(d.data);
    });
  }, [id]);

  if (error) return <div className="py-20 text-center text-muted">Citizen not found.</div>;
  if (!data) return <div className="py-20 text-center text-muted">Loading…</div>;
  const { citizen, applications, documents, grievances, notifications } = data;
  const d = district(citizen.districtId);

  return (
    <div className="space-y-6">
      <Link href="/admin?tab=citizens" className="flex items-center gap-1 text-[13px] font-semibold text-brand"><ArrowLeft size={14} /> All citizens</Link>

      <div className="card flex flex-wrap items-center gap-4 p-5">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-xl font-bold text-brand">
          {citizen.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>
        <div>
          <div className="text-xl font-extrabold text-brand-ink">{citizen.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
            <span className="flex items-center gap-1"><IdCard size={13} /> {citizen.id} · {citizen.aadhaarMasked}</span>
            <span className="flex items-center gap-1"><MapPin size={13} /> {d.name_en}</span>
            <span className="flex items-center gap-1"><Users size={13} /> household {citizen.household}</span>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <span className="chip" style={{ background: "var(--green-soft)", color: "var(--green)" }}>{citizen.category.toUpperCase()}</span>
          {citizen.isBPL && <span className="chip" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>BPL</span>}
          {citizen.isStudent && <span className="chip border">Student</span>}
          {citizen.hasDisability && <span className="chip border">Disability on file</span>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <div className="mb-2 text-[13px] font-bold">Profile fields</div>
          {[
            ["Age / Gender", `${citizen.age} · ${citizen.gender}`],
            ["Occupation", citizen.occupation.replace("_", " ")],
            ["Annual income", `₹${citizen.annualIncome.toLocaleString("en-IN")}`],
            ["Land held", `${citizen.landHectares} ha`],
            ["Forest dweller", citizen.isForestDweller ? "Yes" : "No"],
            ["Phone", citizen.phone],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b py-1.5 text-[12px] last:border-0"><span className="text-muted">{k}</span><span className="font-semibold capitalize">{v}</span></div>
          ))}
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold"><FileCheck2 size={14} /> Documents ({documents.length})</div>
          {documents.map((doc) => (
            <div key={doc.id} className="flex justify-between border-b py-1.5 text-[12px] last:border-0">
              <span>{doc.label_en}</span><span className="text-muted">{new Date(doc.uploadedAt).toLocaleDateString("en-IN")}</span>
            </div>
          ))}
          {documents.length === 0 && <div className="text-[12px] text-muted">No documents on file.</div>}
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-[14px] font-bold">Applications ({applications.length})</h2>
        <div className="card divide-y p-0">
          {applications.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 text-[12px]">
              <div className="min-w-0 flex-1">
                <Link href={`/track/${a.id}`} className="font-semibold text-brand">{service(a.serviceId).name_en}</Link>
                <div className="text-muted">#{a.id} · submitted {new Date(a.submittedAt).toLocaleDateString("en-IN")}</div>
              </div>
              <StatusBadge status={a.status} lang="en" />
              <ChannelBadge channel={a.channel} lang="en" />
            </div>
          ))}
          {applications.length === 0 && <div className="p-6 text-center text-muted">No applications.</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-[14px] font-bold"><ScrollText size={14} /> Grievances ({grievances.length})</h2>
        <div className="card divide-y p-0">
          {grievances.map((g) => (
            <div key={g.id} className="flex items-center gap-3 p-3 text-[12px]">
              <div className="min-w-0 flex-1"><span className="font-semibold">{g.serviceName}</span> <span className="text-muted">#{g.id} · {g.delayDays}d overdue</span></div>
              <span className="chip border">{g.status}</span>
            </div>
          ))}
          {grievances.length === 0 && <div className="p-6 text-center text-muted">No grievances.</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[14px] font-bold">Notifications ({notifications.length})</h2>
        <div className="card divide-y p-0">
          {notifications.map((n) => (
            <div key={n.id} className="p-3 text-[12px]">{n.message_en} <span className="text-muted">· {new Date(n.createdAt).toLocaleDateString("en-IN")}</span></div>
          ))}
          {notifications.length === 0 && <div className="p-6 text-center text-muted">No notifications.</div>}
        </div>
      </section>
    </div>
  );
}
