"use client";

import { useState } from "react";
import { CheckCircle2, LocateOff } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "ok" | "denied" | "unavailable";

export default function PermisoUbicacionPage() {
  const [status, setStatus] = useState<Status>("idle");

  const retry = () => {
    if (!navigator.geolocation) return setStatus("unavailable");
    navigator.geolocation.getCurrentPosition(() => setStatus("ok"), () => setStatus("denied"), { timeout: 8000 });
  };

  return (
    <>
      <ScreenHeader title="Ubicación desactivada" back="/configuracion" />
      <div className="flex-1 overflow-y-auto bg-white px-4 pb-6 pt-3">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FCEBDD] text-[#A8530F]"><LocateOff size={30} /></span>
        <h2 className="mt-4 text-2xl font-bold">Necesitamos tu ubicación para grabar y avisarte de riesgos</h2>
        <p className="mt-2 text-muted">Sin ella no podemos mostrar tu posición, grabar tu rodada ni avisarte de alertas cercanas. Solo la usamos mientras la app está abierta.</p>

        <h3 className="mt-6 text-lg font-bold">Cómo activarla</h3>
        <ol className="mt-3 space-y-4">
          {[
            ["iPhone", "Ajustes, Privacidad y seguridad, Localización. Activa Servicios de localización y elige Waylo."],
            ["Android", "Ajustes, Ubicación. Activa la ubicación y en Permisos de apps elige Waylo."],
            ["Navegador", "Toca el candado junto a la dirección, Permisos y permite Ubicación para este sitio."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="metric flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg text-white">{i + 1}</span>
              <div><p className="font-semibold">{t}</p><p className="text-sm text-muted">{d}</p></div>
            </li>
          ))}
        </ol>

        {status === "ok" && <p role="status" className="mt-6 flex items-center gap-2 rounded-xl bg-brand-100 p-4 text-sm font-semibold text-brand-700"><CheckCircle2 size={20} />Listo, ya tenemos acceso a tu ubicación.</p>}
        {status === "denied" && <p role="alert" className="mt-6 rounded-xl bg-[#F9E1E1] p-4 text-sm font-semibold text-[#B02E2E]">Sigue desactivada. Revisa los pasos de arriba y vuelve a intentar.</p>}
        {status === "unavailable" && <p role="alert" className="mt-6 rounded-xl bg-[#F9E1E1] p-4 text-sm font-semibold text-[#B02E2E]">Este dispositivo no admite geolocalización. Puedes usar el modo simulación al comenzar.</p>}
      </div>
      <div className="pb-safe space-y-2 border-t border-line bg-white px-4 pt-3">
        <Button full size="lg" onClick={retry}>Volver a intentar</Button>
        <Button full variant="ghost" href="/rodada">Usar modo simulación</Button>
        <div className="h-1" />
      </div>
    </>
  );
}
