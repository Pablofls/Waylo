"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Scooter, Briefcase, Trees, LocateFixed, Minus, Plus, ShieldCheck, BellRing, Check } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Stepper } from "@/components/ui/Stepper";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import type { MainUse, Vehicle } from "@/types";

const TOTAL = 5;

function Option({ selected, onClick, icon, title, text }: { selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; text: string }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex min-h-[76px] w-full items-center gap-4 rounded-card border-2 px-4 text-left ${selected ? "border-brand-600 bg-brand-100" : "border-line bg-white"}`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${selected ? "bg-brand-600 text-white" : "bg-canvas text-ink"}`}>{icon}</span>
      <span className="flex-1">
        <span className="block text-base font-bold">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
      {selected && <Check size={22} className="text-brand-600" strokeWidth={3} />}
    </button>
  );
}

export default function RegistroPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState<Vehicle>("bicicleta");
  const [use, setUse] = useState<MainUse>("transporte");
  const [pref, setPref] = useState(70);
  const [extra, setExtra] = useState(10);

  const finish = () => router.push("/inicio");
  const next = () => (step < TOTAL ? setStep(step + 1) : finish());
  const prefText = pref < 34 ? "Prioriza llegar rápido, aunque pases por calles con más riesgo." : pref < 67 ? "Equilibra tiempo y seguridad en cada trayecto." : "Prioriza ciclovías y calles tranquilas, aunque tardes más.";

  return (
    <>
      <ScreenHeader title="Crear cuenta" back={step === 1 ? "/login" : undefined} />
      <div className="px-4 pb-2">
        <Stepper step={step} total={TOTAL} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-5">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Cuéntanos de ti</h2>
            <Input label="Nombre completo" autoComplete="name" defaultValue="Daniela Garza" />
            <Input label="Correo electrónico" type="email" autoComplete="email" defaultValue="daniela.garza@correo.com" />
            <Input label="Contraseña" type="password" autoComplete="new-password" defaultValue="waylo2026" hint="Mínimo 8 caracteres." />
          </div>
        )}

        {step === 2 && (
          <div role="radiogroup" aria-label="Vehículo" className="space-y-3">
            <h2 className="text-2xl font-bold">¿En qué te mueves?</h2>
            <Option selected={vehicle === "bicicleta"} onClick={() => setVehicle("bicicleta")} icon={<Bike size={24} />} title="Bicicleta" text="Urbana, de ruta o de montaña" />
            <Option selected={vehicle === "scooter"} onClick={() => setVehicle("scooter")} icon={<Scooter size={24} />} title="Scooter" text="Eléctrico o de patada" />
            <Option selected={vehicle === "ambos"} onClick={() => setVehicle("ambos")} icon={<Bike size={24} />} title="Ambos" text="Cambio según el día" />
          </div>
        )}

        {step === 3 && (
          <div role="radiogroup" aria-label="Uso principal" className="space-y-3">
            <h2 className="text-2xl font-bold">¿Para qué la usas más?</h2>
            <Option selected={use === "transporte"} onClick={() => setUse("transporte")} icon={<Briefcase size={24} />} title="Transporte" text="Ir a la escuela, al trabajo o a hacer mandados" />
            <Option selected={use === "recreativo"} onClick={() => setUse("recreativo")} icon={<Trees size={24} />} title="Recreativo" text="Rodadas, ejercicio y paseo" />
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold">Tu preferencia de ruta</h2>
            <p className="mt-1 text-sm text-muted">Waylo propondrá primero las rutas que mejor se ajusten. Puedes cambiarlo después.</p>
            <div className="mt-6 rounded-card border border-line p-4">
              <div className="flex justify-between text-sm font-bold">
                <span>Más rápida</span>
                <span className="text-brand-600">Más segura</span>
              </div>
              <Slider label="Preferencia entre rápida y segura" value={pref} onChange={setPref} />
              <p className="text-sm text-muted">{prefText}</p>
            </div>
            <div className="mt-4 rounded-card border border-line p-4">
              <p className="text-sm font-bold">Minutos extra que aceptarías</p>
              <p className="text-sm text-muted">Tope máximo para elegir una ruta más segura.</p>
              <div className="mt-3 flex items-center justify-between">
                <button aria-label="Menos minutos" onClick={() => setExtra(Math.max(0, extra - 5))} className="flex h-12 w-12 items-center justify-center rounded-full border border-line active:bg-canvas"><Minus size={22} /></button>
                <p className="metric text-6xl">{extra}<span className="ml-1 font-display text-2xl font-semibold text-muted">min</span></p>
                <button aria-label="Más minutos" onClick={() => setExtra(Math.min(30, extra + 5))} className="flex h-12 w-12 items-center justify-center rounded-full border border-line active:bg-canvas"><Plus size={22} /></button>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600"><LocateFixed size={32} /></span>
            <h2 className="mt-4 text-2xl font-bold">Activa tu ubicación</h2>
            <p className="mt-1 text-muted">La usamos solo mientras la app está abierta, para estas tres cosas:</p>
            <ul className="mt-5 space-y-4">
              {[
                { i: <ShieldCheck size={22} />, t: "Calcular rutas seguras", d: "Desde donde estás hasta tu destino." },
                { i: <BellRing size={22} />, t: "Avisarte de alertas cercanas", d: "Baches, accidentes o calles cerradas en tu camino." },
                { i: <LocateFixed size={22} />, t: "Registrar tus rodadas", d: "Tu recorrido, tiempo y distancia. Tú decides cuándo empezar." },
              ].map((x) => (
                <li key={x.t} className="flex gap-3">
                  <span className="mt-0.5 text-brand-600">{x.i}</span>
                  <div>
                    <p className="font-semibold">{x.t}</p>
                    <p className="text-sm text-muted">{x.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="pb-safe space-y-1 border-t border-line bg-white px-4 pt-3">
        {step < TOTAL ? (
          <Button full size="lg" onClick={next}>Continuar</Button>
        ) : (
          <>
            <Button
              full
              size="lg"
              onClick={() => {
                navigator.geolocation?.getCurrentPosition(finish, finish, { timeout: 8000 });
                if (!navigator.geolocation) finish();
              }}
            >
              Permitir ubicación
            </Button>
            <Button full variant="ghost" onClick={finish}>Ahora no</Button>
          </>
        )}
        {step > 1 && <Button full variant="ghost" onClick={() => setStep(step - 1)}>Atrás</Button>}
        <div className="h-2" />
      </div>
    </>
  );
}
