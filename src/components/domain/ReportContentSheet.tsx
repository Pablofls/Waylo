"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

export interface Reason {
  /** Clave del catálogo de motivos de denuncia. */
  clave: string;
  label: string;
}

/** Motivos del catálogo `cat_motivo_denuncia`. */
export const REPORT_REASONS: Reason[] = [
  { clave: "falso_o_repetido", label: "Información falsa o repetida" },
  { clave: "inapropiado", label: "Contenido inapropiado" },
  { clave: "acoso", label: "Acoso o trato ofensivo" },
  { clave: "spam", label: "Spam" },
  { clave: "otro", label: "Otro" },
];

interface Props {
  open: boolean;
  title: string;
  reasons?: Reason[];
  /** Envía la denuncia; si lanza, se muestra el mensaje. */
  onSend: (clave: string) => Promise<void>;
  onClose: () => void;
}

/** Hoja para avisar de contenido inapropiado (reportes, comentarios). */
export function ReportContentSheet({ open, title, reasons = REPORT_REASONS, onSend, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;
  const close = () => { setReason(""); setSent(false); setError(""); onClose(); };
  const send = async () => {
    setBusy(true);
    setError("");
    try {
      await onSend(reason);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos enviar el aviso.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Cerrar" className="absolute inset-0 bg-ink/50" onClick={close} />
      <div role="dialog" aria-modal="true" aria-label={title} className="pb-safe relative rounded-t-3xl bg-white p-5">
        {sent ? (
          <>
            <h2 className="text-xl font-bold">Gracias por avisarnos</h2>
            <p className="mt-1 text-sm text-muted">Lo revisaremos y retiraremos el contenido si incumple las reglas.</p>
            <Button full className="mt-4" onClick={close}>Listo</Button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted">¿Qué problema tiene?</p>
            <div className="mt-3 flex flex-wrap gap-2">{reasons.map((r) => <Chip key={r.clave} selected={reason === r.clave} onClick={() => setReason(r.clave)}>{r.label}</Chip>)}</div>
            {error && <p role="alert" className="mt-3 text-sm font-semibold text-risk-red">{error}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3"><Button variant="outline" onClick={close}>Cancelar</Button><Button disabled={!reason || busy} onClick={() => void send()}>Enviar</Button></div>
          </>
        )}
      </div>
    </div>
  );
}
