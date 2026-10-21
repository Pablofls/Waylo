import { z } from "zod";
import { ApiError, notFound } from "./api";
import { query, queryOne, tx } from "./db";
import { isUuid } from "./geo";
import type { Club } from "@/types";

type Row = {
  id: string;
  nombre: string;
  descripcion: string;
  zona: string;
  privacidad: "publico" | "privado";
  propietario: string | null;
  total: number;
  soy_miembro: boolean;
  solicitado: boolean;
  miembros: string[] | null;
  rodadas: string[] | null;
};

const SELECT = `
  SELECT c.id, c.nombre, c.descripcion, m.nombre AS zona, c.privacidad,
         (SELECT usuario_id FROM club_miembro WHERE club_id = c.id AND rol = 'propietario') AS propietario,
         (SELECT count(*)::int FROM club_miembro WHERE club_id = c.id) AS total,
         EXISTS (SELECT 1 FROM club_miembro x WHERE x.club_id = c.id AND x.usuario_id = $1) AS soy_miembro,
         EXISTS (SELECT 1 FROM club_solicitud_ingreso s WHERE s.club_id = c.id AND s.usuario_id = $1 AND s.respondida_en IS NULL) AS solicitado,
         CASE WHEN c.privacidad = 'publico' OR EXISTS (SELECT 1 FROM club_miembro x WHERE x.club_id = c.id AND x.usuario_id = $1) THEN
           (SELECT array_agg(s.usuario_id) FROM (
              SELECT cm.usuario_id FROM club_miembro cm LEFT JOIN privacidad_usuario p ON p.usuario_id = cm.usuario_id
              WHERE cm.club_id = c.id AND (cm.usuario_id = $1 OR cm.rol = 'propietario' OR COALESCE(p.perfil_visible, true))
                AND NOT EXISTS (SELECT 1 FROM usuario_bloqueado b WHERE (b.usuario_id = $1 AND b.bloqueado_id = cm.usuario_id) OR (b.usuario_id = cm.usuario_id AND b.bloqueado_id = $1))
              ORDER BY cm.se_unio_en LIMIT 100) s)
         END AS miembros,
         CASE WHEN c.privacidad = 'publico' OR EXISTS (SELECT 1 FROM club_miembro x WHERE x.club_id = c.id AND x.usuario_id = $1) THEN
           (SELECT array_agg(rodada_grupal_id) FROM club_rodada WHERE club_id = c.id)
         END AS rodadas
  FROM club c JOIN municipio m ON m.clave = c.municipio_clave`;

const aClub = (r: Row): Club => ({
  id: r.id,
  name: r.nombre,
  description: r.descripcion,
  zone: r.zona,
  privacy: r.privacidad,
  ownerId: r.propietario ?? "",
  memberIds: r.miembros ?? [],
  memberCount: r.total,
  rideIds: r.rodadas ?? [],
  requested: r.solicitado,
});

export async function clubes(uid: string): Promise<Club[]> {
  return (await query<Row>(`${SELECT} ORDER BY c.nombre LIMIT 200`, [uid])).map(aClub);
}

export const clubInput = z.object({
  nombre: z.string().trim().min(3, "Escribe un nombre de al menos 3 caracteres.").max(40),
  descripcion: z.string().trim().min(15, "Cuéntanos de qué trata el club (al menos 15 caracteres).").max(300),
  municipio: z.string().min(1, "Indica el municipio.").max(60),
  privacidad: z.enum(["publico", "privado"]),
});

export async function crearClub(uid: string, d: z.infer<typeof clubInput>): Promise<string> {
  try {
    return await tx(async (c) => {
      const { rows } = await c.query<{ id: string }>(`INSERT INTO club (nombre, descripcion, municipio_clave, privacidad) VALUES ($1, $2, $3, $4) RETURNING id`, [d.nombre, d.descripcion, d.municipio, d.privacidad]);
      await c.query(`INSERT INTO club_miembro (club_id, usuario_id, rol) VALUES ($1, $2, 'propietario')`, [rows[0].id, uid]);
      return rows[0].id;
    });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "23505") throw new ApiError(409, "Ya existe un club con ese nombre.");
    if (code === "23503") throw new ApiError(400, "Ese municipio no es válido.");
    throw e;
  }
}

export async function unirseClub(uid: string, id: string): Promise<"miembro" | "solicitado"> {
  if (!isUuid(id)) throw notFound();
  const c = await queryOne<{ privacidad: "publico" | "privado" }>(`SELECT privacidad FROM club WHERE id = $1`, [id]);
  if (!c) throw notFound("No encontramos ese club.");
  if (c.privacidad === "publico") {
    await query(`INSERT INTO club_miembro (club_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, uid]);
    return "miembro";
  }
  const ya = await queryOne(`SELECT 1 FROM club_miembro WHERE club_id = $1 AND usuario_id = $2`, [id, uid]);
  if (ya) return "miembro";
  await query(`INSERT INTO club_solicitud_ingreso (club_id, usuario_id) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM club_solicitud_ingreso WHERE club_id = $1 AND usuario_id = $2 AND respondida_en IS NULL)`, [id, uid]);
  return "solicitado";
}

export async function salirClub(uid: string, id: string): Promise<void> {
  if (!isUuid(id)) throw notFound();
  const m = await queryOne<{ rol: string }>(`SELECT rol FROM club_miembro WHERE club_id = $1 AND usuario_id = $2`, [id, uid]);
  if (!m) {
    await query(`DELETE FROM club_solicitud_ingreso WHERE club_id = $1 AND usuario_id = $2 AND respondida_en IS NULL`, [id, uid]);
    return;
  }
  if (m.rol === "propietario") throw new ApiError(409, "Quien organiza el club no puede salir.");
  await query(`DELETE FROM club_miembro WHERE club_id = $1 AND usuario_id = $2`, [id, uid]);
}
