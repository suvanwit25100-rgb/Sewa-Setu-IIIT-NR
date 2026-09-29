"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/providers";
import { SectionHead } from "@/components/ui";
import { Upload, FileCheck2, Sparkles, ArrowRight, Loader2 } from "lucide-react";

interface Doc {
  id: string; type: string; label_en: string; fileName: string;
  fields: Record<string, string>; uploadedAt: string; reusableIn: string[];
}

export default function DocumentsPage() {
  useApp();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [justAdded, setJustAdded] = useState<Doc | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => { fetch("/api/documents?citizenId=demo").then((r) => r.json()).then((d) => setDocs(d.documents)); };
  useEffect(load, []);

  const onFile = async (file: File) => {
    setUploading(true);
    setJustAdded(null);
    // Pipeline: UPLOAD -> OCR -> CLASSIFICATION -> FIELD EXTRACTION -> VAULT
    await new Promise((r) => setTimeout(r, 900)); // simulate OCR latency
    const res = await fetch("/api/documents", { method: "POST", body: JSON.stringify({ citizenId: "demo", fileName: file.name }) });
    const d = await res.json();
    setUploading(false);
    setJustAdded({ ...d.document, reusableIn: d.reusableIn });
    load();
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-ink">Document Intelligence</h1>
        <p className="text-[13px] text-muted">Upload once — OCR classifies it, extracts fields, and makes it reusable everywhere it&apos;s needed.</p>
      </div>

      {/* Upload */}
      <div
        className="card flex flex-col items-center justify-center gap-2 border-2 border-dashed p-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
      >
        {uploading ? (
          <>
            <Loader2 size={28} className="animate-spin text-brand" />
            <div className="text-[13px] font-semibold">Running OCR → classification → field extraction…</div>
          </>
        ) : (
          <>
            <Upload size={28} className="text-brand" />
            <div className="text-[14px] font-bold">Drag a document here, or</div>
            <button onClick={() => inputRef.current?.click()} className="rounded-xl bg-brand px-4 py-2 text-[13px] font-bold text-white">Choose file</button>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <div className="text-[11px] text-muted">Mock OCR for the prototype — try a filename like &quot;income_certificate.pdf&quot; or any file.</div>
          </>
        )}
      </div>

      {/* Just extracted */}
      {justAdded && (
        <div className="card animate-in p-5" style={{ borderColor: "color-mix(in srgb, var(--green) 30%, white)" }}>
          <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "var(--green)" }}>
            <Sparkles size={16} /> Extracted: {justAdded.label_en}
          </div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {Object.entries(justAdded.fields).map(([k, v]) => (
              <div key={k} className="flex justify-between rounded-lg bg-surface-2 px-2.5 py-1.5 text-[12px]">
                <span className="text-muted">{k}</span><span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg px-3 py-2 text-[13px] font-semibold" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
            ✓ This document can now be reused for {justAdded.reusableIn.length} service{justAdded.reusableIn.length === 1 ? "" : "s"}.
          </div>
        </div>
      )}

      {/* Vault */}
      <section>
        <SectionHead title={<span className="flex items-center gap-2"><FileCheck2 size={17} /> Document vault</span>} sub={`${docs.length} documents on file`} />
        <div className="grid gap-3 sm:grid-cols-2">
          {docs.map((doc) => (
            <div key={doc.id} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold">{doc.label_en}</span>
                <span className="chip" style={{ background: "var(--green-soft)", color: "var(--green)" }}>✓ verified</span>
              </div>
              <div className="mt-1 text-[11px] text-muted">{doc.fileName} • {new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
              <div className="mt-2 space-y-1">
                {Object.entries(doc.fields).slice(0, 3).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[12px]"><span className="text-muted">{k}</span><span>{v}</span></div>
                ))}
              </div>
              {doc.reusableIn.length > 0 && (
                <div className="mt-3 border-t pt-2">
                  <div className="mb-1 text-[11px] font-semibold text-muted">Reuse graph — used by:</div>
                  <div className="flex flex-wrap gap-1">
                    {doc.reusableIn.map((s) => (
                      <span key={s} className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}><ArrowRight size={10} /> {s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {docs.length === 0 && <div className="py-10 text-center text-muted">No documents yet — upload one above.</div>}
        </div>
      </section>
    </div>
  );
}
