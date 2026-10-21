-- 015: vistas con los datos derivados (nada de esto se guarda en tablas).
-- Todas las fechas se almacenan en UTC (timestamptz); donde se agrupa por día, semana o mes se
-- usa la hora local de America/Monterrey.
SET search_path = waylo, public;

-- Lugares ------------------------------------------------------------------------
-- Único acceso a lugares desde otras personas: excluye todo lugar privado (casa, trabajo...).
CREATE VIEW v_lugar_publico AS
SELECT l.id AS lugar_id, l.nombre, l.detalle, l.geog,
       ST_Y(l.geog::geometry) AS latitud, ST_X(l.geog::geometry) AS longitud,
       c.nombre AS colonia, m.nombre AS municipio
FROM lugar l
LEFT JOIN colonia c ON c.id = l.colonia_id
LEFT JOIN municipio m ON m.clave = c.municipio_clave
WHERE l.propietario_id IS NULL;

-- Cuenta ---------------------------------------------------------------------------
CREATE VIEW v_usuario_correo_verificado AS
SELECT u.id AS usuario_id,
       EXISTS (SELECT 1 FROM verificacion_correo v
               WHERE v.usuario_id = u.id AND v.correo = u.correo AND v.confirmada_en IS NOT NULL) AS verificado
FROM usuario u;

-- Amistad ------------------------------------------------------------------------
-- Amistad = solicitud aceptada y no terminada. Un renglón por amistad (par normalizado a < b).
CREATE VIEW v_amistad AS
SELECT s.id AS solicitud_id,
       LEAST(s.emisor_id, s.receptor_id) AS usuario_a,
       GREATEST(s.emisor_id, s.receptor_id) AS usuario_b,
       s.respondida_en AS desde
FROM solicitud_amistad s
WHERE s.resultado = 'aceptada' AND s.amistad_terminada_en IS NULL;

-- Lista de amigos desde la perspectiva de cada persona (dos renglones por amistad).
CREATE VIEW v_amigo AS
SELECT usuario_a AS usuario_id, usuario_b AS amigo_id, solicitud_id, desde FROM v_amistad
UNION ALL
SELECT usuario_b, usuario_a, solicitud_id, desde FROM v_amistad;

-- Relación de usuario_id hacia otro_id. La ausencia de renglón significa "ninguna".
CREATE VIEW v_relacion_usuarios AS
SELECT usuario_id, amigo_id AS otro_id, 'amigo'::text AS relacion FROM v_amigo
UNION ALL
SELECT receptor_id, emisor_id, 'solicitud_recibida' FROM solicitud_amistad WHERE resultado IS NULL
UNION ALL
SELECT emisor_id, receptor_id, 'solicitud_enviada' FROM solicitud_amistad WHERE resultado IS NULL;

-- Amigos en común entre usuario_id y otro_id (solo pares con al menos uno).
CREATE VIEW v_amigos_en_comun AS
SELECT a.usuario_id, b.usuario_id AS otro_id, count(*)::integer AS en_comun
FROM v_amigo a
JOIN v_amigo b ON b.amigo_id = a.amigo_id AND b.usuario_id <> a.usuario_id
GROUP BY a.usuario_id, b.usuario_id;

-- Rutas -------------------------------------------------------------------------
-- Safety Score de la opción = promedio de sus factores ponderado con cat_factor_seguridad.peso.
CREATE VIEW v_ruta_opcion AS
SELECT o.id AS opcion_id, o.consulta_id, o.tipo_ruta_clave, t.nombre AS tipo_nombre, o.minutos, o.via, o.resumen, o.trazo,
       round((ST_Length(o.trazo) / 1000.0)::numeric, 1) AS km,
       o.minutos - min(o.minutos) OVER (PARTITION BY o.consulta_id) AS minutos_extra,
       sc.safety_score
FROM ruta_opcion o
JOIN cat_tipo_ruta t ON t.clave = o.tipo_ruta_clave
LEFT JOIN LATERAL (
  SELECT round(sum(f.calificacion * c.peso) / sum(c.peso))::integer AS safety_score
  FROM ruta_opcion_factor f
  JOIN cat_factor_seguridad c ON c.clave = f.factor_clave
  WHERE f.opcion_id = o.id
) sc ON true;

