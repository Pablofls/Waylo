import type { Feature, LineString } from "geojson";
import type { LngLat } from "@/types";

export const line = (coordinates: LngLat[]): Feature<LineString> => ({
  type: "Feature",
  properties: {},
  geometry: { type: "LineString", coordinates },
});

export function distanceKm(a: LngLat, b: LngLat) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bounds(coords: LngLat[]): [LngLat, LngLat] {
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}

/** Interpola la ruta para que la simulación se mueva de forma suave. */
export function densify(coords: LngLat[], stepsPerSegment = 40): LngLat[] {
  const out: LngLat[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      out.push([coords[i][0] + (coords[i + 1][0] - coords[i][0]) * t, coords[i][1] + (coords[i + 1][1] - coords[i][1]) * t]);
    }
  }
  out.push(coords[coords.length - 1]);
  return out;
}

/** Centro del Área Metropolitana de Monterrey [lng, lat]. */
export const MONTERREY_CENTER: LngLat = [-100.3161, 25.6866];

/** Rumbo inicial en grados (0-359) de `a` hacia `b`. */
export function bearing(a: LngLat, b: LngLat): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b[0] - a[0])) * Math.cos(toRad(b[1]));
  const x = Math.cos(toRad(a[1])) * Math.sin(toRad(b[1])) - Math.sin(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.cos(toRad(b[0] - a[0]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Avance (0-1) de `p` sobre un trazo y distancia (km) al punto más cercano del trazo. */
export function routeProgress(p: LngLat, coords: LngLat[]): { fraction: number; offKm: number } {
  if (coords.length < 2) return { fraction: 0, offKm: 0 };
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + distanceKm(coords[i - 1], coords[i]));
  const total = cum[cum.length - 1] || 1;
  // Proyección plana sobre cada tramo (suficiente a escala de ciudad).
  const kx = Math.cos((p[1] * Math.PI) / 180);
  let best = { fraction: 0, offKm: Infinity };
  for (let i = 1; i < coords.length; i++) {
    const [ax, ay] = [coords[i - 1][0] * kx, coords[i - 1][1]];
    const [bx, by] = [coords[i][0] * kx, coords[i][1]];
    const [px, py] = [p[0] * kx, p[1]];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const q: LngLat = [(ax + t * dx) / kx, ay + t * dy];
    const off = distanceKm(p, q);
    if (off < best.offKm) best = { offKm: off, fraction: (cum[i - 1] + t * (cum[i] - cum[i - 1])) / total };
  }
  return best;
}
