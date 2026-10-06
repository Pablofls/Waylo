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
