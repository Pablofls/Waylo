"use client";

import { useState } from "react";
import { ArrowUpDown, Circle, MapPin, Play, ListChecks } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import { RouteLine } from "@/components/map/RouteLine";
import { RouteOptionCard } from "@/components/domain/RouteOptionCard";
import { Button } from "@/components/ui/Button";
import type { FeatureCollection, Point } from "geojson";
import type { Place, RouteOption, RouteKind } from "@/types";

interface Props {
  routes: RouteOption[];
  origin: Place;
  destination: Place;
  maxExtraMinutes: number;
  risk: FeatureCollection<Point>;
}

export function RoutePlanner({ routes, origin, destination, maxExtraMinutes, risk }: Props) {
  const [selected, setSelected] = useState<RouteKind>("segura");
  const [swapped, setSwapped] = useState(false);
  const from = swapped ? destination : origin;
  const to = swapped ? origin : destination;
  const recommended = routes.filter((r) => r.extraMinutes <= maxExtraMinutes).sort((a, b) => b.safetyScore - a.safetyScore)[0]?.id;
  const current = routes.find((r) => r.id === selected)!;
  // Orden pedido: más rápida, más segura, equilibrada
  const ordered = (["rapida", "segura", "equilibrada"] as RouteKind[]).map((id) => routes.find((r) => r.id === id)!);

  return (
    <>
      <header className="pt-safe shrink-0 bg-white px-4 pb-3">
        <div className="flex items-center gap-2 pt-3">
          <div className="flex-1 space-y-2">
            <div className="flex min-h-[48px] items-center gap-3 rounded-xl bg-canvas px-3">
              <Circle size={14} className="text-brand-600" strokeWidth={3} />
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{from.name}</p><p className="truncate text-xs text-muted">{from.detail}</p></div>
            </div>
            <div className="flex min-h-[48px] items-center gap-3 rounded-xl bg-canvas px-3">
              <MapPin size={16} className="text-ink" />
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{to.name}</p><p className="truncate text-xs text-muted">{to.detail}</p></div>
            </div>
          </div>
          <button aria-label="Invertir origen y destino" onClick={() => setSwapped(!swapped)} className="flex h-12 w-12 items-center justify-center rounded-full border border-line active:bg-canvas">
            <ArrowUpDown size={20} />
          </button>
        </div>
      </header>

      <div className="relative h-[200px] shrink-0 border-y border-line">
        <MapView center={[-100.2985, 25.736]} zoom={12}>
          {routes.filter((r) => r.id !== selected).map((r) => (
            <RouteLine key={`${r.id}-off`} id={`p-${r.id}`} coordinates={r.coordinates} color="#9AA3AD" width={4} opacity={0.8} />
          ))}
          <RouteLine key={`${selected}-on`} id={`p-${selected}`} coordinates={current.coordinates} risk={risk} fit fitPadding={{ top: 30, bottom: 30, left: 30, right: 30 }} />
        </MapView>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-canvas p-4">
        <p className="text-sm text-muted">Tienes un tope de <strong className="text-ink">{maxExtraMinutes} min</strong> extra. Compara las tres opciones:</p>
        {ordered.map((r) => (
          <RouteOptionCard key={r.id} route={r} selected={selected === r.id} recommended={recommended === r.id} onSelect={() => setSelected(r.id)} />
        ))}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button href={`/rutas/${selected}`} variant="outline" icon={<ListChecks size={18} />}>Ver desglose</Button>
          <Button href={`/rodada?ruta=${selected}`} icon={<Play size={18} fill="currentColor" />}>Iniciar</Button>
        </div>
      </div>
    </>
  );
}
