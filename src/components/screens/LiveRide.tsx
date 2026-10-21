"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bike, Scooter, Share2, ShieldAlert, Route as RouteIcon, Compass, CornerUpLeft, CornerUpRight, ArrowUp, Flag, Mic, Pause, Play, Square, X, Siren, Check, LocateOff } from "lucide-react";
import { MapView } from "@/components/map/MapView";
import { RouteLine } from "@/components/map/RouteLine";
import { UserMarker } from "@/components/map/UserMarker";
import { StatBlock } from "@/components/domain/StatBlock";
import { AlertBanner } from "@/components/domain/AlertBanner";
import { EmergencySheet } from "@/components/domain/EmergencySheet";
import { FallAlert } from "@/components/domain/FallAlert";
import { ShareTripSheet } from "@/components/domain/ShareTripSheet";
import { ReportSheet } from "@/components/domain/ReportSheet";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";
import { riskAt } from "@/lib/map/risk";
import { checkGps, useRide } from "@/lib/geo/useRide";
import { requestMotionPermission, useFallDetection } from "@/lib/geo/useFallDetection";
import { useGpsPublisher } from "@/lib/realtime/hooks";
import { api, errorText } from "@/lib/api";
import { MONTERREY_CENTER, routeProgress } from "@/lib/map/geo";
import { useWakeLock } from "@/lib/geo/useWakeLock";
import { formatDuration } from "@/lib/format";
import type { FeatureCollection, Point } from "geojson";
import type { NavAlert, NavStep, RouteOption } from "@/types";

const turnIcon = { recto: ArrowUp, izquierda: CornerUpLeft, derecha: CornerUpRight, llegada: Flag };

interface Props {
  /** Ruta guiada; `null` en una rodada libre sin destino. */
  route: RouteOption | null;
  steps: NavStep[];
  alerts: NavAlert[];
  risk: FeatureCollection<Point>;
}

const OFF_ROUTE_KM = 0.08;

