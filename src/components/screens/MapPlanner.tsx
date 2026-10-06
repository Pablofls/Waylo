"use client";

import { useMemo, useState } from "react";
import type { FeatureCollection, Point } from "geojson";
import { ArrowUpDown, ChevronDown, ChevronUp, Circle, Clock, Layers, ListChecks, MapPin, Play, X } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import { HeatmapLayer } from "@/components/map/HeatmapLayer";
import { ReportMarkers } from "@/components/map/ReportMarkers";
import { RouteLine } from "@/components/map/RouteLine";
import { UserMarker } from "@/components/map/UserMarker";
import { RouteOptionCard } from "@/components/domain/RouteOptionCard";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { Button } from "@/components/ui/Button";
import { useUserPosition } from "@/lib/geo/useUserPosition";
import { categoryById } from "@/lib/report-categories";
import { formatDateTime } from "@/lib/format";
import type { Place, Report, RouteKind, RouteOption } from "@/types";

interface Props {
  risk: FeatureCollection<Point>;
  reports: Report[];
  routes: RouteOption[];
  origin: Place;
  places: Place[];
  maxExtraMinutes: number;
}

const ME: Place = { name: "Mi ubicación", detail: "Cerca de la UDEM, San Pedro Garza García", coordinates: [-100.399, 25.654] };

