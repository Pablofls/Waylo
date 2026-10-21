import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { MapView } from "@/components/map/MapView";
import { RouteLine } from "@/components/map/RouteLine";
import { StatBlock } from "@/components/domain/StatBlock";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { Button } from "@/components/ui/Button";
import { getRideSummary, getRiskPoints } from "@/lib/data";
import { MONTERREY_CENTER } from "@/lib/map/geo";
import { formatDuration } from "@/lib/format";

export default async function ResumenPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const summary = id ? await getRideSummary(id) : null;
  if (!summary) notFound();
  const { ride, free, pendingReports } = summary;
  const risk = await getRiskPoints();

  return (
    <>
      <div className="relative h-[260px] shrink-0">
        <MapView center={ride.coordinates[0] ?? MONTERREY_CENTER} zoom={13.5}>
          {ride.coordinates.length > 1 && <RouteLine id="done" coordinates={ride.coordinates} risk={risk} fit fitPadding={{ top: 50, bottom: 40, left: 40, right: 40 }} />}
        </MapView>
      </div>
      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-white px-4 pt-5 -mt-5 relative">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Rodada terminada</p>
        <h1 className="text-2xl font-bold">{ride.title}</h1>

        <div className="mt-5 flex items-end justify-between">
          <StatBlock size="lg" value={formatDuration(ride.minutes * 60)} label="Tiempo" />
          <SafetyScoreBadge size="lg" score={ride.avgSafetyScore} showLabel />
        </div>
        <div className="mt-5 flex gap-10 border-t border-line pt-5">
          <StatBlock value={ride.km.toFixed(1)} unit="km" label="Distancia" />
          <StatBlock value={ride.avgSpeed.toFixed(1)} unit="km/h" label="Vel. promedio" />
          <StatBlock value={ride.avgSafetyScore} label="Safety Score" />
        </div>
        <p className="mt-4 text-sm text-muted">
          {free ? `El Safety Score de tu recorrido fue ${ride.avgSafetyScore}, estimado con los reportes cercanos a tu trayecto.` : `El Safety Score de tu recorrido fue ${ride.avgSafetyScore}, calculado con el tráfico, iluminación, pavimento y reportes de la ruta.`}
        </p>

        {pendingReports > 0 && (
          <Link href="/reportes" className="mt-5 flex items-center gap-3 rounded-card border border-risk-orange bg-[#FCEBDD] p-4">
            <ClipboardList size={24} className="shrink-0 text-[#A8530F]" />
            <div className="flex-1">
              <p className="font-bold">{pendingReports} {pendingReports === 1 ? "reporte pendiente" : "reportes pendientes"} por completar</p>
              <p className="text-sm text-muted">Agrega foto y detalles para que el municipio pueda atenderlos.</p>
            </div>
          </Link>
        )}

        <div className="space-y-2 py-5">
          <Button href="/reportes" full size="lg">Completar reportes</Button>
          <Button href="/inicio" full variant="outline">Volver al inicio</Button>
        </div>
      </div>
    </>
  );
}
