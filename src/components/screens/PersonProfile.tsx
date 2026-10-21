"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Lock, MapPin, UserX, Users } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Avatar } from "@/components/domain/Avatar";
import { StatBlock } from "@/components/domain/StatBlock";
import { BadgeMedal } from "@/components/domain/BadgeMedal";
import { ActivityCard } from "@/components/domain/ActivityCard";
import { RelationButton } from "@/components/domain/RelationButton";
import { EmptyState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { useSocial } from "@/lib/social";
import { formatDateTime } from "@/lib/format";
import type { BadgeInfo, FriendActivity } from "@/types";

const vehicleLabel = { bicicleta: "Bicicleta", scooter: "Scooter", ambos: "Bicicleta y scooter" } as const;

export function PersonProfile({ id, activity, allBadges }: { id: string; activity: FriendActivity[]; allBadges: BadgeInfo[] }) {
  const { person: find, rides } = useSocial();
  const person = find(id);

  if (!person) {
    return (
      <>
        <ScreenHeader title="Perfil" back="/amigos" />
        <EmptyState icon={<UserX size={26} />} title="No encontramos a esta persona" text="Puede que haya eliminado su cuenta." />
      </>
    );
  }

  const isFriend = person.relation === "amigo";
  const badges = allBadges.filter((b) => person.badgeIds.includes(b.id)).map((b) => ({ ...b, earned: true, progress: b.goal }));
  const groupRides = rides.filter((r) => r.attendeeIds.includes(person.id) && r.status === "programada").slice(0, 3);
  const since = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(new Date(person.memberSince));

  return (
    <>
      <ScreenHeader title={person.name} back="/amigos" />
      <div className="flex-1 overflow-y-auto bg-white">
        <section className="px-4 pb-5 pt-2">
          <div className="flex items-center gap-4">
            <Avatar name={person.name} size={72} />
            <div className="min-w-0">
              <h2 className="text-2xl font-bold leading-tight">{person.name}</h2>
              <p className="flex items-center gap-1 text-sm text-muted"><MapPin size={14} />{person.city}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5"><Badge tone="brand">{vehicleLabel[person.vehicle]}</Badge></div>
            </div>
          </div>
          <p className="mt-4 text-[15px]">{person.bio}</p>
          <p className="mt-2 flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5"><CalendarDays size={16} />Desde {since}</span>
            <span className="flex items-center gap-1.5"><Users size={16} />{person.mutual} amigos en común</span>
          </p>
          <div className="mt-4"><RelationButton person={person} size="full" /></div>
        </section>

        <section className="border-y border-line px-4 py-5">
          <div className="grid grid-cols-3 gap-4">
            <StatBlock value={person.stats.km.toFixed(0)} unit="km" label="Recorridos" />
            <StatBlock value={person.stats.rides} label="Rodadas" />
            <StatBlock value={person.stats.avgSafetyScore} label="Score prom." />
          </div>
        </section>

        {badges.length > 0 && (
          <section className="pt-5">
            <h3 className="px-4 text-lg font-bold">Insignias</h3>
            <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-1">{badges.map((b) => <BadgeMedal key={b.id} badge={b} />)}</div>
          </section>
        )}

        {groupRides.length > 0 && (
          <section className="pt-6">
            <h3 className="px-4 text-lg font-bold">Rodadas grupales a las que va</h3>
            <ul className="mt-2 border-t border-line">
              {groupRides.map((r) => (
                <li key={r.id}>
                  <Link href={`/rodadas/${r.id}`} className="flex min-h-[64px] items-center gap-3 border-b border-line px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{r.title}</span>
                      <span className="block text-sm text-muted">{formatDateTime(r.date)} · {r.meetingPoint}</span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="pt-6">
          <h3 className="px-4 pb-2 text-lg font-bold">Actividad reciente</h3>
          {isFriend ? (
            activity.length === 0 ? (
              <p className="px-4 pb-6 text-sm text-muted">Aún no tiene rodadas recientes.</p>
            ) : (
              <div className="border-t border-line">{activity.map((a) => <ActivityCard key={a.id} name={person.name} personId={person.id} title={a.title} km={a.km} minutes={a.minutes} safetyScore={a.safetyScore} at={a.at} vehicle={a.vehicle} />)}</div>
            )
          ) : (
            <div className="mx-4 mb-6 flex items-start gap-3 rounded-card border border-line bg-canvas p-4">
              <Lock size={20} className="mt-0.5 shrink-0 text-muted" />
              <p className="text-sm text-muted">Agrega a {person.name.split(" ")[0]} como amigo para ver sus rodadas y qué tan seguras fueron.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
