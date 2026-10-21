"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";
import { categoryById } from "@/lib/report-categories";
import type { Report, ReportCompletion } from "@/types";

const severities: { v: ReportCompletion["severity"]; l: string }[] = [
  { v: "leve", l: "Leve" },
  { v: "moderada", l: "Moderada" },
  { v: "grave", l: "Grave" },
];

export function CompleteReport({ report }: { report: Report | null }) {
  const router = useRouter();
  const { completeReport } = useSocial();
  const done = report?.completion;
  const [severity, setSeverity] = useState<ReportCompletion["severity"]>(done?.severity ?? "moderada");
  const [note, setNote] = useState(done?.note ?? report?.note ?? "");
  const [street, setStreet] = useState(done?.street ?? report?.street ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [keepPhoto, setKeepPhoto] = useState(Boolean(done?.hasPhoto));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!report) return (<><ScreenHeader title="Completar reporte" back="/reportes" /><EmptyState title="No encontramos este reporte" text="Puede que haya sido eliminado." /></>);
  const cat = categoryById(report.category);

  const save = async () => {
    if (note.trim().length < 10) return setError("Describe lo que viste en al menos 10 caracteres.");
    if (street.trim().length < 3) return setError("Indica la calle o referencia.");
    setError("");
    setBusy(true);
    try {
      await completeReport(report.id, { severity, note: note.trim(), street: street.trim() }, photo ?? (!keepPhoto && done?.hasPhoto ? "quitar" : null));
      router.push(`/reportes/${report.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar el reporte.");
      setBusy(false);
    }
  };

  return (
    <>
      <ScreenHeader title="Completar reporte" subtitle={cat.label} back={`/reportes/${report.id}`} />
      <div className="flex-1 space-y-5 overflow-y-auto bg-white px-4 pb-6 pt-3">
        <p className="text-sm text-muted">Con más detalles el municipio puede atender tu reporte más rápido. <a href="/ayuda/reglas-reportes" className="font-semibold text-brand-600 underline">Reglas de reporte</a></p>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Gravedad</p>
          <div className="flex gap-2">{severities.map((s) => <Chip key={s.v} selected={severity === s.v} onClick={() => setSeverity(s.v)}>{s.l}</Chip>)}</div>
        </div>

        <div>
          <label htmlFor="note" className="mb-1.5 block text-sm font-semibold">¿Qué viste?</label>
          <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={300} placeholder="Bache de unos 40 cm en el carril derecho, difícil de ver de noche" className="w-full rounded-xl border border-line px-4 py-3 text-base placeholder:text-[#8A929C] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" />
          <p className="mt-1 text-right text-xs text-muted">{note.length}/300</p>
        </div>

        <Input label="Calle o referencia" value={street} onChange={(e) => setStreet(e.target.value)} hint="Corrige la ubicación si no es exacta." />

        <div>
          <p className="mb-1.5 text-sm font-semibold">Foto</p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { setPhoto(e.target.files?.[0] ?? null); setKeepPhoto(false); }} />
          {photo || keepPhoto ? (
            <div className="flex min-h-[56px] items-center gap-3 rounded-xl border border-line px-4">
              <Camera size={20} className="text-brand-600" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{photo ? photo.name : "Foto guardada"}</span>
              <button aria-label="Quitar foto" onClick={() => { setPhoto(null); setKeepPhoto(false); }} className="-mr-3 flex h-11 w-11 items-center justify-center"><X size={18} /></button>
            </div>
          ) : (
            <Button variant="outline" full icon={<Camera size={20} />} onClick={() => fileRef.current?.click()}>Agregar foto</Button>
          )}
        </div>

        {error && <p role="alert" className="text-sm font-semibold text-risk-red">{error}</p>}
      </div>
      <div className="pb-safe border-t border-line bg-white px-4 pt-3">
        <Button full size="lg" disabled={busy} onClick={() => void save()}>{busy ? "Guardando…" : "Guardar y enviar al municipio"}</Button>
        <div className="h-3" />
      </div>
    </>
  );
}
