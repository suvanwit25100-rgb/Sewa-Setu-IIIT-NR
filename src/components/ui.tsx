import type { AppStatus, Channel, Lang, Region } from "@/lib/types";
import { STATUS_LABEL, CHANNEL_LABEL, statusText, channelText } from "@/lib/labels";
import { dept } from "@/lib/reference";

export function StatusBadge({ status, lang }: { status: AppStatus; lang: Lang }) {
  const c = STATUS_LABEL[status].color;
  return (
    <span className="chip" style={{ background: `color-mix(in srgb, ${c} 14%, white)`, color: c }}>
      <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {statusText(status, lang)}
    </span>
  );
}

export function ChannelBadge({ channel, lang }: { channel: Channel; lang: Lang }) {
  return (
    <span className="chip border" style={{ color: "var(--muted)" }}>
      {CHANNEL_LABEL[channel].icon} {channelText(channel, lang)}
    </span>
  );
}

const REGION_STYLE: Record<Region, { label: string; bg: string; fg: string }> = {
  plains: { label: "Plains", bg: "var(--brand-soft)", fg: "var(--brand)" },
  tribal: { label: "Tribal", bg: "var(--green-soft)", fg: "var(--green)" },
  lwe: { label: "LWE / remote", bg: "var(--red-soft)", fg: "var(--red)" },
};

export function RegionTag({ region }: { region: Region }) {
  const s = REGION_STYLE[region];
  return <span className="chip" style={{ background: s.bg, color: s.fg }}>{s.label}</span>;
}

export function DeptBadge({ id }: { id: string }) {
  const d = dept(id);
  return (
    <span className="chip" style={{ background: `color-mix(in srgb, ${d.color} 12%, white)`, color: d.color }}>
      {d.name_en}
    </span>
  );
}

export function Stat({ label, value, sub, tone = "brand" }: { label: string; value: string | number; sub?: string; tone?: "brand" | "green" | "red" | "amber" }) {
  const color = { brand: "var(--brand)", green: "var(--green)", red: "var(--red)", amber: "var(--amber)" }[tone];
  return (
    <div className="card p-4">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-3xl font-extrabold" style={{ color }}>{value}</div>
      {sub && <div className="mt-0.5 text-[12px] text-muted">{sub}</div>}
    </div>
  );
}

export function SectionHead({ title, sub, right }: { title: React.ReactNode; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[17px] font-bold text-brand-ink">{title}</h2>
        {sub && <p className="text-[13px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
