import { z } from "zod";
import { ApiError, forbidden, notFound } from "./api";
import { query, queryOne, tx } from "./db";
import { isUuid } from "./geo";
import type { Report, ReportCategory, ReportCompletion, ReportStatus } from "@/types";

type Row = {
  reporte_id: string;
  categoria_clave: ReportCategory;
  latitud: number;
  longitud: number;
  referencia: string | null;
  colonia: string | null;
  municipio: string | null;
  gravedad_clave: ReportCompletion["severity"] | null;
  nota: string | null;
  tiene_foto: boolean;
  creado_en: Date;
  estado_clave: ReportStatus;
  confirmaciones: number;
  pendiente_completar?: boolean;
  mi_voto: "sigue" | "resuelto" | null;
  mio: boolean;
};

const COLS = `v.reporte_id, v.categoria_clave, v.latitud, v.longitud, v.referencia, v.colonia, v.municipio, v.gravedad_clave, v.nota, v.tiene_foto, v.creado_en, v.estado_clave, v.confirmaciones`;
const MI_VOTO = `(SELECT c.resultado FROM reporte_confirmacion c WHERE c.reporte_id = v.reporte_id AND c.usuario_id = $1) AS mi_voto`;

async function aReportes(rows: Row[]): Promise<Report[]> {
  if (rows.length === 0) return [];
  const hist = await query<{ reporte_id: string; estado_clave: ReportStatus; registrado_en: Date; texto: string | null }>(
    `SELECT reporte_id, estado_clave, registrado_en, texto FROM reporte_historial_estado WHERE reporte_id = ANY($1::uuid[]) ORDER BY registrado_en`,
    [rows.map((r) => r.reporte_id)],
  );
  return rows.map((r) => {
    const completo = r.gravedad_clave !== null;
    return {
      id: r.reporte_id,
      category: r.categoria_clave,
      coordinates: [Number(r.longitud), Number(r.latitud)],
      street: r.referencia ?? "",
      colonia: r.colonia ?? r.municipio ?? "",
      createdAt: r.creado_en.toISOString(),
      status: r.estado_clave,
      note: r.nota ?? undefined,
      pendingDetails: r.mio ? !completo : undefined,
      confirmations: r.confirmaciones,
      mine: r.mio,
      myVote: r.mi_voto ?? undefined,
      hasPhoto: r.tiene_foto,
      completion: completo ? { severity: r.gravedad_clave!, note: r.nota ?? "", street: r.referencia ?? "", hasPhoto: r.tiene_foto } : undefined,
      timeline: hist.filter((h) => h.reporte_id === r.reporte_id).map((h) => ({ status: h.estado_clave, at: h.registrado_en.toISOString(), text: h.texto ?? "" })),
    };
  });
}

/** Mis reportes (con detalle completo y pendientes por completar). */
export async function misReportes(uid: string): Promise<Report[]> {
  const rows = await query<Row>(
    `SELECT ${COLS}, ${MI_VOTO}, true AS mio FROM v_reporte v WHERE v.usuario_id = $1 AND v.cancelado_en IS NULL ORDER BY v.creado_en DESC LIMIT 200`,
    [uid],
  );
  return aReportes(rows);
}

export async function miReporte(uid: string, id: string): Promise<Report | null> {
  if (!isUuid(id)) return null;
  const rows = await query<Row>(`SELECT ${COLS}, ${MI_VOTO}, true AS mio FROM v_reporte v WHERE v.usuario_id = $1 AND v.reporte_id = $2 AND v.cancelado_en IS NULL`, [uid, id]);
  return (await aReportes(rows))[0] ?? null;
}

/** Reportes de la comunidad (vista pública: sin autoría real; sin los míos ni los de personas bloqueadas). */
export async function reportesComunidad(uid: string, dias = 30): Promise<Report[]> {
  const rows = await query<Row>(
    `SELECT ${COLS}, ${MI_VOTO}, false AS mio
     FROM v_reporte_publico v JOIN reporte r ON r.id = v.reporte_id
     WHERE r.usuario_id IS DISTINCT FROM $1 AND v.creado_en > now() - make_interval(days => $2)
       AND NOT EXISTS (SELECT 1 FROM usuario_bloqueado b WHERE (b.usuario_id = $1 AND b.bloqueado_id = r.usuario_id) OR (b.bloqueado_id = $1 AND b.usuario_id = r.usuario_id))
     ORDER BY v.creado_en DESC LIMIT 300`,
    [uid, dias],
  );
  return aReportes(rows);
}

/** Cualquier reporte visible para la persona: suyo o de la comunidad. */
export async function reporteVisible(uid: string, id: string): Promise<Report | null> {
  if (!isUuid(id)) return null;
  const mio = await miReporte(uid, id);
  if (mio) return mio;
  const rows = await query<Row>(
    `SELECT ${COLS}, ${MI_VOTO}, false AS mio FROM v_reporte_publico v JOIN reporte r ON r.id = v.reporte_id
     WHERE v.reporte_id = $2
       AND NOT EXISTS (SELECT 1 FROM usuario_bloqueado b WHERE (b.usuario_id = $1 AND b.bloqueado_id = r.usuario_id) OR (b.bloqueado_id = $1 AND b.usuario_id = r.usuario_id))`,
    [uid, id],
  );
  return (await aReportes(rows))[0] ?? null;
}

