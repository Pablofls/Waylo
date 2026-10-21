import { z } from "zod";
import { ApiError, notFound } from "./api";
import { query, queryOne, tx } from "./db";
import { isUuid } from "./geo";
import type { EmergencyContact } from "@/types";

export const contactoInput = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del contacto.").max(80),
  phone: z.string().trim().regex(/^[0-9 +()-]{8,20}$/, "Escribe un teléfono válido.").refine((v) => v.replace(/\D/g, "").length >= 10, "El teléfono debe tener al menos 10 dígitos."),
  relation: z.string().trim().min(1).max(40),
});

export async function misContactos(uid: string): Promise<EmergencyContact[]> {
  const rows = await query<{ id: string; nombre: string; telefono: string; parentesco: string }>(`SELECT id, nombre, telefono, parentesco FROM contacto_emergencia WHERE usuario_id = $1 ORDER BY nombre`, [uid]);
  return rows.map((r) => ({ id: r.id, name: r.nombre, phone: r.telefono, relation: r.parentesco }));
}

export async function guardarContacto(uid: string, id: string | null, d: z.infer<typeof contactoInput>): Promise<EmergencyContact> {
  try {
    const r = id
      ? await queryOne<{ id: string }>(`UPDATE contacto_emergencia SET nombre = $3, telefono = $4, parentesco = $5 WHERE id = $1 AND usuario_id = $2 RETURNING id`, [id, uid, d.name, d.phone, d.relation])
      : await queryOne<{ id: string }>(`INSERT INTO contacto_emergencia (usuario_id, nombre, telefono, parentesco) VALUES ($1, $2, $3, $4) RETURNING id`, [uid, d.name, d.phone, d.relation]);
    if (!r) throw notFound();
    return { id: r.id, name: d.name, phone: d.phone, relation: d.relation };
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new ApiError(409, "Ya tienes un contacto con ese teléfono.");
    throw e;
  }
}

export async function quitarContacto(uid: string, id: string): Promise<void> {
  if (!isUuid(id)) throw notFound();
  const r = await query(`DELETE FROM contacto_emergencia WHERE id = $1 AND usuario_id = $2 RETURNING id`, [id, uid]);
  if (r.length === 0) throw notFound();
}

export async function configCaidas(uid: string): Promise<{ activa: boolean; segundos: number }> {
  const r = await queryOne<{ activa: boolean; segundos_espera: number }>(`SELECT activa, segundos_espera FROM config_caidas WHERE usuario_id = $1`, [uid]);
  return { activa: r?.activa ?? true, segundos: r?.segundos_espera ?? 15 };
}

export async function guardarCaidas(uid: string, activa: boolean): Promise<void> {
  await query(`INSERT INTO config_caidas (usuario_id, activa) VALUES ($1, $2) ON CONFLICT (usuario_id) DO UPDATE SET activa = EXCLUDED.activa`, [uid, activa]);
}

export const emergenciaInput = z.object({
  tipo: z.enum(["caida_detectada", "sos_manual"]),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  rodadaId: z.string().uuid().optional(),
});

/** Registra el evento. El aviso a contactos lo hace la persona desde su app de mensajes (aún no hay proveedor de SMS). */
export async function abrirEmergencia(uid: string, d: z.infer<typeof emergenciaInput>): Promise<{ id: string }> {
  const r = await queryOne<{ id: string }>(
    `INSERT INTO evento_emergencia (usuario_id, tipo_clave, rodada_id, geog)
     VALUES ($1, $2, (SELECT id FROM rodada WHERE id = $3 AND usuario_id = $1), CASE WHEN $4::float8 IS NULL OR $5::float8 IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography END) RETURNING id`,
    [uid, d.tipo, d.rodadaId ?? null, d.lat ?? null, d.lng ?? null],
  );
  return { id: r!.id };
}

export async function cerrarEmergencia(uid: string, id: string, resultado: "falsa_alarma" | "contactos_avisados"): Promise<void> {
  if (!isUuid(id)) throw notFound();
  await tx(async (c) => {
    const r = await c.query(`UPDATE evento_emergencia SET cerrado_en = GREATEST(now(), ocurrido_en), resultado = $3 WHERE id = $1 AND usuario_id = $2 AND cerrado_en IS NULL RETURNING id`, [id, uid, resultado]);
    if (r.rowCount === 0) throw notFound();
    if (resultado === "contactos_avisados") await c.query(`INSERT INTO evento_emergencia_aviso (evento_id, contacto_id) SELECT $1, id FROM contacto_emergencia WHERE usuario_id = $2 ON CONFLICT DO NOTHING`, [id, uid]);
  });
}
