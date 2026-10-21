import { z } from "zod";
import { ApiError } from "./api";
import { query, queryOne, tx } from "./db";
import { miPrivacidad, type Privacidad } from "./social";

export const notificacionesSchema = z.object({
  alertas: z.boolean(),
  radioM: z.union([z.literal(200), z.literal(500), z.literal(1000)]),
  municipio: z.boolean(),
  estado: z.boolean(),
  amistad: z.boolean(),
  actividad: z.boolean(),
  rodadas: z.boolean(),
  anticipacionMin: z.union([z.literal(60), z.literal(1440)]),
  silencioso: z.object({ activo: z.boolean(), desde: z.string().regex(/^\d{2}:\d{2}$/), hasta: z.string().regex(/^\d{2}:\d{2}$/) }),
});
export type NotificacionesAjustes = z.infer<typeof notificacionesSchema>;

export const rutasSchema = z.object({
  inclinacion: z.number().int().min(0).max(100),
  minutosExtra: z.number().int().min(0).max(60),
  evitar: z.array(z.string().max(40)).max(20),
  preferir: z.array(z.string().max(40)).max(20),
});
export type RutasAjustes = z.infer<typeof rutasSchema>;

export interface Ajustes {
  privacidad: Privacidad;
  notificaciones: NotificacionesAjustes;
  rutas: RutasAjustes;
}

const TIPOS = { alertas: "alerta_ruta", municipio: "aviso_municipio", estado: "estado_reporte", amistad: "solicitud_amistad", actividad: "actividad_amigos", rodadas: "recordatorio_rodada" } as const;

export async function misAjustes(uid: string): Promise<Ajustes> {
  const [privacidad, prefs, extra, silencio, ruta, evitar, preferir] = await Promise.all([
    miPrivacidad(uid),
    query<{ tipo_clave: string; activa: boolean }>(`SELECT tipo_clave, activa FROM preferencia_notificacion WHERE usuario_id = $1`, [uid]),
    queryOne<{ radio: number | null; antic: number | null }>(
      `SELECT (SELECT distancia_aviso_m FROM preferencia_alerta_ruta WHERE usuario_id = $1) AS radio, (SELECT anticipacion_min FROM preferencia_recordatorio_rodada WHERE usuario_id = $1) AS antic`,
      [uid],
    ),
    queryOne<{ desde: string; hasta: string }>(`SELECT to_char(desde, 'HH24:MI') AS desde, to_char(hasta, 'HH24:MI') AS hasta FROM horario_silencioso WHERE usuario_id = $1`, [uid]),
    queryOne<{ inclinacion_segura: number; minutos_extra_max: number }>(`SELECT inclinacion_segura, minutos_extra_max FROM preferencia_ruta WHERE usuario_id = $1`, [uid]),
    query<{ evitar_clave: string }>(`SELECT evitar_clave FROM preferencia_ruta_evitar WHERE usuario_id = $1`, [uid]),
    query<{ preferir_clave: string }>(`SELECT preferir_clave FROM preferencia_ruta_preferir WHERE usuario_id = $1`, [uid]),
  ]);
  // Sin fila equivale a "activa".
  const on = (tipo: string) => prefs.find((p) => p.tipo_clave === tipo)?.activa ?? true;
  return {
    privacidad,
    notificaciones: {
      alertas: on(TIPOS.alertas),
      radioM: (extra?.radio as 200 | 500 | 1000 | null) ?? 500,
      municipio: on(TIPOS.municipio),
      estado: on(TIPOS.estado),
      amistad: on(TIPOS.amistad),
      actividad: on(TIPOS.actividad),
      rodadas: on(TIPOS.rodadas),
      anticipacionMin: (extra?.antic as 60 | 1440 | null) ?? 60,
      silencioso: { activo: silencio !== null, desde: silencio?.desde ?? "22:00", hasta: silencio?.hasta ?? "06:30" },
    },
    rutas: { inclinacion: ruta?.inclinacion_segura ?? 50, minutosExtra: ruta?.minutos_extra_max ?? 10, evitar: evitar.map((e) => e.evitar_clave), preferir: preferir.map((e) => e.preferir_clave) },
  };
}

export async function guardarNotificaciones(uid: string, d: NotificacionesAjustes): Promise<void> {
  if (d.silencioso.activo && d.silencioso.desde === d.silencioso.hasta) throw new ApiError(400, "El horario silencioso necesita una hora de inicio y otra de fin distintas.");
  await tx(async (c) => {
    for (const [campo, tipo] of Object.entries(TIPOS)) {
      await c.query(
        `INSERT INTO preferencia_notificacion (usuario_id, tipo_clave, activa) VALUES ($1, $2, $3) ON CONFLICT (usuario_id, tipo_clave) DO UPDATE SET activa = EXCLUDED.activa`,
        [uid, tipo, d[campo as keyof typeof TIPOS]],
      );
    }
    await c.query(`INSERT INTO preferencia_alerta_ruta (usuario_id, distancia_aviso_m) VALUES ($1, $2) ON CONFLICT (usuario_id) DO UPDATE SET distancia_aviso_m = EXCLUDED.distancia_aviso_m`, [uid, d.radioM]);
    await c.query(`INSERT INTO preferencia_recordatorio_rodada (usuario_id, anticipacion_min) VALUES ($1, $2) ON CONFLICT (usuario_id) DO UPDATE SET anticipacion_min = EXCLUDED.anticipacion_min`, [uid, d.anticipacionMin]);
    if (d.silencioso.activo) {
      await c.query(`INSERT INTO horario_silencioso (usuario_id, desde, hasta) VALUES ($1, $2, $3) ON CONFLICT (usuario_id) DO UPDATE SET desde = EXCLUDED.desde, hasta = EXCLUDED.hasta`, [uid, d.silencioso.desde, d.silencioso.hasta]);
    } else {
      await c.query(`DELETE FROM horario_silencioso WHERE usuario_id = $1`, [uid]);
    }
  });
}