-- Rodadas individuales ------------------------------------------------------------
-- minutos: tiempo transcurrido menos pausas. km: de la traza GPS (ride_points) si tiene al menos
-- dos puntos; si no, de la ruta guiada. safety_score: el de la ruta guiada (NULL en rodadas libres).
CREATE VIEW v_rodada_resumen AS
SELECT r.id AS rodada_id, r.usuario_id, r.titulo, r.vehiculo_clave, r.rodada_grupal_id, r.ruta_opcion_id,
       r.iniciada_en, r.finalizada_en,
       (r.finalizada_en IS NULL) AS en_curso,
       t.minutos,
       COALESCE(tr.km, ro.km) AS km,
       CASE WHEN tr.km IS NOT NULL THEN 'traza' WHEN ro.km IS NOT NULL THEN 'ruta' END AS fuente_km,
       CASE WHEN t.minutos > 0 AND COALESCE(tr.km, ro.km) IS NOT NULL
            THEN round((COALESCE(tr.km, ro.km) / (t.minutos / 60.0))::numeric, 1) END AS velocidad_media_kmh,
       ro.safety_score
FROM rodada r
CROSS JOIN LATERAL (
  SELECT round(GREATEST(0, EXTRACT(epoch FROM (COALESCE(r.finalizada_en, now()) - r.iniciada_en))
           - COALESCE((SELECT sum(EXTRACT(epoch FROM (COALESCE(p.reanudada_en, r.finalizada_en, now()) - p.pausada_en)))
                       FROM rodada_pausa p WHERE p.rodada_id = r.id), 0)) / 60.0)::integer AS minutos
) t
LEFT JOIN LATERAL (
  SELECT (ST_Length(ST_MakeLine(p.geog::geometry ORDER BY p.ts)::geography) / 1000.0)::numeric AS km
  FROM ride_points p WHERE p.ride_id = r.id HAVING count(*) >= 2
) tr ON true
LEFT JOIN v_ruta_opcion ro ON ro.opcion_id = r.ruta_opcion_id
WHERE r.eliminada_en IS NULL;

CREATE VIEW v_estadistica_usuario_mes AS
SELECT usuario_id,
       date_trunc('month', iniciada_en AT TIME ZONE 'America/Monterrey')::date AS mes,
       count(*)::integer AS rodadas,
       COALESCE(sum(km), 0)::numeric(10,1) AS km,
       COALESCE(sum(minutos), 0)::integer AS minutos,
       round(avg(safety_score))::integer AS safety_score_promedio
FROM v_rodada_resumen
WHERE finalizada_en IS NOT NULL
GROUP BY usuario_id, 2;

-- Perfil de una persona con sus estadísticas (reemplaza Person.stats). perfil_visible la
-- respeta la app/consulta: false = solo la propia persona puede abrirlo.
CREATE VIEW v_persona_perfil AS
SELECT u.id AS usuario_id, u.nombre, u.ocupacion, m.nombre AS municipio, u.bio, u.creado_en AS miembro_desde,
       COALESCE(p.perfil_visible, true) AS perfil_visible,
       COALESCE(e.rodadas, 0) AS rodadas,
       COALESCE(e.km, 0)::numeric(10,1) AS km,
       e.safety_score_promedio
FROM usuario u
LEFT JOIN municipio m ON m.clave = u.municipio_clave
LEFT JOIN privacidad_usuario p ON p.usuario_id = u.id
LEFT JOIN LATERAL (
  SELECT count(*)::integer AS rodadas, sum(r.km) AS km, round(avg(r.safety_score))::integer AS safety_score_promedio
  FROM v_rodada_resumen r WHERE r.usuario_id = u.id AND r.finalizada_en IS NOT NULL
) e ON true;

-- Reportes -------------------------------------------------------------------------
-- Estado actual = último renglón de la línea de tiempo (sin renglón: "enviado").
CREATE VIEW v_reporte_estado_actual AS
SELECT DISTINCT ON (h.reporte_id) h.reporte_id, h.estado_clave, h.registrado_en, h.texto
FROM reporte_historial_estado h
JOIN cat_estado_reporte e ON e.clave = h.estado_clave
ORDER BY h.reporte_id, h.registrado_en DESC, e.orden DESC;

