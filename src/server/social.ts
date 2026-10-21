import { z } from "zod";
import { ApiError, forbidden, notFound } from "./api";
import { query, queryOne, tx } from "./db";
import { isUuid, lineFromGeoJSON } from "./geo";
import { puntosDeRiesgo } from "./riesgo";
import { scoreFromTrack } from "@/lib/map/risk";
import type { ActivityComment, CommunityRide, FriendActivity, Person, Relation, Vehicle } from "@/types";

// Personas ----------------------------------------------------------------------------
type PersonRow = {
  id: string;
  nombre: string;
  municipio: string | null;
  bio: string | null;
  creado_en: Date;
  perfil_visible: boolean;
  rodadas: number;
  km: string;
  score: number | null;
  vehiculos: string[];
  insignias: string[];
  relacion: Relation | null;
  en_comun: number | null;
};

/**
 * Tarjeta pública de personas. Nunca incluye el correo de otra persona. Si su perfil no es visible
 * y no son amigos, solo se ven nombre y municipio.
 */
const PERSON_SELECT = `
  SELECT u.id, u.nombre, p.municipio, p.bio, u.creado_en, p.perfil_visible, p.rodadas, p.km, p.safety_score_promedio AS score,
         COALESCE((SELECT array_agg(tipo_vehiculo_clave) FROM usuario_vehiculo WHERE usuario_id = u.id), '{}') AS vehiculos,
         COALESCE((SELECT array_agg(insignia_clave) FROM usuario_insignia WHERE usuario_id = u.id), '{}') AS insignias,
         (SELECT relacion FROM v_relacion_usuarios WHERE usuario_id = $1 AND otro_id = u.id) AS relacion,
         (SELECT en_comun FROM v_amigos_en_comun WHERE usuario_id = $1 AND otro_id = u.id) AS en_comun
  FROM usuario u JOIN v_persona_perfil p ON p.usuario_id = u.id`;

function aPersona(r: PersonRow): Person {
  const relation: Relation = r.relacion ?? "ninguna";
  const visible = r.perfil_visible || relation === "amigo";
  const vehicle: Vehicle = r.vehiculos.length > 1 ? "ambos" : r.vehiculos[0] === "scooter" ? "scooter" : "bicicleta";
  return {
    id: r.id,
    name: r.nombre,
    email: "",
    city: r.municipio ?? "",
    vehicle,
    bio: visible ? (r.bio ?? "") : "",
    memberSince: r.creado_en.toISOString().slice(0, 10),
    stats: visible ? { rides: r.rodadas, km: Number(r.km), avgSafetyScore: r.score ?? 0 } : { rides: 0, km: 0, avgSafetyScore: 0 },
    badgeIds: visible ? r.insignias : [],
    relation,
    mutual: r.en_comun ?? 0,
  };
}

const NO_BLOQUEADO = `NOT EXISTS (SELECT 1 FROM usuario_bloqueado b WHERE (b.usuario_id = $1 AND b.bloqueado_id = u.id) OR (b.usuario_id = u.id AND b.bloqueado_id = $1))`;

/** Personas con las que la sesión tiene un vínculo visible: amigos, solicitudes, bloqueados, participantes de sus rodadas y clubes. */
export async function personasConocidas(uid: string): Promise<Person[]> {
  const rows = await query<PersonRow>(
    `${PERSON_SELECT}
     WHERE u.id <> $1 AND (
       u.id IN (SELECT otro_id FROM v_relacion_usuarios WHERE usuario_id = $1)
       OR u.id IN (SELECT bloqueado_id FROM usuario_bloqueado WHERE usuario_id = $1)
       OR (${NO_BLOQUEADO} AND (
         u.id IN (SELECT a2.usuario_id FROM rodada_grupal_asistente a1 JOIN rodada_grupal_asistente a2 ON a2.rodada_grupal_id = a1.rodada_grupal_id WHERE a1.usuario_id = $1)
         OR u.id IN (SELECT g.organizador_id FROM rodada_grupal g WHERE g.privacidad = 'publica' OR g.id IN (SELECT rodada_grupal_id FROM rodada_grupal_asistente WHERE usuario_id = $1))
         OR u.id IN (SELECT m2.usuario_id FROM club_miembro m1 JOIN club_miembro m2 ON m2.club_id = m1.club_id WHERE m1.usuario_id = $1)
       ))
     )
     LIMIT 300`,
    [uid],
  );
  return rows.map(aPersona);
}

