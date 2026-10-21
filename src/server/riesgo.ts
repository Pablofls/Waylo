import type { FeatureCollection, Point } from "geojson";
import { query } from "./db";
import type { RiskPointProps } from "@/types";

/**
 * Puntos de riesgo para el mapa de calor y el aviso en rodadas libres: reportes vigentes de los últimos 90 días,
 * con el peso de su categoría (normalizado a 0-1). No incluye autoría.
 */
export async function puntosDeRiesgo(): Promise<FeatureCollection<Point, RiskPointProps>> {
  const rows = await query<{ lng: number; lat: number; peso: number }>(
    `SELECT ST_X(r.geog::geometry) AS lng, ST_Y(r.geog::geometry) AS lat, (c.peso_riesgo / 3.0)::float AS peso
     FROM reporte r JOIN cat_categoria_reporte c ON c.clave = r.categoria_clave
     WHERE r.cancelado_en IS NULL AND r.creado_en > now() - interval '90 days'`,
  );
  return {
    type: "FeatureCollection",
    features: rows.map((r) => ({ type: "Feature", properties: { weight: Math.min(1, Number(r.peso)) }, geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] } })),
  };
}
