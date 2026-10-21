import { z } from "zod";
import { ApiError, notFound } from "./api";
import { query, queryOne, tx } from "./db";
import { isUuid, lineFromGeoJSON } from "./geo";
import { opcionPorId } from "./rutas";
import { puntosDeRiesgo } from "./riesgo";
import { scoreFromTrack } from "@/lib/map/risk";
import type { LngLat, Ride } from "@/types";

export const crearRodadaInput = z.object({
  vehiculo: z.enum(["bicicleta", "scooter"]).default("bicicleta"),
  rutaOpcionId: z.string().uuid().optional(),
});

const fechaCorta = (d: Date) => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Monterrey" }).format(d).replace(".", "");

/** Crea la rodada antes de transmitir (el servicio en tiempo real valida `ride_id` contra esta fila). */
export async function crearRodada(uid: string, d: z.infer<typeof crearRodadaInput>): Promise<{ id: string; titulo: string }> {
  let titulo = `Rodada libre del ${fechaCorta(new Date())}`;
  if (d.rutaOpcionId) {
    const op = await opcionPorId(uid, d.rutaOpcionId);
    if (!op) throw notFound("No encontramos esa ruta.");
    const nombres = await queryOne<{ o: string; d: string }>(
      `SELECT lo.nombre AS o, ld.nombre AS d FROM ruta_opcion x JOIN ruta_consulta c ON c.id = x.consulta_id JOIN lugar lo ON lo.id = c.origen_lugar_id JOIN lugar ld ON ld.id = c.destino_lugar_id WHERE x.id = $1`,
      [d.rutaOpcionId],
    );
    if (nombres) titulo = `${nombres.o} a ${nombres.d}`;
  }
  return tx(async (c) => {
    // Una persona tiene una sola rodada en curso: si quedó una abierta (app cerrada a medias), se cierra.
    await c.query(`UPDATE rodada SET finalizada_en = now() WHERE usuario_id = $1 AND finalizada_en IS NULL AND eliminada_en IS NULL AND iniciada_en < now()`, [uid]);
    const { rows } = await c.query<{ id: string }>(`INSERT INTO rodada (usuario_id, titulo, vehiculo_clave, ruta_opcion_id) VALUES ($1, $2, $3, $4) RETURNING id`, [uid, titulo, d.vehiculo, d.rutaOpcionId ?? null]);
    return { id: rows[0].id, titulo };
  });
}

async function rodadaEnCurso(uid: string, id: string) {
  if (!isUuid(id)) throw notFound();
  const r = await queryOne<{ id: string }>(`SELECT id FROM rodada WHERE id = $1 AND usuario_id = $2 AND eliminada_en IS NULL AND finalizada_en IS NULL`, [id, uid]);
  if (!r) throw notFound("No encontramos una rodada en curso.");
}

export async function pausar(uid: string, id: string, pausar: boolean): Promise<void> {
  await rodadaEnCurso(uid, id);
  if (pausar) {
    await query(`INSERT INTO rodada_pausa (rodada_id, pausada_en) SELECT $1::uuid, now() WHERE NOT EXISTS (SELECT 1 FROM rodada_pausa WHERE rodada_id = $1 AND reanudada_en IS NULL)`, [id]);
  } else {
    await query(`UPDATE rodada_pausa SET reanudada_en = now() WHERE rodada_id = $1 AND reanudada_en IS NULL AND now() > pausada_en`, [id]);
  }
}

export async function finalizar(uid: string, id: string): Promise<void> {
  await rodadaEnCurso(uid, id);
  await tx(async (c) => {
    await c.query(`UPDATE rodada_pausa SET reanudada_en = now() WHERE rodada_id = $1 AND reanudada_en IS NULL AND now() > pausada_en`, [id]);
    await c.query(`UPDATE rodada SET finalizada_en = GREATEST(now(), iniciada_en + interval '1 second') WHERE id = $1`, [id]);
  });
}

export async function renombrar(uid: string, id: string, titulo: string): Promise<void> {
  if (!isUuid(id)) throw notFound();
  const r = await query(`UPDATE rodada SET titulo = $3 WHERE id = $1 AND usuario_id = $2 AND eliminada_en IS NULL RETURNING id`, [id, uid, titulo]);
  if (r.length === 0) throw notFound();
}

export async function eliminar(uid: string, id: string): Promise<void> {
  if (!isUuid(id)) throw notFound();
  const r = await query(`UPDATE rodada SET eliminada_en = now() WHERE id = $1 AND usuario_id = $2 AND eliminada_en IS NULL RETURNING id`, [id, uid]);
  if (r.length === 0) throw notFound();
}

