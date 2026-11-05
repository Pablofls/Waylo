import { notFound } from "./api";
import { query } from "./db";
import { isUuid } from "./geo";
import type { FeatureCollection, Polygon } from "geojson";
import type { ReportCategory, Zone, ZoneShapeProps } from "@/types";

type Row = { zona_id: string; nombre: string; detalle: string | null; municipio: string; descripcion: string; latitud: number; longitud: number; score: number | null; tendencia: number | null };

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

async function armar(rows: Row[]): Promise<Zone[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.zona_id);
  const [mensual, tipos, horas] = await Promise.all([
    query<{ zona_id: string; mes: Date; score: number }>(`SELECT zona_id, mes, score FROM v_zona_seguridad_mensual WHERE zona_id = ANY($1::uuid[]) ORDER BY mes`, [ids]),
    query<{ zona_id: string; categoria_clave: ReportCategory; reportes: number }>(`SELECT zona_id, categoria_clave, reportes FROM v_zona_reporte_categoria WHERE zona_id = ANY($1::uuid[]) ORDER BY reportes DESC`, [ids]),
    query<{ zona_id: string; etiqueta: string; riesgo: number }>(
      `SELECT h.zona_id, h.etiqueta, h.riesgo FROM v_zona_riesgo_horario h JOIN cat_franja_horaria f ON f.clave = h.franja_clave WHERE h.zona_id = ANY($1::uuid[]) ORDER BY f.hora_desde`,
      [ids],
    ),
  ]);
  return rows.map((r) => {
    const m = mensual.filter((x) => x.zona_id === r.zona_id);
    return {
      id: r.zona_id,
      name: r.nombre,
      detail: r.detalle ?? r.municipio,
      coordinates: [Number(r.longitud), Number(r.latitud)],
      score: r.score ?? 100,
      trend: r.tendencia ?? 0,
      monthly: m.map((x) => x.score),
      months: m.map((x) => MESES[x.mes.getUTCMonth()]),
      reportsByType: tipos.filter((t) => t.zona_id === r.zona_id).map((t) => ({ category: t.categoria_clave, count: t.reportes })),
      hourly: horas.filter((h) => h.zona_id === r.zona_id).map((h) => ({ label: h.etiqueta, risk: h.riesgo })),
      summary: r.descripcion,
    };
  });
}

const SELECT = `SELECT zona_id, nombre, detalle, municipio, descripcion, latitud, longitud, score, tendencia FROM v_zona_resumen`;

export async function zonas(): Promise<Zone[]> {
  return armar(await query<Row>(`${SELECT} ORDER BY nombre`));
}

export async function zona(id: string): Promise<Zone | null> {
  if (!isUuid(id)) return null;
  return (await armar(await query<Row>(`${SELECT} WHERE zona_id = $1`, [id])))[0] ?? null;
}

/** Polígonos de las zonas con su Safety Score del mes, para dibujarlos en el mapa. */
export async function zonasGeo(): Promise<FeatureCollection<Polygon, ZoneShapeProps>> {
  const rows = await query<{ zona_id: string; nombre: string; score: number | null; area: string }>(
    `SELECT v.zona_id, v.nombre, v.score, ST_AsGeoJSON(z.area::geometry, 6) AS area FROM v_zona_resumen v JOIN zona z ON z.id = v.zona_id`,
  );
  return {
    type: "FeatureCollection",
    features: rows.map((r) => ({ type: "Feature", properties: { id: r.zona_id, name: r.nombre, score: r.score ?? 100 }, geometry: JSON.parse(r.area) as Polygon })),
  };
}

export { notFound };