-- Vista completa: incluye la autoría real (usuario_id). Solo para "mis reportes" y moderación.
CREATE VIEW v_reporte AS
SELECT r.id AS reporte_id, r.usuario_id, r.categoria_clave, c.nombre AS categoria, c.icono,
       r.geog, ST_Y(r.geog::geometry) AS latitud, ST_X(r.geog::geometry) AS longitud,
       r.referencia, col.nombre AS colonia, mun.nombre AS municipio,
       r.gravedad_clave, r.nota, (r.foto_url IS NOT NULL) AS tiene_foto, r.rodada_id,
       r.creado_en, r.cancelado_en,
       COALESCE(e.estado_clave, 'enviado') AS estado_clave,
       COALESCE(e.registrado_en, r.creado_en) AS estado_desde,
       COALESCE(cf.sigue, 0) AS confirmaciones,
       COALESCE(cf.resuelto, 0) AS marcado_resuelto,
       (r.gravedad_clave IS NULL AND r.cancelado_en IS NULL) AS pendiente_completar,
       (COALESCE(p.reportes_anonimos, false)) AS autor_oculto
FROM reporte r
JOIN cat_categoria_reporte c ON c.clave = r.categoria_clave
LEFT JOIN colonia col ON col.id = r.colonia_id
LEFT JOIN municipio mun ON mun.clave = col.municipio_clave
LEFT JOIN v_reporte_estado_actual e ON e.reporte_id = r.id
LEFT JOIN privacidad_usuario p ON p.usuario_id = r.usuario_id
LEFT JOIN LATERAL (
  SELECT count(*) FILTER (WHERE x.resultado = 'sigue')::integer AS sigue,
         count(*) FILTER (WHERE x.resultado = 'resuelto')::integer AS resuelto
  FROM reporte_confirmacion x WHERE x.reporte_id = r.id
) cf ON true;

-- Vista pública (comunidad, mapa, actividad): sin cancelados y SIN usuario_id real.
-- La autoría se guarda, pero solo se muestra (autor_visible_id) si la persona no eligió "reportes anónimos".
CREATE VIEW v_reporte_publico AS
SELECT v.reporte_id, v.categoria_clave, v.categoria, v.icono, v.geog, v.latitud, v.longitud,
       v.referencia, v.colonia, v.municipio, v.gravedad_clave, v.nota, v.tiene_foto,
       v.creado_en, v.estado_clave, v.estado_desde, v.confirmaciones, v.marcado_resuelto,
       CASE WHEN v.autor_oculto THEN NULL ELSE r.usuario_id END AS autor_visible_id
FROM v_reporte v
JOIN reporte r ON r.id = v.reporte_id
WHERE v.cancelado_en IS NULL;

-- Rodadas grupales -------------------------------------------------------------------
-- estado: cancelada si tiene cancelada_en; finalizada si ya pasó la fecha; programada en otro caso.
CREATE VIEW v_rodada_grupal AS
SELECT g.id AS rodada_grupal_id, g.titulo, g.descripcion, g.programada_en, g.organizador_id,
       g.lugar_salida_id, l.nombre AS lugar_salida, l.detalle AS lugar_detalle, l.geog AS lugar_geog,
       ST_Y(l.geog::geometry) AS latitud, ST_X(l.geog::geometry) AS longitud,
       g.nivel_clave, n.nombre AS nivel, g.ritmo_clave, rt.nombre AS ritmo,
       g.distancia_km, g.cupo, g.privacidad,
       CASE WHEN g.cancelada_en IS NOT NULL THEN 'cancelada'
            WHEN g.programada_en < now() THEN 'finalizada'
            ELSE 'programada' END AS estado,
       COALESCE(a.asistentes, 0) AS asistentes,
       CASE WHEN g.cupo IS NULL THEN NULL ELSE GREATEST(g.cupo - COALESCE(a.asistentes, 0), 0) END AS lugares_disponibles
FROM rodada_grupal g
JOIN lugar l ON l.id = g.lugar_salida_id
JOIN cat_nivel_rodada n ON n.clave = g.nivel_clave
JOIN cat_ritmo_rodada rt ON rt.clave = g.ritmo_clave
LEFT JOIN LATERAL (SELECT count(*)::integer AS asistentes FROM rodada_grupal_asistente x WHERE x.rodada_grupal_id = g.id) a ON true;

-- Asistentes con los datos mínimos que muestra la pantalla de asistentes.
CREATE VIEW v_rodada_grupal_asistente AS
SELECT a.rodada_grupal_id, a.usuario_id, u.nombre, m.nombre AS municipio, a.se_unio_en,
       (a.usuario_id = g.organizador_id) AS es_organizador
