import { z } from "zod";
import { ApiError, notFound } from "./api";
import { query, queryOne } from "./db";
import { isUuid, lineFromGeoJSON } from "./geo";
import { lugarVisible, resolverLugar, placeInput } from "./lugares";
import type { NavAlert, NavStep } from "@/types";
import type { LngLat, Place, RiskFactor, RiskKey, RouteKind, RouteOption, SavedRoute } from "@/types";

type OptionRow = { opcion_id: string; consulta_id: string; tipo_ruta_clave: RouteKind; tipo_nombre: string; minutos: number; via: string; resumen: string; km: string; minutos_extra: number; safety_score: number | null; trazo: string };

async function withFactors(rows: OptionRow[]): Promise<RouteOption[]> {
  if (rows.length === 0) return [];
  const factors = await query<{ opcion_id: string; factor_clave: RiskKey; nombre: string; calificacion: number; explicacion: string }>(
    `SELECT f.opcion_id, f.factor_clave, c.nombre, f.calificacion, f.explicacion FROM ruta_opcion_factor f JOIN cat_factor_seguridad c ON c.clave = f.factor_clave
     WHERE f.opcion_id = ANY($1::uuid[]) ORDER BY c.orden`,
    [rows.map((r) => r.opcion_id)],
  );
  return rows.map((r) => ({
    id: r.tipo_ruta_clave,
    optionId: r.opcion_id,
    label: r.tipo_nombre,
    minutes: r.minutos,
    km: Number(r.km),
    safetyScore: r.safety_score ?? 0,
    extraMinutes: r.minutos_extra,
    via: r.via,
    summary: r.resumen,
    coordinates: lineFromGeoJSON(r.trazo),
    factors: factors.filter((f) => f.opcion_id === r.opcion_id).map<RiskFactor>((f) => ({ key: f.factor_clave, label: f.nombre, score: f.calificacion, explanation: f.explicacion })),
  }));
}

const OPTION_SQL = `SELECT o.opcion_id, o.consulta_id, o.tipo_ruta_clave, o.tipo_nombre, o.minutos, o.via, o.resumen, o.km, o.minutos_extra, o.safety_score, ST_AsGeoJSON(o.trazo::geometry) AS trazo
                    FROM v_ruta_opcion o JOIN cat_tipo_ruta t ON t.clave = o.tipo_ruta_clave`;

/**
 * Opciones de ruta hacia un destino. Todavía no hay un motor de rutas: se sirven las consultas ya calculadas
 * (ver docs/propuestas/app-datos.md). Solo cuentan consultas propias o entre lugares públicos.
 */
export async function opcionesHacia(uid: string, destinoLugarId: string): Promise<RouteOption[]> {
  if (!(await lugarVisible(uid, destinoLugarId))) throw notFound("No encontramos ese lugar.");
  const c = await queryOne<{ id: string }>(
    `SELECT c.id FROM ruta_consulta c
     JOIN lugar o ON o.id = c.origen_lugar_id JOIN lugar d ON d.id = c.destino_lugar_id
     WHERE c.destino_lugar_id = $1 AND (c.usuario_id = $2 OR (o.propietario_id IS NULL AND d.propietario_id IS NULL))
     ORDER BY (c.usuario_id = $2) DESC, c.calculada_en DESC LIMIT 1`,
    [destinoLugarId, uid],
  );
  if (!c) return [];
  return withFactors(await query<OptionRow>(`${OPTION_SQL} WHERE o.consulta_id = $1 ORDER BY t.orden`, [c.id]));
}

/** Opción por id, solo si la consulta es de la persona o une lugares públicos. */
export async function opcionPorId(uid: string, id: string): Promise<RouteOption | null> {
  if (!isUuid(id)) return null;
  const rows = await query<OptionRow>(
    `${OPTION_SQL} JOIN ruta_consulta c ON c.id = o.consulta_id JOIN lugar lo ON lo.id = c.origen_lugar_id JOIN lugar ld ON ld.id = c.destino_lugar_id
     WHERE o.opcion_id = $1 AND (c.usuario_id = $2 OR (lo.propietario_id IS NULL AND ld.propietario_id IS NULL))`,
    [id, uid],
  );
  return (await withFactors(rows))[0] ?? null;
}

/** Maniobras (posición como fracción del trazo) y avisos de reportes cercanos al trayecto. */
export async function navegacion(uid: string, opcionId: string): Promise<{ steps: NavStep[]; alerts: NavAlert[] }> {
  if (!(await opcionPorId(uid, opcionId))) throw notFound();
  const steps = await query<{ fraccion: number; giro: NavStep["turn"]; texto: string }>(
    `SELECT ST_LineLocatePoint(o.trazo::geometry, m.punto::geometry) AS fraccion, m.giro_clave AS giro, m.texto
     FROM ruta_opcion_maniobra m JOIN ruta_opcion o ON o.id = m.opcion_id WHERE m.opcion_id = $1 ORDER BY m.orden`,
    [opcionId],
  );
  const reps = await query<{ fraccion: number; categoria: string; referencia: string | null; metros: number }>(
    `SELECT ST_LineLocatePoint(o.trazo::geometry, r.geog::geometry) AS fraccion, c.nombre AS categoria, r.referencia, ST_Distance(o.trazo, r.geog) AS metros
     FROM ruta_opcion o JOIN reporte r ON ST_DWithin(o.trazo, r.geog, 80) JOIN cat_categoria_reporte c ON c.clave = r.categoria_clave
     WHERE o.id = $1 AND r.cancelado_en IS NULL AND r.creado_en > now() - interval '30 days' ORDER BY fraccion LIMIT 8`,
    [opcionId],
  );
  return {
    steps: steps.map((s) => ({ at: s.fraccion, turn: s.giro, text: s.texto })),
    alerts: reps.map((r) => ({ from: Math.max(0, r.fraccion - 0.08), to: Math.min(1, r.fraccion + 0.02), title: `${r.categoria} adelante`, text: r.referencia ?? "Reportado por la comunidad en tu ruta.", tone: "orange" as const })),
  };
}

