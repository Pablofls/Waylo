import { notFound } from "next/navigation";
import { MapPin, Users } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { MapView } from "@/components/map/MapView";
import { ReportMarkers } from "@/components/map/ReportMarkers";
import { ReportDetailExtras } from "@/components/screens/ReportDetailExtras";
import { ReportStatusTimeline } from "@/components/domain/ReportStatusTimeline";
import { Badge } from "@/components/ui/Badge";
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
      <ScreenHeader title={cat.label} subtitle={`Reporte #${report.id.slice(0, 8)}`} back="/reportes" />
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
            {report.hasPhoto && /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/reportes/${report.id}/foto`} alt="Foto del reporte" className="mt-3 max-h-64 w-full rounded-xl object-cover" />}
            <p className="mt-3 flex items-center gap-2 text-sm text-muted"><Users size={16} />{report.confirmations} personas lo confirmaron</p>
          </div>
          <ReportDetailExtras report={report} />
          <div>
            <h2 className="mb-4 text-lg font-bold">Seguimiento</h2>
            <ReportStatusTimeline report={report} />
          </div>
        </div>
      </div>
    </>
  );
}
