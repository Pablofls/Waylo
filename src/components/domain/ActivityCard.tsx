import { Bike, Scooter } from "lucide-react";
import { Avatar } from "./Avatar";
import { SafetyScoreBadge } from "./SafetyScoreBadge";
import { formatDateTime } from "@/lib/format";

interface Props {
  name: string;
  title: string;
  km: number;
  minutes: number;
  safetyScore: number;
  at: string;
  vehicle?: "bicicleta" | "scooter";
  meta?: string;
}

/** Actividad de otra persona (amigo o comunidad). */
export function ActivityCard({ name, title, km, minutes, safetyScore, at, vehicle, meta }: Props) {
  const Icon = vehicle === "scooter" ? Scooter : Bike;
  return (
    <div className="flex gap-3 border-b border-line bg-white px-4 py-4">
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold">{name}</span> <span className="text-muted">· {formatDateTime(at)}{meta ? ` · ${meta}` : ""}</span>
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
      </div>
      <SafetyScoreBadge score={safetyScore} size="sm" />
    </div>
  );
}
