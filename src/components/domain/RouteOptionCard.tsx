import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SafetyScoreBadge } from "./SafetyScoreBadge";
import type { RouteOption } from "@/types";

interface Props {
  route: RouteOption;
  selected?: boolean;
  recommended?: boolean;
  href?: string;
  onSelect?: () => void;
}

export function RouteOptionCard({ route, selected, recommended, href, onSelect }: Props) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold">{route.label}</h3>
            {recommended && <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Recomendada</span>}
          </div>
          <p className="truncate text-sm text-muted">vía {route.via}</p>
        </div>
        <SafetyScoreBadge score={route.safetyScore} />
      </div>
      <div className="mt-3 flex items-end gap-6">
        <div>
          <span className="metric text-4xl">{route.minutes}</span>
          <span className="ml-1 font-display text-lg font-semibold text-muted">min</span>
        </div>
        <div>
          <span className="metric text-2xl">{route.km.toFixed(1)}</span>
          <span className="ml-1 font-display text-base font-semibold text-muted">km</span>
        </div>
        <p className="ml-auto pb-0.5 text-sm font-semibold text-muted">{route.extraMinutes === 0 ? "La más corta" : `+${route.extraMinutes} min`}</p>
        {href && <ChevronRight size={20} className="mb-1 text-muted" />}
      </div>
    </>
  );
  const cls = `block w-full rounded-card border bg-white p-4 text-left ${selected ? "border-2 border-brand-600" : "border-line"}`;
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={cls}>
      {body}
    </button>
  );
}
