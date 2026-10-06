"use client";

import { useState } from "react";
import Link from "next/link";
import type { FeatureCollection, Point } from "geojson";
import { Layers, Search, X, Play, TriangleAlert } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import { HeatmapLayer } from "@/components/map/HeatmapLayer";
import { ReportMarkers } from "@/components/map/ReportMarkers";
import { RouteLine } from "@/components/map/RouteLine";
import { UserMarker } from "@/components/map/UserMarker";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { Button } from "@/components/ui/Button";
import { useUserPosition } from "@/lib/geo/useUserPosition";
import { categoryById } from "@/lib/report-categories";
import { formatDateTime } from "@/lib/format";
import type { Place, Report, RouteOption } from "@/types";

interface Props {
  risk: FeatureCollection<Point>;
  reports: Report[];
  usual: { origin: Place; destination: Place; route: RouteOption; newAlerts: number };
}

export function MapHome({ risk, reports, usual }: Props) {
  const [heat, setHeat] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);
  const position = useUserPosition(usual.origin.coordinates);
  const { route } = usual;

  return (
    <div className="relative flex-1">
      <MapView center={[-100.3, 25.7]} zoom={11.5}>
        <HeatmapLayer data={risk} visible={heat} />
        <RouteLine id="usual" coordinates={route.coordinates} risk={heat ? risk : undefined} />
        <ReportMarkers reports={reports} onSelect={setSelected} />
        <UserMarker position={position} />
      </MapView>

      <div className="pt-safe pointer-events-none absolute inset-x-0 top-0 flex items-start gap-2 p-3">
        <Link href="/rutas" className="pointer-events-auto flex min-h-[48px] flex-1 items-center gap-3 rounded-xl border border-line bg-white px-4 text-[15px] text-muted">
          <Search size={20} className="text-ink" />
          ¿A dónde vas?
        </Link>
        <button
          onClick={() => setHeat(!heat)}
          aria-pressed={heat}
          aria-label="Mostrar mapa de calor de riesgo"
          className={`pointer-events-auto flex h-12 items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${heat ? "border-brand-900 bg-brand-900 text-white" : "border-line bg-white text-ink"}`}
        >
          <Layers size={20} />
          Riesgo
        </button>
      </div>

      {heat && (
        <div className="pointer-events-none absolute left-3 top-[68px] mt-[env(safe-area-inset-top)] rounded-lg border border-line bg-white px-2.5 py-2">
          <p className="text-[11px] font-semibold text-muted">Nivel de riesgo</p>
          <div className="mt-1 h-2 w-24 rounded-full" style={{ background: "linear-gradient(to right, #13896F, #F2C94C, #E8833A, #D64545)" }} />
          <div className="flex justify-between text-[10px] text-muted"><span>Bajo</span><span>Alto</span></div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        {selected ? (
          <div className="rounded-card border border-line bg-white p-4">
            <div className="flex items-start gap-3">
              {(() => {
                const c = categoryById(selected.category);
                return <c.icon size={26} className="mt-0.5 shrink-0 text-ink" />;
              })()}
              <div className="min-w-0 flex-1">
                <p className="font-bold">{categoryById(selected.category).label}</p>
                <p className="truncate text-sm text-muted">{selected.street}</p>
                <p className="mt-1 text-xs text-muted">{formatDateTime(selected.createdAt)} · {selected.confirmations} confirmaciones</p>
              </div>
              <button aria-label="Cerrar" onClick={() => setSelected(null)} className="-m-2 flex h-11 w-11 items-center justify-center"><X size={20} /></button>
            </div>
          </div>
        ) : (
          <div className="rounded-card border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tu ruta habitual</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold leading-tight">{usual.origin.name} a UANL CU</p>
                <p className="truncate text-sm text-muted">vía {route.via}</p>
              </div>
              <SafetyScoreBadge score={route.safetyScore} size="md" />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="flex items-end gap-5">
                <div><span className="metric text-4xl">{route.minutes}</span><span className="ml-1 font-display text-lg font-semibold text-muted">min</span></div>
                <div className="flex items-center gap-1.5 pb-1 text-sm font-semibold text-[#A8530F]">
                  <TriangleAlert size={18} />
                  {usual.newAlerts} alertas nuevas
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button href="/rodada?ruta=segura" size="md" className="flex-1" icon={<Play size={18} fill="currentColor" />}>Iniciar</Button>
              <Button href="/rutas" variant="outline" className="flex-1">Ver rutas</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