FROM rodada_grupal_asistente a
JOIN rodada_grupal g ON g.id = a.rodada_grupal_id
JOIN usuario u ON u.id = a.usuario_id
LEFT JOIN municipio m ON m.clave = u.municipio_clave;

-- Notificaciones ------------------------------------------------------------------
-- tipo (alerta | reporte | amistad | rodada) se deduce del destino. Para tipo = 'amistad':
--   subtipo 'solicitud_recibida' si la persona notificada es el receptor ("te enviaron solicitud");
--   subtipo 'solicitud_aceptada' si es el emisor ("aceptaron tu solicitud").
CREATE VIEW v_notificacion AS
SELECT n.id AS notificacion_id, n.usuario_id, n.creada_en, n.leida_en, (n.leida_en IS NULL) AS no_leida,
       CASE WHEN n.reporte_id IS NOT NULL THEN 'alerta'
            WHEN n.historial_estado_id IS NOT NULL THEN 'reporte'
            WHEN n.solicitud_amistad_id IS NOT NULL THEN 'amistad'
            ELSE 'rodada' END AS tipo,
       CASE WHEN n.solicitud_amistad_id IS NULL THEN NULL
            WHEN s.receptor_id = n.usuario_id THEN 'solicitud_recibida'
            ELSE 'solicitud_aceptada' END AS subtipo,
       COALESCE(n.reporte_id, h.reporte_id) AS reporte_id,
       h.estado_clave AS reporte_estado_clave,
       CASE WHEN s.receptor_id = n.usuario_id THEN s.emisor_id ELSE s.receptor_id END AS otra_persona_id,
       n.rodada_grupal_id
FROM notificacion n
LEFT JOIN reporte_historial_estado h ON h.id = n.historial_estado_id
LEFT JOIN solicitud_amistad s ON s.id = n.solicitud_amistad_id;

-- Ubicación compartida -------------------------------------------------------------
-- Una fila por destinatario con una comparticion activa (también alimenta "allow" del JWT del tiempo real).
CREATE VIEW v_comparticion_activa AS
SELECT c.id AS comparticion_id, c.usuario_id, d.destinatario_id, c.inicia_en, c.expira_en
FROM comparticion_ubicacion c
JOIN comparticion_destinatario d ON d.comparticion_id = c.id
WHERE c.detenida_en IS NULL AND (c.expira_en IS NULL OR c.expira_en > now());

-- Premium ------------------------------------------------------------------------
CREATE VIEW v_suscripcion_actual AS
SELECT DISTINCT ON (s.usuario_id)
       s.usuario_id, s.id AS suscripcion_id, s.plan_clave, p.nombre AS plan, s.inicia_en, s.vigente_hasta, s.cancelada_en,
       (s.vigente_hasta > now()) AS activa,
       (s.cancelada_en IS NOT NULL) AS cancelada,
       (s.vigente_hasta > now() AND s.cancelada_en IS NULL) AS renueva
FROM suscripcion s
JOIN plan p ON p.clave = s.plan_clave
WHERE s.usuario_id IS NOT NULL
ORDER BY s.usuario_id, s.vigente_hasta DESC;

-- Recibo: subtotal = total / (1 + tasa), IVA = total - subtotal.
CREATE VIEW v_pago_recibo AS
SELECT g.id AS pago_id, g.folio, s.usuario_id, u.nombre AS cliente, p.nombre AS concepto,
       g.pagado_en, m.nombre AS metodo_pago, g.tarjeta_ultimos4,
       round(g.monto_total / (1 + g.tasa_iva), 2) AS subtotal,
       g.monto_total - round(g.monto_total / (1 + g.tasa_iva), 2) AS iva,
       g.tasa_iva, g.monto_total AS total
FROM pago g
JOIN suscripcion s ON s.id = g.suscripcion_id
JOIN plan p ON p.clave = s.plan_clave
JOIN cat_metodo_pago m ON m.clave = g.metodo_clave
LEFT JOIN usuario u ON u.id = s.usuario_id;

