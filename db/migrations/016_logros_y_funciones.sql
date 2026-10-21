-- 016: cálculo de métricas (retos e insignias), vistas de progreso y actividad, y funciones de consulta.
SET search_path = waylo, public;

-- Valor de una métrica para una persona dentro de una ventana opcional [p_desde, p_hasta).
-- Filtros: p_categoria y p_estado (solo reportes_enviados), p_umbral (solo rodadas_seguras).
CREATE FUNCTION fn_valor_metrica(
  p_usuario   uuid,
  p_metrica   text,
  p_categoria text DEFAULT NULL,
  p_estado    text DEFAULT NULL,
  p_umbral    integer DEFAULT NULL,
  p_desde     timestamptz DEFAULT NULL,
  p_hasta     timestamptz DEFAULT NULL
) RETURNS numeric
LANGUAGE plpgsql STABLE
SET search_path = waylo, public
AS $$
DECLARE
  v numeric;
BEGIN
  CASE p_metrica
    WHEN 'km_recorridos' THEN
      SELECT COALESCE(sum(r.km), 0) INTO v FROM v_rodada_resumen r
      WHERE r.usuario_id = p_usuario AND r.finalizada_en IS NOT NULL
        AND (p_desde IS NULL OR r.iniciada_en >= p_desde) AND (p_hasta IS NULL OR r.iniciada_en < p_hasta);
    WHEN 'rodadas_registradas' THEN
      SELECT count(*) INTO v FROM v_rodada_resumen r
      WHERE r.usuario_id = p_usuario AND r.finalizada_en IS NOT NULL
        AND (p_desde IS NULL OR r.iniciada_en >= p_desde) AND (p_hasta IS NULL OR r.iniciada_en < p_hasta);
    WHEN 'rodadas_seguras' THEN
      SELECT count(*) INTO v FROM v_rodada_resumen r
      WHERE r.usuario_id = p_usuario AND r.finalizada_en IS NOT NULL
        AND r.safety_score >= COALESCE(p_umbral, 80)
        AND (p_desde IS NULL OR r.iniciada_en >= p_desde) AND (p_hasta IS NULL OR r.iniciada_en < p_hasta);
    WHEN 'semanas_consecutivas' THEN
      -- Racha de semanas (lunes a domingo, hora de Monterrey) con al menos una rodada, vigente si
      -- termina en la semana actual o en la anterior.
      WITH semanas AS (
        SELECT DISTINCT date_trunc('week', r.iniciada_en AT TIME ZONE 'America/Monterrey')::date AS semana
        FROM v_rodada_resumen r
        WHERE r.usuario_id = p_usuario AND r.finalizada_en IS NOT NULL
          AND (p_desde IS NULL OR r.iniciada_en >= p_desde) AND (p_hasta IS NULL OR r.iniciada_en < p_hasta)
      ), islas AS (
        SELECT semana, semana - (row_number() OVER (ORDER BY semana) * 7)::integer AS isla FROM semanas
      ), ultima AS (
        SELECT count(*) AS largo, max(semana) AS fin FROM islas GROUP BY isla ORDER BY max(semana) DESC LIMIT 1
      )
      SELECT CASE WHEN fin >= date_trunc('week', now() AT TIME ZONE 'America/Monterrey')::date - 7 THEN largo ELSE 0 END
      INTO v FROM ultima;
    WHEN 'reportes_enviados' THEN
      SELECT count(*) INTO v FROM v_reporte r
      WHERE r.usuario_id = p_usuario AND r.cancelado_en IS NULL
        AND (p_categoria IS NULL OR r.categoria_clave = p_categoria)
        AND (p_estado IS NULL OR r.estado_clave = p_estado)
        AND (p_desde IS NULL OR r.creado_en >= p_desde) AND (p_hasta IS NULL OR r.creado_en < p_hasta);
    WHEN 'reportes_confirmados' THEN
      SELECT count(*) INTO v FROM v_reporte r
      WHERE r.usuario_id = p_usuario AND r.cancelado_en IS NULL AND r.confirmaciones >= 1
        AND (p_desde IS NULL OR r.creado_en >= p_desde) AND (p_hasta IS NULL OR r.creado_en < p_hasta);
    WHEN 'rodadas_grupales_asistidas' THEN
      SELECT count(*) INTO v FROM rodada_grupal_asistente a
      JOIN v_rodada_grupal g ON g.rodada_grupal_id = a.rodada_grupal_id
      WHERE a.usuario_id = p_usuario AND g.estado = 'finalizada'
        AND (p_desde IS NULL OR g.programada_en >= p_desde) AND (p_hasta IS NULL OR g.programada_en < p_hasta);
    WHEN 'rodadas_grupales_organizadas' THEN
      SELECT count(*) INTO v FROM rodada_grupal g
      WHERE g.organizador_id = p_usuario AND g.cancelada_en IS NULL
        AND (p_desde IS NULL OR g.creada_en >= p_desde) AND (p_hasta IS NULL OR g.creada_en < p_hasta);
    ELSE
      RAISE EXCEPTION 'Métrica desconocida: %', p_metrica;
  END CASE;
  RETURN COALESCE(v, 0);
