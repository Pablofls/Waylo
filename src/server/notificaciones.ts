import { notFound } from "./api";
import { query } from "./db";
import { isUuid } from "./geo";
import type { AppNotification } from "@/types";

type Row = {
  notificacion_id: string;
  creada_en: Date;
  no_leida: boolean;
  tipo: "alerta" | "reporte" | "amistad" | "rodada";
  subtipo: string | null;
  reporte_id: string | null;
  reporte_estado_clave: string | null;
  otra_persona_id: string | null;
  rodada_grupal_id: string | null;
  categoria: string | null;
  referencia: string | null;
  estado_texto: string | null;
  persona: string | null;
  rodada: string | null;
  rodada_fecha: string | null;
  lugar: string | null;
};

const ESTADOS: Record<string, string> = { en_revision: "Tu reporte está en revisión", atendido: "Tu reporte fue atendido", enviado: "Tu reporte fue enviado" };

/** El tipo se deduce del destino; el texto lo arma la app (ver docs/base-de-datos.md §6.4). */
export async function notificaciones(uid: string): Promise<AppNotification[]> {
  const rows = await query<Row>(
    `SELECT n.notificacion_id, n.creada_en, n.no_leida, n.tipo, n.subtipo, n.reporte_id, n.reporte_estado_clave, n.otra_persona_id, n.rodada_grupal_id,
            c.nombre AS categoria, r.referencia, h.texto AS estado_texto, u.nombre AS persona,
            g.titulo AS rodada, to_char(g.programada_en AT TIME ZONE 'America/Monterrey', 'DD/MM HH24:MI') AS rodada_fecha, l.nombre AS lugar
     FROM v_notificacion n
     LEFT JOIN reporte r ON r.id = n.reporte_id
     LEFT JOIN cat_categoria_reporte c ON c.clave = r.categoria_clave
     LEFT JOIN reporte_historial_estado h ON h.reporte_id = n.reporte_id AND h.estado_clave = n.reporte_estado_clave
     LEFT JOIN usuario u ON u.id = n.otra_persona_id
     LEFT JOIN rodada_grupal g ON g.id = n.rodada_grupal_id
     LEFT JOIN lugar l ON l.id = g.lugar_salida_id
     WHERE n.usuario_id = $1
       AND (n.otra_persona_id IS NULL OR NOT EXISTS (SELECT 1 FROM usuario_bloqueado b WHERE (b.usuario_id = $1 AND b.bloqueado_id = n.otra_persona_id) OR (b.usuario_id = n.otra_persona_id AND b.bloqueado_id = $1)))
     ORDER BY n.creada_en DESC LIMIT 100`,
    [uid],
  );
  return rows.map((r): AppNotification => {
    const base = { id: r.notificacion_id, kind: r.tipo, at: r.creada_en.toISOString(), read: !r.no_leida };
    if (r.tipo === "alerta") return { ...base, title: `${r.categoria ?? "Reporte"} cerca de tu ruta`, text: r.referencia ?? "La comunidad reportó algo en tu trayecto.", href: `/reportes-comunidad/${r.reporte_id}` };
    if (r.tipo === "reporte") return { ...base, title: ESTADOS[r.reporte_estado_clave ?? ""] ?? "Actualización de tu reporte", text: r.estado_texto ?? r.categoria ?? "", href: `/reportes/${r.reporte_id}` };
    if (r.tipo === "amistad") {
      const recibida = r.subtipo === "solicitud_recibida";
      return { ...base, title: recibida ? "Nueva solicitud de amistad" : "Solicitud aceptada", text: recibida ? `${r.persona ?? "Alguien"} quiere ser tu amigo.` : `${r.persona ?? "Alguien"} aceptó tu solicitud.`, href: recibida ? "/amigos" : `/personas/${r.otra_persona_id}` };
    }
    return { ...base, title: `Rodada grupal: ${r.rodada ?? ""}`, text: `${r.rodada_fecha ?? ""} · ${r.lugar ?? ""}`, href: `/rodadas/${r.rodada_grupal_id}` };
  });
}

export async function marcarLeida(uid: string, id: string): Promise<void> {
  if (!isUuid(id)) throw notFound();
  await query(`UPDATE notificacion SET leida_en = now() WHERE id = $1 AND usuario_id = $2 AND leida_en IS NULL`, [id, uid]);
}

export async function marcarTodasLeidas(uid: string): Promise<void> {
  await query(`UPDATE notificacion SET leida_en = now() WHERE usuario_id = $1 AND leida_en IS NULL`, [uid]);
}
