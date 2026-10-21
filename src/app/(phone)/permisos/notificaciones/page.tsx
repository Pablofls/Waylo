"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CalendarDays, ClipboardList, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PermisoNotificacionesPage() {
  const router = useRouter();
  const [denied, setDenied] = useState(false);

  const allow = async () => {
    try {
      if ("Notification" in window) {
        const r = await Notification.requestPermission();
        if (r === "denied") return setDenied(true);
      }
    } catch {
      /* el navegador no admite notificaciones */
    }
    router.push("/inicio");
  };

  return (
    <div className="pt-safe pb-safe flex flex-1 flex-col bg-white px-6">
      <div className="flex-1 overflow-y-auto pt-12">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600"><BellRing size={32} /></span>
        <h1 className="mt-4 text-3xl font-bold">Activa las notificaciones</h1>
        <p className="mt-2 text-muted">Te avisamos solo de lo que importa. Puedes ajustar cada tipo en Configuración.</p>
        <ul className="mt-6 space-y-4">
          {[
            { i: <TriangleAlert size={22} />, t: "Alertas en tu ruta", d: "Baches, accidentes o calles cerradas antes de que salgas." },
            { i: <ClipboardList size={22} />, t: "Estado de tus reportes", d: "Cuando el municipio los revise o los atienda." },
            { i: <CalendarDays size={22} />, t: "Rodadas y amigos", d: "Recordatorios de rodadas y solicitudes de amistad." },
          ].map((x) => (
            <li key={x.t} className="flex gap-3"><span className="mt-0.5 text-brand-600">{x.i}</span><div><p className="font-semibold">{x.t}</p><p className="text-sm text-muted">{x.d}</p></div></li>
          ))}
        </ul>
        {denied && <p role="alert" className="mt-6 rounded-xl bg-[#FCEBDD] p-4 text-sm font-semibold text-[#7A3F0C]">Las notificaciones están bloqueadas en este navegador. Puedes activarlas desde los permisos del sitio y seguir sin ellas por ahora.</p>}
      </div>
      <div className="space-y-1 pb-6">
        <Button full size="lg" onClick={allow}>Activar notificaciones</Button>
        <Button full variant="ghost" href="/inicio">Ahora no</Button>
      </div>
    </div>
  );
}
