"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { service } from "@/lib/reference";
import { Stat, SectionHead, RegionTag, StatusBadge, ChannelBadge } from "@/components/ui";
import { daysBetween } from "@/lib/labels";
import type { Application } from "@/lib/types";
import type { MisData } from "@/lib/db";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { AlertTriangle, MapPin, ArrowRight, Megaphone } from "lucide-react";

const CH_COLORS: Record<string, string> = { web: "#1d4ed8", whatsapp: "#0f9d58", assisted: "#d97706", voice: "#7c3aed" };
const REGION_COLOR: Record<string, string> = { plains: "#1d4ed8", tribal: "#0f9d58", lwe: "#dc2626" };

export default function MisPage() {
  const { lang } = useApp();
  const [mis, setMis] = useState<MisData | null>(null);
  const [queue, setQueue] = useState<Application[]>([]);

  const load = useCallback(() => {
    fetch("/api/mis").then((r) => r.json()).then(setMis);
    fetch("/api/applications").then((r) => r.json()).then((d: { applications: Application[] }) => {
      const pending = d.applications
        .filter((a) => !["delivered", "approved", "rejected"].includes(a.status))
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
      setQueue(pending.slice(0, 10));
    });
  }, []);
  useEffect(load, [load]);

  const advance = async (id: string) => {
    await fetch(`/api/applications/${id}`, { method: "POST" });
    load();
  };

  if (!mis) return <div className="py-20 text-center text-muted">Loading MIS…</div>;

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-brand-ink">Collector / Department MIS</h1>
          <span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>live</span>
        </div>
        <p className="text-[13px] text-muted">Actionable governance — where service delivery is lagging and where to send outreach.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Applications" value={mis.totals.total.toLocaleString("en-IN")} sub="last 90 days" />
        <Stat label="In pipeline" value={mis.totals.pending} sub="awaiting action" tone="amber" />
        <Stat label="SLA breached" value={mis.totals.breached} sub="penalty exposure" tone="red" />
        <Stat label="Breach rate" value={`${mis.totals.breachRate}%`} sub="of all applications" tone={mis.totals.breachRate > 20 ? "red" : "green"} />
      </div>

      {/* Camp alerts — the actionable bit */}
      <section className="card p-5" style={{ background: "linear-gradient(135deg,var(--amber-soft),white)" }}>
        <SectionHead
          title={<span className="flex items-center gap-2" style={{ color: "var(--amber)" }}><Megaphone size={18} /> Recommended government action</span>}
          sub="Auto-generated from uptake + breach signals"
        />
        <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
          {mis.campAlerts.map((c) => (
            <div key={c.district} className="rounded-xl border bg-surface p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[14px] font-bold"><MapPin size={14} /> {c.district}</span>
                <RegionTag region={c.region as "plains" | "tribal" | "lwe"} />
              </div>
              <p className="mt-1.5 text-[12px] text-muted">{c.reason}</p>
              <div className="mt-2 chip" style={{ background: "var(--red-soft)", color: "var(--red)" }}>{c.metric}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="mb-2 text-[14px] font-bold">Applications trend (14 days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mis.trend} margin={{ left: -18, right: 6, top: 6 }}>
              <defs>
                <linearGradient id="gSub" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.35} /><stop offset="100%" stopColor="#1d4ed8" stopOpacity={0} /></linearGradient>
                <linearGradient id="gDel" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f9d58" stopOpacity={0.35} /><stop offset="100%" stopColor="#0f9d58" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9aa5b5" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9aa5b5" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)" }} />
              <Area type="monotone" dataKey="submitted" stroke="#1d4ed8" fill="url(#gSub)" strokeWidth={2} name="Submitted" />
              <Area type="monotone" dataKey="delivered" stroke="#0f9d58" fill="url(#gDel)" strokeWidth={2} name="Delivered" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-1 flex gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#1d4ed8" }} /> Submitted</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#0f9d58" }} /> Delivered</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 text-[14px] font-bold">Channel mix</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={mis.byChannel} dataKey="count" nameKey="channel" innerRadius={45} outerRadius={72} paddingAngle={2}>
                {mis.byChannel.map((c) => <Cell key={c.channel} fill={CH_COLORS[c.channel]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            {mis.byChannel.map((c) => (
              <span key={c.channel} className="flex items-center gap-1 text-muted"><i className="h-2 w-2 rounded-full" style={{ background: CH_COLORS[c.channel] }} /> {c.channel} ({c.count})</span>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted">Assisted + voice = last-mile reach.</p>
        </div>
      </div>

      {/* District breach + top services */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-2 text-[14px] font-bold">SLA breach rate by district</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mis.byDistrict.slice(0, 10)} layout="vertical" margin={{ left: 24, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9aa5b5" unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={78} stroke="#9aa5b5" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v}%`, "breach"]} />
              <Bar dataKey="breachRate" radius={[0, 5, 5, 0]}>
                {mis.byDistrict.slice(0, 10).map((d) => <Cell key={d.id} fill={REGION_COLOR[d.region]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-3 text-[11px] text-muted">
            {Object.entries(REGION_COLOR).map(([r, c]) => <span key={r} className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: c }} /> {r}</span>)}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-2 text-[14px] font-bold">Top services by volume</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mis.byService} layout="vertical" margin={{ left: 30, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9aa5b5" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} stroke="#9aa5b5" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="total" fill="#1d4ed8" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Triage queue */}
      <section>
        <SectionHead
          title={<span className="flex items-center gap-2"><AlertTriangle size={17} style={{ color: "var(--amber)" }} /> Officer triage queue</span>}
          sub="Most urgent first — one-click to advance the workflow"
        />
        <div className="card divide-y p-0">
          {queue.map((a) => {
            const s = service(a.serviceId);
            const left = daysBetween(new Date().toISOString(), a.dueAt);
            const breached = left < 0;
            return (
              <div key={a.id} className="flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-bold">{s.name_en}</span>
                    <StatusBadge status={a.status} lang={lang} />
                    <ChannelBadge channel={a.channel} lang={lang} />
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted">#{a.id} • {a.citizenName} • {a.districtId}</div>
                </div>
                <div className="text-right">
                  {breached
                    ? <span className="chip" style={{ background: "var(--red-soft)", color: "var(--red)" }}>{-left}d overdue</span>
                    : <span className="text-[12px] font-bold text-brand-ink">{left}d left</span>}
                </div>
                <button onClick={() => advance(a.id)} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-bold text-white">
                  Advance <ArrowRight size={13} />
                </button>
              </div>
            );
          })}
          {queue.length === 0 && <div className="p-8 text-center text-muted">Queue clear 🎉</div>}
        </div>
      </section>

      <div className="text-center">
        <Link href="/citizen" className="text-[13px] font-semibold text-brand">← Back to citizen portal</Link>
      </div>
    </div>
  );
}
