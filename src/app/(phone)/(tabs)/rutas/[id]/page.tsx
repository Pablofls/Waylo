import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { RiskBreakdown } from "@/components/domain/RiskBreakdown";
import { StatBlock } from "@/components/domain/StatBlock";
import { Button } from "@/components/ui/Button";
import { getRoute } from "@/lib/data";

export default async function RutaDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const route = await getRoute(id);
  if (!route) notFound();

  return (
    <>
      <ScreenHeader title={route.label} subtitle={`vía ${route.via}`} back="/mapa" />
      <div className="flex-1 overflow-y-auto">
        <section className="border-b border-line px-4 pb-5 pt-2">
          <div className="flex items-end justify-between">
            <SafetyScoreBadge score={route.safetyScore} size="lg" showLabel />
            <div className="flex gap-6">
              <StatBlock value={route.minutes} unit="min" label="Tiempo" />
              <StatBlock value={route.km.toFixed(1)} unit="km" label="Distancia" />
            </div>
          </div>
          <p className="mt-4 text-[15px]">{route.summary}</p>
          <p className="mt-2 text-sm font-semibold text-muted">{route.extraMinutes === 0 ? "Es la ruta más corta." : `${route.extraMinutes} min más que la ruta más rápida.`}</p>
        </section>
        <section className="px-4 pt-4">
          <h2 className="text-lg font-bold">Por qué esta calificación</h2>
          <p className="text-sm text-muted">Cada factor va de 0 a 100; mayor es mejor.</p>
          <RiskBreakdown factors={route.factors} />
        </section>
        <div className="h-4" />
      </div>
      <div className="border-t border-line bg-white p-4">
        <Button href={`/rodada?ruta=${route.id}`} full size="lg" icon={<Play size={20} fill="currentColor" />}>Iniciar con esta ruta</Button>
      </div>
    </>
  );
}
