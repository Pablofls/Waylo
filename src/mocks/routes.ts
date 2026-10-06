import type { RouteOption } from "@/types";

// Ruta demo: casa (cerca de la UDEM) -> UDEM. Trazos aproximados; en fase 3 vendrán de OpenRouteService.
export const mockRoutes: RouteOption[] = [
  {
    id: "rapida",
    label: "Más rápida",
    minutes: 11,
    km: 2.4,
    safetyScore: 58,
    extraMinutes: 0,
    via: "Av. Morones Prieto",
    summary:
      "Recorre casi todo el trayecto por Av. Morones Prieto, con tráfico pesado y autos a más de 60 km/h en horas pico.",
    coordinates: [
      [-100.399, 25.654], [-100.403, 25.656], [-100.4075, 25.6575], [-100.412, 25.659], [-100.415, 25.6598], [-100.417, 25.6605],
    ],
    factors: [
      { key: "trafico", label: "Tráfico y velocidad vehicular", score: 38, explanation: "Avenida de varios carriles con límite de 60 km/h y 11 reportes de autos a alta velocidad este mes." },
      { key: "robo", label: "Robo o asalto", score: 62, explanation: "Dos reportes de asalto en los últimos 30 días cerca de la entrada a la universidad." },
      { key: "iluminacion", label: "Iluminación", score: 70, explanation: "Alumbrado público continuo, con un tramo oscuro de 300 m antes de llegar." },
      { key: "pavimento", label: "Estado del pavimento", score: 55, explanation: "Seis baches reportados, tres de ellos en el carril derecho." },
      { key: "ciclovia", label: "Presencia de ciclovía", score: 20, explanation: "Sin ciclovía; se comparte carril con autos y camiones." },
    ],
  },
  {
    id: "equilibrada",
    label: "Equilibrada",
    minutes: 13,
    km: 2.7,
    safetyScore: 76,
    extraMinutes: 2,
    via: "Calles locales del fraccionamiento",
    summary:
      "Evita el tramo más peligroso de Av. Morones Prieto usando calles locales con menor velocidad y mejor iluminación.",
    coordinates: [
      [-100.399, 25.654], [-100.4025, 25.6575], [-100.4075, 25.6595], [-100.4125, 25.6612], [-100.4155, 25.6612], [-100.417, 25.6605],
    ],
    factors: [
      { key: "trafico", label: "Tráfico y velocidad vehicular", score: 72, explanation: "Calles locales con límite de 40 km/h y poco tráfico pesado." },
      { key: "robo", label: "Robo o asalto", score: 74, explanation: "Un reporte de asalto en 30 días, en la parte final del trayecto." },
      { key: "iluminacion", label: "Iluminación", score: 80, explanation: "Buena iluminación en el 90 % del trayecto." },
      { key: "pavimento", label: "Estado del pavimento", score: 72, explanation: "Dos baches reportados, ambos señalados en el mapa." },
      { key: "ciclovia", label: "Presencia de ciclovía", score: 45, explanation: "Ciclovía en el 30 % del recorrido." },
    ],
  },
  {
    id: "segura",
    label: "Más segura",
    minutes: 15,
    km: 3.2,
    safetyScore: 88,
    extraMinutes: 4,
    via: "Calles tranquilas y ciclovía",
    summary:
      "Prioriza ciclovías y calles con poca velocidad vehicular. Tarda 4 minutos más, dentro de tu tope de 10.",
    coordinates: [
      [-100.399, 25.654], [-100.4, 25.6505], [-100.4045, 25.6495], [-100.41, 25.652], [-100.414, 25.656], [-100.416, 25.659], [-100.417, 25.6605],
    ],
    factors: [
      { key: "trafico", label: "Tráfico y velocidad vehicular", score: 90, explanation: "Casi todo el trayecto va separado del tráfico o por calles de 30 km/h." },
      { key: "robo", label: "Robo o asalto", score: 82, explanation: "Sin reportes de asalto en los últimos 45 días." },
      { key: "iluminacion", label: "Iluminación", score: 86, explanation: "Ciclovía con luminarias LED en toda su extensión." },
      { key: "pavimento", label: "Estado del pavimento", score: 85, explanation: "Pavimento en buen estado; un bache reportado ya está en revisión." },
      { key: "ciclovia", label: "Presencia de ciclovía", score: 95, explanation: "Ciclovía confinada en el 80 % del recorrido." },
    ],
  },
];
