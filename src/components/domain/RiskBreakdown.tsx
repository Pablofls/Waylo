import { Car, ShieldAlert, Lightbulb, Construction, Bike, type LucideIcon } from "lucide-react";
import { safetyTone, toneClasses } from "@/lib/safety";
import type { RiskFactor, RiskKey } from "@/types";

const icons: Record<RiskKey, LucideIcon> = {
  trafico: Car,
  robo: ShieldAlert,
  iluminacion: Lightbulb,
  pavimento: Construction,
  ciclovia: Bike,
};

export function RiskBreakdown({ factors }: { factors: RiskFactor[] }) {
  return (
    <ul className="divide-y divide-line">
      {factors.map((f) => {
        const tone = toneClasses[safetyTone(f.score)];
        const Icon = icons[f.key];
        return (
          <li key={f.key} className="py-4">
            <div className="flex items-center gap-3">
              <Icon size={20} className="shrink-0 text-ink" />
              <p className="flex-1 text-sm font-semibold">{f.label}</p>
              <span className={`metric text-2xl ${tone.text}`}>{f.score}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="presentation">
              <div className={`h-full rounded-full ${tone.bg}`} style={{ width: `${f.score}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted">{f.explanation}</p>
          </li>
        );
      })}
    </ul>
  );
}