END;
$$;

-- Progreso de cada insignia para cada persona. Si ya la obtuvo, el progreso es la meta completa.
CREATE VIEW v_insignia_progreso AS
SELECT u.id AS usuario_id, i.clave AS insignia_clave, i.nombre, i.descripcion, i.como_obtenerla, i.meta,
       CASE WHEN ui.usuario_id IS NOT NULL THEN COALESCE(i.meta, 0)::numeric
            WHEN i.metrica_clave IS NULL THEN 0
            ELSE LEAST(fn_valor_metrica(u.id, i.metrica_clave, i.categoria_reporte_clave, i.estado_reporte_clave, i.umbral_score), i.meta)
       END AS progreso,
       (ui.usuario_id IS NOT NULL) AS obtenida,
       ui.obtenida_en
FROM usuario u
CROSS JOIN insignia i
LEFT JOIN usuario_insignia ui ON ui.usuario_id = u.id AND ui.insignia_clave = i.clave;

-- Retos con su vigencia y número de participantes (se cuentan, no se guardan).
CREATE VIEW v_reto AS
SELECT r.id AS reto_id, r.titulo, r.descripcion, r.metrica_clave, r.meta, r.umbral_score, r.inicia_en, r.termina_en,
       r.insignia_premio, i.nombre AS premio,
       GREATEST(0, r.termina_en - (now() AT TIME ZONE 'America/Monterrey')::date) AS dias_restantes,
       ((now() AT TIME ZONE 'America/Monterrey')::date BETWEEN r.inicia_en AND r.termina_en) AS vigente,
       (SELECT count(*)::integer FROM reto_participacion p WHERE p.reto_id = r.id) AS participantes
FROM reto r
LEFT JOIN insignia i ON i.clave = r.insignia_premio;

-- Progreso de cada participante dentro de la ventana del reto.
CREATE VIEW v_reto_progreso AS
SELECT p.usuario_id, r.reto_id, r.titulo, r.meta, r.dias_restantes, r.participantes,
       LEAST(fn_valor_metrica(p.usuario_id, r.metrica_clave, NULL, NULL, r.umbral_score,
               r.inicia_en::timestamp AT TIME ZONE 'America/Monterrey',
               (r.termina_en + 1)::timestamp AT TIME ZONE 'America/Monterrey'), r.meta)::numeric(10,1) AS progreso
FROM reto_participacion p
JOIN v_reto r ON r.reto_id = p.reto_id;

-- Ranking mensual por kilómetros (solo perfiles visibles).
CREATE VIEW v_ranking_km_mes AS
SELECT mes, usuario_id, nombre, km, rank() OVER (PARTITION BY mes ORDER BY km DESC)::integer AS posicion
FROM (
  SELECT date_trunc('month', r.iniciada_en AT TIME ZONE 'America/Monterrey')::date AS mes,
         r.usuario_id, u.nombre, sum(r.km)::numeric(10,1) AS km
  FROM v_rodada_resumen r
  JOIN usuario u ON u.id = r.usuario_id
  LEFT JOIN privacidad_usuario p ON p.usuario_id = r.usuario_id
  WHERE r.finalizada_en IS NOT NULL AND r.km IS NOT NULL AND COALESCE(p.perfil_visible, true)
  GROUP BY 1, r.usuario_id, u.nombre
) x;

-- Actividad de amigos (Inicio). Una fila por rodada finalizada de un amigo cuya visibilidad sea
-- "amigos" o "todos". espectador_id es quien mira el feed. Excluye bloqueos en cualquier sentido.
CREATE VIEW v_actividad_amigos AS
SELECT a.usuario_id AS espectador_id, r.usuario_id AS autor_id, u.nombre AS autor_nombre,
       r.rodada_id, r.titulo, r.vehiculo_clave, r.km, r.minutos, r.safety_score, r.iniciada_en
