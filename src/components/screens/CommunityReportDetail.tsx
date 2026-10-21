"use client";

import { useState } from "react";
import { Flag, MapPin, ThumbsUp, Users, CheckCircle2 } from "lucide-react";
import { ReportContentSheet } from "@/components/domain/ReportContentSheet";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { MapView } from "@/components/map/MapView";
import { ReportMarkers } from "@/components/map/ReportMarkers";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";
import { categoryById, statusLabels } from "@/lib/report-categories";
import { formatDateTime } from "@/lib/format";
import type { Report } from "@/types";

const tone = { enviado: "neutral", en_revision: "yellow", atendido: "brand" } as const;

export function CommunityReportDetail({ report, mine }: { report: Report | null; mine: boolean }) {
  const { confirmations, confirmReport } = useSocial();
  const [flagging, setFlagging] = useState(false);
  if (!report) return (<><ScreenHeader title="Reporte" back="/comunidad" /><EmptyState title="No encontramos este reporte" text="Puede que ya haya sido eliminado." /></>);

  const cat = categoryById(report.category);
  const vote = confirmations[report.id];
  const count = report.confirmations + (vote === "sigue" ? 1 : 0);

  return (
    <>
      <ScreenHeader title={cat.label} subtitle={mine ? "Tu reporte" : "Reporte de la comunidad"} back={mine ? `/reportes/${report.id}` : "/comunidad"} />
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="relative h-[190px]"><MapView center={report.coordinates} zoom={15.5}><ReportMarkers reports={[report]} /></MapView></div>
        <div className="space-y-4 p-4">
          <Badge tone={tone[report.status]}>{statusLabels[report.status]}</Badge>
          <p className="flex items-start gap-2 text-[15px] font-semibold"><MapPin size={18} className="mt-0.5 shrink-0" />{report.street}{report.colonia ? `, ${report.colonia}` : ""}</p>
          <p className="text-sm text-muted">Reportado el {formatDateTime(report.createdAt)}</p>
          <p className="flex items-center gap-2 text-sm text-muted"><Users size={16} />{count} personas lo confirmaron</p>

          {!mine && (
            <div className="rounded-card border border-line p-4">
              <p className="font-bold">¿Sigue ahí?</p>
              <p className="mt-0.5 text-sm text-muted">Tu respuesta ayuda a mantener el mapa al día.</p>
              {vote ? (
                <p role="status" className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand-700"><CheckCircle2 size={18} />{vote === "sigue" ? "Gracias, confirmaste que sigue ahí." : "Gracias, avisaremos que ya no está."}
                  <button onClick={() => confirmReport(report.id, vote === "sigue" ? "resuelto" : "sigue")} className="ml-auto min-h-[44px] text-sm font-semibold text-brand-600">Cambiar</button></p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button icon={<ThumbsUp size={18} />} onClick={() => confirmReport(report.id, "sigue")}>Sigue ahí</Button>
                  <Button variant="outline" onClick={() => confirmReport(report.id, "resuelto")}>Ya no está</Button>
                </div>
              )}
            </div>
          )}
          {!mine && <button onClick={() => setFlagging(true)} className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-muted"><Flag size={16} />Reportar este contenido</button>}
          <a href="/ayuda/reglas-reportes" className="block text-sm font-semibold text-brand-600 underline">Reglas de reporte</a>
        </div>
      </div>
      <ReportContentSheet open={flagging} title="Reportar contenido" reasons={["Información falsa", "Ya está atendido", "Repetido", "Ofensivo", "Otro"]} onClose={() => setFlagging(false)} />
    </>
  );
}
