import type { RouteOption } from "@/types";

// Trazos aproximados San Nicolás -> UANL CU. En fase 3 vendrán de OpenRouteService.
export const mockRoutes: RouteOption[] = [
  {
    id: "rapida",
    label: "Más rápida",
    minutes: 24,
    km: 6.1,
    safetyScore: 58,
    extraMinutes: 0,
    via: "Av. Universidad",
    summary:
      "Recorre casi todo el trayecto por Av. Universidad, con tráfico pesado y a más de 60 km/h en horas pico.",
    coordinates: [
      [-100.286, 25.7475], [-100.2905, 25.744], [-100.2955, 25.7395], [-100.3, 25.735],
      [-100.305, 25.731], [-100.3085, 25.7275], [-100.311, 25.7245],
    ],
    factors: [
      { key: "trafico", label: "Tráfico y velocidad vehicular", score: 38, explanation: "Avenida de 4 carriles con límite de 60 km/h y 11 reportes de autos a alta velocidad este mes." },
      { key: "robo", label: "Robo o asalto", score: 62, explanation: "Dos reportes de asalto en los últimos 30 días cerca del cruce con Av. Sendero." },
      { key: "iluminacion", label: "Iluminación", score: 70, explanation: "Alumbrado público continuo, con un tramo oscuro de 400 m bajo el puente." },
      { key: "pavimento", label: "Estado del pavimento", score: 55, explanation: "Seis baches reportados, tres de ellos en el carril derecho." },
      { key: "ciclovia", label: "Presencia de ciclovía", score: 20, explanation: "Sin ciclovía; se comparte carril con autos y camiones." },
    ],
  },
  {
    id: "equilibrada",
    label: "Equilibrada",
    minutes: 27,
    km: 6.6,
    safetyScore: 76,
    extraMinutes: 3,
    via: "Av. Fidel Velázquez y calles locales",
    summary:
      "Evita el tramo más peligroso de Av. Universidad usando calles locales con menor velocidad y mejor iluminación.",
    coordinates: [
      [-100.286, 25.7475], [-100.2885, 25.7425], [-100.2935, 25.7395], [-100.2985, 25.7345],
      [-100.3045, 25.7305], [-100.3095, 25.7265], [-100.311, 25.7245],
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
    minutes: 33,
    km: 7.4,
    safetyScore: 88,
    extraMinutes: 9,
    via: "Ciclovía de Av. Sendero y Paseo de los Leones",
    summary:
      "Prioriza ciclovías y calles con poca velocidad vehicular. Tarda 9 minutos más, dentro de tu tope de 10.",
    coordinates: [
      [-100.286, 25.7475], [-100.283, 25.743], [-100.2855, 25.737], [-100.2925, 25.7325],
      [-100.2995, 25.728], [-100.3055, 25.7235], [-100.3085, 25.7225], [-100.311, 25.7245],
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
