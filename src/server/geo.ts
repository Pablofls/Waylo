import type { LngLat } from "@/types";

/** Coordenadas [lng, lat] de un GeoJSON LineString/Point que devuelve `ST_AsGeoJSON`. */
export function lineFromGeoJSON(json: string | null): LngLat[] {
  if (!json) return [];
  const g = JSON.parse(json) as { type: string; coordinates: unknown };
  if (g.type === "LineString") return (g.coordinates as number[][]).map((c) => [c[0], c[1]]);
  if (g.type === "Point") return [[(g.coordinates as number[])[0], (g.coordinates as number[])[1]]];
  return [];
}

export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
