import { Check, X } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

const yes = ["Baches, obras o calles cerradas que viste en el camino", "Autos a alta velocidad o conductores agresivos en un punto concreto", "Falta de iluminación en un tramo", "Accidentes o robos en los que estuviste presente o que viste ocurrir", "Una calle que ya fue arreglada (con \"Ya no está\")"];
const no = ["Datos personales de otras personas: nombres, placas o rostros", "Rumores o cosas que no viste con tus propios ojos", "Insultos, acusaciones o contenido ofensivo", "Lo mismo varias veces: mejor confirma el reporte existente", "Emergencias en curso: llama primero al 911"];

export default function ReglasReportesPage() {
  return (
    <>
      <ScreenHeader title="Reglas de reporte" subtitle="Qué sí y qué no reportar" back="/ayuda" />
      <div className="flex-1 overflow-y-auto bg-white px-4 pb-8 pt-3">
        <p className="text-[15px]">Los reportes ayudan a todas las personas que ruedan y pueden llegar al municipio. Mientras más claros y verídicos, más rápido se atienden.</p>
        <h2 className="mt-6 text-lg font-bold">Sí reportes</h2>
        <ul className="mt-2 space-y-3">{yes.map((t) => <li key={t} className="flex gap-3 text-[15px]"><Check size={20} className="mt-0.5 shrink-0 text-brand-600" strokeWidth={3} />{t}</li>)}</ul>
        <h2 className="mt-6 text-lg font-bold">No reportes</h2>
        <ul className="mt-2 space-y-3">{no.map((t) => <li key={t} className="flex gap-3 text-[15px]"><X size={20} className="mt-0.5 shrink-0 text-risk-red" strokeWidth={3} />{t}</li>)}</ul>
        <p className="mt-6 rounded-card bg-canvas p-4 text-sm text-muted">Podemos retirar reportes falsos o repetidos y limitar la cuenta de quien los envíe de forma reiterada. Si ves un reporte inapropiado, puedes avisarnos desde su detalle.</p>
      </div>
    </>
  );
}
