import { Bike, Car, Construction, Lightbulb, ShieldAlert } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";

const factors = [
  { i: Car, t: "Tráfico y velocidad vehicular", d: "Avenidas rápidas y con mucho tráfico bajan el puntaje; calles tranquilas lo suben." },
  { i: ShieldAlert, t: "Robo o asalto", d: "Reportes recientes de la comunidad en la zona de tu ruta." },
  { i: Lightbulb, t: "Iluminación", d: "Tramos oscuros pesan más de noche." },
  { i: Construction, t: "Estado del pavimento", d: "Baches y obras reportados en el camino." },
  { i: Bike, t: "Presencia de ciclovía", d: "Mientras más del recorrido sea ciclovía confinada, mejor." },
];

export default function SafetyScoreHelpPage() {
  return (
    <>
      <ScreenHeader title="El Safety Score" subtitle="Cómo se calcula" back="/ayuda" />
      <div className="flex-1 overflow-y-auto bg-white px-4 pb-8 pt-3">
        <p className="text-[15px]">Cada ruta recibe una calificación de 0 a 100. Mientras más alta, menos riesgos encontrarás en el camino. Es una estimación con datos de la comunidad, no una garantía.</p>

        <h2 className="mt-6 text-lg font-bold">Cómo leerlo</h2>
        <div className="mt-3 space-y-3">
          {[
            { s: 88, t: "80 a 100", d: "Ruta segura. Pocos riesgos reportados." },
            { s: 72, t: "60 a 79", d: "Con precaución. Hay tramos con riesgo medio." },
            { s: 44, t: "Menos de 60", d: "Riesgosa. Considera otra opción si puedes." },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-4 rounded-card border border-line p-3">
              <SafetyScoreBadge score={x.s} size="md" />
              <div><p className="font-bold">{x.t}</p><p className="text-sm text-muted">{x.d}</p></div>
            </div>
          ))}
        </div>

        <h2 className="mt-6 text-lg font-bold">Qué mide</h2>
        <ul className="mt-3 space-y-4">
          {factors.map(({ i: Icon, t, d }) => (
            <li key={t} className="flex gap-3"><Icon size={22} className="mt-0.5 shrink-0 text-brand-600" /><div><p className="font-semibold">{t}</p><p className="text-sm text-muted">{d}</p></div></li>
          ))}
        </ul>

        <h2 className="mt-6 text-lg font-bold">El mapa de riesgo</h2>
        <p className="mt-1 text-[15px]">Muestra dónde hay más reportes. Va de verde (riesgo bajo) a rojo (riesgo alto). Tu ruta toma esos colores para que veas qué tramos cuidar.</p>
        <div className="mt-3 h-4 rounded-full" style={{ background: "linear-gradient(to right, #13896F, #F2C94C, #E8833A, #D64545)" }} role="img" aria-label="Escala de verde a rojo" />
        <div className="mt-1 flex justify-between text-xs text-muted"><span>Riesgo bajo</span><span>Riesgo alto</span></div>
      </div>
    </>
  );
}
