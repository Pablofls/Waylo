"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Lock, MapPin, Users } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Avatar } from "@/components/domain/Avatar";
import { AttendeeStack } from "@/components/domain/AttendeeStack";
import { ConfirmSheet } from "@/components/domain/ConfirmSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useAttendees, useSocial } from "@/lib/social";
import { formatDateTime } from "@/lib/format";

export function ClubDetail({ id }: { id: string }) {
  const { clubs, me, rides, joinClub, leaveClub, person } = useSocial();
  const club = clubs.find((c) => c.id === id);
  const members = useAttendees(club?.memberIds ?? []);
  const [confirm, setConfirm] = useState(false);

  if (!club) return (<><ScreenHeader title="Club" back="/comunidad" /><EmptyState title="No encontramos este club" text="Puede que se haya eliminado." action={<Button href="/comunidad">Ver clubes</Button>} /></>);

  const isMember = club.memberIds.includes(me.id);
  const isOwner = club.ownerId === me.id;
  const isPrivate = club.privacy === "privado" && !isMember;
  const upcoming = rides.filter((r) => club.rideIds.includes(r.id) && r.status === "programada");
  const owner = isOwner ? me.name : person(club.ownerId)?.name ?? "";

  return (
    <>
      <ScreenHeader title={club.name} subtitle={club.zone} back="/comunidad" />
      <div className="flex-1 overflow-y-auto bg-white pb-6">
        <section className="px-4 pt-2">
          <div className="flex items-center gap-4"><Avatar name={club.name} size={72} /><div><p className="flex items-center gap-1.5 text-sm text-muted"><MapPin size={14} />{club.zone}</p><p className="flex items-center gap-1.5 text-sm text-muted"><Users size={14} />{club.memberIds.length} miembros {club.privacy === "privado" && <><Lock size={14} />Privado</>}</p></div></div>
          <p className="mt-4 text-[15px]">{club.description}</p>
          {owner && <p className="mt-2 text-sm text-muted">Organiza: <strong className="text-ink">{owner}</strong></p>}
          <div className="mt-4">
            {isOwner ? <p className="rounded-xl bg-brand-100 p-3 text-sm font-semibold text-brand-700">Eres quien organiza este club.</p>
              : isMember ? <Button full variant="outline" onClick={() => setConfirm(true)}>Salir del club</Button>
              : <Button full size="lg" onClick={() => joinClub(club.id)}>{club.privacy === "privado" ? "Solicitar unirme" : "Unirme al club"}</Button>}
          </div>
        </section>

        {isPrivate ? (
          <div className="mx-4 mt-6 flex gap-3 rounded-card border border-line bg-canvas p-4"><Lock size={20} className="mt-0.5 shrink-0 text-muted" /><p className="text-sm text-muted">Este club es privado. Solicita unirte para ver sus miembros y rodadas.</p></div>
        ) : (
          <>
            <section className="px-4 pt-6">
              <h2 className="text-lg font-bold">Próximas rodadas</h2>
              {upcoming.length === 0 ? <p className="mt-2 text-sm text-muted">Este club aún no tiene rodadas programadas.</p> : (
                <ul className="mt-2 divide-y divide-line rounded-card border border-line">{upcoming.map((r) => (
                  <li key={r.id}><Link href={`/rodadas/${r.id}`} className="flex min-h-[64px] items-center gap-3 px-4 py-3"><CalendarDays size={20} className="shrink-0 text-brand-600" /><span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">{r.title}</span><span className="block truncate text-sm text-muted">{formatDateTime(r.date)} · {r.meetingPoint}</span></span><ChevronRight size={18} className="text-muted" /></Link></li>
                ))}</ul>
              )}
              {isMember && <Button href="/rodadas/nueva" full variant="secondary" className="mt-3">Crear rodada del club</Button>}
            </section>
            <section className="px-4 pt-6">
              <h2 className="text-lg font-bold">Miembros</h2>
              <div className="mt-2"><AttendeeStack names={members.map((m) => m.name)} total={members.length} /></div>
              <ul className="mt-2">{members.map((m) => (
                <li key={m.id}><Link href={m.isMe ? "/perfil" : `/personas/${m.id}`} className="flex min-h-[56px] items-center gap-3"><Avatar name={m.name} size={40} /><span className="flex-1 text-[15px] font-semibold">{m.name}{m.isMe ? " (tú)" : ""}</span>{m.id === club.ownerId && <span className="text-xs font-semibold text-brand-700">Organiza</span>}</Link></li>
              ))}</ul>
            </section>
          </>
        )}
      </div>
      <ConfirmSheet open={confirm} danger title={`¿Salir de ${club.name}?`} text="Dejarás de ver sus rodadas y miembros." confirmLabel="Salir del club" onConfirm={() => leaveClub(club.id)} onClose={() => setConfirm(false)} />
    </>
  );
}
