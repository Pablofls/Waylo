"use client";

import { useState } from "react";
import { Camera, Pencil } from "lucide-react";
import { ConfirmSheet } from "@/components/domain/ConfirmSheet";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";
import type { Report } from "@/types";

const sev = { leve: "Leve", moderada: "Moderada", grave: "Grave" } as const;

/** Bloque de detalle del reporte propio: aviso para completar o datos ya completados. */
export function ReportDetailExtras({ report }: { report: Report }) {
  const { completions, cancelledReports, cancelReport } = useSocial();
  const [confirm, setConfirm] = useState(false);
  const c = completions[report.id];
  const pending = report.pendingDetails && !c;

  if (cancelledReports.includes(report.id)) {
    return <div role="status" className="rounded-card border border-line bg-canvas p-4 text-sm font-semibold text-muted">Cancelaste este reporte. Ya no se muestra a la comunidad ni al municipio.</div>;
  }
  const cancellable = report.status !== "atendido";
  const cancelBlock = cancellable && (
    <>
      <Button variant="ghost" className="mt-2 !text-[#B02E2E]" onClick={() => setConfirm(true)}>Cancelar reporte</Button>
      <ConfirmSheet open={confirm} danger title="¿Cancelar este reporte?" text="Dejará de mostrarse a la comunidad y no se enviará al municipio." confirmLabel="Cancelar reporte" cancelLabel="Mantener" onConfirm={() => cancelReport(report.id)} onClose={() => setConfirm(false)} />
    </>
  );

  if (pending) {
    return (
      <div className="rounded-card border border-risk-orange bg-[#FCEBDD] p-4">
        <p className="font-bold">Falta completar este reporte</p>
        <p className="mt-0.5 text-sm text-muted">Agrega una foto y una descripción para que el municipio pueda atenderlo.</p>
        <Button href={`/reportes/${report.id}/completar`} className="mt-3" icon={<Pencil size={18} />}>Completar ahora</Button>
        {cancelBlock}
      </div>
    );
  }
  if (!c) return cancelBlock || null;
  return (
    <div className="rounded-card border border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={c.severity === "grave" ? "red" : c.severity === "moderada" ? "orange" : "yellow"}>{`Gravedad ${sev[c.severity].toLowerCase()}`}</Badge>
        {c.hasPhoto && <Badge><Camera size={12} />Con foto</Badge>}
      </div>
      <p className="mt-3 text-[15px]">{c.note}</p>
      <p className="mt-1 text-sm text-muted">{c.street}</p>
      <Button href={`/reportes/${report.id}/completar`} variant="outline" className="mt-3" icon={<Pencil size={18} />}>Editar detalles</Button>
      {cancelBlock}
    </div>
  );
}
