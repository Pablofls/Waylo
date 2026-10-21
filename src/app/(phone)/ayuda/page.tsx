"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Gauge, LifeBuoy, Search } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui/States";

const faqs = [
  { q: "¿Qué es el Safety Score?", a: "Es una calificación de 0 a 100 de qué tan segura es una ruta. Combina tráfico y velocidad vehicular, robos, iluminación, estado del pavimento y presencia de ciclovía." },
  { q: "¿Por qué una ruta segura tarda más?", a: "Las rutas seguras prefieren ciclovías y calles tranquilas, que a veces son más largas. Tú defines cuántos minutos extra aceptas en Configuración, Preferencias de ruta." },
  { q: "¿Cómo envío un reporte?", a: "Toca el botón rojo durante una rodada, o Reportar en el mapa. Un toque guarda el reporte con tu ubicación; puedes completarlo con foto y detalles después." },
  { q: "¿Qué pasa con mis reportes?", a: "Se muestran a la comunidad y pueden enviarse al municipio. En Mis reportes ves su estado: Enviado, En revisión o Atendido." },
  { q: "¿Waylo usa mi ubicación todo el tiempo?", a: "No. Solo la usa mientras la app está abierta, para mostrar tu posición, grabar tu rodada y avisarte de alertas cercanas." },
  { q: "¿Cómo agrego amigos?", a: "Entra a Amigos desde Inicio, busca por nombre, ciudad o correo y toca Agregar. También puedes invitar con un enlace." },
  { q: "¿Qué es una rodada grupal?", a: "Es un punto de encuentro con fecha y hora. Cada persona registra su propio recorrido al salir." },
  { q: "¿Puedo cancelar Premium?", a: "Sí, en cualquier momento desde Perfil, Waylo Premium. Conservas los beneficios hasta el final del periodo pagado." },
];

export default function AyudaPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const list = faqs.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <ScreenHeader title="Ayuda" subtitle="Preguntas frecuentes" back="/configuracion" />
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="p-4 pb-2">
          <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-line px-4 focus-within:border-brand-600">
            <Search size={20} className="text-muted" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(null); }} aria-label="Buscar en la ayuda" placeholder="Buscar en la ayuda" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8A929C]" />
          </div>
        </div>
        <Link href="/ayuda/safety-score" className="mx-4 mt-2 flex min-h-[64px] items-center gap-3 rounded-card bg-brand-100 px-4 text-brand-700">
          <Gauge size={24} /><span className="flex-1"><span className="block font-bold">Cómo se calcula el Safety Score</span><span className="block text-sm">Guía rápida con ejemplos</span></span><ChevronRight size={20} />
        </Link>
        {list.length === 0 ? (
          <EmptyState title="Sin resultados" text="Prueba con otras palabras o escríbenos y te ayudamos." />
        ) : (
          <ul className="mt-3 border-t border-line">
            {list.map((f, i) => (
              <li key={f.q} className="border-b border-line">
                <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left">
                  <span className="flex-1 text-[15px] font-semibold">{f.q}</span>
                  <ChevronDown size={20} className={`shrink-0 text-muted transition-transform ${open === i ? "rotate-180" : ""}`} />
                </button>
                {open === i && <p className="px-4 pb-4 text-[15px] text-muted">{f.a}</p>}
              </li>
            ))}
          </ul>
        )}
        <Link href="/ayuda/contacto" className="m-4 flex min-h-[56px] items-center gap-3 rounded-card border border-line px-4">
          <LifeBuoy size={22} className="text-brand-600" /><span className="flex-1 font-semibold">¿No encontraste tu respuesta? Escríbenos</span><ChevronRight size={18} className="text-muted" />
        </Link>
      </div>
    </>
  );
}
