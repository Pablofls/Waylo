"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, CalendarX, Check, ChevronRight, Info, Navigation, Pencil, Play, Share2, Users } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { MiniMap } from "@/components/domain/MiniMap";
import { AttendeeStack } from "@/components/domain/AttendeeStack";
import { ConfirmSheet } from "@/components/domain/ConfirmSheet";
import { ShareSheet } from "@/components/domain/ShareSheet";
import { Avatar } from "@/components/domain/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useAttendees, useSocial } from "@/lib/social";
import { formatWeekday, formatTime } from "@/lib/format";

const levelTone = { Principiante: "brand", Intermedio: "yellow", Avanzado: "orange" } as const;
const vehicleLabel = { bicicleta: "Bicicleta", scooter: "Scooter", ambos: "Bicicleta o scooter" } as const;

export function GroupRideDetail({ id }: { id: string }) {
  const { ride: find, me, join, leave, cancelRide, person } = useSocial();
  const ride = find(id);
  const attendees = useAttendees(ride?.attendeeIds ?? []);
  const [share, setShare] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (!ride) {
    return (
      <>
        <ScreenHeader title="Rodada" back="/comunidad" />
        <EmptyState icon={<CalendarX size={26} />} title="No encontramos esta rodada" text="Puede que el organizador la haya eliminado." action={<Button href="/comunidad">Ver rodadas</Button>} />
      </>
    );
  }

  const isOrganizer = ride.organizerId === me.id;
  const going = ride.attendeeIds.includes(me.id);
  const organizer = isOrganizer ? { name: me.name, city: me.city } : person(ride.organizerId);
  const full = ride.capacity !== undefined && ride.attendeeIds.length >= ride.capacity;
  const cancelled = ride.status === "cancelada";
  const finished = ride.status === "finalizada";
  const active = !cancelled && !finished;
  const dest = `/mapa?destino=${ride.meetingCoordinates.join(",")}&nombre=${encodeURIComponent(ride.meetingPoint)}`;
  const friendsGoing = attendees.filter((a) => !a.isMe && person(a.id)?.relation === "amigo").length;

  return (
    <>
      <ScreenHeader title="Rodada grupal" back="/comunidad" action={<button aria-label="Compartir" onClick={() => setShare(true)} className="flex h-11 w-11 items-center justify-center rounded-full active:bg-canvas"><Share2 size={22} /></button>} />
      <div className="flex-1 overflow-y-auto bg-white">
        {cancelled && <div role="alert" className="flex items-center gap-2 bg-[#F9E1E1] px-4 py-3 text-sm font-semibold text-[#B02E2E]"><Ban size={18} />El organizador canceló esta rodada.</div>}
        {finished && <div className="flex items-center gap-2 bg-canvas px-4 py-3 text-sm font-semibold text-muted"><Check size={18} />Esta rodada ya terminó.</div>}

        <section className="px-4 pb-4 pt-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={levelTone[ride.level]}>{ride.level}</Badge>
            <Badge>{`Ritmo ${ride.pace.toLowerCase()}`}</Badge>
            <Badge>{vehicleLabel[ride.vehicle]}</Badge>
            <Badge>{ride.privacy === "amigos" ? "Solo amigos" : "Pública"}</Badge>
          </div>
          <h2 className="mt-3 text-2xl font-bold leading-tight">{ride.title}</h2>
          <div className="mt-4 flex items-end gap-5 rounded-card bg-brand-900 p-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Hora de salida</p>
              <p className="metric text-6xl">{formatTime(ride.date)}</p>
            </div>
            <p className="pb-1 block text-sm font-semibold text-white/80 first-letter:uppercase">{formatWeekday(ride.date)}</p>
          </div>
        </section>

        <section className="px-4">
          <h3 className="text-lg font-bold">Punto de salida</h3>
          <p className="mt-1 text-[15px]">{ride.meetingPoint}</p>
          <div className="mt-3"><MiniMap position={ride.meetingCoordinates} /></div>
          <Button href={dest} variant="outline" full className="mt-3" icon={<Navigation size={18} />}>Cómo llegar</Button>
        </section>

        <section className="px-4 pt-6">
          <h3 className="text-lg font-bold">Detalles</h3>
          <p className="mt-1 text-[15px]">{ride.description}</p>
          <p className="mt-2 text-sm text-muted">Distancia aproximada: <strong className="text-ink">{ride.km} km</strong></p>
        </section>

        <section className="px-4 pt-6">
          <div className="flex gap-3 rounded-card bg-brand-100 p-4">
            <Info size={20} className="mt-0.5 shrink-0 text-brand-700" />
            <p className="text-sm text-brand-900">Esta rodada es un punto de encuentro. Cada persona registra su recorrido de forma individual con Comenzar al salir.</p>
          </div>
        </section>

        <section className="px-4 pt-6">
          <h3 className="text-lg font-bold">Recomendaciones</h3>
          <ul className="mt-2 space-y-2">
            {ride.rules.map((r) => <li key={r} className="flex items-center gap-2 text-[15px]"><Check size={18} className="shrink-0 text-brand-600" strokeWidth={3} />{r}</li>)}
          </ul>
        </section>

        {organizer && (
          <section className="px-4 pt-6">
            <h3 className="text-lg font-bold">Organiza</h3>
            {isOrganizer ? (
              <div className="mt-2 flex items-center gap-3"><Avatar name={me.name} size={48} /><div><p className="font-semibold">Tú</p><p className="text-sm text-muted">{me.city}</p></div></div>
            ) : (
              <Link href={`/personas/${ride.organizerId}`} className="mt-2 flex min-h-[56px] items-center gap-3">
                <Avatar name={organizer.name} size={48} />
                <span className="min-w-0 flex-1"><span className="block font-semibold">{organizer.name}</span><span className="block text-sm text-muted">{organizer.city}</span></span>
                <ChevronRight size={18} className="text-muted" />
              </Link>
            )}
          </section>
        )}

        <section className="px-4 pb-6 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Quiénes van</h3>
            <span className="flex items-center gap-1.5 text-sm text-muted"><Users size={16} />{ride.attendeeIds.length}{ride.capacity ? ` de ${ride.capacity}` : ""}</span>
          </div>
          <Link href={`/rodadas/${ride.id}/asistentes`} className="mt-3 flex min-h-[56px] items-center justify-between rounded-card border border-line px-4">
            <span>
              <AttendeeStack names={attendees.map((a) => a.name)} total={attendees.length} />
              {friendsGoing > 0 && <span className="mt-1 block text-xs text-muted">{friendsGoing} {friendsGoing === 1 ? "amigo va" : "amigos van"}</span>}
            </span>
            <span className="flex items-center text-sm font-semibold text-brand-600">Ver todos<ChevronRight size={18} /></span>
          </Link>
        </section>
      </div>

      {active && (
        <div className="pb-safe space-y-2 border-t border-line bg-white px-4 pt-3">
          {isOrganizer ? (
            <div className="grid grid-cols-2 gap-2">
              <Button href={`/rodadas/${ride.id}/editar`} variant="outline" icon={<Pencil size={18} />}>Editar</Button>
              <Button variant="danger" onClick={() => setConfirmCancel(true)}>Cancelar rodada</Button>
            </div>
          ) : going ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setConfirmLeave(true)}>No voy</Button>
              <Button href="/rodada" icon={<Play size={18} fill="currentColor" />}>Comenzar</Button>
            </div>
          ) : (
            <Button full size="lg" disabled={full} onClick={() => join(ride.id)}>{full ? "Cupo lleno" : "Unirme a la rodada"}</Button>
          )}
          <div className="h-1" />
        </div>
      )}

      <ShareSheet open={share} onClose={() => setShare(false)} title="Comparte la rodada" text="Cualquiera con el enlace podrá ver los detalles." url={`https://waylo.app/rodadas/${ride.id}`} />
      <ConfirmSheet open={confirmCancel} danger title="¿Cancelar la rodada?" text="Avisaremos a las personas que iban. Esta acción no se puede deshacer." confirmLabel="Cancelar rodada" cancelLabel="Mantener" onConfirm={() => cancelRide(ride.id)} onClose={() => setConfirmCancel(false)} />
      <ConfirmSheet open={confirmLeave} title="¿Ya no vas a ir?" text="Liberaremos tu lugar y el organizador verá que cancelaste." confirmLabel="Sí, ya no voy" cancelLabel="Seguir yendo" onConfirm={() => leave(ride.id)} onClose={() => setConfirmLeave(false)} />
    </>
  );
}