FROM v_amigo a
JOIN v_rodada_resumen r ON r.usuario_id = a.amigo_id AND r.finalizada_en IS NOT NULL
JOIN usuario u ON u.id = r.usuario_id
LEFT JOIN privacidad_usuario p ON p.usuario_id = r.usuario_id
WHERE COALESCE(p.visibilidad_rodadas, 'amigos') IN ('todos', 'amigos')
  AND NOT EXISTS (SELECT 1 FROM usuario_bloqueado b
                  WHERE (b.usuario_id = a.usuario_id AND b.bloqueado_id = r.usuario_id)
                     OR (b.usuario_id = r.usuario_id AND b.bloqueado_id = a.usuario_id));

-- Actividad de la comunidad: rodadas de personas con visibilidad "todos" y perfil visible.
-- La zona que muestra la pantalla es el municipio de la persona.
CREATE FUNCTION fn_actividad_comunidad(p_espectador uuid, p_limite integer DEFAULT 20)
RETURNS TABLE (autor_id uuid, autor_nombre text, municipio text, rodada_id uuid, titulo text,
               km numeric, minutos integer, safety_score integer, iniciada_en timestamptz)
LANGUAGE sql STABLE
SET search_path = waylo, public
AS $$
  SELECT r.usuario_id, u.nombre, m.nombre, r.rodada_id, r.titulo, r.km, r.minutos, r.safety_score, r.iniciada_en
  FROM v_rodada_resumen r
  JOIN usuario u ON u.id = r.usuario_id
  LEFT JOIN municipio m ON m.clave = u.municipio_clave
  JOIN privacidad_usuario p ON p.usuario_id = r.usuario_id
  WHERE r.finalizada_en IS NOT NULL
    AND p.visibilidad_rodadas = 'todos' AND p.perfil_visible
    AND r.usuario_id <> p_espectador
    AND NOT EXISTS (SELECT 1 FROM usuario_bloqueado b
                    WHERE (b.usuario_id = p_espectador AND b.bloqueado_id = r.usuario_id)
                       OR (b.usuario_id = r.usuario_id AND b.bloqueado_id = p_espectador))
  ORDER BY r.iniciada_en DESC
  LIMIT p_limite
$$;

-- Reportes cercanos a un punto (Mapa y alertas). Usa la vista pública: no revela autoría de
-- quienes eligieron reportes anónimos. Si se pasa p_usuario, omite reportes de personas bloqueadas.
CREATE FUNCTION fn_reportes_cercanos(
  p_lat      double precision,
  p_lng      double precision,
  p_radio_m  integer DEFAULT 1000,
  p_dias     integer DEFAULT 30,
  p_usuario  uuid DEFAULT NULL
) RETURNS TABLE (reporte_id uuid, categoria_clave text, categoria text, latitud double precision,
                 longitud double precision, referencia text, colonia text, estado_clave text,
                 confirmaciones integer, creado_en timestamptz, distancia_m double precision,
                 autor_visible_id uuid)
LANGUAGE sql STABLE
SET search_path = waylo, public
AS $$
  SELECT v.reporte_id, v.categoria_clave, v.categoria, v.latitud, v.longitud, v.referencia, v.colonia,
         v.estado_clave, v.confirmaciones, v.creado_en,
         ST_Distance(v.geog, pt.g) AS distancia_m,
         v.autor_visible_id
  FROM v_reporte_publico v
  CROSS JOIN (SELECT ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography AS g) pt
  WHERE ST_DWithin(v.geog, pt.g, p_radio_m)
    AND v.creado_en >= now() - make_interval(days => p_dias)
    AND (p_usuario IS NULL OR NOT EXISTS (
          SELECT 1 FROM reporte r
          JOIN usuario_bloqueado b ON (b.usuario_id = p_usuario AND b.bloqueado_id = r.usuario_id)
                                   OR (b.bloqueado_id = p_usuario AND b.usuario_id = r.usuario_id)
          WHERE r.id = v.reporte_id))
  ORDER BY distancia_m
$$;

-- waylo_app solo lee las vistas: se le quitan los permisos de escritura que otorgan los
-- privilegios por omisión del esquema. (Volver a correr este bloque si se agregan vistas.)
DO $$
DECLARE
  v record;
BEGIN
  FOR v IN SELECT viewname FROM pg_views WHERE schemaname = 'waylo' LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON waylo.%I FROM waylo_app', v.viewname);
  END LOOP;
END;
$$;
