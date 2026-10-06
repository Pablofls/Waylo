import { SafetyScoreBadge } from "./SafetyScoreBadge";
import { formatDateTime } from "@/lib/format";
import type { Ride } from "@/types";

export function RideCard({ ride }: { ride: Ride }) {
  return (
    <div className="flex items-center gap-4 border-b border-line bg-white px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{ride.title}</p>
        <p className="text-xs text-muted">{formatDateTime(ride.startedAt)}</p>
        <p className="mt-1 text-sm">
          <span className="metric text-xl">{ride.km.toFixed(1)}</span> <span className="text-muted">km</span>
          <span className="mx-2 text-line">|</span>
          <span className="metric text-xl">{ride.minutes}</span> <span className="text-muted">min</span>
        </p>
      </div>
      <SafetyScoreBadge score={ride.avgSafetyScore} />
    </div>
  );
}
