import { Award, Lock } from "lucide-react";
import type { BadgeInfo } from "@/types";

export function BadgeMedal({ badge }: { badge: BadgeInfo }) {
  return (
    <div className="flex w-[104px] shrink-0 flex-col items-center text-center" aria-label={`${badge.name}: ${badge.progress} de ${badge.goal}`}>
      <span className={`flex h-16 w-16 items-center justify-center rounded-full ${badge.earned ? "bg-brand-600 text-white" : "border-2 border-dashed border-line bg-canvas text-muted"}`}>
        {badge.earned ? <Award size={30} /> : <Lock size={24} />}
      </span>
      <p className="mt-2 text-[13px] font-semibold leading-tight">{badge.name}</p>
      <p className="text-xs text-muted">{badge.progress}/{badge.goal}</p>
    </div>
  );
}
