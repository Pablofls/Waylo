"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, TriangleAlert, UserPlus, Users } from "lucide-react";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { RideCard } from "@/components/domain/RideCard";
import { ActivityCard } from "@/components/domain/ActivityCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import type { CommunityRide, Friend, FriendActivity, Place, Ride, RouteOption, User } from "@/types";

type Tab = "mias" | "comunidad" | "amigos";

interface Props {
  user: User;
  usual: { origin: Place; destination: Place; route: RouteOption; newAlerts: number };
  rides: Ride[];
  communityRides: CommunityRide[];
  friends: Friend[];
  activity: FriendActivity[];
}

export function Home({ user, usual, rides, communityRides, friends, activity }: Props) {
  const [tab, setTab] = useState<Tab>("mias");
  const { route } = usual;
  const tabs: { v: Tab; l: string }[] = [
    { v: "mias", l: "Mis rodadas" },
    { v: "comunidad", l: "Comunidad" },
    { v: "amigos", l: "Amigos" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <header className="pt-safe flex items-center justify-between px-4 pb-2 pt-5">
        <div>
          <p className="text-sm text-muted">Buen día</p>
          <h1 className="text-2xl font-bold leading-tight">Hola, {user.name.split(" ")[0]}</h1>
        </div>
        <Link href="/amigos" aria-label="Amigos" className="relative flex h-12 w-12 items-center justify-center rounded-full border border-line active:bg-canvas">
          <Users size={22} />
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">2</span>
        </Link>
      </header>

      <section className="px-4 pt-2">
        <div className="rounded-card bg-brand-900 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Tu ruta habitual</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight">{usual.origin.name} a la UDEM</p>
              <p className="truncate text-sm text-white/70">vía {route.via}</p>
            </div>
            <SafetyScoreBadge score={route.safetyScore} />
          </div>
          <div className="mt-3 flex items-end gap-5">
            <div><span className="metric text-4xl">{route.minutes}</span><span className="ml-1 font-display text-lg font-semibold text-white/70">min</span></div>
            <p className="flex items-center gap-1.5 pb-1 text-sm font-semibold text-risk-yellow"><TriangleAlert size={18} />{usual.newAlerts} alertas nuevas</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button href="/rodada?ruta=segura" className="!bg-white !text-brand-900" icon={<Play size={18} fill="currentColor" />}>Iniciar</Button>
            <Button href="/mapa" variant="outline" className="!border-white/30 !bg-transparent !text-white">Ver en el mapa</Button>
          </div>
        </div>
      </section>

      <div role="tablist" className="sticky top-0 z-10 mt-4 flex border-b border-line bg-white">
        {tabs.map((t) => (
          <button key={t.v} role="tab" aria-selected={tab === t.v} onClick={() => setTab(t.v)} className={`min-h-[48px] flex-1 border-b-2 text-sm font-semibold ${tab === t.v ? "border-brand-600 text-brand-600" : "border-transparent text-muted"}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "mias" && rides.map((r) => <RideCard key={r.id} ride={r} />)}
      {tab === "comunidad" &&
        communityRides.map((r) => <ActivityCard key={r.id} name={r.person} title={r.title} km={r.km} minutes={r.minutes} safetyScore={r.safetyScore} at={r.at} meta={r.zone} />)}
      {tab === "amigos" &&
        (activity.length === 0 ? (
          <EmptyState icon={<UserPlus size={26} />} title="Aún no sigues a nadie" text="Agrega amigos para ver sus rodadas y qué tan seguras fueron." action={<Button href="/amigos">Agregar amigos</Button>} />
        ) : (
          <>
            {activity.map((a) => {
              const f = friends.find((x) => x.id === a.friendId)!;
              return <ActivityCard key={a.id} name={f.name} title={a.title} km={a.km} minutes={a.minutes} safetyScore={a.safetyScore} at={a.at} vehicle={a.vehicle} />;
            })}
            <div className="p-4"><Button href="/amigos" variant="secondary" full icon={<UserPlus size={18} />}>Agregar amigos</Button></div>
          </>
        ))}
      <div className="h-4" />
    </div>
  );
}