/** Amigos de amigos que aún no tienen vínculo con la persona. */
export async function sugerencias(uid: string): Promise<Person[]> {
  const rows = await query<PersonRow>(
    `${PERSON_SELECT}
     WHERE u.id <> $1 AND p.perfil_visible AND ${NO_BLOQUEADO}
       AND u.id IN (SELECT otro_id FROM v_amigos_en_comun WHERE usuario_id = $1)
       AND NOT EXISTS (SELECT 1 FROM v_relacion_usuarios r WHERE r.usuario_id = $1 AND r.otro_id = u.id)
     ORDER BY (SELECT en_comun FROM v_amigos_en_comun WHERE usuario_id = $1 AND otro_id = u.id) DESC LIMIT 5`,
    [uid],
  );
  return rows.map(aPersona);
}

/** Búsqueda: por nombre (parcial) o por correo exacto. Solo perfiles visibles y sin bloqueos. */
export async function buscarPersonas(uid: string, q: string): Promise<Person[]> {
  const t = q.trim();
  if (t.length < 2) return [];
  const rows = await query<PersonRow>(
    `${PERSON_SELECT}
     WHERE u.id <> $1 AND p.perfil_visible AND ${NO_BLOQUEADO}
       AND (u.nombre ILIKE '%' || replace(replace(replace($2, '\\', '\\\\'), '%', '\\%'), '_', '\\_') || '%' OR u.correo = lower($2))
     ORDER BY u.nombre LIMIT 20`,
    [uid, t],
  );
  return rows.map(aPersona);
}

export async function persona(uid: string, id: string): Promise<Person | null> {
  if (!isUuid(id)) return null;
  const rows = await query<PersonRow>(`${PERSON_SELECT} WHERE u.id = $2 AND (${NO_BLOQUEADO} OR u.id IN (SELECT bloqueado_id FROM usuario_bloqueado WHERE usuario_id = $1))`, [uid, id]);
  return rows[0] ? aPersona(rows[0]) : null;
}

// Amistad -----------------------------------------------------------------------------
export const amistadInput = z.object({ con: z.string().uuid(), accion: z.enum(["enviar", "cancelar", "aceptar", "rechazar", "terminar"]) });

async function bloqueados(a: string, b: string): Promise<boolean> {
  const r = await queryOne(`SELECT 1 FROM usuario_bloqueado WHERE (usuario_id = $1 AND bloqueado_id = $2) OR (usuario_id = $2 AND bloqueado_id = $1)`, [a, b]);
  return r !== null;
}

