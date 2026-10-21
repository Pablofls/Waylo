import { z } from "zod";
import { ApiError, notFound } from "./api";
import { query, queryOne, tx } from "./db";
import { isUuid } from "./geo";
import type { LngLat, Place, SavedPlace } from "@/types";

type PlaceRow = { lugar_id: string; nombre: string; detalle: string | null; latitud: number; longitud: number };

const toPlace = (r: PlaceRow): Place => ({ id: r.lugar_id, name: r.nombre, detail: r.detalle ?? "", coordinates: [Number(r.longitud), Number(r.latitud)] as LngLat });

export const placeInput = z.object({
  id: z.string().refine(isUuid).optional(),
  name: z.string().trim().min(1).max(120),
  detail: z.string().trim().max(240).default(""),
  coordinates: z.tuple([z.number().min(-100.7).max(-100.0), z.number().min(25.4).max(26.0)]),
});
export type PlaceInput = z.infer<typeof placeInput>;

/** Lugares públicos (nunca privados) para buscar destinos y puntos de salida. */
export async function lugaresPublicos(): Promise<Place[]> {
  const rows = await query<PlaceRow>(`SELECT lugar_id, nombre, detalle, latitud, longitud FROM v_lugar_publico ORDER BY nombre`);
  return rows.map(toPlace);
}

/** Un lugar visible para la persona: público o suyo. */
export async function lugarVisible(uid: string, id: string): Promise<Place | null> {
  const r = await queryOne<PlaceRow>(
    `SELECT id AS lugar_id, nombre, detalle, ST_Y(geog::geometry) AS latitud, ST_X(geog::geometry) AS longitud FROM lugar WHERE id = $1 AND (propietario_id IS NULL OR propietario_id = $2)`,
    [id, uid],
  );
  return r ? toPlace(r) : null;
}

/** Devuelve el id de un lugar visible o crea uno privado de la persona con esos datos. */
async function resolverLugar(uid: string, p: PlaceInput): Promise<string> {
  if (p.id) {
    if (!(await lugarVisible(uid, p.id))) throw notFound("No encontramos ese lugar.");
    return p.id;
  }
  const r = await queryOne<{ id: string }>(
    `INSERT INTO lugar (nombre, detalle, geog, propietario_id) VALUES ($1, NULLIF($2, ''), ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5) RETURNING id`,
    [p.name, p.detail, p.coordinates[0], p.coordinates[1], uid],
  );
  return r!.id;
}

// Lugares guardados ---------------------------------------------------------------
type SavedRow = PlaceRow & { guardado_id: string; etiqueta: string; tipo: SavedPlace["kind"] };

export async function lugaresGuardados(uid: string): Promise<SavedPlace[]> {
  const rows = await query<SavedRow>(
    `SELECT g.id AS guardado_id, g.etiqueta, g.tipo_lugar_clave AS tipo, l.id AS lugar_id, l.nombre, l.detalle,
            ST_Y(l.geog::geometry) AS latitud, ST_X(l.geog::geometry) AS longitud
     FROM lugar_guardado g JOIN lugar l ON l.id = g.lugar_id WHERE g.usuario_id = $1 ORDER BY g.creado_en`,
    [uid],
  );
  return rows.map((r) => ({ id: r.guardado_id, label: r.etiqueta, kind: r.tipo, place: toPlace(r) }));
}

export const guardarLugarInput = z.object({ kind: z.enum(["casa", "escuela", "trabajo", "favorito"]), label: z.string().trim().min(1).max(80), place: placeInput });

export async function guardarLugar(uid: string, d: z.infer<typeof guardarLugarInput>): Promise<SavedPlace> {
  // La FK compuesta exige que lo guardado sea un lugar propio: un lugar público se copia como privado.
  const base = d.place.id ? await lugarVisible(uid, d.place.id) : null;
  const copia: PlaceInput = base ? { name: base.name, detail: base.detail, coordinates: base.coordinates } : { ...d.place, id: undefined };
  try {
    const id = await tx(async (c) => {
      const { rows } = await c.query<{ id: string }>(
        `INSERT INTO lugar (nombre, detalle, geog, propietario_id) VALUES ($1, NULLIF($2, ''), ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5) RETURNING id`,
        [copia.name, copia.detail, copia.coordinates[0], copia.coordinates[1], uid],
      );
      const lugar = rows[0].id;
      const g = await c.query<{ id: string }>(`INSERT INTO lugar_guardado (usuario_id, lugar_id, tipo_lugar_clave, etiqueta) VALUES ($1, $2, $3, $4) RETURNING id`, [uid, lugar, d.kind, d.label]);
      return g.rows[0].id;
    });
    return (await lugaresGuardados(uid)).find((s) => s.id === id)!;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new ApiError(409, "Ya tienes una casa guardada. Elimínala para guardar otra.");
    throw e;
  }
}

export async function quitarLugarGuardado(uid: string, id: string): Promise<void> {
  if (!isUuid(id)) throw notFound();
  // Borrar el lugar privado elimina en cascada el guardado.
  const r = await query(`DELETE FROM lugar WHERE id = (SELECT lugar_id FROM lugar_guardado WHERE id = $1 AND usuario_id = $2) AND propietario_id = $2 RETURNING id`, [id, uid]);
  if (r.length === 0) throw notFound();
}

// Historial de búsqueda ------------------------------------------------------------
export async function historialBusqueda(uid: string): Promise<Place[]> {
  const rows = await query<PlaceRow>(
    `SELECT l.id AS lugar_id, l.nombre, l.detalle, ST_Y(l.geog::geometry) AS latitud, ST_X(l.geog::geometry) AS longitud
     FROM historial_busqueda h JOIN lugar l ON l.id = h.lugar_id WHERE h.usuario_id = $1 AND (l.propietario_id IS NULL OR l.propietario_id = $1)
     ORDER BY h.buscado_en DESC LIMIT 6`,
    [uid],
  );
  return rows.map(toPlace);
}

export async function agregarBusqueda(uid: string, lugarId: string): Promise<void> {
  if (!(await lugarVisible(uid, lugarId))) throw notFound("No encontramos ese lugar.");
  await query(`INSERT INTO historial_busqueda (usuario_id, lugar_id) VALUES ($1, $2) ON CONFLICT (usuario_id, lugar_id) DO UPDATE SET buscado_en = now()`, [uid, lugarId]);
}

export async function quitarBusqueda(uid: string, lugarId: string): Promise<void> {
  await query(`DELETE FROM historial_busqueda WHERE usuario_id = $1 AND lugar_id = $2`, [uid, lugarId]);
}

export async function limpiarBusquedas(uid: string): Promise<void> {
  await query(`DELETE FROM historial_busqueda WHERE usuario_id = $1`, [uid]);
}

export { resolverLugar };
