"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DEPARTMENTS, SERVICES, DISTRICTS } from "@/lib/reference";
import {
  Landmark, Languages, Share2, MessageCircle, Rss, ShieldCheck,
  Fingerprint, ArrowRight, Sparkles, Layers, Smartphone, Workflow, Database,
  Network, FileText, ClipboardList, MessageSquareWarning, CheckCircle2,
} from "lucide-react";

type Tab = "citizen" | "sewasetu" | "govt" | "admin";
type Method = "password" | "otp";

const TABS: { id: Tab; hi: string; en: string; role: "citizen" | "officer" }[] = [
  { id: "citizen", hi: "नागरिक लॉगिन", en: "Citizen Login", role: "citizen" },
  { id: "sewasetu", hi: "सेवा सेतु लॉगिन", en: "Sewa Setu Login", role: "citizen" },
  { id: "govt", hi: "शासकीय", en: "Government", role: "officer" },
  { id: "admin", hi: "एडमिन लॉगिन", en: "Admin Login", role: "officer" },
];

const FOCUS = [
  { icon: Sparkles, hi: "सक्रिय एवं व्यक्तिगत सेवाएं", en: "Proactive & personalized", desc_hi: "पात्रता इंजन उन लाभों को दिखाता है जो आपने कभी नहीं लिए।", desc_en: "Eligibility engine surfaces benefits you never claimed." },
  { icon: Layers, hi: "एकीकृत यात्रा", en: "Unified journeys", desc_hi: "एक प्रोफ़ाइल, एक यात्रा, हर प्रासंगिक सेवा।", desc_en: "One profile, one journey, every relevant service." },
  { icon: Smartphone, hi: "मोबाइल-फर्स्ट एवं समावेशी", en: "Mobile-first & inclusive", desc_hi: "आवाज़, छत्तीसगढ़ी, सहायता-प्राप्त मोड।", desc_en: "Voice, Chhattisgarhi, assisted mode." },
  { icon: Workflow, hi: "स्मार्ट वर्कफ़्लो व ट्रैकिंग", en: "Smart workflow & tracking", desc_hi: "SLA उलटी गिनती, विलंब जोखिम, स्पष्ट स्पष्टीकरण।", desc_en: "SLA countdown, delay risk, plain-language explainers." },
  { icon: Database, hi: "डेटा-संचालित शासन", en: "Data-driven governance", desc_hi: "बॉटलनेक पहचान + AI मूल कारण विश्लेषण।", desc_en: "Bottleneck detection + AI root-cause analysis." },
  { icon: Network, hi: "अंतर-विभागीय समन्वय", en: "Interoperability", desc_hi: "विभागों में स्वतः सत्यापन; दस्तावेज़ पुनः उपयोग।", desc_en: "Auto-verify across departments; document reuse." },
];

