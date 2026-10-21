import { z } from "zod";
import { ApiError, forbidden, notFound } from "./api";
import { query, queryOne, tx } from "./db";
import { isUuid } from "./geo";
import type { GroupRide, RideLevel, RidePace, Vehicle } from "@/types";

type Row = {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  organizador_id: string;
  lugar_id: string;
  lugar: string;
  lat: number;
  lng: number;
  nivel: RideLevel;
  ritmo: RidePace;
  km: string;
  cupo: number | null;
  privacidad: "publica" | "amigos";
  estado: GroupRide["status"];
  asistentes: number;
  vehiculos: string[] | null;
  reglas: string[] | null;
  asistentes_ids: string[] | null;
};

// Visible si es pública, propia, de un amigo, o si estás asistiendo o invitado; sin bloqueos con quien organiza.
const VISIBLE = `(
  (v.privacidad = 'publica' OR v.organizador_id = $1
   OR EXISTS (SELECT 1 FROM rodada_grupal_asistente x WHERE x.rodada_grupal_id = v.rodada_grupal_id AND x.usuario_id = $1)
   OR EXISTS (SELECT 1 FROM v_amigo f WHERE f.usuario_id = $1 AND f.amigo_id = v.organizador_id)
   OR EXISTS (SELECT 1 FROM rodada_grupal_invitacion i WHERE i.rodada_grupal_id = v.rodada_grupal_id AND i.invitado_id = $1))
  AND (v.organizador_id = $1 OR NOT EXISTS (SELECT 1 FROM usuario_bloqueado b WHERE (b.usuario_id = $1 AND b.bloqueado_id = v.organizador_id) OR (b.usuario_id = v.organizador_id AND b.bloqueado_id = $1)))
)`;

const SELECT = `
  SELECT v.rodada_grupal_id AS id, v.titulo, v.descripcion,
         to_char(v.programada_en AT TIME ZONE 'America/Monterrey', 'YYYY-MM-DD"T"HH24:MI:SS') || '-06:00' AS fecha,
         v.organizador_id, v.lugar_salida_id AS lugar_id, v.lugar_salida AS lugar, v.latitud AS lat, v.longitud AS lng,
         v.nivel, v.ritmo, v.distancia_km AS km, v.cupo, v.privacidad, v.estado, v.asistentes,
         (SELECT array_agg(tipo_vehiculo_clave) FROM rodada_grupal_vehiculo WHERE rodada_grupal_id = v.rodada_grupal_id) AS vehiculos,
         (SELECT array_agg(c.nombre ORDER BY c.nombre) FROM rodada_grupal_regla r JOIN cat_regla_rodada c ON c.clave = r.regla_clave WHERE r.rodada_grupal_id = v.rodada_grupal_id) AS reglas,
         (SELECT array_agg(s.usuario_id) FROM (
            SELECT a.usuario_id FROM rodada_grupal_asistente a LEFT JOIN privacidad_usuario p ON p.usuario_id = a.usuario_id
            WHERE a.rodada_grupal_id = v.rodada_grupal_id
              AND (a.usuario_id = $1 OR a.usuario_id = v.organizador_id OR COALESCE(p.perfil_visible, true))
              AND NOT EXISTS (SELECT 1 FROM usuario_bloqueado b WHERE (b.usuario_id = $1 AND b.bloqueado_id = a.usuario_id) OR (b.usuario_id = a.usuario_id AND b.bloqueado_id = $1))
            ORDER BY a.se_unio_en LIMIT 100) s) AS asistentes_ids
  FROM v_rodada_grupal v`;

const aRide = (r: Row): GroupRide => ({
  id: r.id,
  title: r.titulo,
  description: r.descripcion,
  date: r.fecha,
  meetingPoint: r.lugar,
  meetingPlaceId: r.lugar_id,
  meetingCoordinates: [Number(r.lng), Number(r.lat)],
  level: r.nivel,
  pace: r.ritmo,
  vehicle: (r.vehiculos ?? []).length > 1 ? "ambos" : r.vehiculos?.[0] === "scooter" ? "scooter" : "bicicleta",
  km: Number(r.km),
  organizerId: r.organizador_id,
  attendeeIds: r.asistentes_ids ?? [],
  attendeeCount: r.asistentes,
  capacity: r.cupo ?? undefined,
  privacy: r.privacidad,
  rules: r.reglas ?? [],
  status: r.estado,
});

