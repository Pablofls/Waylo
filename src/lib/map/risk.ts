import type { FeatureCollection, Point } from "geojson";
import type { LngLat } from "@/types";
import { distanceKm } from "./geo";

/** Color de ruta por defecto: azul, fuera de la escala de riesgo (verde, amarillo, naranja, rojo). */
export const ROUTE_COLOR = "#1F5FBF";

const SCALE: { at: number; rgb: [number, number, number] }[] = [
  { at: 0, rgb: [19, 137, 111] }, // verde (riesgo bajo)
  { at: 0.3, rgb: [242, 201, 76] }, // amarillo
  { at: 0.6, rgb: [232, 131, 58] }, // naranja
  { at: 1, rgb: [214, 69, 69] }, // rojo
];

export function riskColor(r: number): string {
  const x = Math.max(0, Math.min(1, r));
  for (let i = 1; i < SCALE.length; i++) {
    if (x <= SCALE[i].at) {
      const a = SCALE[i - 1];
      const b = SCALE[i];
      const t = (x - a.at) / (b.at - a.at);
      const c = a.rgb.map((v, k) => Math.round(v + (b.rgb[k] - v) * t));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return "rgb(214,69,69)";
}

const SIGMA_KM = 0.35;
const SATURATION = 2.2;

/** Riesgo 0-1 en un punto según la cercanía y el peso de los puntos de riesgo. */
export function riskAt(p: LngLat, risk: FeatureCollection<Point>): number {
  let sum = 0;
  for (const f of risk.features) {
    const c = f.geometry.coordinates as LngLat;
    if (Math.abs(c[0] - p[0]) > 0.02 || Math.abs(c[1] - p[1]) > 0.02) continue;
    const d = distanceKm(p, c);
    const w = (f.properties as { weight?: number } | null)?.weight ?? 0.5;
    sum += w * Math.exp(-((d / SIGMA_KM) ** 2));
  }
  return Math.min(1, sum / SATURATION);
}

/** Expresión `line-gradient` de MapLibre: el color de la ruta cambia según el riesgo en cada tramo. */
export function riskGradient(coords: LngLat[], risk: FeatureCollection<Point>, samples = 70): unknown[] | null {
  if (coords.length < 2) return null;
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + distanceKm(coords[i - 1], coords[i]));
  const total = cum[cum.length - 1];
  if (total < 0.01) return null;

  const pts: LngLat[] = [];
  let j = 0;
  for (let s = 0; s < samples; s++) {
    const d = (s / (samples - 1)) * total;
    while (j < coords.length - 2 && cum[j + 1] < d) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const t = Math.min(1, Math.max(0, (d - cum[j]) / seg));
    pts.push([coords[j][0] + (coords[j + 1][0] - coords[j][0]) * t, coords[j][1] + (coords[j + 1][1] - coords[j][1]) * t]);
  }
  const raw = pts.map((p) => riskAt(p, risk));
  const smooth = raw.map((_, i) => {
    const a = raw[Math.max(0, i - 1)], b = raw[i], c = raw[Math.min(raw.length - 1, i + 1)];
    return (a + b * 2 + c) / 4;
  });
  const stops = smooth.flatMap((r, i) => [i / (samples - 1), riskColor(r)]);
  return ["interpolate", ["linear"], ["line-progress"], ...stops];
}
