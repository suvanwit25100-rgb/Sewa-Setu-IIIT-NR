"use client";

import { useState } from "react";
import Link from "next/link";
import { LAND_TRANSFER_QUESTIONS } from "@/lib/reference";
import { useApp } from "./providers";
import { CheckCircle2, ArrowRight } from "lucide-react";

const REQUIRED_DOCS = ["Legal Heir Certificate / registered deed", "Death certificate (if inherited)", "Land record (B-1/RoR)", "Aadhaar"];

export function LandNavigator({ compact = false }: { compact?: boolean }) {
  const { lang } = useApp();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [i, setI] = useState(0);
  const [input, setInput] = useState("");
  const done = i >= LAND_TRANSFER_QUESTIONS.length;
  const q = LAND_TRANSFER_QUESTIONS[i];

  const answer = (val: string) => {
    setAnswers((a) => ({ ...a, [q.id]: val }));
    setInput("");
    setI((n) => n + 1);
  };

  const missingDoc = answers.deed === "no" ? "Legal Heir Certificate" : "Registered deed copy";

  return (
    <div className={compact ? "space-y-2" : "card space-y-4 p-5"}>
      {!compact && (
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-brand">Land / Revenue Navigator</div>
          <h3 className="text-[16px] font-bold">Transfer family land</h3>
        </div>
      )}

      {!done && (
        <div className="animate-in space-y-2">
          <div className="text-[13px] font-semibold">{lang === "en" ? q.q_en : q.q_hi}</div>
          {q.options ? (
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => (
                <button key={o.value} onClick={() => answer(o.value)} className="chip border px-3 py-1.5 text-[12px] hover:bg-brand-soft">
                  {lang === "en" ? o.label_en : o.label_hi}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && input.trim() && answer(input.trim())}
                placeholder={lang === "en" ? "Type your answer…" : "उत्तर लिखें…"}
                className="flex-1 rounded-xl border bg-surface-2 px-3 py-2 text-[13px] outline-none"
              />
              <button disabled={!input.trim()} onClick={() => answer(input.trim())} className="rounded-xl bg-brand px-3 py-2 text-[13px] font-bold text-white disabled:opacity-40">
                →
              </button>
            </div>
          )}
          <div className="text-[11px] text-muted">Question {i + 1} of {LAND_TRANSFER_QUESTIONS.length}</div>
        </div>
      )}

      {done && (
        <div className="animate-in space-y-3">
          <div className="text-[13px] font-bold" style={{ color: "var(--green)" }}>✓ Land Service Journey built</div>
          <ol className="space-y-1.5 text-[13px]">
            {[
              "Ownership understood",
              "Applicable service identified: Land Mutation (Naamantaran)",
              "Eligibility checked",
              `Required documents: ${REQUIRED_DOCS.join(", ")}`,
              `Missing: ${missingDoc}`,
              "Application preparation ready",
            ].map((s, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: "var(--green)" }} /> {s}
              </li>
            ))}
          </ol>
          <Link href="/apply/land_mutation" className="flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-[13px] font-bold text-white">
            Start Land Mutation application <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
