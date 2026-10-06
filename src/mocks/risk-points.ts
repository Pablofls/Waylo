import type { FeatureCollection, Point } from "geojson";
import type { RiskPointProps } from "@/types";

// Zonas de riesgo simuladas. Cada clúster se expande con ruido determinista.
const clusters: { c: [number, number]; n: number; spread: number; w: number }[] = [
  { c: [-100.3098, 25.67], n: 40, spread: 0.008, w: 0.8 }, // Centro de Monterrey
  { c: [-100.2855, 25.679], n: 22, spread: 0.007, w: 0.55 }, // Fundidora
  { c: [-100.3185, 25.6415], n: 18, spread: 0.007, w: 0.45 }, // Valle Oriente
  { c: [-100.3555, 25.6575], n: 16, spread: 0.007, w: 0.5 }, // San Pedro
  { c: [-100.4075, 25.6575], n: 34, spread: 0.005, w: 0.8 }, // Av. Morones Prieto, cerca de la UDEM
  { c: [-100.4145, 25.6595], n: 14, spread: 0.003, w: 0.6 }, // Entrada de la UDEM
  { c: [-100.2565, 25.677], n: 20, spread: 0.008, w: 0.6 }, // Guadalupe
];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const rand = rng(2026);

export const riskPoints: FeatureCollection<Point, RiskPointProps> = {
  type: "FeatureCollection",
  features: clusters.flatMap(({ c, n, spread, w }) =>
    Array.from({ length: n }, () => ({
      type: "Feature" as const,
      properties: { weight: Math.min(1, w * (0.5 + rand())) },
      geometry: {
        type: "Point" as const,
        coordinates: [c[0] + (rand() - 0.5) * spread * 2, c[1] + (rand() - 0.5) * spread * 2],
      },
    })),
  ),
};