export async function guardarRutas(uid: string, d: RutasAjustes): Promise<void> {
  try {
    await tx(async (c) => {
      await c.query(
        `INSERT INTO preferencia_ruta (usuario_id, inclinacion_segura, minutos_extra_max) VALUES ($1, $2, $3) ON CONFLICT (usuario_id) DO UPDATE SET inclinacion_segura = EXCLUDED.inclinacion_segura, minutos_extra_max = EXCLUDED.minutos_extra_max`,
        [uid, d.inclinacion, d.minutosExtra],
      );
      await c.query(`DELETE FROM preferencia_ruta_evitar WHERE usuario_id = $1`, [uid]);
      await c.query(`INSERT INTO preferencia_ruta_evitar (usuario_id, evitar_clave) SELECT $1, unnest($2::text[])`, [uid, d.evitar]);
      await c.query(`DELETE FROM preferencia_ruta_preferir WHERE usuario_id = $1`, [uid]);
      // "Rutas personalizadas" es Premium: sin suscripción activa no se guarda.
      const premium = await c.query(`SELECT 1 FROM v_suscripcion_actual WHERE usuario_id = $1 AND activa`, [uid]);
      const preferir = d.preferir.filter((p) => p !== "rutas_personalizadas" || (premium.rowCount ?? 0) > 0);
      await c.query(`INSERT INTO preferencia_ruta_preferir (usuario_id, preferir_clave) SELECT $1, unnest($2::text[])`, [uid, preferir]);
    });
  } catch (e) {
    if ((e as { code?: string }).code === "23503") throw new ApiError(400, "Alguna preferencia no es válida.");
    throw e;
  }
}

export const perfilSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  municipio: z.string().max(60).nullable(),
  bio: z.string().trim().max(160),
  vehiculo: z.enum(["bicicleta", "scooter", "ambos"]),
});

export async function guardarPerfil(uid: string, d: z.infer<typeof perfilSchema>): Promise<void> {
  const vehiculos = d.vehiculo === "ambos" ? ["bicicleta", "scooter"] : [d.vehiculo];
  try {
    await tx(async (c) => {
      await c.query(`UPDATE usuario SET nombre = $2, municipio_clave = $3, bio = NULLIF($4, '') WHERE id = $1`, [uid, d.nombre, d.municipio, d.bio]);
      await c.query(`DELETE FROM usuario_vehiculo WHERE usuario_id = $1`, [uid]);
      await c.query(`INSERT INTO usuario_vehiculo (usuario_id, tipo_vehiculo_clave) SELECT $1, unnest($2::text[])`, [uid, vehiculos]);
    });
  } catch (e) {
    if ((e as { code?: string }).code === "23503") throw new ApiError(400, "Ese municipio no es válido.");
    throw e;
  }
}

export async function municipios(): Promise<{ clave: string; nombre: string }[]> {
  return query<{ clave: string; nombre: string }>(`SELECT clave, nombre FROM municipio ORDER BY nombre`);
}

/** Todo lo que Waylo guarda de la persona, para que lo descargue (derecho de acceso). */
export async function exportarDatos(uid: string): Promise<Record<string, unknown>> {
  const q = (sql: string) => query(sql, [uid]);
  const [usuario, rodadas, reportes, lugares, rutas, amistades, contactos] = await Promise.all([
    q(`SELECT id, nombre, correo, ocupacion, bio, municipio_clave, uso_principal_clave, creado_en FROM usuario WHERE id = $1`),
    q(`SELECT rodada_id, titulo, iniciada_en, finalizada_en, km, minutos, velocidad_media_kmh, safety_score FROM v_rodada_resumen WHERE usuario_id = $1 ORDER BY iniciada_en`),
    q(`SELECT reporte_id, categoria_clave, latitud, longitud, referencia, gravedad_clave, nota, creado_en, estado_clave FROM v_reporte WHERE usuario_id = $1 ORDER BY creado_en`),
    q(`SELECT g.etiqueta, g.tipo_lugar_clave, l.nombre, l.detalle, ST_Y(l.geog::geometry) AS latitud, ST_X(l.geog::geometry) AS longitud FROM lugar_guardado g JOIN lugar l ON l.id = g.lugar_id WHERE g.usuario_id = $1`),
    q(`SELECT nombre, tipo_ruta_clave, creada_en FROM ruta_guardada WHERE usuario_id = $1`),
    q(`SELECT amigo_id, desde FROM v_amigo WHERE usuario_id = $1`),
    q(`SELECT nombre, telefono, parentesco FROM contacto_emergencia WHERE usuario_id = $1`),
  ]);
  return { generado_en: new Date().toISOString(), usuario: usuario[0] ?? null, rodadas, reportes, lugares_guardados: lugares, rutas_guardadas: rutas, amistades, contactos_emergencia: contactos };
}
