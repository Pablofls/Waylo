"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Avatar } from "@/components/domain/Avatar";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { useSocial } from "@/lib/social";
import { monthStats } from "@/mocks/rides";
import type { Challenge } from "@/types";

type Metric = "km" | "rodadas" | "score";
const unit: Record<Challenge["metric"], string> = { km: "km", rodadas: "rodadas", reportes: "reportes", score: "rodadas" };

export function RetosScreen({ challenges }: { challenges: Challenge[] }) {
  const { joinedChallenges, toggleChallenge, friends, me } = useSocial();
  const [tab, setTab] = useState<"retos" | "ranking">("retos");
  const [metric, setMetric] = useState<Metric>("km");

  // Ranking entre tú y tus amigos con las estadísticas del mes (datos de ejemplo)
  const value = (s: { rides: number; km: number; avgSafetyScore: number }) => (metric === "km" ? s.km : metric === "rodadas" ? s.rides : s.avgSafetyScore);
  const board = [{ id: me.id, name: `${me.name} (tú)`, v: value({ rides: monthStats.rides, km: monthStats.km, avgSafetyScore: monthStats.avgSafetyScore }) }, ...friends.map((f) => ({ id: f.id, name: f.name, v: value({ rides: Math.round(f.stats.rides / 2), km: f.stats.km / 3, avgSafetyScore: f.stats.avgSafetyScore }) }))].sort((a, b) => b.v - a.v);
  const fmt = (v: number) => (metric === "km" ? v.toFixed(1) : String(Math.round(v)));

  return (
    <>
      <ScreenHeader title="Retos y ranking" subtitle="Octubre" back="/comunidad" />
      <div className="px-4 pb-2"><Segmented label="Vista" value={tab} onChange={setTab} options={[{ value: "retos", label: "Retos del mes" }, { value: "ranking", label: "Ranking de amigos" }]} /></div>
      <div className="flex-1 overflow-y-auto bg-white pb-6">
        {tab === "retos" ? (
          <ul className="space-y-3 p-4">
            {challenges.map((c) => {
              const joined = joinedChallenges.includes(c.id);
              const pct = Math.min(100, Math.round((c.progress / c.goal) * 100));
              return (
                <li key={c.id} className="rounded-card border border-line p-4">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="text-[17px] font-bold leading-tight">{c.title}</h3><p className="mt-0.5 text-sm text-muted">{c.description}</p></div><span className="shrink-0 text-xs font-semibold text-muted">{c.daysLeft} días</span></div>
                  {joined ? (
                    <div className="mt-3">
                      <div className="flex items-baseline justify-between"><span className="metric text-3xl">{Number.isInteger(c.progress) ? c.progress : c.progress.toFixed(1)}<span className="ml-1 font-display text-lg text-muted">/ {c.goal} {unit[c.metric]}</span></span><span className="text-sm font-semibold text-brand-700">{pct >= 100 ? "¡Completado!" : `${pct} %`}</span></div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} /></div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted">Meta: {c.goal} {unit[c.metric]}</p>
                  )}
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted"><Trophy size={14} />{c.reward} · {c.participants} participantes</p>
                  <Button full variant={joined ? "outline" : "primary"} className="mt-3" onClick={() => toggleChallenge(c.id)}>{joined ? "Salir del reto" : "Unirme al reto"}</Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <>
            <div className="px-4 pt-1"><Segmented label="Métrica" value={metric} onChange={setMetric} options={[{ value: "km", label: "Kilómetros" }, { value: "rodadas", label: "Rodadas" }, { value: "score", label: "Score prom." }]} /></div>
            <ol className="mt-3 border-t border-line">
              {board.map((r, i) => (
                <li key={r.id} className={`flex min-h-[64px] items-center gap-3 border-b border-line px-4 ${r.id === me.id ? "bg-brand-100/60" : ""}`}>
                  <span className="metric w-7 text-2xl text-muted">{i + 1}</span><Avatar name={r.name} size={40} />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{r.name}</span>
                  <span className="metric text-2xl">{fmt(r.v)}<span className="ml-1 text-sm text-muted">{metric === "km" ? "km" : ""}</span></span>
                </li>
              ))}
            </ol>
            <p className="px-4 pt-3 text-xs text-muted">Solo se comparan tú y tus amigos. Los datos son del mes en curso.</p>
          </>
        )}
      </div>
    </>
  );
}
