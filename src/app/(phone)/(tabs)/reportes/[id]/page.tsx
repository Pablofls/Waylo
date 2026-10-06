import { notFound } from "next/navigation";
import { MapPin, Users, Pencil } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { MapView } from "@/components/map/MapView";
import { ReportMarkers } from "@/components/map/ReportMarkers";
import { ReportStatusTimeline } from "@/components/domain/ReportStatusTimeline";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getMyReport } from "@/lib/data";
import { categoryById, statusLabels } from "@/lib/report-categories";
import { formatDateTime } from "@/lib/format";

const tone = { enviado: "neutral", en_revision: "yellow", atendido: "brand" } as const;

export default async function ReporteDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getMyReport(id);
  if (!report) notFound();
  const cat = categoryById(report.category);

  return (
    <>
      <ScreenHeader title={cat.label} subtitle={`Reporte ${report.id.replace("r_", "#")}`} back="/reportes" />
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-[170px]">
          <MapView center={report.coordinates} zoom={15.5}>
            <ReportMarkers reports={[report]} />
          </MapView>
        </div>
        <div className="space-y-5 p-4">
          <div>
            <Badge tone={tone[report.status]}>{statusLabels[report.status]}</Badge>
            <p className="mt-3 flex items-start gap-2 text-[15px] font-semibold"><MapPin size={18} className="mt-0.5 shrink-0" />{report.street}, {report.colonia}</p>
            <p className="mt-1 text-sm text-muted">Enviado el {formatDateTime(report.createdAt)}</p>
            {report.note && <p className="mt-3 rounded-lg bg-canvas p-3 text-sm">{report.note}</p>}
            <p className="mt-3 flex items-center gap-2 text-sm text-muted"><Users size={16} />{report.confirmations} personas lo confirmaron</p>
          </div>
          {report.pendingDetails && (
            <div className="rounded-card border border-risk-orange bg-[#FCEBDD] p-4">
              <p className="font-bold">Falta completar este reporte</p>
              <p className="mt-0.5 text-sm text-muted">Agrega una foto y una descripción para que el municipio pueda atenderlo.</p>
              <Button className="mt-3" icon={<Pencil size={18} />}>Completar ahora</Button>
            </div>
          )}
          <div>
            <h2 className="mb-4 text-lg font-bold">Seguimiento</h2>
            <ReportStatusTimeline report={report} />
          </div>
        </div>
      </div>
    </>
  );
}
