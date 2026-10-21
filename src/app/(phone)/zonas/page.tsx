import Link from "next/link";
import { ChevronRight, Crown, TrendingDown, TrendingUp } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { getZones } from "@/lib/data";

export default async function ZonasPage() {
  const zones = await getZones();
  return (
    <>
      <ScreenHeader title="Seguridad por zona" subtitle="Historial de las zonas donde ruedas" back="/configuracion" action={<span className="flex items-center gap-1 rounded bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700"><Crown size={12} />Premium</span>} />
      <ul className="flex-1 overflow-y-auto bg-white">
        {zones.map((z) => (
          <li key={z.id}>
            <Link href={`/zonas/${z.id}`} className="flex min-h-[80px] items-center gap-3 border-b border-line px-4 py-3">
              <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">{z.name}</span><span className="block truncate text-sm text-muted">{z.detail}</span>
                <span className={`mt-1 flex items-center gap-1 text-xs font-semibold ${z.trend < 0 ? "text-[#B02E2E]" : "text-brand-700"}`}>{z.trend < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}{z.trend > 0 ? "+" : ""}{z.trend} contra el mes pasado</span></span>
              <SafetyScoreBadge score={z.score} size="sm" /><ChevronRight size={18} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
