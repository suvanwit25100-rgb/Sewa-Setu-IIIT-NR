"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/types";
import { setGoogleTranslateLanguage, resetGoogleTranslate } from "./google-translate";

type Theme = "light" | "dark";

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  assisted: boolean;
  setAssisted: (v: boolean) => void;
  theme: Theme;
  toggleTheme: () => void;
  /** "en" = original, "hi" = our dictionary, or any Google code = full-page MT */
  translateLang: string;
  setTranslateLang: (code: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [assisted, setAssistedState] = useState(false);
  const [theme, setThemeState] = useState<Theme>("light");
  const [translateLang, setTranslateLangState] = useState("en");

  useEffect(() => {
    try {
      const l = localStorage.getItem("ss_lang") as Lang | null;
      if (l) setLangState(l);
      setAssistedState(localStorage.getItem("ss_assisted") === "1");
      const th = (localStorage.getItem("ss_theme") as Theme | null) ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      setThemeState(th);
      const tl = localStorage.getItem("ss_translate") ?? "en";
      setTranslateLangState(tl);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("ss_lang", l); } catch {}
  };
  const setAssisted = (v: boolean) => {
    setAssistedState(v);
    try { localStorage.setItem("ss_assisted", v ? "1" : "0"); } catch {}
  };
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setThemeState(next);
    try { localStorage.setItem("ss_theme", next); } catch {}
  };

  const setTranslateLang = (code: string) => {
    setTranslateLangState(code);
    try { localStorage.setItem("ss_translate", code); } catch {}
    if (code === "en") resetGoogleTranslate();
    else setGoogleTranslateLanguage(code);
    // Google Translate handles arbitrary page copy; our own dictionary
    // still governs app chrome (buttons, labels) via `lang`.
    if (code !== "en") setLang("hi");
  };

  useEffect(() => {
    document.documentElement.classList.remove("lang-en", "lang-hi", "lang-cg");
    document.documentElement.classList.add(`lang-${lang}`);
  }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Re-apply the Google Translate selection once the widget script has
  // loaded (it mounts asynchronously and needs a live <select> to drive).
  useEffect(() => {
    if (translateLang !== "en") {
      const t = setTimeout(() => setGoogleTranslateLanguage(translateLang), 1200);
      return () => clearTimeout(t);
    }
  }, [translateLang]);

  return (
    <Ctx.Provider value={{ lang, setLang, assisted, setAssisted, theme, toggleTheme, translateLang, setTranslateLang }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within Providers");
  return c;
}
