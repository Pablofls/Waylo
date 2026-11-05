"use client";

import { useEffect, useMemo, useState } from "react";
import type { FeatureCollection, Point, Polygon } from "geojson";
import Link from "next/link";
import { ArrowUpDown, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Circle, Clock, ListChecks, MapPin, Play, RotateCw, X } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import { HeatmapLayer } from "@/components/map/HeatmapLayer";
import { ReportMarkers } from "@/components/map/ReportMarkers";
import { ZoneLayer } from "@/components/map/ZoneLayer";
import { RouteLine } from "@/components/map/RouteLine";
import { UserMarker } from "@/components/map/UserMarker";
import { MapSelectionCard, RiskControls, useRiskLayers } from "@/components/domain/RiskControls";
import { ReportSheet } from "@/components/domain/ReportSheet";
import { RouteOptionCard } from "@/components/domain/RouteOptionCard";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";
import { api, errorText } from "@/lib/api";
import { MONTERREY_CENTER } from "@/lib/map/geo";
import { useUserPosition } from "@/lib/geo/useUserPosition";
import type { Place, Report, RouteKind, RouteOption, ZoneShapeProps } from "@/types";

interface Props {
  risk: FeatureCollection<Point>;
  zones: FeatureCollection<Polygon, ZoneShapeProps>;
  reports: Report[];
  places: Place[];
  maxExtraMinutes: number;
  /** Destino preseleccionado (por ejemplo, el punto de salida de una rodada grupal). */
  initialDest?: Place | null;
  initialRoute?: RouteKind;
}

const ME: Place = { name: "Mi ubicación", detail: "", coordinates: MONTERREY_CENTER };