-- Zonas -----------------------------------------------------------------------------
-- Fórmula del Safety Score de una zona en el mes M (solo con reportes dentro del polígono, ST_Covers;
-- no se recorre ride_points):
--   riesgo(M) = suma de cat_categoria_reporte.peso_riesgo de los reportes no cancelados dentro de la
--               zona creados en los 3 meses que terminan en M (M y los dos anteriores)
--   score(M)  = round(100 * exp(-riesgo(M) / 40))      -> 100 sin reportes, baja al crecer el riesgo
-- Los parámetros (ventana de 3 meses y escala 40) son decisiones de diseño a calibrar con datos reales.
CREATE VIEW v_zona_seguridad_mensual AS
WITH meses AS (
  SELECT z.id AS zona_id, z.area, m::date AS mes
  FROM zona z
  CROSS JOIN LATERAL generate_series(
    date_trunc('month', now() AT TIME ZONE 'America/Monterrey') - interval '5 months',
    date_trunc('month', now() AT TIME ZONE 'America/Monterrey'),
    interval '1 month') AS m
)
SELECT me.zona_id, me.mes,
       count(r.id)::integer AS reportes_ventana,
       COALESCE(sum(c.peso_riesgo), 0) AS riesgo,
       round(100 * exp(-COALESCE(sum(c.peso_riesgo), 0) / 40.0))::integer AS score
FROM meses me
LEFT JOIN reporte r ON r.cancelado_en IS NULL
     AND ST_Covers(me.area, r.geog)
     AND (r.creado_en AT TIME ZONE 'America/Monterrey') >= (me.mes - interval '2 months')
     AND (r.creado_en AT TIME ZONE 'America/Monterrey') <  (me.mes + interval '1 month')
LEFT JOIN cat_categoria_reporte c ON c.clave = r.categoria_clave
GROUP BY me.zona_id, me.mes;

-- Resumen actual de cada zona: score del mes en curso y tendencia contra el mes anterior.
CREATE VIEW v_zona_resumen AS
SELECT z.id AS zona_id, z.nombre, z.detalle, mu.nombre AS municipio, z.descripcion,
       ST_Y(ST_Centroid(z.area::geometry)) AS latitud, ST_X(ST_Centroid(z.area::geometry)) AS longitud,
       a.score, a.score - p.score AS tendencia
FROM zona z
JOIN municipio mu ON mu.clave = z.municipio_clave
LEFT JOIN v_zona_seguridad_mensual a
       ON a.zona_id = z.id AND a.mes = date_trunc('month', now() AT TIME ZONE 'America/Monterrey')::date
LEFT JOIN v_zona_seguridad_mensual p
       ON p.zona_id = z.id AND p.mes = (a.mes - interval '1 month')::date;

-- Reportes de la zona por categoría en los últimos 6 meses.
CREATE VIEW v_zona_reporte_categoria AS
SELECT z.id AS zona_id, c.clave AS categoria_clave, c.nombre AS categoria, count(*)::integer AS reportes
FROM zona z
JOIN reporte r ON r.cancelado_en IS NULL
              AND r.creado_en >= now() - interval '6 months'
              AND ST_Covers(z.area, r.geog)
JOIN cat_categoria_reporte c ON c.clave = r.categoria_clave
GROUP BY z.id, c.clave, c.nombre;

-- Riesgo por franja horaria (0-100), relativo a la franja con más riesgo ponderado de la zona
-- (la franja pico vale 100; sin reportes todas valen 0). Últimos 6 meses, hora de Monterrey.
CREATE VIEW v_zona_riesgo_horario AS
WITH base AS (
  SELECT z.id AS zona_id, f.clave AS franja_clave, f.etiqueta, f.hora_desde,
         COALESCE(sum(c.peso_riesgo), 0) AS peso
  FROM zona z
  CROSS JOIN cat_franja_horaria f
  LEFT JOIN reporte r ON r.cancelado_en IS NULL
       AND r.creado_en >= now() - interval '6 months'
       AND ST_Covers(z.area, r.geog)
       AND EXTRACT(hour FROM r.creado_en AT TIME ZONE 'America/Monterrey') >= f.hora_desde
       AND EXTRACT(hour FROM r.creado_en AT TIME ZONE 'America/Monterrey') <  f.hora_hasta
  LEFT JOIN cat_categoria_reporte c ON c.clave = r.categoria_clave
  GROUP BY z.id, f.clave, f.etiqueta, f.hora_desde
)
SELECT zona_id, franja_clave, etiqueta,
       CASE WHEN max(peso) OVER (PARTITION BY zona_id) = 0 THEN 0
            ELSE round(100 * peso / max(peso) OVER (PARTITION BY zona_id))::integer END AS riesgo
FROM base;
