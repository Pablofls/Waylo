"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { PremiumGate } from "@/components/domain/PremiumGate";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";

export default function PreferenciasRutaPage() {
  const router = useRouter();
  const { me, updateMe, subscription } = useSocial();
  const [pref, setPref] = useState(me.routePreference);
  const [extra, setExtra] = useState(me.maxExtraMinutes);
  const [avoidRisk, setAvoidRisk] = useState(true);
  const [avoidDark, setAvoidDark] = useState(true);
  const [avoidFast, setAvoidFast] = useState(false);
  const [bikeLane, setBikeLane] = useState(true);
  const [gate, setGate] = useState(false);

  const text = pref < 34 ? "Prioriza llegar rápido, aunque pases por calles con más riesgo." : pref < 67 ? "Equilibra tiempo y seguridad en cada trayecto." : "Prioriza ciclovías y calles tranquilas, aunque tardes más.";
  const save = () => { updateMe({ routePreference: pref, maxExtraMinutes: extra }); router.push("/configuracion"); };

  const Row = ({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex min-h-[60px] items-center justify-between gap-3 pl-4"><span><span className="block text-[15px] font-semibold">{label}</span><span className="block text-xs text-muted">{hint}</span></span><Toggle label={label} checked={checked} onChange={onChange} /></div>
  );

  return (
    <>
      <ScreenHeader title="Preferencias de ruta" back="/configuracion" />
      <div className="flex-1 overflow-y-auto bg-white px-4 pb-6 pt-3">
        <div className="rounded-card border border-line p-4">
          <div className="flex justify-between text-sm font-bold"><span>Más rápida</span><span className="text-brand-600">Más segura</span></div>
          <Slider label="Preferencia entre rápida y segura" value={pref} onChange={setPref} />
          <p className="text-sm text-muted">{text}</p>
        </div>
        <div className="mt-4 rounded-card border border-line p-4">
          <p className="text-sm font-bold">Minutos extra que aceptarías</p>
          <div className="mt-3 flex items-center justify-between">
            <button aria-label="Menos minutos" onClick={() => setExtra(Math.max(0, extra - 5))} className="flex h-12 w-12 items-center justify-center rounded-full border border-line"><Minus size={22} /></button>
            <p className="metric text-6xl">{extra}<span className="ml-1 font-display text-2xl font-semibold text-muted">min</span></p>
            <button aria-label="Más minutos" onClick={() => setExtra(Math.min(30, extra + 5))} className="flex h-12 w-12 items-center justify-center rounded-full border border-line"><Plus size={22} /></button>
          </div>
        </div>
        <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-muted">Evitar</h2>
        <div className="mt-2 divide-y divide-line rounded-card border border-line">
          <Row label="Zonas de riesgo alto" hint="Sectores en rojo del mapa" checked={avoidRisk} onChange={setAvoidRisk} />
          <Row label="Calles sin iluminación de noche" hint="Después de las 7 p. m." checked={avoidDark} onChange={setAvoidDark} />
          <Row label="Vías rápidas sin ciclovía" hint="Más de 50 km/h" checked={avoidFast} onChange={setAvoidFast} />
        </div>
        <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-muted">Preferir</h2>
        <div className="mt-2 divide-y divide-line rounded-card border border-line">
          <Row label="Ciclovías confinadas" hint="Aunque la ruta sea más larga" checked={bikeLane} onChange={setBikeLane} />
          <button onClick={() => !subscription.active && setGate(true)} className="flex min-h-[60px] w-full items-center justify-between gap-3 px-4 text-left">
            <span><span className="block text-[15px] font-semibold">Rutas personalizadas</span><span className="block text-xs text-muted">Aprende de tus recorridos habituales</span></span>
            <span className="rounded bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700">{subscription.active ? "Activa" : "Premium"}</span>
          </button>
        </div>
      </div>
      <div className="pb-safe border-t border-line bg-white px-4 pt-3"><Button full size="lg" onClick={save}>Guardar preferencias</Button><div className="h-3" /></div>
      <PremiumGate open={gate} feature="Las rutas personalizadas" onClose={() => setGate(false)} />
    </>
  );
}
