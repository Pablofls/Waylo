import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Logo } from "@/components/layout/Logo";

export default function AcercaDePage() {
  return (
    <>
      <ScreenHeader title="Acerca de Waylo" back="/configuracion" />
      <div className="flex-1 overflow-y-auto bg-white px-4 pb-8 pt-6">
        <div className="text-center">
          <Logo size="xl" />
          <p className="mt-2 font-display text-xl font-bold uppercase text-muted">Llega seguro</p>
          <p className="mt-1 text-sm text-muted">Versión 0.1 · Prototipo</p>
        </div>
        <p className="mt-6 text-[15px]">Waylo ayuda a quienes se mueven en bici o scooter en el Área Metropolitana de Monterrey a llegar seguros, con rutas calificadas por riesgo y reportes de la comunidad.</p>
        <p className="mt-3 text-[15px] text-muted">Proyecto universitario desarrollado en la Universidad de Monterrey (UDEM).</p>
        <ul className="mt-6 divide-y divide-line rounded-card border border-line">
          {[{ h: "/legal/terminos", l: "Términos y condiciones" }, { h: "/legal/privacidad", l: "Aviso de privacidad" }, { h: "/acerca-de/licencias", l: "Licencias de código abierto" }, { h: "/ayuda/comentarios", l: "Enviar comentarios" }].map((x) => (
            <li key={x.h}><Link href={x.h} className="flex min-h-[56px] items-center px-4"><span className="flex-1 text-[15px] font-semibold">{x.l}</span><ChevronRight size={18} className="text-muted" /></Link></li>
          ))}
        </ul>
      </div>
    </>
  );
}
