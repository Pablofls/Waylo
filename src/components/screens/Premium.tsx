"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";

const rows: { label: string; free: boolean; premium: boolean }[] = [
  { label: "Rutas con Safety Score", free: true, premium: true },
  { label: "Alertas en tu ruta", free: true, premium: true },
  { label: "Reportes de la comunidad", free: true, premium: true },
  { label: "Envío de reportes al municipio", free: true, premium: true },
  { label: "Sin anuncios", free: false, premium: true },
  { label: "Mapas sin conexión", free: false, premium: true },
  { label: "Rutas personalizadas", free: false, premium: true },
  { label: "Alertas avanzadas", free: false, premium: true },
  { label: "Historial de seguridad por zona", free: false, premium: true },
];

function Mark({ on }: { on: boolean }) {
  return on ? <Check size={20} className="mx-auto text-brand-600" strokeWidth={3} aria-label="Incluido" /> : <Minus size={20} className="mx-auto text-[#A3ABB4]" aria-label="No incluido" />;
}

export function Premium() {
  const [plan, setPlan] = useState<"normal" | "estudiante">("estudiante");
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <header className="pt-safe bg-brand-900 px-4 pb-6 text-white">
        <p className="pt-5 font-display text-lg font-semibold uppercase tracking-wide text-brand-100">Waylo Premium</p>
        <h1 className="mt-1 max-w-[300px] text-3xl font-bold leading-tight">Más herramientas para llegar seguro</h1>
      </header>

      <section className="px-4 pt-5">
        <div className="grid grid-cols-[1fr_64px_72px] items-end pb-2 text-xs font-bold uppercase tracking-wide text-muted">
          <span />
          <span className="text-center">Gratis</span>
          <span className="text-center text-brand-600">Premium</span>
        </div>
        <ul className="border-t border-line">
          {rows.map((r) => (
            <li key={r.label} className="grid min-h-[52px] grid-cols-[1fr_64px_72px] items-center border-b border-line">
              <span className="pr-2 text-[15px]">{r.label}</span>
              <Mark on={r.free} />
              <span className="flex h-full items-center bg-brand-100/60"><span className="w-full"><Mark on={r.premium} /></span></span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 px-4 py-6" role="radiogroup" aria-label="Plan">
        {[
          { id: "normal" as const, name: "Mensual", price: 79, note: "Cancela cuando quieras" },
          { id: "estudiante" as const, name: "Tarifa estudiantil", price: 49, note: "Con credencial vigente" },
        ].map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={plan === p.id}
            onClick={() => setPlan(p.id)}
            className={`flex min-h-[76px] w-full items-center justify-between rounded-card border-2 px-4 text-left ${plan === p.id ? "border-brand-600 bg-brand-100" : "border-line"}`}
          >
            <span>
              <span className="block font-bold">{p.name}</span>
              <span className="block text-sm text-muted">{p.note}</span>
            </span>
            <span className="text-right">
              <span className="metric text-4xl">${p.price}</span>
              <span className="block text-xs text-muted">MXN al mes</span>
            </span>
          </button>
        ))}
        <Button full size="lg">Continuar con Premium</Button>
        <p className="text-center text-xs text-muted">Pago simulado en esta versión. No se realiza ningún cargo.</p>
      </section>
    </div>
  );
}