export async function cambiarAmistad(uid: string, d: z.infer<typeof amistadInput>): Promise<void> {
  if (d.con === uid) throw new ApiError(400, "No puedes agregarte a ti mismo.");
  const existe = await queryOne(`SELECT 1 FROM usuario WHERE id = $1`, [d.con]);
  if (!existe) throw notFound("No encontramos a esa persona.");

  if (d.accion === "enviar") {
    if (await bloqueados(uid, d.con)) throw forbidden("No puedes enviar una solicitud a esta persona.");
    try {
      await tx(async (c) => {
        const { rows } = await c.query<{ id: string }>(`INSERT INTO solicitud_amistad (emisor_id, receptor_id) VALUES ($1, $2) RETURNING id`, [uid, d.con]);
        await c.query(`INSERT INTO notificacion (usuario_id, solicitud_amistad_id) VALUES ($1, $2)`, [d.con, rows[0].id]);
      });
    } catch (e) {
      if ((e as { code?: string }).code === "23505") throw new ApiError(409, "Ya existe una solicitud o amistad con esta persona.");
      throw e;
    }
    return;
  }
  if (d.accion === "cancelar") {
    const r = await query(`UPDATE solicitud_amistad SET respondida_en = now(), resultado = 'cancelada' WHERE emisor_id = $1 AND receptor_id = $2 AND resultado IS NULL RETURNING id`, [uid, d.con]);
    if (r.length === 0) throw notFound("No hay una solicitud pendiente.");
    return;
  }
  if (d.accion === "rechazar") {
    const r = await query(`UPDATE solicitud_amistad SET respondida_en = now(), resultado = 'rechazada' WHERE emisor_id = $2 AND receptor_id = $1 AND resultado IS NULL RETURNING id`, [uid, d.con]);
    if (r.length === 0) throw notFound("No hay una solicitud pendiente.");
    return;
  }
  if (d.accion === "aceptar") {
    if (await bloqueados(uid, d.con)) throw forbidden();
    await tx(async (c) => {
      const { rows } = await c.query<{ id: string }>(`UPDATE solicitud_amistad SET respondida_en = now(), resultado = 'aceptada' WHERE emisor_id = $2 AND receptor_id = $1 AND resultado IS NULL RETURNING id`, [uid, d.con]);
      if (!rows[0]) throw notFound("No hay una solicitud pendiente.");
      // Al emisor le llega "aceptaron tu solicitud" (misma solicitud, otra persona notificada).
      await c.query(`INSERT INTO notificacion (usuario_id, solicitud_amistad_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [d.con, rows[0].id]);
    });
    return;
  }
  const r = await query(
    `UPDATE solicitud_amistad SET amistad_terminada_en = now() WHERE resultado = 'aceptada' AND amistad_terminada_en IS NULL AND ((emisor_id = $1 AND receptor_id = $2) OR (emisor_id = $2 AND receptor_id = $1)) RETURNING id`,
    [uid, d.con],
  );
  if (r.length === 0) throw notFound("No son amigos.");
}

// Bloqueos y privacidad ------------------------------------------------------------------
export async function misBloqueados(uid: string): Promise<string[]> {
  return (await query<{ bloqueado_id: string }>(`SELECT bloqueado_id FROM usuario_bloqueado WHERE usuario_id = $1`, [uid])).map((r) => r.bloqueado_id);
}

export async function bloquear(uid: string, otro: string): Promise<void> {
  if (otro === uid) throw new ApiError(400, "No puedes bloquearte a ti mismo.");
  if (!(await queryOne(`SELECT 1 FROM usuario WHERE id = $1`, [otro]))) throw notFound("No encontramos a esa persona.");
  await tx(async (c) => {
    await c.query(`INSERT INTO usuario_bloqueado (usuario_id, bloqueado_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [uid, otro]);
    // Bloquear termina la amistad y cierra solicitudes pendientes entre ambos.
    await c.query(`UPDATE solicitud_amistad SET amistad_terminada_en = now() WHERE resultado = 'aceptada' AND amistad_terminada_en IS NULL AND ((emisor_id = $1 AND receptor_id = $2) OR (emisor_id = $2 AND receptor_id = $1))`, [uid, otro]);
    await c.query(`UPDATE solicitud_amistad SET respondida_en = now(), resultado = CASE WHEN emisor_id = $1 THEN 'cancelada' ELSE 'rechazada' END WHERE resultado IS NULL AND ((emisor_id = $1 AND receptor_id = $2) OR (emisor_id = $2 AND receptor_id = $1))`, [uid, otro]);
  });
}

export async function desbloquear(uid: string, otro: string): Promise<void> {
  await query(`DELETE FROM usuario_bloqueado WHERE usuario_id = $1 AND bloqueado_id = $2`, [uid, otro]);
}

export const privacidadSchema = z.object({
  visibilidadRodadas: z.enum(["todos", "amigos", "yo"]),
  perfilVisible: z.boolean(),
  reportesAnonimos: z.boolean(),
});
export type Privacidad = z.infer<typeof privacidadSchema>;

export async function miPrivacidad(uid: string): Promise<Privacidad> {
  const r = await queryOne<{ v: Privacidad["visibilidadRodadas"]; p: boolean; a: boolean }>(`SELECT visibilidad_rodadas AS v, perfil_visible AS p, reportes_anonimos AS a FROM privacidad_usuario WHERE usuario_id = $1`, [uid]);
  return { visibilidadRodadas: r?.v ?? "amigos", perfilVisible: r?.p ?? true, reportesAnonimos: r?.a ?? false };
}

export async function guardarPrivacidad(uid: string, d: Privacidad): Promise<void> {
  await query(
    `INSERT INTO privacidad_usuario (usuario_id, visibilidad_rodadas, perfil_visible, reportes_anonimos) VALUES ($1, $2, $3, $4)
     ON CONFLICT (usuario_id) DO UPDATE SET visibilidad_rodadas = EXCLUDED.visibilidad_rodadas, perfil_visible = EXCLUDED.perfil_visible, reportes_anonimos = EXCLUDED.reportes_anonimos`,
    [uid, d.visibilidadRodadas, d.perfilVisible, d.reportesAnonimos],
  );
}

export async function denunciarPersona(uid: string, otro: string, motivo: string): Promise<void> {
  if (otro === uid) throw new ApiError(400, "No puedes denunciarte a ti mismo.");
  try {
    await query(`INSERT INTO denuncia_contenido (denunciante_id, motivo_clave, usuario_denunciado_id) VALUES ($1, $2, $3)`, [uid, motivo, otro]);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "23505") return;
    if (code === "23503") throw new ApiError(400, "Motivo o persona no válidos.");
    throw e;
  }
}

// Actividad (rodadas finalizadas de otras personas) ---------------------------------------
type ActRow = { rodada_id: string; autor_id: string; autor_nombre: string; municipio: string | null; titulo: string; vehiculo_clave: "bicicleta" | "scooter" | null; km: string | null; minutos: number; safety_score: number | null; iniciada_en: Date; reacciones: number; comentarios: number; yo_reaccione: boolean };

const ACT_EXTRA = `,
  (SELECT count(*)::int FROM reaccion_rodada x WHERE x.rodada_id = a.rodada_id) AS reacciones,
  (SELECT count(*)::int FROM comentario_rodada x WHERE x.rodada_id = a.rodada_id) AS comentarios,
  EXISTS (SELECT 1 FROM reaccion_rodada x WHERE x.rodada_id = a.rodada_id AND x.usuario_id = $1) AS yo_reaccione`;

async function conScore(rows: ActRow[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const sin = rows.filter((r) => r.safety_score === null);
  rows.forEach((r) => r.safety_score !== null && out.set(r.rodada_id, r.safety_score));
  if (sin.length) {
    const risk = await puntosDeRiesgo();
    const lines = await query<{ id: string; linea: string | null }>(
      `SELECT p.ride_id AS id, ST_AsGeoJSON(ST_Simplify(ST_MakeLine(p.geog::geometry ORDER BY p.ts), 0.00005)) AS linea FROM ride_points p WHERE p.ride_id = ANY($1::uuid[]) GROUP BY p.ride_id HAVING count(*) >= 2`,
      [sin.map((r) => r.rodada_id)],
    );
    const byId = new Map(lines.map((l) => [l.id, lineFromGeoJSON(l.linea)]));
    for (const r of sin) out.set(r.rodada_id, scoreFromTrack(byId.get(r.rodada_id) ?? [], risk));
  }
  return out;
}

const aAmigo = (r: ActRow, score: number): FriendActivity => ({
  id: r.rodada_id,
  friendId: r.autor_id,
  title: r.titulo,
  km: Number(r.km ?? 0),
  minutes: r.minutos,
  safetyScore: score,
  at: r.iniciada_en.toISOString(),
  vehicle: r.vehiculo_clave ?? "bicicleta",
  kudos: r.reacciones,
  comments: r.comentarios,
  gaveKudo: r.yo_reaccione,
});

export async function actividadAmigos(uid: string, autor?: string): Promise<FriendActivity[]> {
  const rows = await query<ActRow>(
    `SELECT a.rodada_id, a.autor_id, a.autor_nombre, NULL::text AS municipio, a.titulo, a.vehiculo_clave, a.km, a.minutos, a.safety_score, a.iniciada_en ${ACT_EXTRA}
     FROM v_actividad_amigos a WHERE a.espectador_id = $1 AND ($2::uuid IS NULL OR a.autor_id = $2) ORDER BY a.iniciada_en DESC LIMIT 40`,
    [uid, autor ?? null],
  );
  const scores = await conScore(rows);
  return rows.map((r) => aAmigo(r, scores.get(r.rodada_id)!));
}

export async function actividadComunidad(uid: string): Promise<CommunityRide[]> {
  const rows = await query<ActRow>(
    `SELECT a.rodada_id, a.autor_id, a.autor_nombre, a.municipio, a.titulo, NULL::text AS vehiculo_clave, a.km, a.minutos, a.safety_score, a.iniciada_en ${ACT_EXTRA}
     FROM fn_actividad_comunidad($1, 20) a`,
    [uid],
  );
  const scores = await conScore(rows);
  return rows.map((r) => ({
    id: r.rodada_id,
    personId: r.autor_id,
    person: r.autor_nombre,
    title: r.titulo,
    km: Number(r.km ?? 0),
    minutes: r.minutos,
    safetyScore: scores.get(r.rodada_id)!,
    at: r.iniciada_en.toISOString(),
    zone: r.municipio ?? "",
    kudos: r.reacciones,
    comments: r.comentarios,
    gaveKudo: r.yo_reaccione,
  }));
}

export interface Post {
  id: string;
  personId: string;
  name: string;
  title: string;
  km: number;
  minutes: number;
  safetyScore: number;
  at: string;
  vehicle?: "bicicleta" | "scooter";
  kudos: number;
  gaveKudo: boolean;
  comments: ActivityComment[];
}

/** Una actividad si es tuya, de un amigo o de la comunidad (con la privacidad de su autora). */
export async function publicacion(uid: string, id: string): Promise<Post | null> {
  if (!isUuid(id)) return null;
  const rows = await query<ActRow>(
    `SELECT a.rodada_id, a.usuario_id AS autor_id, u.nombre AS autor_nombre, NULL::text AS municipio, a.titulo, a.vehiculo_clave, a.km, a.minutos, a.safety_score, a.iniciada_en ${ACT_EXTRA}
     FROM v_rodada_resumen a JOIN usuario u ON u.id = a.usuario_id
     WHERE a.rodada_id = $2 AND a.finalizada_en IS NOT NULL AND (
       a.usuario_id = $1
       OR EXISTS (SELECT 1 FROM v_actividad_amigos f WHERE f.espectador_id = $1 AND f.rodada_id = a.rodada_id)
       OR EXISTS (SELECT 1 FROM fn_actividad_comunidad($1, 1000) c WHERE c.rodada_id = a.rodada_id))`,
    [uid, id],
  );
  const r = rows[0];
  if (!r) return null;
  const score = (await conScore([r])).get(r.rodada_id)!;
  const cs = await query<{ id: string; usuario_id: string; texto: string; creado_en: Date }>(
    `SELECT c.id, c.usuario_id, c.texto, c.creado_en FROM comentario_rodada c WHERE c.rodada_id = $2
       AND NOT EXISTS (SELECT 1 FROM usuario_bloqueado b WHERE (b.usuario_id = $1 AND b.bloqueado_id = c.usuario_id) OR (b.usuario_id = c.usuario_id AND b.bloqueado_id = $1))
     ORDER BY c.creado_en`,
    [uid, id],
  );
  return {
    id,
    personId: r.autor_id,
    name: r.autor_nombre,
    title: r.titulo,
    km: Number(r.km ?? 0),
    minutes: r.minutos,
    safetyScore: score,
    at: r.iniciada_en.toISOString(),
    vehicle: r.vehiculo_clave ?? undefined,
    kudos: r.reacciones,
    gaveKudo: r.yo_reaccione,
    comments: cs.map((c) => ({ id: c.id, activityId: id, personId: c.usuario_id, text: c.texto, at: c.creado_en.toISOString() })),
  };
}

async function actividadVisible(uid: string, id: string): Promise<boolean> {
  return (await publicacion(uid, id)) !== null;
}

export async function misReacciones(uid: string): Promise<string[]> {
  return (await query<{ rodada_id: string }>(`SELECT rodada_id FROM reaccion_rodada WHERE usuario_id = $1`, [uid])).map((r) => r.rodada_id);
}

export async function reaccionar(uid: string, id: string, dar: boolean): Promise<void> {
  if (!(await actividadVisible(uid, id))) throw notFound();
  if (dar) await query(`INSERT INTO reaccion_rodada (rodada_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, uid]);
  else await query(`DELETE FROM reaccion_rodada WHERE rodada_id = $1 AND usuario_id = $2`, [id, uid]);
}

export async function comentar(uid: string, id: string, texto: string): Promise<void> {
  if (!(await actividadVisible(uid, id))) throw notFound();
  await query(`INSERT INTO comentario_rodada (rodada_id, usuario_id, texto) VALUES ($1, $2, $3)`, [id, uid, texto]);
}

export async function denunciarComentario(uid: string, comentarioId: string, motivo: string): Promise<void> {
  if (!isUuid(comentarioId)) throw notFound();
  const c = await queryOne<{ rodada_id: string; usuario_id: string }>(`SELECT rodada_id, usuario_id FROM comentario_rodada WHERE id = $1`, [comentarioId]);
  if (!c || !(await actividadVisible(uid, c.rodada_id))) throw notFound();
  if (c.usuario_id === uid) throw forbidden("No puedes denunciar tu propio comentario.");
  try {
    await query(`INSERT INTO denuncia_contenido (denunciante_id, motivo_clave, comentario_id) VALUES ($1, $2, $3)`, [uid, motivo, comentarioId]);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "23505") return;
    if (code === "23503") throw new ApiError(400, "Motivo no válido.");
    throw e;
  }
}