export async function rodadasGrupales(uid: string): Promise<GroupRide[]> {
  const rows = await query<Row>(`${SELECT} WHERE v.programada_en > now() - interval '90 days' AND ${VISIBLE} ORDER BY v.programada_en LIMIT 200`, [uid]);
  return rows.map(aRide);
}

export async function rodadaGrupal(uid: string, id: string): Promise<GroupRide | null> {
  if (!isUuid(id)) return null;
  const rows = await query<Row>(`${SELECT} WHERE v.rodada_grupal_id = $2 AND ${VISIBLE}`, [uid, id]);
  return rows[0] ? aRide(rows[0]) : null;
}

// Escritura ---------------------------------------------------------------------------
export const rodadaGrupalInput = z.object({
  titulo: z.string().trim().min(4, "Escribe un nombre de al menos 4 caracteres.").max(60),
  descripcion: z.string().trim().max(300).default(""),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-06:00$/, "Fecha no válida."),
  lugarSalidaId: z.string().uuid(),
  nivel: z.enum(["Principiante", "Intermedio", "Avanzado"]),
  ritmo: z.enum(["Relajado", "Moderado", "Rápido"]),
  vehiculo: z.enum(["bicicleta", "scooter", "ambos"]),
  km: z.number().gt(0).max(500),
  cupo: z.number().int().min(2).max(500).nullable().optional(),
  privacidad: z.enum(["publica", "amigos"]),
  reglas: z.array(z.string().max(60)).max(20),
  invitados: z.array(z.string().uuid()).max(100).default([]),
  clubId: z.string().uuid().optional(),
});
type Input = z.infer<typeof rodadaGrupalInput>;

async function validarLugarPublico(id: string) {
  const l = await queryOne(`SELECT 1 FROM lugar WHERE id = $1 AND propietario_id IS NULL`, [id]);
  if (!l) throw new ApiError(400, "El punto de salida debe ser un lugar público de la lista.");
}

async function escribirDetalle(c: import("pg").PoolClient, id: string, d: Input) {
  const vehiculos = d.vehiculo === "ambos" ? ["bicicleta", "scooter"] : [d.vehiculo];
  await c.query(`DELETE FROM rodada_grupal_vehiculo WHERE rodada_grupal_id = $1`, [id]);
  await c.query(`INSERT INTO rodada_grupal_vehiculo (rodada_grupal_id, tipo_vehiculo_clave) SELECT $1, unnest($2::text[])`, [id, vehiculos]);
  await c.query(`DELETE FROM rodada_grupal_regla WHERE rodada_grupal_id = $1`, [id]);
  await c.query(`INSERT INTO rodada_grupal_regla (rodada_grupal_id, regla_clave) SELECT $1, clave FROM cat_regla_rodada WHERE nombre = ANY($2::text[])`, [id, d.reglas]);
}