export function MapPlanner({ risk, reports, routes, origin, places, maxExtraMinutes }: Props) {
  const [heat, setHeat] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [from, setFrom] = useState<Place>({ ...ME, coordinates: origin.coordinates });
  const [dest, setDest] = useState<Place | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<RouteKind>("segura");
  const [expanded, setExpanded] = useState(true);
  const position = useUserPosition(origin.coordinates);

  const ordered = (["rapida", "segura", "equilibrada"] as RouteKind[]).map((id) => routes.find((r) => r.id === id)!);
  const current = routes.find((r) => r.id === picked)!;
  const recommended = routes.filter((r) => r.extraMinutes <= maxExtraMinutes).sort((a, b) => b.safetyScore - a.safetyScore)[0]?.id;
  const matches = useMemo(() => places.filter((p) => `${p.name} ${p.detail}`.toLowerCase().includes(query.trim().toLowerCase())), [places, query]);

  const choose = (p: Place) => {
    setDest(p);
    setSearching(false);
    setQuery("");
    setExpanded(true);
  };
  const swap = () => {
    if (!dest) return;
    setFrom(dest);
    setDest(from);
  };

  return (
    <div className="relative flex-1">
      <MapView center={[-100.408, 25.6575]} zoom={13.2}>
        <HeatmapLayer data={risk} visible={heat} />
        {dest &&
          routes.filter((r) => r.id !== picked).map((r) => <RouteLine key={`${r.id}-off`} id={`m-${r.id}`} coordinates={r.coordinates} color="#9AA3AD" width={4} opacity={0.8} />)}
        {dest && <RouteLine key={`${picked}-on`} id={`m-${picked}`} coordinates={current.coordinates} risk={heat ? risk : undefined} fit fitPadding={{ top: 150, bottom: 330, left: 40, right: 40 }} />}
        <ReportMarkers reports={reports} onSelect={setSelectedReport} />
        <UserMarker position={position} />
      </MapView>

      {/* Origen y destino */}
      <div className="pt-safe absolute inset-x-0 top-0 p-3">
        <div className="rounded-card border border-line bg-white p-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1.5">
              <div className="flex min-h-[44px] items-center gap-3 rounded-lg bg-canvas px-3">
                <Circle size={14} className="shrink-0 text-ink" strokeWidth={3} />
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{from.name}</p></div>
              </div>
              <div className="flex min-h-[44px] items-center gap-3 rounded-lg bg-canvas px-3">
                <MapPin size={16} className="shrink-0 text-brand-600" />
                <input
                  value={searching ? query : dest?.name ?? ""}
                  onFocus={() => {
                    setSearching(true);
                    setQuery("");
                  }}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Destino"
                  placeholder="¿A dónde vas?"
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-muted"
                />
                {(dest || searching) && (
                  <button aria-label="Borrar destino" onClick={() => { setDest(null); setSearching(false); setQuery(""); }} className="-mr-2 flex h-11 w-11 items-center justify-center"><X size={18} /></button>
                )}
              </div>
            </div>
            <button aria-label="Invertir origen y destino" onClick={swap} disabled={!dest} className="flex h-12 w-12 items-center justify-center rounded-full border border-line disabled:opacity-40"><ArrowUpDown size={20} /></button>
          </div>
          {searching && (
            <ul className="mt-2 max-h-[240px] overflow-y-auto border-t border-line">
              {matches.length === 0 && <li className="px-3 py-4 text-sm text-muted">Sin resultados para esa búsqueda.</li>}
              {matches.map((p) => (
                <li key={p.name}>
                  <button onClick={() => choose(p)} className="flex min-h-[52px] w-full items-center gap-3 px-3 text-left active:bg-canvas">
                    <Clock size={18} className="shrink-0 text-muted" />
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold">{p.name}</span><span className="block truncate text-xs text-muted">{p.detail}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!searching && (
          <div className="mt-2 flex items-start justify-between">
            {heat ? (
              <div className="rounded-lg border border-line bg-white px-2.5 py-2">
                <p className="text-[11px] font-semibold text-muted">Nivel de riesgo</p>
                <div className="mt-1 h-2 w-24 rounded-full" style={{ background: "linear-gradient(to right, #13896F, #F2C94C, #E8833A, #D64545)" }} />
                <div className="flex justify-between text-[10px] text-muted"><span>Bajo</span><span>Alto</span></div>
              </div>
            ) : <span />}
            <button onClick={() => setHeat(!heat)} aria-pressed={heat} className={`flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${heat ? "border-brand-900 bg-brand-900 text-white" : "border-line bg-white text-ink"}`}>
              <Layers size={18} />Riesgo
            </button>
          </div>
        )}
      </div>

      {/* Hoja inferior */}
      <div className="absolute inset-x-0 bottom-0 max-h-[62%] overflow-y-auto rounded-t-3xl border-t border-line bg-canvas px-4 pb-4 pt-2">
        {selectedReport ? (
          <div className="rounded-card border border-line bg-white p-4">
            <div className="flex items-start gap-3">
              {(() => { const c = categoryById(selectedReport.category); return <c.icon size={26} className="mt-0.5 shrink-0" />; })()}
              <div className="min-w-0 flex-1">
                <p className="font-bold">{categoryById(selectedReport.category).label}</p>
                <p className="truncate text-sm text-muted">{selectedReport.street}</p>
                <p className="mt-1 text-xs text-muted">{formatDateTime(selectedReport.createdAt)} · {selectedReport.confirmations} confirmaciones</p>
              </div>
              <button aria-label="Cerrar" onClick={() => setSelectedReport(null)} className="-m-2 flex h-11 w-11 items-center justify-center"><X size={20} /></button>
            </div>
          </div>
        ) : !dest ? (
          <div className="pt-2">
            <p className="text-sm font-bold uppercase tracking-wide text-muted">Lugares frecuentes</p>
            <ul className="mt-2 divide-y divide-line rounded-card border border-line bg-white">
              {places.slice(0, 4).map((p) => (
                <li key={p.name}>
                  <button onClick={() => choose(p)} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left active:bg-canvas">
                    <MapPin size={18} className="shrink-0 text-brand-600" />
                    <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{p.name}</span><span className="block truncate text-xs text-muted">{p.detail}</span></span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-center text-xs text-muted">Elige un destino para comparar rutas por seguridad.</p>
          </div>
        ) : (
          <>
            <button onClick={() => setExpanded(!expanded)} className="mx-auto flex h-8 w-full items-center justify-center text-muted" aria-label={expanded ? "Contraer opciones" : "Ver las 3 opciones"} aria-expanded={expanded}>
              {expanded ? <ChevronDown size={22} /> : <ChevronUp size={22} />}
            </button>
            {expanded ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">Tope de <strong className="text-ink">{maxExtraMinutes} min</strong> extra. Compara las opciones:</p>
                {ordered.map((r) => <RouteOptionCard key={r.id} route={r} selected={picked === r.id} recommended={recommended === r.id} onSelect={() => setPicked(r.id)} />)}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-card border border-line bg-white p-3">
                <div><p className="font-bold">{current.label}</p><p className="text-sm text-muted">{current.minutes} min · {current.km.toFixed(1)} km</p></div>
                <SafetyScoreBadge score={current.safetyScore} />
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button href={`/rutas/${picked}`} variant="outline" icon={<ListChecks size={18} />}>Ver desglose</Button>
              <Button href={`/rodada?ruta=${picked}`} icon={<Play size={18} fill="currentColor" />}>Iniciar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
