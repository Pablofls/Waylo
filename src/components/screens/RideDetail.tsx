"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FeatureCollection, Point } from "geojson";
import { Check, Pencil, Share2, Trash2 } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { MapView } from "@/components/map/MapView";
import { RouteLine } from "@/components/map/RouteLine";
import { StatBlock } from "@/components/domain/StatBlock";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { ConfirmSheet } from "@/components/domain/ConfirmSheet";
import { ShareSheet } from "@/components/domain/ShareSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";
import { riskAt } from "@/lib/map/risk";
import { safetyTone, toneClasses } from "@/lib/safety";
import { formatDateTime, formatDuration } from "@/lib/format";

export function RideDetail({ id, risk }: { id: string; risk: FeatureCollection<Point> }) {
  const router = useRouter();
  const { myRides, renameMyRide, deleteMyRide } = useSocial();
  const ride = myRides.find((r) => r.id === id);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(ride?.title ?? "");
  const [share, setShare] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!ride) return (<><ScreenHeader title="Rodada" back="/perfil" /><EmptyState title="No encontramos esta rodada" text="Puede que la hayas eliminado." action={<Button href="/inicio">Ir al inicio</Button>} /></>);

  // Score por tramo: se divide el recorrido en tres partes según el riesgo cercano
  const n = ride.coordinates.length;
  const raw = [0, 1, 2].map((i) => {
    const seg = ride.coordinates.slice(Math.floor((i * (n - 1)) / 3), Math.floor(((i + 1) * (n - 1)) / 3) + 1);
    return seg.reduce((a, p) => a + riskAt(p, risk), 0) / seg.length;
  });
  // Se reparte el Score promedio de la rodada según el riesgo relativo de cada tramo
  const mean = raw.reduce((a, b) => a + b, 0) / raw.length;
  const parts = raw.map((r) => Math.round(Math.max(30, Math.min(99, ride.avgSafetyScore - (r - mean) * 60))));
  const labels = ["Primer tercio", "Tramo medio", "Tramo final"];

  return (
    <>
      <ScreenHeader title={ride.title} subtitle={formatDateTime(ride.startedAt)} back="/perfil" action={<button aria-label="Compartir" onClick={() => setShare(true)} className="flex h-11 w-11 items-center justify-center rounded-full active:bg-canvas"><Share2 size={22} /></button>} />
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="relative h-[230px]">
          <MapView center={ride.coordinates[0]} zoom={13.5}>
            <RouteLine id="detail" coordinates={ride.coordinates} risk={risk} fit fitPadding={{ top: 40, bottom: 40, left: 40, right: 40 }} />
          </MapView>
        </div>

        <section className="px-4 pt-5">
          <div className="flex items-end justify-between">
            <StatBlock size="lg" value={formatDuration(ride.minutes * 60)} label="Tiempo" />
            <SafetyScoreBadge size="lg" score={ride.avgSafetyScore} showLabel />
          </div>
          <div className="mt-5 flex gap-10 border-t border-line pt-5">
            <StatBlock value={ride.km.toFixed(1)} unit="km" label="Distancia" />
            <StatBlock value={ride.avgSpeed.toFixed(1)} unit="km/h" label="Vel. promedio" />
          </div>
        </section>

        <section className="px-4 pt-6">
          <h2 className="text-lg font-bold">Safety Score por tramo</h2>
          <ul className="mt-2 divide-y divide-line">
            {parts.map((s, i) => {
              const t = toneClasses[safetyTone(s)];
              return (
                <li key={labels[i]} className="py-3.5">
                  <div className="flex items-center justify-between"><span className="text-[15px] font-semibold">{labels[i]}</span><span className={`metric text-2xl ${t.text}`}>{s}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line"><div className={`h-full rounded-full ${t.bg}`} style={{ width: `${s}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-2 px-4 py-6">
          {editing ? (
            <div className="rounded-card border border-line p-3">
              <label htmlFor="ride-title" className="mb-1.5 block text-sm font-semibold">Nombre de la rodada</label>
              <input id="ride-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} className="min-h-[48px] w-full rounded-xl border border-line px-4 text-base focus:border-brand-600 focus:outline-none" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { setEditing(false); setTitle(ride.title); }}>Cancelar</Button>
                <Button icon={<Check size={18} />} onClick={() => { if (title.trim()) renameMyRide(ride.id, title.trim()); setEditing(false); }}>Guardar</Button>
              </div>
            </div>
          ) : (
            <Button full variant="outline" icon={<Pencil size={18} />} onClick={() => setEditing(true)}>Cambiar nombre</Button>
          )}
          <Button full variant="ghost" className="!text-[#B02E2E]" icon={<Trash2 size={18} />} onClick={() => setConfirmDelete(true)}>Eliminar rodada</Button>
        </section>
      </div>

      <ShareSheet open={share} onClose={() => setShare(false)} title="Comparte tu rodada" text="Tus amigos podrán ver el recorrido y su Safety Score." url={`https://waylo.app/actividad/${ride.id}`} />
      <ConfirmSheet open={confirmDelete} danger title="¿Eliminar esta rodada?" text="Se borrará de tu historial y de tus estadísticas. No se puede deshacer." confirmLabel="Eliminar" onConfirm={() => { deleteMyRide(ride.id); router.push("/perfil"); }} onClose={() => setConfirmDelete(false)} />
    </>
  );
}