function LoginLanding() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next");

  const [lang, setLang] = useState<"hi" | "en">("hi");
  const [tab, setTab] = useState<Tab>("citizen");
  const [method, setMethod] = useState<Method>("password");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [fontScale, setFontScale] = useState(1);
  const [appCount, setAppCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/mis").then((r) => r.json()).then((d) => setAppCount(d.totals?.total ?? null)).catch(() => {});
  }, []);

  const activeTab = TABS.find((t) => t.id === tab)!;

  const login = async (role: "citizen" | "officer", method_: string) => {
    setBusy(true);
    setNote(null);
    await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ role }) });
    setBusy(false);
    const dest = nextPath && nextPath.startsWith("/") ? nextPath : role === "citizen" ? "/citizen" : "/mis";
    router.push(dest);
  };

  const sendOtp = () => {
    if (!username.trim()) { setNote(lang === "hi" ? "पहले यूज़रनेम/मोबाइल भरें" : "Enter username/mobile first"); return; }
    setOtpSent(true);
    setNote(lang === "hi" ? "डेमो OTP: 1234" : "Demo OTP: 1234");
  };

  const submit = () => {
    login(activeTab.role, method);
  };

  const t = (hi: string, en: string) => (lang === "hi" ? hi : en);

  return (
    <div style={{ zoom: fontScale }} className="min-h-screen bg-white text-[#1a1a1a]">
      {/* Accessibility / utility bar */}
      <div className="flex items-center justify-between px-4 py-1.5 text-white" style={{ background: "#b3122a" }}>
        <div className="flex items-center gap-3 text-[12px] font-semibold">
          <button onClick={() => setLang(lang === "hi" ? "en" : "hi")} className="hover:underline">{lang === "hi" ? "हिन्दी" : "English"}</button>
          <span className="opacity-50">|</span>
          <span className="flex items-center gap-1 opacity-90"><Languages size={13} /> Translate</span>
          <span className="opacity-50">|</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setFontScale((s) => Math.min(1.15, s + 0.05))} className="rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-bold">A+</button>
            <button onClick={() => setFontScale((s) => Math.max(0.9, s - 0.05))} className="rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-bold">A-</button>
            <button onClick={() => setFontScale(1)} className="rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-bold">A</button>
          </div>
        </div>
        <div className="flex items-center gap-2.5 opacity-90">
          <Share2 size={14} />
          <MessageCircle size={14} />
          <Rss size={14} />
        </div>
      </div>

      {/* Header */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg,#0f9d58,#0d4ea6)" }}>
            <Landmark size={26} />
          </span>
          <div>
            <div className="text-[30px] font-extrabold leading-none" style={{ color: "#0d4ea6" }}>सेवा <span style={{ color: "#0f9d58" }}>सेतु</span></div>
            <div className="text-[12px] font-semibold text-muted">जनता के द्वार, डिजिटल सरकार</div>
          </div>
          <span className="ml-2 chip" style={{ background: "#fff1e0", color: "#ea7a0c" }}>Prototype</span>
        </div>
        <div className="flex items-center gap-2 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full border-2" style={{ borderColor: "#0d4ea6", background: "#eef3fb", color: "#0d4ea6" }}>
            <Landmark size={22} />
          </span>
          <div className="text-left text-[12px] leading-tight text-muted">
            <div className="font-bold" style={{ color: "#0d4ea6" }}>{t("छत्तीसगढ़ शासन", "Govt. of Chhattisgarh")}</div>
            <div>{t("(संकल्पना प्रोटोटाइप)", "(concept prototype)")}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="text-white" style={{ background: "#0d4ea6" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 text-[13px] font-semibold">
          <a href="#top" className="border-b-2 border-white px-3 py-2.5">{t("होम", "Home")}</a>
          <a href="#stats" className="px-3 py-2.5 opacity-90 hover:opacity-100">{t("सांख्यिकी", "Statistics")}</a>
          <a href="#about" className="px-3 py-2.5 opacity-90 hover:opacity-100">{t("हमारे बारे में", "About Us")}</a>
          <a href="#services-info" className="px-3 py-2.5 opacity-90 hover:opacity-100">{t("सेवाओं की जानकारी", "Service Info")}</a>
          <a href="#districts" className="px-3 py-2.5 opacity-90 hover:opacity-100">{t("जिलों की सूची", "District List")}</a>
          <a href="#login-panel" className="ml-auto rounded-lg bg-white px-4 py-1.5 font-bold" style={{ color: "#0d4ea6" }}>{t("लॉगिन करें", "Login")}</a>
        </div>
      </nav>

      {/* Hero + login */}
      <div id="top" className="relative overflow-hidden" style={{ background: "linear-gradient(180deg,#eef3fb,#ffffff)" }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <h1 className="text-[46px] font-extrabold leading-tight" style={{ color: "#0d4ea6" }}>{t("सेवा सेतु", "Sewa Setu")}</h1>
            <p className="mt-2 max-w-md text-[16px] font-semibold" style={{ color: "#0f9d58" }}>
              {t("प्रदेश के नागरिकों को नागरिक सेवाएं समय-सीमा में सरलतापूर्वक उपलब्ध", "Citizen services delivered within guaranteed timelines, made simple")}
            </p>
            <p className="mt-3 max-w-md text-[13px] text-muted">
              {t("यह असली सेवा सेतु पोर्टल का एक हैकाथॉन प्रोटोटाइप है — लॉगिन के बाद आपको अगली-पीढ़ी का AI-संचालित अनुभव मिलेगा।", "This is a hackathon redesign prototype of the real Sewa Setu portal — log in to see the next-generation AI-powered experience behind it.")}
            </p>

            <div id="stats" className="mt-6 grid grid-cols-2 gap-3">
              <StatCard label={t("सेवा केंद्र (डेमो)", "Service centres (demo)")} value="16,623" icon={<Landmark size={20} />} />
              <StatCard label={t("सेवाएं", "Services")} value={SERVICES.length} icon={<ClipboardList size={20} />} />
              <StatCard label={t("विभाग", "Departments")} value={DEPARTMENTS.length} icon={<Network size={20} />} />
              <StatCard label={t("कुल आवेदन (डेमो)", "Total applications (demo)")} value={appCount ?? "…"} icon={<FileText size={20} />} />
            </div>
            <div className="mt-1.5 text-[11px] text-muted">{t("* ऊपर दिए आंकड़े इस प्रोटोटाइप के डेमो डेटा से हैं, वास्तविक सरकारी आंकड़े नहीं।", "* Figures above are this prototype's demo data, not real government statistics.")}</div>
          </div>

          {/* Login panel */}
          <div id="login-panel" className="card scroll-mt-24 p-0 shadow-xl">
            <div className="flex border-b text-[12px] font-bold">
              {TABS.map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => { setTab(tb.id); setNote(null); }}
                  className="flex-1 px-2 py-3"
                  style={tab === tb.id ? { color: "#0d4ea6", borderBottom: "3px solid #0d4ea6", background: "#eef3fb" } : { color: "#8a94a6" }}
                >
                  {t(tb.hi, tb.en)}
                </button>
              ))}
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex overflow-hidden rounded-lg border text-[12px] font-bold">
                  <button onClick={() => setMethod("password")} className="px-3 py-1.5" style={method === "password" ? { background: "#0d4ea6", color: "white" } : { color: "#0d4ea6" }}>{t("यूज़रनेम व पासवर्ड", "Username & password")}</button>
                  <button onClick={() => setMethod("otp")} className="px-3 py-1.5" style={method === "otp" ? { background: "#0d4ea6", color: "white" } : { color: "#0d4ea6" }}>{t("ओटीपी", "OTP")}</button>
                </div>
                <div className="flex overflow-hidden rounded-lg border text-[11px] font-bold">
                  <button onClick={() => setLang("hi")} className="px-2 py-1" style={lang === "hi" ? { background: "#0d4ea6", color: "white" } : { color: "#0d4ea6" }}>हिंदी</button>
                  <button onClick={() => setLang("en")} className="px-2 py-1" style={lang === "en" ? { background: "#0d4ea6", color: "white" } : { color: "#0d4ea6" }}>EN</button>
                </div>
              </div>

              <button
                onClick={() => login(activeTab.role, "digilocker")}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-[13px] font-bold"
                style={{ borderColor: "#0d4ea6", color: "#0d4ea6" }}
              >
                <ShieldCheck size={16} /> {t("DigiLocker से लॉगिन करें (डेमो)", "Sign in with DigiLocker (demo)")}
              </button>

              {method === "password" ? (
                <div className="space-y-3">
                  <Field label={t("उपयोगकर्ता पहचान", "Username")}>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="UserName" className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none" />
                  </Field>
                  <Field label={t("पासवर्ड", "Password")}>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none" />
                  </Field>
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label={t("मोबाइल / यूज़रनेम", "Mobile / username")}>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="+91 …" className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none" />
                  </Field>
                  <div className="flex items-center gap-2">
                    <button onClick={sendOtp} className="rounded-lg px-3 py-2 text-[12px] font-bold text-white" style={{ background: "#0f9d58" }}>{t("ओटीपी भेजें", "Send OTP")}</button>
                    <div className="flex gap-1.5">
                      {otp.map((d, i) => (
                        <input
                          key={i}
                          value={d}
                          disabled={!otpSent}
                          maxLength={1}
                          onChange={(e) => setOtp((arr) => arr.map((x, j) => (j === i ? e.target.value.replace(/\D/g, "") : x)))}
                          className="h-9 w-9 rounded-lg border text-center text-[13px] outline-none disabled:bg-surface-2"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {note && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                  <Sparkles size={13} /> {note}
                </div>
              )}

              <button
                onClick={submit}
                disabled={busy}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white disabled:opacity-60"
                style={{ background: "#0f9d58" }}
              >
                <Fingerprint size={16} /> {busy ? "…" : t("लॉगिन", "Login")}
              </button>

              <div className="mt-3 flex justify-between text-[11px] font-semibold" style={{ color: "#0d4ea6" }}>
                <button onClick={() => setNote(t("डेमो प्रोटोटाइप — कोई वास्तविक पासवर्ड रीसेट नहीं।", "Demo prototype — no real password reset."))}>{t("पासवर्ड बदलें?", "Change password?")}</button>
                <button onClick={() => setNote(t("डेमो प्रोटोटाइप — कोई वास्तविक खाता नहीं।", "Demo prototype — no real account lookup."))}>{t("यूज़रनेम भूल गए?", "Forgot username?")}</button>
              </div>
            </div>

            <button
              onClick={() => login("citizen", "register")}
              className="flex w-full items-center justify-center gap-1.5 rounded-b-2xl py-3 text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(90deg,#0d4ea6,#0f9d58)" }}
            >
              {t("नया पंजीयन करने हेतु क्लिक करें", "Click for new registration")} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Notice ticker */}
      <div className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold" style={{ background: "#fdeaea", color: "#b3122a" }}>
        <MessageSquareWarning size={14} className="shrink-0" />
        {t("सूचना: यह एक हैकाथॉन अवधारणा प्रोटोटाइप है — कोई वास्तविक आवेदन संसाधित नहीं होता।", "Notice: this is a hackathon concept prototype — no real application is ever processed.")}
      </div>

      {/* Quick actions */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4">
        <QuickAction href="/services" color="#0d4ea6" icon={<ClipboardList size={18} />} label={t("ऑनलाइन सेवा हेतु आवेदन करें", "Apply for a service")} />
        <QuickAction href="/citizen" color="#0f9d58" icon={<FileText size={18} />} label={t("आवेदन की स्थिति", "Application status")} />
        <QuickAction href="/mis" color="#ea7a0c" icon={<Database size={18} />} label={t("शासकीय डैशबोर्ड", "Government dashboard")} />
        <QuickAction href="/grievances" color="#7c3aed" icon={<MessageSquareWarning size={18} />} label={t("शिकायत पंजी", "Grievance register")} />
      </div>

      {/* About / focus areas */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-[20px] font-extrabold" style={{ color: "#0d4ea6" }}>{t("यह प्रोटोटाइप क्या करता है", "What this prototype does")}</h2>
        <p className="mt-1 max-w-2xl text-[13px] text-muted">
          {t("छत्तीसगढ़ हैकाथॉन समस्या-कथन 2 के लिए — नागरिक सरलता और सरकारी संचालन को केंद्र में रखते हुए।", "Built for Chhattisgarh's hackathon Problem Statement 2 — citizen simplicity and government operability at the centre.")}
        </p>
        <div id="services-info" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FOCUS.map((f) => (
            <div key={f.en} className="card p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "#eef3fb", color: "#0d4ea6" }}><f.icon size={19} /></span>
              <h3 className="mt-2 text-[14px] font-bold">{t(f.hi, f.en)}</h3>
              <p className="mt-1 text-[12px] text-muted">{t(f.desc_hi, f.desc_en)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* District list */}
      <section id="districts" className="mx-auto max-w-6xl px-4 pb-10">
        <h2 className="mb-3 text-[16px] font-bold" style={{ color: "#0d4ea6" }}>{t("जिलों की सूची (डेमो)", "District list (demo)")}</h2>
        <div className="flex flex-wrap gap-1.5">
          {DISTRICTS.map((d) => (
            <span key={d.id} className="chip border" style={{ color: "var(--muted)" }}>{lang === "hi" ? d.name_hi : d.name_en}</span>
          ))}
        </div>
      </section>

      <footer id="contact" className="border-t py-6 text-center text-[12px] text-muted">
        <div className="flex items-center justify-center gap-1.5 font-semibold" style={{ color: "#0d4ea6" }}><CheckCircle2 size={14} /> Sewa Setu Next — Chhattisgarh Digital Governance Hackathon Prototype</div>
        <div className="mt-1">{t("यह एक अनाधिकारिक अवधारणा प्रोटोटाइप है।", "This is an unofficial concept prototype.")}</div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-2.5 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: "#eef3fb", color: "#0d4ea6" }}>{icon}</span>
      <div className="min-w-0">
        <div className="truncate text-[17px] font-extrabold" style={{ color: "#0d4ea6" }}>{value}</div>
        <div className="truncate text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[12px] font-semibold text-muted">{label}</div>
      {children}
    </div>
  );
}

function QuickAction({ href, color, icon, label }: { href: string; color: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center text-[12px] font-bold text-white" style={{ background: color }}>
      {icon} {label}
    </Link>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">Loading…</div>}>
      <LoginLanding />
    </Suspense>
  );
}