export function MapPlanner({ risk, zones, reports, places, maxExtraMinutes, initialDest, initialRoute }: Props) {
  const layers = useRiskLayers(reports);
  const { heat, selectedZone, selectedReport } = layers;
  const [from, setFrom] = useState<Place>(ME);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [recommended, setRecommended] = useState<RouteKind | null>(null);
  const [notice, setNotice] = useState("");
  const [routeError, setRouteError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [dest, setDest] = useState<Place | null>(initialDest ?? null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<RouteKind>(initialRoute ?? "segura");
  const [expanded, setExpanded] = useState(true);
  const position = useUserPosition(MONTERREY_CENTER);
  const { savedPlaces, savedRoutes, addSavedRoute, removeSavedRoute, searchHistory, addSearch, removeSearch, clearSearches } = useSocial();
  const [reporting, setReporting] = useState(false);
  const frequent: Place[] = savedPlaces.length > 0 ? savedPlaces.map((sp) => ({ ...sp.place, name: sp.label })) : places.slice(0, 4);

  const ordered = (["rapida", "segura", "equilibrada"] as RouteKind[]).flatMap((id) => routes.find((r) => r.id === id) ?? []);
  const current = routes.find((r) => r.id === picked) ?? routes[0];
  const saved = dest && current ? savedRoutes.find((r) => r.toName === dest.name && r.routeId === current.id) : undefined;
  const matches = useMemo(() => places.filter((p) => `${p.name} ${p.detail}`.toLowerCase().includes(query.trim().toLowerCase())), [places, query]);

  // El origen "Mi ubicación" es el GPS; se redondea (~100 m) para no recalcular con cada lectura.
  const fromMe = from === ME;
  const origin: Place = fromMe ? { ...ME, coordinates: position } : from;
  const originKey = fromMe ? position.map((c) => c.toFixed(3)).join(",") : `${from.id ?? from.name}`;

  // Rutas calculadas por el motor (preferencias de la persona y reportes de la comunidad).
  useEffect(() => {
    setRoutes([]);
    setRecommended(null);
    setNotice("");
    setRouteError("");
    if (!dest) return;
    let alive = true;
    setLoadingRoutes(true);
    const toInput = (p: Place) => ({ id: p.id, name: p.name.slice(0, 120), detail: p.detail.slice(0, 240), coordinates: p.coordinates });
    api<{ opciones: RouteOption[]; recomendada: RouteKind | null; aviso?: string }>("/api/rutas/calcular", "POST", { origen: toInput(origin), destino: toInput(dest === ME ? { ...ME, coordinates: position } : dest) })
      .then((r) => {
        if (!alive) return;
        setRoutes(r.opciones);
        setRecommended(r.recomendada);
        setNotice(r.aviso ?? "");
        if (r.recomendada && !initialRoute) setPicked(r.recomendada);
      })
      .catch((e) => alive && setRouteError(errorText(e)))
      .finally(() => alive && setLoadingRoutes(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest, originKey, attempt]);

  const choose = (p: Place) => {
    addSearch(p);
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
      <MapView center={MONTERREY_CENTER} zoom={12}>
        <ZoneLayer data={zones} visible={layers.zones} onSelect={layers.selectZone} />
        <HeatmapLayer data={risk} visible={heat} />
        {dest && current &&
          routes.filter((r) => r.id !== picked).map((r) => <RouteLine key={`${r.id}-off`} id={`m-${r.id}`} coordinates={r.coordinates} color="#9AA3AD" width={4} opacity={0.8} />)}
        {dest && current && <RouteLine key={`${current.id}-on`} id={`m-${current.id}`} coordinates={current.coordinates} risk={heat ? risk : undefined} fit fitPadding={{ top: 150, bottom: 330, left: 40, right: 40 }} />}
        <ReportMarkers reports={layers.shownReports} onSelect={layers.selectReport} />
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
              {query.trim() === "" && searchHistory.length > 0 && (
                <>
                  <li className="flex items-center justify-between px-3 pt-2"><span className="text-xs font-bold uppercase tracking-wide text-muted">Recientes</span><button onClick={clearSearches} className="min-h-[44px] text-xs font-semibold text-brand-600">Borrar historial</button></li>
                  {searchHistory.map((p) => (
                    <li key={`h-${p.name}`} className="flex items-center">
                      <button onClick={() => choose(p)} className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 px-3 text-left active:bg-canvas"><Clock size={18} className="shrink-0 text-muted" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{p.name}</span><span className="block truncate text-xs text-muted">{p.detail}</span></span></button>
                      <button aria-label={`Quitar ${p.name} del historial`} onClick={() => removeSearch(p.name)} className="flex h-11 w-11 shrink-0 items-center justify-center text-muted"><X size={16} /></button>
                    </li>
                  ))}
                  <li className="px-3 pt-1 text-xs font-bold uppercase tracking-wide text-muted">Lugares</li>
                </>
              )}
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
          <div className="mt-2">
            <RiskControls heat={heat} zones={layers.zones} filtersOn={layers.filtersOn} onHeat={() => layers.setHeat(!heat)} onZones={() => layers.setZones(!layers.zones)} onFilters={layers.openFilters} onReport={() => setReporting(true)} />
          </div>
        )}
      </div>

      {/* Hoja inferior */}
      <div className="absolute inset-x-0 bottom-0 max-h-[62%] overflow-y-auto rounded-t-3xl border-t border-line bg-canvas px-4 pb-4 pt-2">
        {selectedZone || selectedReport ? (
          <MapSelectionCard zone={selectedZone} report={selectedReport} onClose={layers.clearSelection} />
        ) : !dest ? (
          <div>
            <button onClick={() => setExpanded(!expanded)} className="mx-auto flex h-8 w-full items-center justify-center text-muted" aria-label={expanded ? "Ocultar tus lugares" : "Ver tus lugares"} aria-expanded={expanded}>
              {expanded ? <ChevronDown size={22} /> : <ChevronUp size={22} />}
            </button>
            {expanded ? (
              <>
                <div className="flex items-center justify-between"><p className="text-sm font-bold uppercase tracking-wide text-muted">Tus lugares</p><Link href="/lugares" className="flex min-h-[44px] items-center text-sm font-semibold text-brand-600">Editar</Link></div>
                <ul className="mt-2 divide-y divide-line rounded-card border border-line bg-white">
                  {frequent.map((p) => (
                    <li key={p.name}>
                      <button onClick={() => choose(p)} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left active:bg-canvas">
                        <MapPin size={18} className="shrink-0 text-brand-600" />
                        <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{p.name}</span><span className="block truncate text-xs text-muted">{p.detail}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-center text-xs text-muted">Elige un destino para comparar rutas por seguridad.</p>
              </>
            ) : (
              <button onClick={() => setExpanded(true)} className="flex min-h-[44px] w-full items-center justify-center gap-2 text-sm font-semibold text-ink">
                <MapPin size={16} className="text-brand-600" />Tus lugares
              </button>
            )}
          </div>
        ) : (
          <>
            {!current ? (
              <div className="rounded-card border border-line bg-white p-4 text-center" aria-live="polite">
                <p className="font-bold">{loadingRoutes ? "Calculando rutas seguras…" : routeError ? "No pudimos calcular las rutas" : "No encontramos rutas para este destino"}</p>
                {loadingRoutes && <p className="mt-1 text-sm text-muted">Revisamos los reportes de la comunidad en cada trayecto.</p>}
                {!loadingRoutes && <p className="mt-1 text-sm text-muted">{routeError || notice || "Prueba con otro lugar de tu lista o revisa los reportes del mapa."}</p>}
                {!loadingRoutes && <button onClick={() => setAttempt((a) => a + 1)} className="mt-2 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-600"><RotateCw size={16} />Reintentar</button>}
              </div>
            ) : (<>
            <button onClick={() => setExpanded(!expanded)} className="mx-auto flex h-8 w-full items-center justify-center text-muted" aria-label={expanded ? "Contraer opciones" : "Ver las 3 opciones"} aria-expanded={expanded}>
              {expanded ? <ChevronDown size={22} /> : <ChevronUp size={22} />}
            </button>
            {expanded ? (
              <div className="space-y-3">
                {notice && <p className="rounded-lg bg-white px-3 py-2 text-xs text-muted">{notice}</p>}
                <p className="text-sm text-muted">Recomendamos según tu preferencia de seguridad y tu tope de <strong className="text-ink">{maxExtraMinutes} min</strong> extra. <Link href="/configuracion/rutas" className="font-semibold text-brand-600">Ajustar</Link></p>
                {ordered.map((r) => <RouteOptionCard key={r.id} route={r} selected={picked === r.id} recommended={recommended === r.id} onSelect={() => setPicked(r.id)} />)}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-card border border-line bg-white p-3">
                <div><p className="font-bold">{current.label}</p><p className="text-sm text-muted">{current.minutes} min · {current.km.toFixed(1)} km</p></div>
                <SafetyScoreBadge score={current.safetyScore} />
              </div>
            )}
            <div className="mt-3 grid grid-cols-[1fr_48px_1fr] gap-2">
              <Button href={`/rutas/${current.optionId}`} variant="outline" icon={<ListChecks size={18} />}>Ver desglose</Button>
              <button
                aria-label={saved ? "Quitar ruta guardada" : "Guardar ruta"}
                aria-pressed={Boolean(saved)}
                onClick={() => (saved ? removeSavedRoute(saved.id) : addSavedRoute({ id: `sr_${Date.now()}`, name: `${from.name} a ${dest!.name}`, fromName: from.name, toName: dest!.name, destination: dest!.coordinates, routeId: current.id, minutes: current.minutes, safetyScore: current.safetyScore }, origin, dest!))}
                className={`flex min-h-[48px] items-center justify-center rounded-xl border ${saved ? "border-brand-600 bg-brand-100 text-brand-700" : "border-line bg-white"}`}
              >{saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}</button>
              <Button href={`/rodada?ruta=${current.optionId}`} icon={<Play size={18} fill="currentColor" />}>Iniciar</Button>
            </div>
          </>)}
          </>
        )}
      </div>
      {layers.filterSheet}
  <ReportSheet open={reporting} onClose={() => setReporting(false)} position={position} locationLabel="Tu ubicación actual" />
    </div>
  );
}