export function LiveRide({ route, steps, alerts, risk }: Props) {
  const guided = route !== null;
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "active">("idle");
  const [paused, setPaused] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<"bicicleta" | "scooter">("bicicleta");

  const { fallDetection, fallSeconds, liveShare, startLiveShare, stopLiveShare } = useSocial();
  const [shareOpen, setShareOpen] = useState(false);
  const sharingWith = liveShare?.with ?? [];
  const [sosOpen, setSosOpen] = useState(false);
  const [fall, setFall] = useState(false);
  const [rideId, setRideId] = useState<string | null>(null);
  const [gpsIssue, setGpsIssue] = useState<"denied" | "unavailable" | null>(null);
  const [starting, setStarting] = useState(false);
  const [failure, setFailure] = useState("");

  const active = phase === "active";
  const { publish } = useGpsPublisher(rideId);
  const ride = useRide({ active, paused, onSample: publish });
  useWakeLock(active);
  useFallDetection(active && !paused && fallDetection, () => setFall(true));

  const nav = guided && ride.position ? routeProgress(ride.position, route.coordinates) : null;
  const progress = nav ? nav.fraction : 0;
  const nextStep = useMemo(() => steps.find((s) => s.at > progress + 0.001) ?? steps[steps.length - 1], [steps, progress]);
  const nearRisk = !guided && ride.position ? riskAt(ride.position, risk) : 0;
  const alert = guided
    ? alerts.find((a) => progress >= a.from && progress <= a.to)
    : nearRisk > 0.55
      ? { title: "Zona de riesgo alto", text: "Hay varios reportes cerca. Baja la velocidad y circula con precaución.", tone: "red" as const }
      : undefined;
  const offRoute = guided && active && nav !== null && nav.offKm > OFF_ROUTE_KM;
  const distToNext = guided && nextStep ? Math.max(0, Math.round(((nextStep.at - progress) * route.km * 1000) / 10) * 10) : 0;
  const Turn = nextStep ? turnIcon[nextStep.turn] : ArrowUp;

  // La rodada se crea antes de transmitir: el servicio en tiempo real solo acepta puntos de una rodada en curso.
  const start = async () => {
    setFailure("");
    setStarting(true);
    try {
      const gps = await checkGps();
      if (gps !== "ok") return setGpsIssue(gps);
      void requestMotionPermission();
      setGpsIssue(null);
      const r = await api<{ id: string }>("/api/rodadas", "POST", { vehiculo: vehicle, rutaOpcionId: route?.optionId });
      setRideId(r.id);
      setPhase("active");
    } catch (e) {
      setFailure(errorText(e));
    } finally {
      setStarting(false);
    }
  };
  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    if (rideId) api(`/api/rodadas/${rideId}/pausa`, "POST", { pausada: next }).catch(() => {});
  };
  const finish = async () => {
    if (!rideId) return;
    try {
      if (sharingWith.length > 0) stopLiveShare();
      await api(`/api/rodadas/${rideId}/finalizar`, "POST");
      router.push(`/rodada/resumen?id=${rideId}`);
    } catch (e) {
      setConfirmEnd(false);
      setFailure(errorText(e));
    }
  };

  return (
    <div className="relative flex-1 bg-brand-900">
      <MapView center={route?.coordinates[0] ?? MONTERREY_CENTER} zoom={route ? 15 : 12}>
        {route && <RouteLine id="plan" coordinates={route.coordinates} risk={risk} width={6} opacity={active ? 0.4 : 1} fit fitPadding={{ top: 80, bottom: 280, left: 40, right: 40 }} />}
        {ride.track.length > 1 && <RouteLine id="track" coordinates={ride.track} risk={risk} width={8} />}
        <UserMarker position={ride.position} follow={active} />
      </MapView>

      {/* Parte superior */}
      <div className="pt-safe pointer-events-none absolute inset-x-0 top-0 space-y-2 p-3">
        {active ? (
          <>
            {guided && nextStep ? (
              <div className="pointer-events-auto flex items-center gap-4 rounded-xl bg-brand-900 px-4 py-3 text-white">
                <Turn size={36} strokeWidth={2.5} />
                <div className="min-w-0 flex-1">
                  <p className="metric text-3xl">{nextStep.turn === "llegada" ? "Destino" : `${distToNext} m`}</p>
                  <p className="truncate text-sm text-white/80">{nextStep.text}</p>
                </div>
              </div>
            ) : (
              <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-brand-900 px-4 py-3 text-white">
                <Compass size={28} />
                <div>
                  <p className="font-bold leading-tight">Rodada libre</p>
                  <p className="text-sm text-white/70">Sin destino. Te avisamos de zonas de riesgo cercanas.</p>
                </div>
              </div>
            )}
            {offRoute && (
              <div role="alert" className="pointer-events-auto flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-ink">
                <RouteIcon size={26} className="shrink-0 text-risk-orange" />
                <div className="min-w-0 flex-1"><p className="font-bold leading-tight">Te desviaste de la ruta</p><p className="text-sm text-muted">Regresa al trazo marcado en el mapa para seguir la navegación.</p></div>
              </div>
            )}
            {sharingWith.length > 0 && <p className="pointer-events-auto flex items-center gap-2 rounded-xl bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700"><Share2 size={16} />Compartiendo con {sharingWith.join(", ")}</p>}
            {alert && !offRoute && dismissed !== alert.title && (
              <button className="pointer-events-auto block w-full text-left" onClick={() => setDismissed(alert.title)} aria-label="Cerrar aviso">
                <AlertBanner tone={alert.tone} title={alert.title} text={alert.text} />
              </button>
            )}
            {ride.error && <p role="alert" className="pointer-events-auto rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#B02E2E]">{ride.error === "denied" ? "Permiso de ubicación denegado." : ride.error === "unavailable" ? "Este dispositivo no admite geolocalización." : "No pudimos obtener tu ubicación."} <Link href="/permisos/ubicacion" className="underline">Cómo activarla</Link></p>}
          </>
        ) : (
          <div className="pointer-events-auto flex items-center justify-between">
            <Link href={guided ? "/mapa" : "/inicio"} aria-label="Cerrar" className="flex h-12 w-12 items-center justify-center rounded-full bg-white"><X size={22} /></Link>
          </div>
        )}
      </div>

      {/* Compartir y emergencia */}
      {active && (
        <div className="absolute left-3 flex flex-col gap-3" style={{ top: "42%" }}>
          <button aria-label="Compartir mi viaje" onClick={() => setShareOpen(true)} className={`flex h-14 w-14 items-center justify-center rounded-full border ${sharingWith.length ? "border-brand-600 bg-brand-100 text-brand-700" : "border-line bg-white text-ink"}`}><Share2 size={22} /></button>
          <button aria-label="Emergencia" onClick={() => setSosOpen(true)} className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-white text-risk-red"><ShieldAlert size={24} /></button>
        </div>
      )}

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
            {route ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Listo para salir</p>
                <p className="mt-1 text-xl font-bold">{route.label} · {route.minutes} min · {route.km.toFixed(1)} km</p>
                <p className="text-sm text-white/70">vía {route.via}</p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Rodada libre</p>
                <p className="mt-1 text-xl font-bold">Sal sin ruta y registra tu recorrido</p>
                <p className="text-sm text-white/70">Si ya sabes a dónde vas, planea una ruta segura desde Mapa.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(["bicicleta", "scooter"] as const).map((v) => (
                    <button key={v} onClick={() => setVehicle(v)} aria-pressed={vehicle === v} className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${vehicle === v ? "border-white bg-white text-brand-900" : "border-white/30 text-white"}`}>
                      {v === "bicicleta" ? <Bike size={18} /> : <Scooter size={18} />}
                      {v === "bicicleta" ? "Bicicleta" : "Scooter"}
                    </button>
                  ))}
                </div>
              </>
            )}
            {gpsIssue && (
              <div role="alert" className="mt-3 flex items-start gap-3 rounded-xl bg-white p-3 text-ink">
                <LocateOff size={22} className="mt-0.5 shrink-0 text-[#A8530F]" />
                <div className="text-sm">
                  <p className="font-bold">{gpsIssue === "denied" ? "La ubicación está desactivada" : "No pudimos usar el GPS"}</p>
                  <p className="text-muted">{gpsIssue === "denied" ? "Necesitamos tu ubicación para grabar la rodada." : "Este dispositivo no tiene GPS o no está disponible. Abre Waylo desde tu teléfono."}</p>
                  <Link href="/permisos/ubicacion" className="mt-1 inline-flex min-h-[44px] items-center font-semibold text-brand-600 underline">Cómo activarla</Link>
                </div>
              </div>
            )}
            {failure && <p role="alert" className="mt-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#B02E2E]">{failure}</p>}
            <Button full size="lg" className="mt-3 !bg-white !text-brand-900" icon={<Play size={20} fill="currentColor" />} disabled={starting} onClick={() => void start()}>{starting ? "Buscando tu ubicación…" : "Iniciar rodada"}</Button>
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
              <Button variant="outline" size="lg" icon={paused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />} onClick={togglePause}>
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
              <Button variant="danger" icon={<Check size={18} />} onClick={() => void finish()}>Terminar</Button>
            </div>
          </div>
        </div>
      )}

      <ShareTripSheet open={shareOpen} sharingWith={sharingWith} etaLabel={route ? `${Math.max(1, Math.round(route.minutes * (1 - progress)))} min` : "sin destino"} onStart={(ids) => startLiveShare(ids, null)} onStop={stopLiveShare} onClose={() => setShareOpen(false)} />
      <EmergencySheet open={sosOpen} position={ride.position} rideId={rideId} onSimulateFall={process.env.NODE_ENV === "production" ? undefined : () => { setSosOpen(false); setFall(true); }} onClose={() => setSosOpen(false)} />
      {fall && <FallAlert seconds={fallSeconds} position={ride.position} rideId={rideId} onOk={() => setFall(false)} />}
      <ReportSheet open={sheet} onClose={() => setSheet(false)} position={ride.position} rideId={rideId} onSaved={() => setReportCount((n) => n + 1)} locationLabel="Tu ubicación en la rodada" />
    </div>
  );
}
