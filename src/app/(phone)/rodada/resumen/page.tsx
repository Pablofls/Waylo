import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { MapView } from "@/components/map/MapView";
import { RouteLine } from "@/components/map/RouteLine";
import { StatBlock } from "@/components/domain/StatBlock";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { Button } from "@/components/ui/Button";
import { getRoute, getMyReports, getRiskPoints } from "@/lib/data";
import { formatDuration } from "@/lib/format";

export default async function ResumenPage({ searchParams }: { searchParams: Promise<{ ruta?: string; km?: string; seg?: string; pend?: string }> }) {
  const q = await searchParams;
  const route = (await getRoute(q.ruta ?? "segura"))!;
  const km = Number(q.km) > 0 ? Number(q.km) : route.km;
  const seconds = Number(q.seg) > 0 ? Number(q.seg) : route.minutes * 60;
  const avg = (km / (seconds / 3600)).toFixed(1);
  const mine = (await getMyReports()).filter((r) => r.pendingDetails).length;
  const risk = await getRiskPoints();
  const pending = Number(q.pend ?? 0) + mine;

  return (
    <>
      <div className="relative h-[260px] shrink-0">
        <MapView center={[-100.3, 25.735]} zoom={12}>
          <RouteLine id="done" coordinates={route.coordinates} risk={risk} fit fitPadding={{ top: 50, bottom: 40, left: 40, right: 40 }} />
        </MapView>
      </div>
      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-white px-4 pt-5 -mt-5 relative">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Rodada terminada</p>
        <h1 className="text-2xl font-bold">Casa a UANL Ciudad Universitaria</h1>

        <div className="mt-5 flex items-end justify-between">
          <StatBlock size="lg" value={formatDuration(seconds)} label="Tiempo" />
          <SafetyScoreBadge size="lg" score={route.safetyScore} showLabel />
        </div>
        <div className="mt-5 flex gap-10 border-t border-line pt-5">
          <StatBlock value={km.toFixed(1)} unit="km" label="Distancia" />
          <StatBlock value={avg} unit="km/h" label="Vel. promedio" />
          <StatBlock value={route.safetyScore} label="Safety Score" />
        </div>
        <p className="mt-4 text-sm text-muted">El Safety Score promedio de tu recorrido fue {route.safetyScore}, calculado con el tráfico, iluminación, pavimento y reportes de la ruta.</p>

        {pending > 0 && (
          <Link href="/reportes" className="mt-5 flex items-center gap-3 rounded-card border border-risk-orange bg-[#FCEBDD] p-4">
            <ClipboardList size={24} className="shrink-0 text-[#A8530F]" />
            <div className="flex-1">
              <p className="font-bold">{pending} {pending === 1 ? "reporte pendiente" : "reportes pendientes"} por completar</p>
              <p className="text-sm text-muted">Agrega foto y detalles para que el municipio pueda atenderlos.</p>
            </div>
          </Link>
        )}

        <div className="space-y-2 py-5">
          <Button href="/reportes" full size="lg">Completar reportes</Button>
          <Button href="/mapa" full variant="outline">Volver al mapa</Button>
        </div>
      </div>
    </>
  );
}
