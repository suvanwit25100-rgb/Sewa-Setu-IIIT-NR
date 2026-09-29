"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { service, DISTRICTS, DEPARTMENTS } from "@/lib/reference";
import { Stat, SectionHead, RegionTag, StatusBadge, ChannelBadge } from "@/components/ui";
import { daysBetween } from "@/lib/labels";
import type { Application } from "@/lib/types";
import type { MisData, GovernanceData } from "@/lib/db";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { AlertTriangle, MapPin, ArrowRight, Megaphone, TrendingDown, Bot, Send, Sparkles } from "lucide-react";

const CH_COLORS: Record<string, string> = { web: "#1d4ed8", whatsapp: "#0f9d58", assisted: "#d97706", voice: "#7c3aed" };
const REGION_COLOR: Record<string, string> = { plains: "#1d4ed8", tribal: "#0f9d58", lwe: "#dc2626" };

export default function MisPage() {
  const [mis, setMis] = useState<MisData | null>(null);
  const [gov, setGov] = useState<GovernanceData | null>(null);
  const [queue, setQueue] = useState<Application[]>([]);
  const [heatDistrict, setHeatDistrict] = useState("all");
  const [heatDept, setHeatDept] = useState("all");

  const load = useCallback(() => {
    fetch("/api/mis").then((r) => r.json()).then(setMis);
    fetch("/api/governance").then((r) => r.json()).then(setGov);
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

  if (!mis || !gov) return <div className="py-20 text-center text-muted">Loading MIS…</div>;

  const heatRows = gov.heatmap.filter((h) => (heatDistrict === "all" || h.district === heatDistrict) && (heatDept === "all" || h.department === heatDept));

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-brand-ink">Sewa Setu Governance Intelligence</h1>
          <span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>live</span>
        </div>
        <p className="text-[13px] text-muted">Not just numbers — what&apos;s going wrong, why, and where to act. DEMO DATA.</p>
      </div>

      {/* Today's snapshot */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Today's applications" value={gov.today.submitted || mis.totals.total} sub="last 90 days total shown" />
        <Stat label="Completed" value={gov.today.completed} tone="green" />
        <Stat label="Pending" value={gov.today.pending} tone="amber" />
        <Stat label="Delayed" value={gov.today.delayed} tone="red" />
        <Stat label="At risk" value={gov.today.atRisk} tone="amber" />
      </div>

      {/* Top bottleneck + pipeline funnel */}
      <section className="card p-5">
        <SectionHead
          title={<span className="flex items-center gap-2"><TrendingDown size={17} style={{ color: "var(--red)" }} /> Top bottleneck</span>}
          sub={`${gov.bottleneck.stage} — ${gov.bottleneck.pctOfDelayed}% drop-off at this stage`}
        />
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {gov.pipeline.map((p, i) => (
            <div key={p.stage} className="flex items-center gap-1">
              <div className={`min-w-[110px] rounded-xl border p-3 text-center ${p.stage === gov.bottleneck.stage ? "" : ""}`} style={p.stage === gov.bottleneck.stage ? { borderColor: "var(--red)", background: "var(--red-soft)" } : undefined}>
                <div className="text-lg font-extrabold" style={{ color: p.stage === gov.bottleneck.stage ? "var(--red)" : "var(--brand-ink)" }}>{p.count.toLocaleString("en-IN")}</div>
                <div className="text-[11px] text-muted">{p.stage}</div>
              </div>
              {i < gov.pipeline.length - 1 && <ArrowRight size={16} className="shrink-0 text-muted" />}
            </div>
          ))}
        </div>
      </section>

      {/* AI Root Cause Analysis */}
      <section className="card p-5">
        <SectionHead title={<span className="flex items-center gap-2"><Sparkles size={17} style={{ color: "var(--purple)" }} /> AI Root Cause Analysis</span>} sub="Decision-support suggestion — not an automatic government decision" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            {gov.rootCause.map((r) => (
              <div key={r.reason} className="flex items-center gap-2">
                <div className="w-32 shrink-0 text-[12px] text-muted">{r.reason}</div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: "var(--purple)" }} />
                </div>
                <div className="w-9 shrink-0 text-right text-[12px] font-bold">{r.pct}%</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-3 text-[13px]" style={{ background: "var(--purple-soft)", color: "var(--purple)" }}>
            <b>AI INSIGHT:</b> {gov.insight_en}
          </div>
        </div>
      </section>

      {/* Camp alerts */}
      <section className="card p-5" style={{ background: "linear-gradient(135deg,var(--amber-soft),var(--surface))" }}>
        <SectionHead title={<span className="flex items-center gap-2" style={{ color: "var(--amber)" }}><Megaphone size={18} /> Recommended government action</span>} sub="Auto-generated from uptake + breach signals" />
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

      {/* District / department heatmap with filters */}
      <section>
        <SectionHead title="District × service heatmap" sub="DEMO DATA — filter by district or department" />
        <div className="mb-2 flex flex-wrap gap-2">
          <select value={heatDistrict} onChange={(e) => setHeatDistrict(e.target.value)} className="rounded-lg border bg-surface px-2.5 py-1.5 text-[12px]">
            <option value="all">All districts</option>
            {DISTRICTS.map((d) => <option key={d.id} value={d.name_en}>{d.name_en}</option>)}
          </select>
          <select value={heatDept} onChange={(e) => setHeatDept(e.target.value)} className="rounded-lg border bg-surface px-2.5 py-1.5 text-[12px]">
            <option value="all">All departments</option>
            {DEPARTMENTS.map((d) => <option key={d.id} value={d.name_en}>{d.name_en}</option>)}
          </select>
        </div>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b text-left text-muted">
                <th className="px-3 py-2 font-semibold">District</th>
                <th className="px-3 py-2 font-semibold">Service</th>
                <th className="px-3 py-2 font-semibold">Dept</th>
                <th className="px-3 py-2 font-semibold">Apps</th>
                <th className="px-3 py-2 font-semibold">Avg days</th>
                <th className="px-3 py-2 font-semibold">SLA violation</th>
              </tr>
            </thead>
            <tbody>
              {heatRows.slice(0, 30).map((h, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-2">{h.district} <RegionTag region={h.region as "plains" | "tribal" | "lwe"} /></td>
                  <td className="px-3 py-2">{h.service}</td>
                  <td className="px-3 py-2 text-muted">{h.department}</td>
                  <td className="px-3 py-2">{h.applications}</td>
                  <td className="px-3 py-2">{h.avgDays}d</td>
                  <td className="px-3 py-2">
                    <span className="rounded px-2 py-0.5 font-semibold" style={{ background: `color-mix(in srgb, var(--red) ${Math.min(h.slaViolationPct, 60)}%, var(--green-soft))`, color: h.slaViolationPct > 30 ? "white" : "var(--green)" }}>
                      {h.slaViolationPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {heatRows.length === 0 && <div className="p-6 text-center text-muted">No rows match this filter.</div>}
        </div>
      </section>

      {/* Government Copilot */}
      <GovernmentCopilot />

      {/* Triage queue */}
      <section>
        <SectionHead title={<span className="flex items-center gap-2"><AlertTriangle size={17} style={{ color: "var(--amber)" }} /> Officer triage queue</span>} sub="Most urgent first — one-click to advance the workflow" />
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
                    <StatusBadge status={a.status} lang="en" />
                    <ChannelBadge channel={a.channel} lang="en" />
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

const COPILOT_SUGGESTIONS = ["Why are applications delayed?", "Which districts have the worst SLA breach?", "Which department has the most load?", "What's the channel mix?"];

function GovernmentCopilot() {
  const [msgs, setMsgs] = useState<{ role: "q" | "a"; text: string; citing?: string[] }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { role: "q", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/copilot", { method: "POST", body: JSON.stringify({ question: q }) });
      const d = await r.json();
      setMsgs((m) => [...m, { role: "a", text: d.answer, citing: d.citing }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <SectionHead title={<span className="flex items-center gap-2"><Bot size={17} style={{ color: "var(--brand)" }} /> Government Copilot</span>} sub="Ask about delays, districts, departments, services — always cites the data it used" />
      <div className="card p-4">
        <div className="mb-3 max-h-72 space-y-2.5 overflow-y-auto">
          {msgs.length === 0 && (
            <div className="flex flex-wrap gap-1.5">
              {COPILOT_SUGGESTIONS.map((s) => <button key={s} onClick={() => ask(s)} className="chip border text-muted hover:text-brand">{s}</button>)}
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "q" ? "text-right" : ""}>
              {m.role === "q" ? (
                <div className="inline-block max-w-[85%] rounded-xl bg-brand px-3 py-2 text-[13px] text-white">{m.text}</div>
              ) : (
                <div className="inline-block max-w-[95%] whitespace-pre-line rounded-xl bg-surface-2 px-3 py-2 text-left text-[13px]">
                  {m.text}
                  {m.citing && (
                    <div className="mt-2 flex flex-wrap gap-1 border-t pt-1.5">
                      {m.citing.map((c) => <span key={c} className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>📊 {c}</span>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="text-[12px] text-muted">…</div>}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder="Ask the Government Copilot…"
            className="flex-1 rounded-xl border bg-surface-2 px-3 py-2 text-[13px] outline-none"
          />
          <button onClick={() => ask(input)} className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white"><Send size={16} /></button>
        </div>
      </div>
    </section>
  );
}
