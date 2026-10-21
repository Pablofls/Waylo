"use client";

import Link from "next/link";
import { Bike, MessageCircle, Scooter, ThumbsUp } from "lucide-react";
import { Avatar } from "./Avatar";
import { SafetyScoreBadge } from "./SafetyScoreBadge";
import { useSocial } from "@/lib/social";
import { formatDateTime } from "@/lib/format";

interface Props {
  /** Id de la actividad: habilita reacciones y comentarios. */
  id?: string;
  /** Reacciones totales según el servidor (incluyen la tuya si ya reaccionaste). */
  kudos?: number;
  /** Si el servidor ya cuenta tu reacción. */
  gaveKudo?: boolean;
  comments?: number;
  name: string;
  /** Si se pasa, el avatar y el nombre enlazan al perfil. */
  personId?: string;
  title: string;
  km: number;
  minutes: number;
  safetyScore: number;
  at: string;
  vehicle?: "bicicleta" | "scooter";
  meta?: string;
}

/** Actividad de otra persona (amigo o comunidad). */
export function ActivityCard({ id, kudos: serverKudos = 0, gaveKudo = false, comments: nComments = 0, name, personId, title, km, minutes, safetyScore, at, vehicle, meta }: Props) {
  const { kudos, toggleKudo } = useSocial();
  const gave = id ? kudos.includes(id) : false;
  const count = serverKudos - (gaveKudo ? 1 : 0) + (gave ? 1 : 0);
  const Icon = vehicle === "scooter" ? Scooter : Bike;
  return (
    <div className="flex gap-3 border-b border-line bg-white px-4 py-4">
      {personId ? <Link href={`/personas/${personId}`} aria-label={`Ver perfil de ${name}`}><Avatar name={name} /></Link> : <Avatar name={name} />}
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {personId ? <Link href={`/personas/${personId}`} className="font-semibold">{name}</Link> : <span className="font-semibold">{name}</span>}{" "}
          <span className="text-muted">· {formatDateTime(at)}{meta ? ` · ${meta}` : ""}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[15px] font-semibold">
          {vehicle && <Icon size={16} className="shrink-0 text-muted" />}
          <span className="truncate">{title}</span>
        </p>
        <p className="mt-1.5 text-sm">
          <span className="metric text-xl">{km.toFixed(1)}</span> <span className="text-muted">km</span>
          <span className="mx-2 text-line">|</span>
          <span className="metric text-xl">{minutes}</span> <span className="text-muted">min</span>
        </p>
        {id && (
          <div className="-ml-2 mt-1 flex items-center gap-1">
            <button onClick={() => toggleKudo(id)} aria-pressed={gave} aria-label={gave ? "Quitar reacción" : "Reaccionar"} className={`flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-semibold ${gave ? "text-brand-700" : "text-muted"}`}><ThumbsUp size={18} fill={gave ? "currentColor" : "none"} />{count > 0 ? count : "Bien hecho"}</button>
            <Link href={`/publicacion/${id}`} className="flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted"><MessageCircle size={18} />{nComments > 0 ? nComments : "Comentar"}</Link>
          </div>
        )}
      </div>
      <SafetyScoreBadge score={safetyScore} size="sm" />
    </div>
  );
}
