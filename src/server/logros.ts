import { ApiError, notFound } from "./api";
import { query, queryOne } from "./db";
import { isUuid } from "./geo";
import type { BadgeInfo, Challenge } from "@/types";

/** Otorga las insignias cuyo progreso ya llegó a la meta (se guarda el hecho histórico: no se pierde después). */
async function otorgarInsignias(uid: string): Promise<void> {
  await query(
    `INSERT INTO usuario_insignia (usuario_id, insignia_clave)
     SELECT usuario_id, insignia_clave FROM v_insignia_progreso WHERE usuario_id = $1 AND NOT obtenida AND meta IS NOT NULL AND progreso >= meta
     ON CONFLICT DO NOTHING`,
    [uid],
  );
}

export async function misInsignias(uid: string): Promise<{ badges: BadgeInfo[]; confirmedReports: number }> {
  await otorgarInsignias(uid);
  const rows = await query<{ insignia_clave: string; nombre: string; descripcion: string; como_obtenerla: string; meta: number | null; progreso: string; obtenida: boolean }>(
    `SELECT insignia_clave, nombre, descripcion, como_obtenerla, meta, progreso, obtenida FROM v_insignia_progreso WHERE usuario_id = $1 ORDER BY obtenida DESC, nombre`,
    [uid],
  );
  const c = await queryOne<{ n: string }>(`SELECT fn_valor_metrica($1, 'reportes_confirmados', NULL, NULL, NULL) AS n`, [uid]);
  return {
    badges: rows.map((r) => ({ id: r.insignia_clave, name: r.nombre, description: r.descripcion, howTo: r.como_obtenerla, goal: r.meta ?? 0, progress: Math.floor(Number(r.progreso)), earned: r.obtenida })),
    confirmedReports: Math.floor(Number(c?.n ?? 0)),
  };
}

const METRICA: Record<string, Challenge["metric"]> = { km_recorridos: "km", rodadas_registradas: "rodadas", reportes_enviados: "reportes", rodadas_seguras: "score" };

export async function retos(uid: string): Promise<{ challenges: Challenge[]; joined: string[] }> {
  const rows = await query<{ reto_id: string; titulo: string; descripcion: string; metrica_clave: string; meta: number; dias_restantes: number; premio: string | null; participantes: number; progreso: string | null; unido: boolean }>(
    `SELECT r.reto_id, r.titulo, r.descripcion, r.metrica_clave, r.meta, r.dias_restantes, r.premio, r.participantes, p.progreso,
            (p.usuario_id IS NOT NULL) AS unido
     FROM v_reto r LEFT JOIN v_reto_progreso p ON p.reto_id = r.reto_id AND p.usuario_id = $1
     WHERE r.vigente ORDER BY r.termina_en, r.titulo`,
    [uid],
  );
  return {
    challenges: rows.map((r) => ({
      id: r.reto_id,
      title: r.titulo,
      description: r.descripcion,
      metric: METRICA[r.metrica_clave] ?? "rodadas",
      goal: r.meta,
      progress: Number(r.progreso ?? 0),
      daysLeft: r.dias_restantes,
      reward: r.premio ? `Insignia ${r.premio}` : "Sin premio",
      participants: r.participantes,
    })),
    joined: rows.filter((r) => r.unido).map((r) => r.reto_id),
  };
}

export async function unirseReto(uid: string, id: string, unirse: boolean): Promise<void> {
  if (!isUuid(id)) throw notFound();
  if (unirse) {
    const v = await queryOne(`SELECT 1 FROM v_reto WHERE reto_id = $1 AND vigente`, [id]);
    if (!v) throw new ApiError(409, "Este reto ya no está vigente.");
    await query(`INSERT INTO reto_participacion (reto_id, usuario_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, uid]);
  } else {
    await query(`DELETE FROM reto_participacion WHERE reto_id = $1 AND usuario_id = $2`, [id, uid]);
  }
}

export interface RankingRow {
  id: string;
  name: string;
  rides: number;
  km: number;
  avgSafetyScore: number;
}

/** Tú y tus amigos con perfil visible, con las estadísticas del mes en curso. */
export async function rankingAmigos(uid: string): Promise<RankingRow[]> {
  const rows = await query<{ id: string; nombre: string; rodadas: number | null; km: string | null; score: number | null }>(
    `SELECT u.id, u.nombre, e.rodadas, e.km, e.safety_score_promedio AS score
     FROM usuario u
     LEFT JOIN privacidad_usuario p ON p.usuario_id = u.id
     LEFT JOIN v_estadistica_usuario_mes e ON e.usuario_id = u.id AND e.mes = date_trunc('month', now() AT TIME ZONE 'America/Monterrey')::date
     WHERE u.id = $1 OR (u.id IN (SELECT amigo_id FROM v_amigo WHERE usuario_id = $1) AND COALESCE(p.perfil_visible, true))`,
    [uid],
  );
  return rows.map((r) => ({ id: r.id, name: r.nombre, rides: r.rodadas ?? 0, km: Number(r.km ?? 0), avgSafetyScore: r.score ?? 0 }));
}
