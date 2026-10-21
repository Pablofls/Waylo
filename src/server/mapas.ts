import { z } from "zod";
import { ApiError, notFound } from "./api";
import { query, tx } from "./db";

export interface AreaMapa {
  id: string;
  name: string;
  mb: number;
}

export async function areasMapa(): Promise<AreaMapa[]> {
  const rows = await query<{ clave: string; nombre: string; tamano_mb: number }>(`SELECT clave, nombre, tamano_mb FROM area_mapa ORDER BY tamano_mb`);
  return rows.map((r) => ({ id: r.clave, name: r.nombre, mb: r.tamano_mb }));
}

export async function misMapas(uid: string): Promise<string[]> {
  return (await query<{ area_clave: string }>(`SELECT area_clave FROM mapa_descargado WHERE usuario_id = $1`, [uid])).map((r) => r.area_clave);
}

/** Descargar mapas es de Premium. Aquí solo se registra qué áreas eligió la persona. */
export async function marcarMapa(uid: string, area: string, descargado: boolean): Promise<void> {
  if (descargado) {
    const premium = await query(`SELECT 1 FROM v_suscripcion_actual WHERE usuario_id = $1 AND activa`, [uid]);
    if (premium.length === 0) throw new ApiError(402, "Los mapas sin conexión son parte de Premium.");
    try {
      await query(`INSERT INTO mapa_descargado (usuario_id, area_clave) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [uid, area]);
    } catch (e) {
      if ((e as { code?: string }).code === "23503") throw notFound("No encontramos esa área.");
      throw e;
    }
  } else {
    await query(`DELETE FROM mapa_descargado WHERE usuario_id = $1 AND area_clave = $2`, [uid, area]);
  }
}

// Ubicación compartida en vivo ---------------------------------------------------------
export interface LiveShare {
  id: string;
  with: string[];
  withIds: string[];
  hours: number | null;
}

export async function miComparticion(uid: string): Promise<LiveShare | null> {
  const rows = await query<{ id: string; horas: number | null; destinatario_id: string; nombre: string }>(
    `SELECT a.comparticion_id AS id, CASE WHEN a.expira_en IS NULL THEN NULL ELSE round(EXTRACT(epoch FROM a.expira_en - a.inicia_en) / 3600)::int END AS horas, a.destinatario_id, u.nombre
     FROM v_comparticion_activa a JOIN usuario u ON u.id = a.destinatario_id WHERE a.usuario_id = $1 ORDER BY a.inicia_en DESC`,
    [uid],
  );
  if (rows.length === 0) return null;
  const first = rows[0].id;
  const mine = rows.filter((r) => r.id === first);
  return { id: first, with: mine.map((r) => r.nombre.split(" ")[0]), withIds: mine.map((r) => r.destinatario_id), hours: mine[0].horas };
}

export const comparticionInput = z.object({ destinatarios: z.array(z.string().uuid()).min(1, "Elige con quién compartir.").max(20), horas: z.union([z.literal(1), z.literal(4)]).nullable() });

export async function iniciarComparticion(uid: string, d: z.infer<typeof comparticionInput>): Promise<void> {
  // Solo se comparte con amigos.
  const amigos = await query<{ amigo_id: string }>(`SELECT amigo_id FROM v_amigo WHERE usuario_id = $1 AND amigo_id = ANY($2::uuid[])`, [uid, d.destinatarios]);
  if (amigos.length === 0) throw new ApiError(400, "Solo puedes compartir tu ubicación con tus amigos.");
  await detenerComparticion(uid);
  await tx(async (c) => {
    const r = await c.query<{ id: string }>(`INSERT INTO comparticion_ubicacion (usuario_id, expira_en) VALUES ($1, CASE WHEN $2::int IS NULL THEN NULL ELSE now() + make_interval(hours => $2) END) RETURNING id`, [uid, d.horas]);
    await c.query(`INSERT INTO comparticion_destinatario (comparticion_id, destinatario_id) SELECT $1, unnest($2::uuid[])`, [r.rows[0].id, amigos.map((a) => a.amigo_id)]);
  });
}

export async function detenerComparticion(uid: string): Promise<void> {
  await query(`UPDATE comparticion_ubicacion SET detenida_en = now() WHERE usuario_id = $1 AND detenida_en IS NULL AND (expira_en IS NULL OR expira_en > now())`, [uid]);
}

export interface Sharer {
  id: string;
  name: string;
  since: string;
}

/** Quién comparte su ubicación contigo ahora. */
export async function quienComparteConmigo(uid: string): Promise<Sharer[]> {
  const rows = await query<{ usuario_id: string; nombre: string; inicia_en: Date }>(
    `SELECT a.usuario_id, u.nombre, a.inicia_en FROM v_comparticion_activa a JOIN usuario u ON u.id = a.usuario_id
     WHERE a.destinatario_id = $1
       AND NOT EXISTS (SELECT 1 FROM usuario_bloqueado b WHERE (b.usuario_id = $1 AND b.bloqueado_id = a.usuario_id) OR (b.usuario_id = a.usuario_id AND b.bloqueado_id = $1))
     ORDER BY a.inicia_en DESC`,
    [uid],
  );
  return rows.map((r) => ({ id: r.usuario_id, name: r.nombre, since: r.inicia_en.toISOString() }));
}
