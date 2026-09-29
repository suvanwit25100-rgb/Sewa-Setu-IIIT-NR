"use client";

import Link from "next/link";
import { useApp } from "./providers";
import { service } from "@/lib/reference";
import type { Journey as JourneyT } from "@/lib/types";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

export function Journey({ journey }: { journey: JourneyT }) {
  const { lang } = useApp();
  return (
    <div className="card animate-in space-y-4 p-5">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-brand">Government Journey Engine</div>
        <h3 className="text-[18px] font-extrabold text-brand-ink">{lang === "en" ? journey.title_en : journey.title_hi}</h3>
      </div>

      <ol className="space-y-2">
        {journey.steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[13px]">
            {s.done ? <CheckCircle2 size={16} style={{ color: "var(--green)" }} /> : <Circle size={16} className="text-muted opacity-50" />}
            <span className={s.done ? "" : "text-muted"}>{lang === "en" ? s.label_en : s.label_hi}</span>
          </li>
        ))}
      </ol>

      <div>
        <div className="mb-2 text-[12px] font-bold text-muted">Services in this journey</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {journey.services.map((js) => {
            const s = service(js.serviceId);
            return (
              <Link key={js.serviceId} href={`/apply/${js.serviceId}`} className="flex items-center justify-between rounded-xl border p-3 text-[13px] hover:bg-surface-2">
                <span>
                  <span className="block font-semibold">{lang === "en" ? s.name_en : s.name_hi}</span>
                  <span className="text-[11px] text-muted">{lang === "en" ? js.reason_en : js.reason_hi}</span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-brand" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
