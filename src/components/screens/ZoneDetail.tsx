"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Navigation, TrendingDown, TrendingUp } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { PremiumGate } from "@/components/domain/PremiumGate";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";
import { categoryById } from "@/lib/report-categories";
import { safetyTone, toneClasses } from "@/lib/safety";
import type { Zone } from "@/types";

export function ZoneDetail({ zone }: { zone: Zone }) {
  const { subscription } = useSocial();
  const [gate, setGate] = useState(false);
  const locked = !subscription.active;
  const max = Math.max(...zone.reportsByType.map((r) => r.count));
  const w = 300, h = 120, pad = 8;
  const lo = Math.min(...zone.monthly) - 5, hi = Math.max(...zone.monthly) + 5;
  const pts = zone.monthly.map((v, i) => [pad + (i * (w - pad * 2)) / (zone.monthly.length - 1), h - pad - ((v - lo) / (hi - lo)) * (h - pad * 2)] as const);
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <>
      <ScreenHeader title={zone.name} subtitle={zone.detail} back="/zonas" />
      <div className="relative flex-1 overflow-y-auto bg-white pb-6">
        <section className="flex items-end justify-between px-4 pt-3">
          <SafetyScoreBadge size="lg" score={zone.score} showLabel />
          <p className={`flex items-center gap-1 pb-1 text-sm font-semibold ${zone.trend < 0 ? "text-[#B02E2E]" : "text-brand-700"}`}>{zone.trend < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}{zone.trend > 0 ? "+" : ""}{zone.trend} contra el mes pasado</p>
        </section>
        <p className="px-4 pt-3 text-[15px]">{zone.summary}</p>

        <div className={locked ? "pointer-events-none select-none blur-[5px]" : ""} aria-hidden={locked}>
          <section className="px-4 pt-6">
            <h2 className="text-lg font-bold">Safety Score, últimos 6 meses</h2>
            <svg viewBox={`0 0 ${w} ${h + 18}`} className="mt-2 w-full" role="img" aria-label={`Safety Score mensual de ${zone.months[0]} a ${zone.months[5]}: ${zone.monthly.join(", ")}`}>
              <path d={path} fill="none" stroke="#0F6B5C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#0F6B5C" strokeWidth="2.5" />)}
              {pts.map(([x], i) => <text key={i} x={x} y={h + 14} textAnchor="middle" fontSize="11" fill="#5B6470">{zone.months[i]}</text>)}
            </svg>
          </section>
          <section className="px-4 pt-6">
            <h2 className="text-lg font-bold">Reportes por tipo</h2>
            <ul className="mt-2 space-y-3">
              {zone.reportsByType.map((r) => {
                const c = categoryById(r.category);
                return (
                  <li key={r.category}><div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 font-semibold"><c.icon size={16} />{c.label}</span><span className="metric text-xl">{r.count}</span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink" style={{ width: `${(r.count / max) * 100}%` }} /></div></li>
                );
              })}
            </ul>
          </section>
          <section className="px-4 pt-6">
            <h2 className="text-lg font-bold">Riesgo por horario</h2>
            <div className="mt-3 grid grid-cols-6 gap-2">
              {zone.hourly.map((x) => {
                const t = toneClasses[safetyTone(100 - x.risk)];
                return (<div key={x.label} className="flex flex-col items-center"><div className="flex h-24 w-full items-end rounded-md bg-canvas"><div className={`w-full rounded-md ${t.bg}`} style={{ height: `${x.risk}%` }} /></div><span className="mt-1 text-[11px] text-muted">{x.label}</span></div>);
              })}
            </div>
          </section>
        </div>

        {locked && (
          <div className="absolute inset-x-4 top-[240px] rounded-card border border-line bg-white p-5 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600"><Crown size={24} /></span>
            <p className="mt-3 text-lg font-bold">Historial completo con Premium</p>
            <p className="mt-1 text-sm text-muted">Mira cómo cambió la seguridad de esta zona mes a mes y a qué horas conviene evitarla.</p>
            <Button full className="mt-4" onClick={() => setGate(true)}>Desbloquear</Button>
          </div>
        )}
        <div className="px-4 pt-6"><Button href={`/mapa?destino=${zone.coordinates.join(",")}&nombre=${encodeURIComponent(zone.name)}`} full variant="outline" icon={<Navigation size={18} />}>Ir a esta zona</Button></div>
        <Link href="/ayuda/safety-score" className="mt-3 block px-4 text-center text-sm font-semibold text-brand-600">Cómo se calcula el Safety Score</Link>
      </div>
      <PremiumGate open={gate} feature="El historial de seguridad por zona" onClose={() => setGate(false)} />
    </>
  );
}