// Rutas guardadas ----------------------------------------------------------------
type SavedRouteRow = { d_id: string; id: string; nombre: string; tipo: RouteKind; o_nombre: string; d_nombre: string; d_lng: number; d_lat: number; minutos: number | null; safety_score: number | null; opcion_id: string | null };

export async function rutasGuardadas(uid: string): Promise<SavedRoute[]> {
  const rows = await query<SavedRouteRow>(
    `SELECT g.id, g.destino_lugar_id AS d_id, g.nombre, g.tipo_ruta_clave AS tipo, o.nombre AS o_nombre, d.nombre AS d_nombre,
            ST_X(d.geog::geometry) AS d_lng, ST_Y(d.geog::geometry) AS d_lat,
            op.minutos, op.safety_score, op.opcion_id
     FROM ruta_guardada g JOIN lugar o ON o.id = g.origen_lugar_id JOIN lugar d ON d.id = g.destino_lugar_id
     LEFT JOIN LATERAL (
       SELECT x.minutos, x.safety_score, x.opcion_id FROM v_ruta_opcion x JOIN ruta_consulta c ON c.id = x.consulta_id
       WHERE c.origen_lugar_id = g.origen_lugar_id AND c.destino_lugar_id = g.destino_lugar_id AND x.tipo_ruta_clave = g.tipo_ruta_clave
       ORDER BY c.calculada_en DESC LIMIT 1
     ) op ON true
     WHERE g.usuario_id = $1 ORDER BY g.creada_en DESC`,
    [uid],
  );
  return rows.map((r) => ({ id: r.id, name: r.nombre, fromName: r.o_nombre, toName: r.d_nombre, destination: [Number(r.d_lng), Number(r.d_lat)] as LngLat, destinationId: r.d_id, routeId: r.tipo, minutes: r.minutos ?? 0, safetyScore: r.safety_score ?? 0 }));
}

export const guardarRutaInput = z.object({ name: z.string().trim().min(1).max(120), from: placeInput, to: placeInput, routeId: z.enum(["rapida", "segura", "equilibrada"]) });

export async function guardarRuta(uid: string, d: z.infer<typeof guardarRutaInput>): Promise<SavedRoute> {
  const origen = await resolverLugar(uid, d.from);
  const destino = await resolverLugar(uid, d.to);
  if (origen === destino) throw new ApiError(400, "El origen y el destino deben ser distintos.");
  try {
    const r = await queryOne<{ id: string }>(`INSERT INTO ruta_guardada (usuario_id, nombre, origen_lugar_id, destino_lugar_id, tipo_ruta_clave) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [uid, d.name, origen, destino, d.routeId]);
    return (await rutasGuardadas(uid)).find((s) => s.id === r!.id)!;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new ApiError(409, "Ya guardaste una ruta con ese nombre.");
    throw e;
  }
}

export async function quitarRutaGuardada(uid: string, id: string): Promise<void> {
  if (!isUuid(id)) throw notFound();
  const r = await query(`DELETE FROM ruta_guardada WHERE id = $1 AND usuario_id = $2 RETURNING id`, [id, uid]);
  if (r.length === 0) throw notFound();
}

/** Trayecto habitual para el inicio: la ruta guardada más reciente que tenga opciones calculadas. */
export async function trayectoHabitual(uid: string): Promise<{ origin: Place; destination: Place; route: RouteOption; newAlerts: number } | null> {
  const g = await queryOne<{ origen: string; destino: string; tipo: RouteKind }>(
    `SELECT g.origen_lugar_id AS origen, g.destino_lugar_id AS destino, g.tipo_ruta_clave AS tipo FROM ruta_guardada g WHERE g.usuario_id = $1 ORDER BY g.creada_en DESC LIMIT 1`,
    [uid],
  );
  if (!g) return null;
  const [origin, destination, rows] = await Promise.all([
    lugarVisible(uid, g.origen),
    lugarVisible(uid, g.destino),
    query<OptionRow>(
      `${OPTION_SQL} JOIN ruta_consulta c ON c.id = o.consulta_id WHERE c.origen_lugar_id = $1 AND c.destino_lugar_id = $2 AND o.tipo_ruta_clave = $3 ORDER BY c.calculada_en DESC LIMIT 1`,
      [g.origen, g.destino, g.tipo],
    ),
  ]);
  const route = (await withFactors(rows))[0];
  if (!origin || !destination || !route) return null;
  const n = await queryOne<{ n: number }>(`SELECT count(*)::int AS n FROM ruta_opcion o JOIN reporte r ON ST_DWithin(o.trazo, r.geog, 80) WHERE o.id = $1 AND r.cancelado_en IS NULL AND r.creado_en > now() - interval '24 hours'`, [route.optionId]);
  return { origin, destination, route, newAlerts: n?.n ?? 0 };
}