type RideRow = { id: string; titulo: string; iniciada_en: Date; km: string | null; minutos: number; velocidad: string | null; safety_score: number | null; traza: string | null };

const RIDE_SQL = `
  SELECT v.rodada_id AS id, v.titulo, v.iniciada_en, v.km, v.minutos, v.velocidad_media_kmh AS velocidad, v.safety_score,
         COALESCE(t.linea, ST_AsGeoJSON(ro.trazo::geometry)) AS traza
  FROM v_rodada_resumen v
  LEFT JOIN LATERAL (
    SELECT ST_AsGeoJSON(ST_Simplify(ST_MakeLine(p.geog::geometry ORDER BY p.ts), 0.00002)) AS linea
    FROM ride_points p WHERE p.ride_id = v.rodada_id HAVING count(*) >= 2
  ) t ON true
  LEFT JOIN ruta_opcion ro ON ro.id = v.ruta_opcion_id`;

async function aRide(rows: RideRow[]): Promise<Ride[]> {
  const risk = rows.some((r) => r.safety_score === null) ? await puntosDeRiesgo() : null;
  return rows.map((r) => {
    const coordinates: LngLat[] = lineFromGeoJSON(r.traza);
    return {
      id: r.id,
      title: r.titulo,
      startedAt: r.iniciada_en.toISOString(),
      km: Number(r.km ?? 0),
      minutes: r.minutos,
      avgSpeed: Number(r.velocidad ?? 0),
      // Rodada libre: la base no tiene Safety Score (viene de una ruta guiada); se estima con los reportes cercanos.
      avgSafetyScore: r.safety_score ?? scoreFromTrack(coordinates, risk!),
      coordinates,
    };
  });
}

export async function misRodadas(uid: string): Promise<Ride[]> {
  return aRide(await query<RideRow>(`${RIDE_SQL} WHERE v.usuario_id = $1 AND v.finalizada_en IS NOT NULL ORDER BY v.iniciada_en DESC LIMIT 100`, [uid]));
}

export async function miRodada(uid: string, id: string): Promise<Ride | null> {
  if (!isUuid(id)) return null;
  return (await aRide(await query<RideRow>(`${RIDE_SQL} WHERE v.usuario_id = $1 AND v.rodada_id = $2`, [uid, id])))[0] ?? null;
}

export async function estadisticaMes(uid: string): Promise<{ rides: number; km: number; minutes: number; avgSafetyScore: number }> {
  const r = await queryOne<{ rodadas: number; km: string; minutos: number; score: number | null }>(
    `SELECT rodadas, km, minutos, safety_score_promedio AS score FROM v_estadistica_usuario_mes WHERE usuario_id = $1 AND mes = date_trunc('month', now() AT TIME ZONE 'America/Monterrey')::date`,
    [uid],
  );
  return { rides: r?.rodadas ?? 0, km: Number(r?.km ?? 0), minutes: r?.minutos ?? 0, avgSafetyScore: r?.score ?? 0 };
}

export interface RideSummary {
  ride: Ride;
  free: boolean;
  routeLabel: string | null;
  pendingReports: number;
}

/** Resumen al terminar: todo sale de la base (km y minutos se calculan con la traza y las pausas). */
export async function resumenRodada(uid: string, id: string): Promise<RideSummary | null> {
  const ride = await miRodada(uid, id);
  if (!ride) return null;
  const meta = await queryOne<{ libre: boolean; ruta: string | null }>(`SELECT (ruta_opcion_id IS NULL) AS libre, titulo AS ruta FROM rodada WHERE id = $1`, [id]);
  // La traza de la rodada puede ser más fina que la simplificada del listado: se lee completa para el mapa del resumen.
  const pts = await query<{ lng: number; lat: number }>(`SELECT ST_X(geog::geometry) AS lng, ST_Y(geog::geometry) AS lat FROM ride_points WHERE ride_id = $1 ORDER BY ts LIMIT 5000`, [id]);
  const coordinates: LngLat[] = pts.length >= 2 ? pts.map((p) => [Number(p.lng), Number(p.lat)]) : ride.coordinates;
  const pend = await queryOne<{ n: number }>(`SELECT count(*)::int AS n FROM v_reporte WHERE usuario_id = $1 AND pendiente_completar`, [uid]);
  return { ride: { ...ride, coordinates }, free: meta?.libre ?? true, routeLabel: meta?.ruta ?? null, pendingReports: pend?.n ?? 0 };
}

export { ApiError };