export async function misVotos(uid: string): Promise<Record<string, "sigue" | "resuelto">> {
  const rows = await query<{ reporte_id: string; resultado: "sigue" | "resuelto" }>(`SELECT reporte_id, resultado FROM reporte_confirmacion WHERE usuario_id = $1`, [uid]);
  return Object.fromEntries(rows.map((r) => [r.reporte_id, r.resultado]));
}

// Escritura ---------------------------------------------------------------------------
export const crearReporteInput = z.object({
  categoria: z.enum(["bache", "accidente", "calle_cerrada", "alta_velocidad", "conductor_agresivo", "poca_iluminacion", "robo"]),
  lng: z.number().min(-100.7).max(-100.0),
  lat: z.number().min(25.4).max(26.0),
  referencia: z.string().trim().max(200).optional(),
  rodadaId: z.string().uuid().optional(),
});

export async function crearReporte(uid: string, d: z.infer<typeof crearReporteInput>): Promise<string> {
  return tx(async (c) => {
    if (d.rodadaId) {
      const r = await c.query(`SELECT 1 FROM rodada WHERE id = $1 AND usuario_id = $2`, [d.rodadaId, uid]);
      if (r.rowCount === 0) throw notFound("No encontramos esa rodada.");
    }
    const { rows } = await c.query<{ id: string }>(
      `INSERT INTO reporte (usuario_id, categoria_clave, geog, referencia, rodada_id) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, NULLIF($5, ''), $6) RETURNING id`,
      [uid, d.categoria, d.lng, d.lat, d.referencia ?? "", d.rodadaId ?? null],
    );
    await c.query(`INSERT INTO reporte_historial_estado (reporte_id, estado_clave, texto) VALUES ($1, 'enviado', $2)`, [rows[0].id, d.rodadaId ? "Reporte enviado desde tu rodada." : "Reporte enviado."]);
    return rows[0].id;
  });
}

export const completarInput = z.object({
  severity: z.enum(["leve", "moderada", "grave"]),
  note: z.string().trim().min(10, "Describe lo que viste en al menos 10 caracteres.").max(300),
  street: z.string().trim().min(3, "Indica la calle o referencia.").max(200),
});

export async function completarReporte(uid: string, id: string, d: z.infer<typeof completarInput>): Promise<void> {
  if (!isUuid(id)) throw notFound();
  const r = await query(`UPDATE reporte SET gravedad_clave = $3, nota = $4, referencia = $5 WHERE id = $1 AND usuario_id = $2 AND cancelado_en IS NULL RETURNING id`, [id, uid, d.severity, d.note, d.street]);
  if (r.length === 0) throw notFound();
}

export async function cancelarReporte(uid: string, id: string): Promise<void> {
  if (!isUuid(id)) throw notFound();
  const rep = await miReporte(uid, id);
  if (!rep) throw notFound();
  if (rep.status === "atendido") throw new ApiError(409, "Un reporte atendido ya no se puede cancelar.");
  await query(`UPDATE reporte SET cancelado_en = now() WHERE id = $1 AND usuario_id = $2`, [id, uid]);
}

export async function confirmarReporte(uid: string, id: string, resultado: "sigue" | "resuelto"): Promise<void> {
  const rep = await reporteVisible(uid, id);
  if (!rep) throw notFound();
  if (rep.mine) throw forbidden("No puedes confirmar tu propio reporte.");
  await query(
    `INSERT INTO reporte_confirmacion (reporte_id, usuario_id, resultado) VALUES ($1, $2, $3) ON CONFLICT (reporte_id, usuario_id) DO UPDATE SET resultado = EXCLUDED.resultado, confirmado_en = now()`,
    [id, uid, resultado],
  );
}

export async function denunciarReporte(uid: string, id: string, motivo: string, detalle?: string): Promise<void> {
  const rep = await reporteVisible(uid, id);
  if (!rep) throw notFound();
  if (rep.mine) throw forbidden("No puedes denunciar tu propio reporte.");
  try {
    await query(`INSERT INTO denuncia_contenido (denunciante_id, motivo_clave, reporte_id, detalle) VALUES ($1, $2, $3, $4)`, [uid, motivo, id, detalle ?? null]);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "23505") return; // ya lo habías denunciado: misma respuesta
    if (code === "23503") throw new ApiError(400, "Motivo no válido.");
    throw e;
  }
}

// Foto ---------------------------------------------------------------------------------
export async function guardarFotoUrl(uid: string, id: string, nombre: string): Promise<void> {
  const r = await query(`UPDATE reporte SET foto_url = $3 WHERE id = $1 AND usuario_id = $2 AND cancelado_en IS NULL RETURNING id`, [id, uid, nombre]);
  if (r.length === 0) throw notFound();
}

export async function quitarFoto(uid: string, id: string): Promise<string | null> {
  const r = await queryOne<{ foto_url: string | null }>(`UPDATE reporte SET foto_url = NULL WHERE id = $1 AND usuario_id = $2 RETURNING (SELECT foto_url FROM reporte WHERE id = $1) AS foto_url`, [id, uid]);
  return r?.foto_url ?? null;
}

/** Nombre de archivo de la foto de un reporte visible para la persona. */
export async function fotoDe(uid: string, id: string): Promise<string | null> {
  if (!(await reporteVisible(uid, id))) return null;
  const r = await queryOne<{ foto_url: string | null }>(`SELECT foto_url FROM reporte WHERE id = $1 AND cancelado_en IS NULL`, [id]);
  return r?.foto_url ?? null;
}
