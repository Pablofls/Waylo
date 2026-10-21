"use client";

import { useState } from "react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { PremiumGate } from "@/components/domain/PremiumGate";
import { Segmented } from "@/components/ui/Segmented";
import { Toggle } from "@/components/ui/Toggle";
import { Input } from "@/components/ui/Input";
import { useSocial } from "@/lib/social";

function Row({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex min-h-[60px] items-center justify-between gap-3 pl-4"><span><span className="block text-[15px] font-semibold">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span><Toggle label={label} checked={checked} onChange={onChange} /></div>
  );
}

export default function PreferenciasNotificacionesPage() {
  const { subscription, settings, saveNotifications } = useSocial();
  const n = settings.notificaciones;
  const [gate, setGate] = useState(false);
  const set = (patch: Partial<typeof n>) => saveNotifications({ ...n, ...patch });
  const setQuiet = (patch: Partial<typeof n.silencioso>) => set({ silencioso: { ...n.silencioso, ...patch } });
  const alertas = n.alertas;
  const rodadas = n.rodadas;
  const silencio = n.silencioso.activo;

  return (
    <>
      <ScreenHeader title="Notificaciones" subtitle="Elige qué quieres recibir" back="/configuracion" />
      <div className="flex-1 space-y-6 overflow-y-auto bg-white px-4 pb-8 pt-3">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Alertas en tu ruta</h2>
          <div className="mt-2 rounded-card border border-line">
            <Row label="Avisar de alertas cercanas" hint="Baches, accidentes, calles cerradas" checked={alertas} onChange={(v) => set({ alertas: v })} />
            {alertas && <div className="border-t border-line p-4"><p className="mb-2 text-sm font-semibold">Distancia de aviso</p><Segmented label="Distancia de aviso" value={String(n.radioM) as "200" | "500" | "1000"} onChange={(v) => set({ radioM: Number(v) as 200 | 500 | 1000 })} options={[{ value: "200", label: "200 m" }, { value: "500", label: "500 m" }, { value: "1000", label: "1 km" }]} /></div>}
            <button onClick={() => !subscription.active && setGate(true)} className="flex min-h-[60px] w-full items-center justify-between gap-3 border-t border-line px-4 text-left"><span><span className="block text-[15px] font-semibold">Alertas avanzadas</span><span className="block text-xs text-muted">Pronóstico de riesgo por hora y clima</span></span><span className="rounded bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700">{subscription.active ? "Activas" : "Premium"}</span></button>
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Cuenta y social</h2>
          <div className="mt-2 divide-y divide-line rounded-card border border-line">
            <Row label="Estado de mis reportes" hint="Cuando el municipio los revise o atienda" checked={n.estado} onChange={(v) => set({ estado: v })} />
            <Row label="Solicitudes de amistad" checked={n.amistad} onChange={(v) => set({ amistad: v })} />
            <Row label="Actividad de amigos" hint="Cuando un amigo termina una rodada" checked={n.actividad} onChange={(v) => set({ actividad: v })} />
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Rodadas grupales</h2>
          <div className="mt-2 rounded-card border border-line">
            <Row label="Recordatorios de rodadas" checked={rodadas} onChange={(v) => set({ rodadas: v })} />
            {rodadas && <div className="border-t border-line p-4"><p className="mb-2 text-sm font-semibold">Avisarme</p><Segmented label="Recordatorio" value={n.anticipacionMin === 1440 ? "1d" : "1h"} onChange={(v) => set({ anticipacionMin: v === "1d" ? 1440 : 60 })} options={[{ value: "1d", label: "1 día antes" }, { value: "1h", label: "1 hora antes" }]} /></div>}
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Horario silencioso</h2>
          <div className="mt-2 rounded-card border border-line">
            <Row label="No molestar" hint="Excepto alertas de tu ruta mientras ruedas" checked={silencio} onChange={(v) => setQuiet({ activo: v })} />
            {silencio && <div className="grid grid-cols-2 gap-3 border-t border-line p-4"><Input label="De" type="time" value={n.silencioso.desde} onChange={(e) => e.target.value && setQuiet({ desde: e.target.value })} /><Input label="A" type="time" value={n.silencioso.hasta} onChange={(e) => e.target.value && setQuiet({ hasta: e.target.value })} /></div>}
          </div>
        </section>
      </div>
      <PremiumGate open={gate} feature="Las alertas avanzadas" onClose={() => setGate(false)} />
    </>
  );
}
