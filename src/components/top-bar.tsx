"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./providers";
import { t, LANG_LABEL } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { Landmark, HandHelping, BarChart3, User } from "lucide-react";

export function TopBar() {
  const { lang, setLang, assisted, setAssisted } = useApp();
  const path = usePathname();
  const isOfficer = path.startsWith("/officer") || path.startsWith("/mis");

  return (
    <header className="sticky top-0 z-40">
      <div className="tricolour h-1 w-full" />
      <div className="border-b bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">
              <Landmark size={18} />
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-bold text-brand-ink">{t("appName", lang)}</span>
              <span className="hidden text-[11px] text-muted sm:block">{t("tagline", lang)}</span>
            </span>
          </Link>

          <span className="chip ml-1 hidden bg-saffron-soft text-saffron md:inline-flex" style={{ background: "var(--saffron-soft)", color: "var(--saffron)" }}>
            {t("prototype", lang)}
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Persona switch */}
            <nav className="mr-1 hidden items-center rounded-xl border bg-surface-2 p-0.5 sm:flex">
              <Link href="/citizen" className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${!isOfficer ? "bg-brand text-white" : "text-muted"}`}>
                <User size={14} /> {t("citizenPortal", lang)}
              </Link>
              <Link href="/mis" className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${isOfficer ? "bg-brand text-white" : "text-muted"}`}>
                <BarChart3 size={14} /> {t("officerPortal", lang)}
              </Link>
            </nav>

            {/* Language */}
            <div className="flex items-center rounded-xl border bg-surface-2 p-0.5">
              {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-lg px-2 py-1.5 text-[12px] font-semibold ${lang === l ? "bg-white text-brand-ink shadow-sm" : "text-muted"} ${l !== "en" ? "font-deva" : ""}`}
                  style={l !== "en" ? { fontFamily: "var(--font-deva)" } : undefined}
                >
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>

            {/* Assisted mode */}
            <button
              onClick={() => setAssisted(!assisted)}
              title="Assisted mode (operator applies on behalf of a citizen)"
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[12px] font-semibold ${assisted ? "border-transparent bg-amber-soft text-amber" : "text-muted"}`}
              style={assisted ? { background: "var(--amber-soft)", color: "var(--amber)" } : undefined}
            >
              <HandHelping size={15} />
              <span className="hidden md:inline">{t("assistedMode", lang)}</span>
            </button>
          </div>
        </div>
      </div>

      {assisted && (
        <div className="border-b" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>
          <div className="mx-auto max-w-6xl px-4 py-1.5 text-[12px] font-semibold">
            🤝 {t("assistedOn", lang)}
          </div>
        </div>
      )}
    </header>
  );
}
