"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CornerUpLeft, CornerUpRight, ArrowUp, Flag, Mic, Pause, Play, Square, MapPinned, X, Siren, Check } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import { RouteLine } from "@/components/map/RouteLine";
import { UserMarker } from "@/components/map/UserMarker";
import { StatBlock } from "@/components/domain/StatBlock";
import { AlertBanner } from "@/components/domain/AlertBanner";
import { ReportSheet } from "@/components/domain/ReportSheet";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { useRide } from "@/lib/geo/useRide";
import { useWakeLock } from "@/lib/geo/useWakeLock";
import { formatDuration } from "@/lib/format";
import type { FeatureCollection, Point } from "geojson";
import type { NavAlert, NavStep } from "@/mocks/navigation";
import type { RouteOption } from "@/types";

const turnIcon = { recto: ArrowUp, izquierda: CornerUpLeft, derecha: CornerUpRight, llegada: Flag };

interface Props {
  route: RouteOption;
  steps: NavStep[];
  alerts: NavAlert[];
  risk: FeatureCollection<Point>;
}

export function LiveRide({ route, steps, alerts, risk }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "active">("idle");
  const [paused, setPaused] = useState(false);
  const [simulate, setSimulate] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const active = phase === "active";
  const ride = useRide({ active, paused, simulate, simulationRoute: route.coordinates });
  useWakeLock(active);

  const progress = Math.min(1, ride.km / route.km);
  const nextStep = useMemo(() => steps.find((s) => s.at > progress + 0.001) ?? steps[steps.length - 1], [steps, progress]);
  const alert = alerts.find((a) => progress >= a.from && progress <= a.to);
  const distToNext = Math.max(0, Math.round(((nextStep.at - progress) * route.km * 1000) / 10) * 10);
  const Turn = turnIcon[nextStep.turn];

  const finish = () => {
    const q = new URLSearchParams({ ruta: route.id, km: ride.km.toFixed(1), seg: String(ride.seconds), pend: String(reportCount) });
    router.push(`/rodada/resumen?${q.toString()}`);
  };

  return (
    <div className="relative flex-1 bg-brand-900">
      <MapView center={route.coordinates[0]} zoom={15}>
        <RouteLine id="plan" coordinates={route.coordinates} risk={risk} width={6} opacity={active ? 0.4 : 1} fit fitPadding={{ top: 80, bottom: 280, left: 40, right: 40 }} />
        {ride.track.length > 1 && <RouteLine id="track" coordinates={ride.track} risk={risk} width={8} />}
        <UserMarker position={ride.position ?? (active ? null : route.coordinates[0])} follow={active} />
      </MapView>

      {/* Parte superior */}
      <div className="pt-safe pointer-events-none absolute inset-x-0 top-0 space-y-2 p-3">
        {active ? (
          <>
            <div className="pointer-events-auto flex items-center gap-4 rounded-xl bg-brand-900 px-4 py-3 text-white">
              <Turn size={36} strokeWidth={2.5} />
              <div className="min-w-0 flex-1">
                <p className="metric text-3xl">{nextStep.turn === "llegada" ? "Destino" : `${distToNext} m`}</p>
                <p className="truncate text-sm text-white/80">{nextStep.text}</p>
              </div>
            </div>
            {alert && dismissed !== alert.title && (
              <button className="pointer-events-auto block w-full text-left" onClick={() => setDismissed(alert.title)} aria-label="Cerrar aviso">
                <AlertBanner tone={alert.tone} title={alert.title} text={alert.text} />
              </button>
            )}
            {ride.error && <p role="alert" className="pointer-events-auto rounded-xl bg-white px-4 py-3 text-sm font-semibold text-risk-red">{ride.error}</p>}
          </>
        ) : (
          <div className="pointer-events-auto flex items-center justify-between">
            <Link href="/rutas" aria-label="Cerrar" className="flex h-12 w-12 items-center justify-center rounded-full bg-white"><X size={22} /></Link>
          </div>
        )}
      </div>

      {/* Botones flotantes de reporte */}
      {active && (
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-3" style={{ top: "42%" }}>
          <button aria-label="Reporte por voz" className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-white text-ink">
            <Mic size={24} />
          </button>
          <button aria-label="Reportar un problema" onClick={() => setSheet(true)} className="relative flex h-16 w-16 items-center justify-center rounded-full bg-risk-red text-white ring-4 ring-white active:bg-[#B93A3A]">
            <Siren size={28} />
            {reportCount > 0 && <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-ink px-1 text-xs font-bold">{reportCount}</span>}
          </button>
        </div>
      )}

      {/* Panel inferior */}
      <div className="pb-safe absolute inset-x-0 bottom-0 rounded-t-3xl bg-brand-900 px-4 pt-4 text-white">
        {!active ? (
          <div className="pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Listo para salir</p>
            <p className="mt-1 text-xl font-bold">{route.label} · {route.minutes} min · {route.km.toFixed(1)} km</p>
            <p className="text-sm text-white/70">vía {route.via}</p>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 pl-4">
              <div className="flex items-center gap-3">
                <MapPinned size={20} />
                <div>
                  <p className="text-sm font-semibold">Modo simulación</p>
                  <p className="text-xs text-white/60">Reproduce esta ruta sin usar tu GPS</p>
                </div>
              </div>
              <Toggle checked={simulate} onChange={setSimulate} label="Modo simulación" />
            </div>
            <Button full size="lg" className="mt-3 !bg-white !text-brand-900" icon={<Play size={20} fill="currentColor" />} onClick={() => setPhase("active")}>Iniciar rodada</Button>
          </div>
        ) : (
          <div className="pb-4">
            <div className="flex items-end justify-between">
              <StatBlock invert size="xl" value={formatDuration(ride.seconds)} label={paused ? "Pausado" : "Tiempo"} />
            </div>
            <div className="mt-3 flex gap-8">
              <StatBlock invert size="lg" value={ride.km.toFixed(2)} unit="km" label="Distancia" />
              <StatBlock invert size="lg" value={Math.round(ride.speedKmh)} unit="km/h" label="Velocidad" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" size="lg" icon={paused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />} onClick={() => setPaused(!paused)}>
                {paused ? "Reanudar" : "Pausar"}
              </Button>
              <Button variant="danger" size="lg" icon={<Square size={18} fill="currentColor" />} onClick={() => setConfirmEnd(true)}>Terminar</Button>
            </div>
          </div>
        )}
      </div>

      {confirmEnd && (
        <div className="absolute inset-0 z-40 flex items-end bg-ink/60">
          <div role="dialog" aria-modal="true" aria-label="Terminar rodada" className="pb-safe w-full rounded-t-3xl bg-white p-5">
            <h2 className="text-xl font-bold">¿Terminar la rodada?</h2>
            <p className="mt-1 text-sm text-muted">Llevas {ride.km.toFixed(1)} km en {formatDuration(ride.seconds)}. Verás tu resumen y podrás completar tus reportes.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setConfirmEnd(false)}>Seguir</Button>
              <Button variant="danger" icon={<Check size={18} />} onClick={finish}>Terminar</Button>
            </div>
          </div>
        </div>
      )}

      <ReportSheet open={sheet} onClose={() => setSheet(false)} onSaved={() => setReportCount((n) => n + 1)} locationLabel="Av. Sendero, San Nicolás" />
    </div>
  );
}
