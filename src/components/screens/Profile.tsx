"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Crown, MapPin, Pencil, Settings, Users } from "lucide-react";
import { StatBlock } from "@/components/domain/StatBlock";
import { RideCard } from "@/components/domain/RideCard";
import { BadgeMedal } from "@/components/domain/BadgeMedal";
import { Segmented } from "@/components/ui/Segmented";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { useSocial } from "@/lib/social";
import type { BadgeInfo, Ride, User, Vehicle } from "@/types";

interface Props {
  user?: User;
  stats: { rides: number; km: number; minutes: number; avgSafetyScore: number };
  rides?: Ride[];
  badges: BadgeInfo[];
  confirmedReports: number;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[56px] items-center justify-between gap-3 border-b border-line">
      <span className="text-[15px]">{label}</span>
      {children}
    </div>
  );
}

export function Profile({ stats, badges, confirmedReports }: Props) {
  const { friends, received, me: user, myRides: rides } = useSocial();
  const [vehicle, setVehicle] = useState<Vehicle>(user.vehicle);
  const [pref, setPref] = useState(user.routePreference);
  const [n, setN] = useState(user.notifications);
  const initials = user.name.split(" ").map((p) => p[0]).join("");

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <header className="pt-safe bg-brand-900 px-4 pb-6 text-white">
        <div className="flex items-center gap-4 pt-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 font-display text-3xl font-bold text-brand-900">{initials}</span>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{user.name}</h1>
            <p className="text-sm text-white/70">{user.occupation} · {user.age} años · {user.city}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 px-4 pt-4">
        <Link href="/perfil/editar" className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-card border border-line text-xs font-semibold"><Pencil size={20} />Editar</Link>
        <Link href="/lugares" className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-card border border-line text-xs font-semibold"><MapPin size={20} />Lugares</Link>
        <Link href="/configuracion" className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-card border border-line text-xs font-semibold"><Settings size={20} />Ajustes</Link>
      </div>

      <section className="px-4 py-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Octubre</h2>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <StatBlock value={stats.km.toFixed(0)} unit="km" label="Recorridos" />
          <StatBlock value={stats.rides} label="Rodadas" />
          <StatBlock value={stats.avgSafetyScore} label="Score prom." />
        </div>
      </section>

      <Link href="/premium" className="mx-4 flex min-h-[64px] items-center gap-3 rounded-card bg-brand-100 px-4 text-brand-700">
        <Crown size={24} />
        <span className="flex-1"><span className="block font-bold">Waylo Premium</span><span className="block text-sm">Mapas sin conexión y alertas avanzadas</span></span>
        <ChevronRight size={20} />
      </Link>

      <Link href="/amigos" className="mx-4 mt-3 flex min-h-[64px] items-center gap-3 rounded-card border border-line px-4">
        <Users size={22} />
        <span className="flex-1"><span className="block font-bold">Amigos</span><span className="block text-sm text-muted">{friends.length} amigos{received.length ? ` · ${received.length} ${received.length === 1 ? "solicitud" : "solicitudes"}` : ""}</span></span>
        <ChevronRight size={20} className="text-muted" />
      </Link>

      <section className="pt-6">
        <h2 className="px-4 text-lg font-bold">Rodadas recientes</h2>
        <div className="mt-2 border-t border-line">{rides.map((r) => <RideCard key={r.id} ride={r} />)}</div>
      </section>

      <section className="pt-6">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-bold">Reportes y insignias</h2>
        </div>
        <Link href="/reportes" className="mx-4 mt-3 flex min-h-[64px] items-center gap-4 rounded-card border border-line px-4">
          <span className="metric text-4xl">{confirmedReports}</span>
          <span className="flex-1 text-sm"><span className="block font-semibold">Reportes confirmados</span><span className="block text-muted">Ver mis reportes y su estado</span></span>
          <ChevronRight size={20} className="text-muted" />
        </Link>
        <div className="mt-4 flex gap-3 overflow-x-auto px-4 pb-1">{badges.map((b) => <BadgeMedal key={b.id} badge={b} />)}</div>
      </section>

      <section className="px-4 pt-8">
        <h2 className="text-lg font-bold">Preferencias</h2>
        <div className="mt-2">
          <p className="pt-3 text-sm font-semibold text-muted">Vehículo</p>
          <div className="mt-2"><Segmented label="Vehículo" value={vehicle} onChange={setVehicle} options={[{ value: "bicicleta", label: "Bicicleta" }, { value: "scooter", label: "Scooter" }, { value: "ambos", label: "Ambos" }]} /></div>
          <p className="pt-5 text-sm font-semibold text-muted">Preferencia de ruta</p>
          <div className="flex justify-between pt-1 text-xs font-semibold"><span>Más rápida</span><span className="text-brand-600">Más segura</span></div>
          <Slider label="Preferencia de ruta" value={pref} onChange={setPref} />
          <p className="pt-3 text-sm font-semibold text-muted">Notificaciones</p>
          <Row label="Alertas en mi ruta"><Toggle label="Alertas en mi ruta" checked={n.alertas} onChange={(v) => setN({ ...n, alertas: v })} /></Row>
          <Row label="Estado de mis reportes"><Toggle label="Estado de mis reportes" checked={n.municipio} onChange={(v) => setN({ ...n, municipio: v })} /></Row>
          <Row label="Rodadas grupales"><Toggle label="Rodadas grupales" checked={n.rodadas} onChange={(v) => setN({ ...n, rodadas: v })} /></Row>
        </div>
        <Link href="/configuracion" className="mt-2 flex min-h-[56px] items-center gap-3 font-semibold text-brand-600"><Settings size={20} />Más ajustes y privacidad</Link>
        <div className="h-4" />
      </section>
    </div>
  );
}
