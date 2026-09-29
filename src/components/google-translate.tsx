"use client";

import { useEffect } from "react";

// Languages we offer through Google's full-page machine translation.
// (Chhattisgarhi has no ISO code in Google Translate — it stays on our
// own hand-written dictionary via the EN/HI/CG toggle instead.)
export const GT_LANGUAGES: { code: string; label: string }[] = [
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "or", label: "ଓଡ଼ିଆ (Odia)" },
  { code: "ur", label: "اردو (Urdu)" },
];

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: { translate?: { TranslateElement: new (opts: Record<string, unknown>, id: string) => unknown } };
  }
}

let scriptInjected = false;

/** Injects Google's page-translation widget once per app load (hidden UI —
 *  we drive it programmatically from our own language switcher). */
export function GoogleTranslate() {
  useEffect(() => {
    if (scriptInjected || typeof window === "undefined") return;
    scriptInjected = true;

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: GT_LANGUAGES.map((l) => l.code).join(","),
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    const s = document.createElement("script");
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return <div id="google_translate_element" />;
}

/** Sets the page's translated language by driving the hidden Google combo
 *  box — this is the standard technique for a custom-styled switcher.
 *  code === "en" restores the original (untranslated) page. */
export function setGoogleTranslateLanguage(code: string) {
  const apply = () => {
    const combo = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
    if (!combo) return false;
    combo.value = code === "en" ? "" : code;
    combo.dispatchEvent(new Event("change"));
    return true;
  };
  if (apply()) return;
  // Widget may not have mounted its <select> yet on first use — retry briefly.
  let tries = 0;
  const iv = setInterval(() => {
    tries++;
    if (apply() || tries > 20) clearInterval(iv);
  }, 200);
}

/** Clears Google's translate cookie so a hard "back to English" is real. */
export function resetGoogleTranslate() {
  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${location.hostname}`;
  setGoogleTranslateLanguage("en");
}
