"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

interface Props {
  open: boolean;
  title: string;
  reasons: string[];
  onClose: () => void;
}

/** Hoja para avisar de contenido inapropiado (reportes, comentarios). */
export function ReportContentSheet({ open, title, reasons, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  if (!open) return null;
  const close = () => { setReason(""); setSent(false); onClose(); };
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
            <div className="mt-3 flex flex-wrap gap-2">{reasons.map((r) => <Chip key={r} selected={reason === r} onClick={() => setReason(r)}>{r}</Chip>)}</div>
            <div className="mt-4 grid grid-cols-2 gap-3"><Button variant="outline" onClick={close}>Cancelar</Button><Button disabled={!reason} onClick={() => setSent(true)}>Enviar</Button></div>
          </>
        )}
      </div>
    </div>
  );
}
