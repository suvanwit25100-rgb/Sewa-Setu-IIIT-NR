"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "./providers";
import { GT_LANGUAGES } from "./google-translate";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { Landmark, HandHelping, BarChart3, User, Sun, Moon, Languages, ChevronDown, TriangleAlert, LogOut } from "lucide-react";

const MANUAL: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "cg", label: "छत्तीसगढ़ी" },
];

export function TopBar() {
  const { lang, setLang, assisted, setAssisted, theme, toggleTheme, translateLang, setTranslateLang } = useApp();
  const path = usePathname();
  const router = useRouter();
  const isOfficer = path.startsWith("/mis");
  const [langOpen, setLangOpen] = useState(false);

  // The login/landing page renders its own official-look-alike header.
  if (path === "/") return null;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const currentLabel =
    translateLang !== "en"
      ? GT_LANGUAGES.find((l) => l.code === translateLang)?.label ?? translateLang
      : MANUAL.find((l) => l.code === lang)?.label ?? "English";

  const pickManual = (code: Lang) => {
    setTranslateLang("en");
    setLang(code);
    setLangOpen(false);
  };
  const pickGoogle = (code: string) => {
    setTranslateLang(code);
    setLangOpen(false);
  };

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

          <span className="chip ml-1 hidden md:inline-flex" style={{ background: "var(--saffron-soft)", color: "var(--saffron)" }}>
            {t("prototype", lang)}
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <nav className="mr-1 hidden items-center rounded-xl border bg-surface-2 p-0.5 sm:flex">
              <Link href="/citizen" className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${!isOfficer ? "bg-brand text-white" : "text-muted"}`}>
                <User size={14} /> {t("citizenPortal", lang)}
              </Link>
              <Link href="/mis" className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${isOfficer ? "bg-brand text-white" : "text-muted"}`}>
                <BarChart3 size={14} /> {t("officerPortal", lang)}
              </Link>
            </nav>

            {/* Language: manual dict (en/hi/cg) + Google full-page MT for everything else */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1 rounded-xl border bg-surface-2 px-2.5 py-1.5 text-[12px] font-semibold text-muted"
              >
                <Languages size={14} />
                <span className="hidden max-w-[90px] truncate sm:inline">{currentLabel}</span>
                <ChevronDown size={12} />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="card absolute right-0 z-50 mt-1.5 max-h-96 w-64 overflow-y-auto p-1.5 shadow-xl">
                    <div className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-muted">App language</div>
                    {MANUAL.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => pickManual(l.code)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] ${lang === l.code && translateLang === "en" ? "bg-brand-soft font-bold text-brand-ink" : "hover:bg-surface-2"}`}
                      >
                        {l.label}
                      </button>
                    ))}
                    <div className="my-1.5 h-px bg-border" />
                    <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-muted">Translate full page (Google)</div>
                    {GT_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => pickGoogle(l.code)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] ${translateLang === l.code ? "bg-brand-soft font-bold text-brand-ink" : "hover:bg-surface-2"}`}
                      >
                        {l.label}
                      </button>
                    ))}
                    <div className="px-2 pt-1.5 text-[10px] text-muted">Google Translate covers content our own दict doesn&apos;t — names, MIS text, chat replies.</div>
                  </div>
                </>
              )}
            </div>

            {/* Theme */}
            <button
              onClick={toggleTheme}
              title="Toggle dark mode"
              className="grid h-9 w-9 place-items-center rounded-xl border bg-surface-2 text-muted"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Assisted mode */}
            <button
              onClick={() => setAssisted(!assisted)}
              title="Assisted mode (Kendra operator applies on behalf of a citizen)"
              className={`hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[12px] font-semibold sm:flex ${assisted ? "border-transparent" : "text-muted"}`}
              style={assisted ? { background: "var(--amber-soft)", color: "var(--amber)" } : undefined}
            >
              <HandHelping size={15} />
              <span className="hidden md:inline">{t("assistedMode", lang)}</span>
            </button>

            {/* Disaster mode entry */}
            <Link
              href="/disaster"
              title="Disaster relief mode"
              className="grid h-9 w-9 place-items-center rounded-xl border"
              style={{ background: "var(--red-soft)", color: "var(--red)" }}
            >
              <TriangleAlert size={16} />
            </Link>

            <button onClick={logout} title="Log out" className="grid h-9 w-9 place-items-center rounded-xl border text-muted">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* mobile persona switch */}
        <nav className="flex items-center gap-1 border-t bg-surface-2 px-4 py-1.5 sm:hidden">
          <Link href="/citizen" className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold ${!isOfficer ? "bg-brand text-white" : "text-muted"}`}>
            <User size={13} /> {t("citizenPortal", lang)}
          </Link>
          <Link href="/mis" className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold ${isOfficer ? "bg-brand text-white" : "text-muted"}`}>
            <BarChart3 size={13} /> {t("officerPortal", lang)}
          </Link>
        </nav>
      </div>

      {assisted && (
        <div className="border-b" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>
          <div className="mx-auto max-w-6xl px-4 py-1.5 text-[12px] font-semibold">
            🤝 {t("assistedOn", lang)}
          </div>
        </div>
      )}

      {!isOfficer && <CitizenSubNav path={path} lang={lang} />}
    </header>
  );
}

const CITIZEN_LINKS = (lang: Lang) => [
  { href: "/citizen", label: t("citizenPortal", lang) === "Citizen" ? "Home" : "होम" },
  { href: "/services", label: t("allServices", lang) },
  { href: "/profile", label: t("profile", lang) },
  { href: "/documents", label: t("documents", lang) },
  { href: "/grievances", label: t("grievances", lang) },
  { href: "/privacy", label: t("privacy", lang) },
];

function CitizenSubNav({ path, lang }: { path: string; lang: Lang }) {
  if (path === "/" || path.startsWith("/mis")) return null;
  const links = CITIZEN_LINKS(lang);
  return (
    <div className="border-b bg-surface">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-1.5">
        {links.map((l) => {
          const active = path === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[12px] font-semibold ${active ? "bg-brand-soft text-brand-ink" : "text-muted hover:bg-surface-2"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
