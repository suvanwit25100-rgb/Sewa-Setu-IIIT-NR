"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusBadge, ChannelBadge, Stat, RegionTag } from "@/components/ui";
import { service, district } from "@/lib/reference";
import type { Application, AuditLogEntry, CitizenProfile } from "@/lib/types";
import {
  Database, Users, FileText, ScrollText, BookOpen, Search, Server, Cpu, HardDrive,
  ShieldCheck, ArrowRight,
} from "lucide-react";

type Tab = "overview" | "citizens" | "applications" | "audit" | "api";
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview (backend)", icon: <Server size={14} /> },
  { id: "citizens", label: "Citizens", icon: <Users size={14} /> },
  { id: "applications", label: "Applications", icon: <FileText size={14} /> },
  { id: "audit", label: "Audit log", icon: <ScrollText size={14} /> },
  { id: "api", label: "API reference", icon: <BookOpen size={14} /> },
];

async function api<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const d = await r.json();
  if (!d.success) throw new Error(d.error?.message ?? "request failed");
  return d.data as T;
}

function AdminInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "overview";
  const setTab = (t: Tab) => router.push(`/admin?tab=${t}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-brand-ink"><ShieldCheck size={22} /> Admin Portal</h1>
        <p className="text-[13px] text-muted">System oversight — inspect real citizen data, applications, and the audit trail. Not the citizen or officer experience.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-bold ${tab === t.id ? "bg-brand text-white" : "text-muted"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "citizens" && <Citizens />}
      {tab === "applications" && <ApplicationsTab />}
      {tab === "audit" && <AuditTab />}
      {tab === "api" && <ApiReference />}
    </div>
  );
}

// ---------------------------------------------------------------------------
interface Stats {
  tables: Record<string, number>;
  catalog: { services: number; departments: number; districts: number };
  dbPath: string; aiProvider: string; environment: string;
  applications: { total: number; pending: number; breached: number; delivered: number; breachRate: number };
  governance: { bottleneck: { stage: string; pctOfDelayed: number }; todayAtRisk: number; todayDelayed: number };
}

function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { api<Stats>("/api/admin/stats").then(setStats).catch(() => {}); }, []);
  if (!stats) return <div className="py-16 text-center text-muted">Loading backend status…</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "var(--green-soft)", color: "var(--green)" }}><Database size={18} /></span>
          <div>
            <div className="text-[13px] font-bold">Database</div>
            <div className="text-[11px] text-muted">SQLite (better-sqlite3, file-based)</div>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "var(--purple-soft)", color: "var(--purple)" }}><Cpu size={18} /></span>
          <div>
            <div className="text-[13px] font-bold">AI Provider</div>
            <div className="text-[11px] text-muted uppercase">{stats.aiProvider} mode</div>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}><HardDrive size={18} /></span>
          <div>
            <div className="text-[13px] font-bold">Environment</div>
            <div className="text-[11px] text-muted">{stats.environment}</div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-[14px] font-bold">Database tables</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(stats.tables).map(([k, v]) => (
            <div key={k} className="card p-3 text-center">
              <div className="text-xl font-extrabold text-brand-ink">{v}</div>
              <div className="text-[11px] capitalize text-muted">{k}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[14px] font-bold">Reference catalog (static, not DB tables)</h2>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Services" value={stats.catalog.services} />
          <Stat label="Departments" value={stats.catalog.departments} />
          <Stat label="Districts" value={stats.catalog.districts} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[14px] font-bold">Live application health</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Total" value={stats.applications.total} />
          <Stat label="Pending" value={stats.applications.pending} tone="amber" />
          <Stat label="Breached SLA" value={stats.applications.breached} tone="red" />
          <Stat label="Breach rate" value={`${stats.applications.breachRate}%`} tone={stats.applications.breachRate > 20 ? "red" : "green"} />
        </div>
        <div className="mt-2 text-[12px] text-muted">Top bottleneck: <b>{stats.governance.bottleneck.stage}</b> ({stats.governance.bottleneck.pctOfDelayed}% drop-off) · {stats.governance.todayAtRisk} at risk · {stats.governance.todayDelayed} delayed</div>
      </section>

      <div className="card p-3 text-[11px] text-muted">DB file: <code>{stats.dbPath}</code></div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Citizens() {
  const [rows, setRows] = useState<CitizenProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = new URLSearchParams({ search, limit: "30" });
    api<{ rows: CitizenProfile[]; pagination: { total: number } }>(`/api/admin/citizens?${q}`)
      .then((d) => { setRows(d.rows); setTotal(d.pagination.total); }).catch(() => {});
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="card flex items-center gap-2 px-3 py-2">
        <Search size={15} className="text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or id…" className="flex-1 bg-transparent text-[13px] outline-none" />
        <span className="text-[11px] text-muted">{total} citizens</span>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b text-left text-muted">
              <th className="px-3 py-2 font-semibold">ID</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">District</th>
              <th className="px-3 py-2 font-semibold">Category</th>
              <th className="px-3 py-2 font-semibold">Occupation</th>
              <th className="px-3 py-2 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-surface-2">
                <td className="px-3 py-2 font-mono text-[11px]">{c.id}</td>
                <td className="px-3 py-2 font-semibold">{c.name}</td>
                <td className="px-3 py-2">{district(c.districtId).name_en}</td>
                <td className="px-3 py-2 uppercase">{c.category}</td>
                <td className="px-3 py-2 capitalize">{c.occupation.replace("_", " ")}</td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/citizens/${c.id}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand">Inspect <ArrowRight size={12} /></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function ApplicationsTab() {
  const [rows, setRows] = useState<Application[]>([]);
  const [status, setStatus] = useState("all");

  useEffect(() => { fetch("/api/applications").then((r) => r.json()).then((d) => setRows(d.applications)); }, []);
  const filtered = status === "all" ? rows : rows.filter((a) => a.status === status);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border bg-surface px-2.5 py-1.5 text-[12px]">
          <option value="all">All statuses</option>
          {["submitted", "auto_verifying", "in_review", "approved", "delivered", "rejected"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-[11px] text-muted">{filtered.length} of {rows.length}</span>
      </div>
      <div className="card max-h-[70vh] overflow-y-auto p-0">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-surface">
            <tr className="border-b text-left text-muted">
              <th className="px-3 py-2 font-semibold">ID</th>
              <th className="px-3 py-2 font-semibold">Citizen</th>
              <th className="px-3 py-2 font-semibold">Service</th>
              <th className="px-3 py-2 font-semibold">District</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Channel</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((a) => (
              <tr key={a.id} className="border-b last:border-0 hover:bg-surface-2">
                <td className="px-3 py-2 font-mono text-[11px]"><Link href={`/track/${a.id}`} className="text-brand">{a.id}</Link></td>
                <td className="px-3 py-2">
                  <Link href={`/admin/citizens/${a.citizenId}`} className="text-brand hover:underline">{a.citizenName}</Link>
                </td>
                <td className="px-3 py-2">{service(a.serviceId).name_en}</td>
                <td className="px-3 py-2">{district(a.districtId).name_en}</td>
                <td className="px-3 py-2"><StatusBadge status={a.status} lang="en" /></td>
                <td className="px-3 py-2"><ChannelBadge channel={a.channel} lang="en" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function AuditTab() {
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  useEffect(() => { api<{ rows: AuditLogEntry[] }>("/api/admin/audit?limit=200").then((d) => setRows(d.rows)).catch(() => {}); }, []);

  return (
    <div className="card divide-y p-0">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-3 p-3 text-[12px]">
          <span className="chip border shrink-0" style={{ color: "var(--muted)" }}>{r.actorRole}</span>
          <div className="min-w-0 flex-1">
            <span className="font-semibold">{r.action}</span> <span className="text-muted">on {r.entityType} #{r.entityId}</span>
          </div>
          <span className="shrink-0 text-[11px] text-muted">{new Date(r.createdAt).toLocaleString("en-IN")}</span>
        </div>
      ))}
      {rows.length === 0 && <div className="p-8 text-center text-muted">No audited actions yet — log in, submit an application, or file a grievance to generate entries.</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
interface Endpoint { method: string; path: string; auth: string; purpose: string }

function ApiReference() {
  const [rows, setRows] = useState<Endpoint[]>([]);
  useEffect(() => { api<{ endpoints: Endpoint[] }>("/api/admin/stats").then((d) => setRows(d.endpoints)).catch(() => {}); }, []);

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b text-left text-muted">
            <th className="px-3 py-2 font-semibold">Method</th>
            <th className="px-3 py-2 font-semibold">Path</th>
            <th className="px-3 py-2 font-semibold">Auth</th>
            <th className="px-3 py-2 font-semibold">Purpose</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="px-3 py-2"><span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>{e.method}</span></td>
              <td className="px-3 py-2 font-mono text-[11px]">{e.path}</td>
              <td className="px-3 py-2 text-muted">{e.auth}</td>
              <td className="px-3 py-2">{e.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">Loading…</div>}>
      <AdminInner />
    </Suspense>
  );
}
