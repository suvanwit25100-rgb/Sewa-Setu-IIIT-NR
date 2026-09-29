"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/types";

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  assisted: boolean;
  setAssisted: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [assisted, setAssistedState] = useState(false);

  useEffect(() => {
    try {
      const l = localStorage.getItem("ss_lang") as Lang | null;
      if (l) setLangState(l);
      setAssistedState(localStorage.getItem("ss_assisted") === "1");
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

  useEffect(() => {
    document.documentElement.classList.remove("lang-en", "lang-hi", "lang-cg");
    document.documentElement.classList.add(`lang-${lang}`);
  }, [lang]);

  return <Ctx.Provider value={{ lang, setLang, assisted, setAssisted }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within Providers");
  return c;
}