export async function crearRodadaGrupal(uid: string, d: Input): Promise<string> {
  if (new Date(d.fecha).getTime() < Date.now() - 5 * 60_000) throw new ApiError(400, "La fecha debe ser hoy o futura.");
  await validarLugarPublico(d.lugarSalidaId);
  return tx(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `INSERT INTO rodada_grupal (organizador_id, titulo, descripcion, programada_en, lugar_salida_id, nivel_clave, ritmo_clave, distancia_km, cupo, privacidad)
       VALUES ($1, $2, $3, $4, $5, (SELECT clave FROM cat_nivel_rodada WHERE nombre = $6), (SELECT clave FROM cat_ritmo_rodada WHERE nombre = $7), $8, $9, $10) RETURNING id`,
      [uid, d.titulo, d.descripcion, d.fecha, d.lugarSalidaId, d.nivel, d.ritmo, d.km, d.cupo ?? null, d.privacidad],
    );
    const id = rows[0].id;
    await escribirDetalle(c, id, d);
    await c.query(`INSERT INTO rodada_grupal_asistente (rodada_grupal_id, usuario_id) VALUES ($1, $2)`, [id, uid]);
    // Solo se invita a amigos; cada invitación avisa a esa persona.
    const inv = await c.query<{ amigo_id: string }>(`SELECT amigo_id FROM v_amigo WHERE usuario_id = $1 AND amigo_id = ANY($2::uuid[])`, [uid, d.invitados]);
    for (const { amigo_id } of inv.rows) {
      await c.query(`INSERT INTO rodada_grupal_invitacion (rodada_grupal_id, invitado_id) VALUES ($1, $2)`, [id, amigo_id]);
      await c.query(`INSERT INTO notificacion (usuario_id, rodada_grupal_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [amigo_id, id]);
    }
    if (d.clubId) {
      const m = await c.query(`SELECT 1 FROM club_miembro WHERE club_id = $1 AND usuario_id = $2`, [d.clubId, uid]);
      if (m.rowCount === 0) throw forbidden("Solo los miembros pueden crear rodadas del club.");
      await c.query(`INSERT INTO club_rodada (club_id, rodada_grupal_id) VALUES ($1, $2)`, [d.clubId, id]);
    }
    return id;
  });
}

export async function editarRodadaGrupal(uid: string, id: string, d: Input): Promise<void> {
  const r = await rodadaGrupal(uid, id);
  if (!r) throw notFound();
  if (r.organizerId !== uid) throw forbidden("Solo quien organiza puede editar la rodada.");
  if (r.status !== "programada") throw new ApiError(409, "Esta rodada ya no se puede editar.");
  await validarLugarPublico(d.lugarSalidaId);
  if (d.cupo && d.cupo < r.attendeeCount) throw new ApiError(400, `Ya hay ${r.attendeeCount} personas: el cupo no puede ser menor.`);
  await tx(async (c) => {
    await c.query(
      `UPDATE rodada_grupal SET titulo = $2, descripcion = $3, programada_en = $4, lugar_salida_id = $5,
              nivel_clave = (SELECT clave FROM cat_nivel_rodada WHERE nombre = $6), ritmo_clave = (SELECT clave FROM cat_ritmo_rodada WHERE nombre = $7),
              distancia_km = $8, cupo = $9, privacidad = $10 WHERE id = $1`,
      [id, d.titulo, d.descripcion, d.fecha, d.lugarSalidaId, d.nivel, d.ritmo, d.km, d.cupo ?? null, d.privacidad],
    );
    await escribirDetalle(c, id, d);
  });
}

export async function cancelarRodadaGrupal(uid: string, id: string): Promise<void> {
  const r = await query(`UPDATE rodada_grupal SET cancelada_en = now() WHERE id = $1 AND organizador_id = $2 AND cancelada_en IS NULL AND programada_en > now() RETURNING id`, [id, uid]);
  if (r.length === 0) throw notFound("No encontramos una rodada que puedas cancelar.");
}

export async function unirse(uid: string, id: string): Promise<void> {
  const r = await rodadaGrupal(uid, id);
  if (!r) throw notFound();
  await tx(async (c) => {
    // Se bloquea la fila para que dos personas no tomen el último lugar a la vez.
    const g = await c.query<{ cupo: number | null; cancelada_en: Date | null; programada_en: Date }>(`SELECT cupo, cancelada_en, programada_en FROM rodada_grupal WHERE id = $1 FOR UPDATE`, [id]);
    const row = g.rows[0];
    if (!row || row.cancelada_en || row.programada_en < new Date()) throw new ApiError(409, "Esta rodada ya no acepta asistentes.");
    const n = await c.query<{ n: number }>(`SELECT count(*)::int AS n FROM rodada_grupal_asistente WHERE rodada_grupal_id = $1`, [id]);
    const ya = await c.query(`SELECT 1 FROM rodada_grupal_asistente WHERE rodada_grupal_id = $1 AND usuario_id = $2`, [id, uid]);
    if (ya.rowCount) return;
    if (row.cupo !== null && n.rows[0].n >= row.cupo) throw new ApiError(409, "La rodada ya está llena.");
    await c.query(`INSERT INTO rodada_grupal_asistente (rodada_grupal_id, usuario_id) VALUES ($1, $2)`, [id, uid]);
    await c.query(`UPDATE rodada_grupal_invitacion SET respondida_en = now(), resultado = 'aceptada' WHERE rodada_grupal_id = $1 AND invitado_id = $2 AND respondida_en IS NULL`, [id, uid]);
  });
}

export async function salir(uid: string, id: string): Promise<void> {
  const r = await rodadaGrupal(uid, id);
  if (!r) throw notFound();
  if (r.organizerId === uid) throw new ApiError(409, "Quien organiza no puede salir: cancela la rodada.");
  await query(`DELETE FROM rodada_grupal_asistente WHERE rodada_grupal_id = $1 AND usuario_id = $2`, [id, uid]);
  await query(`UPDATE rodada_grupal_invitacion SET respondida_en = now(), resultado = 'rechazada' WHERE rodada_grupal_id = $1 AND invitado_id = $2 AND respondida_en IS NULL`, [id, uid]);
}

export type { Vehicle };
