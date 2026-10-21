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
  const { subscription } = useSocial();
  const [alertas, setAlertas] = useState(true);
  const [radio, setRadio] = useState<"200" | "500" | "1000">("500");
  const [estado, setEstado] = useState(true);
  const [amistad, setAmistad] = useState(true);
  const [rodadas, setRodadas] = useState(true);
  const [recordatorio, setRecordatorio] = useState<"1d" | "1h">("1h");
  const [actividad, setActividad] = useState(false);
  const [silencio, setSilencio] = useState(true);
  const [gate, setGate] = useState(false);

  return (
    <>
      <ScreenHeader title="Notificaciones" subtitle="Elige qué quieres recibir" back="/configuracion" />
      <div className="flex-1 space-y-6 overflow-y-auto bg-white px-4 pb-8 pt-3">
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Alertas en tu ruta</h2>
          <div className="mt-2 rounded-card border border-line">
            <Row label="Avisar de alertas cercanas" hint="Baches, accidentes, calles cerradas" checked={alertas} onChange={setAlertas} />
            {alertas && <div className="border-t border-line p-4"><p className="mb-2 text-sm font-semibold">Distancia de aviso</p><Segmented label="Distancia de aviso" value={radio} onChange={setRadio} options={[{ value: "200", label: "200 m" }, { value: "500", label: "500 m" }, { value: "1000", label: "1 km" }]} /></div>}
            <button onClick={() => !subscription.active && setGate(true)} className="flex min-h-[60px] w-full items-center justify-between gap-3 border-t border-line px-4 text-left"><span><span className="block text-[15px] font-semibold">Alertas avanzadas</span><span className="block text-xs text-muted">Pronóstico de riesgo por hora y clima</span></span><span className="rounded bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700">{subscription.active ? "Activas" : "Premium"}</span></button>
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Cuenta y social</h2>
          <div className="mt-2 divide-y divide-line rounded-card border border-line">
            <Row label="Estado de mis reportes" hint="Cuando el municipio los revise o atienda" checked={estado} onChange={setEstado} />
            <Row label="Solicitudes de amistad" checked={amistad} onChange={setAmistad} />
            <Row label="Actividad de amigos" hint="Cuando un amigo termina una rodada" checked={actividad} onChange={setActividad} />
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Rodadas grupales</h2>
          <div className="mt-2 rounded-card border border-line">
            <Row label="Recordatorios de rodadas" checked={rodadas} onChange={setRodadas} />
            {rodadas && <div className="border-t border-line p-4"><p className="mb-2 text-sm font-semibold">Avisarme</p><Segmented label="Recordatorio" value={recordatorio} onChange={setRecordatorio} options={[{ value: "1d", label: "1 día antes" }, { value: "1h", label: "1 hora antes" }]} /></div>}
          </div>
        </section>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Horario silencioso</h2>
          <div className="mt-2 rounded-card border border-line">
            <Row label="No molestar" hint="Excepto alertas de tu ruta mientras ruedas" checked={silencio} onChange={setSilencio} />
            {silencio && <div className="grid grid-cols-2 gap-3 border-t border-line p-4"><Input label="De" type="time" defaultValue="22:00" /><Input label="A" type="time" defaultValue="06:30" /></div>}
          </div>
        </section>
      </div>
      <PremiumGate open={gate} feature="Las alertas avanzadas" onClose={() => setGate(false)} />
    </>
  );
}
