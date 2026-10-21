-- Pruebas SQL de la base de Waylo. Requieren haber aplicado `./db/apply.sh --seed`.
--
--   psql -X --dbname="$MIGRATOR_DATABASE_URL" -f db/verify.sql
--
-- Todo corre dentro de una transacción que termina en ROLLBACK: no deja datos. Cada prueba que modifica
-- datos se revierte sola (subtransacción). Si alguna falla, psql se detiene con el mensaje
-- "PRUEBA FALLIDA: ..." y un código de salida distinto de cero. Al final imprime TODAS LAS PRUEBAS PASARON.
-- Las pruebas que dependen de la fecha actual están protegidas para no fallar por el paso del tiempo.

\set ON_ERROR_STOP on
\pset pager off
\pset null '(null)'
SET search_path = waylo, public;
BEGIN;

CREATE FUNCTION pg_temp.id(text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT md5('waylo-demo:' || $1)::uuid $$;

-- ok(condición, mensaje): falla si la condición no es verdadera.
CREATE FUNCTION pg_temp.ok(p_cond boolean, p_msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_cond IS NOT TRUE THEN
    RAISE EXCEPTION 'PRUEBA FALLIDA: %', p_msg;
  END IF;
  RAISE NOTICE 'ok  %', p_msg;
END;
$$;

-- q(consulta): devuelve el primer valor de la consulta como texto.
CREATE FUNCTION pg_temp.q(p_sql text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE v text;
BEGIN
  EXECUTE p_sql INTO v;
  RETURN v;
END;
$$;

-- debe_fallar(sentencia, sqlstate, mensaje): la sentencia debe lanzar exactamente ese error.
-- 23505 unique, 23514 check, 23503 foreign key, 23502 not null; '*' acepta cualquier error.
CREATE FUNCTION pg_temp.debe_fallar(p_sql text, p_sqlstate text, p_msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    IF p_sqlstate = '*' OR SQLSTATE = p_sqlstate THEN
      RAISE NOTICE 'ok  % (rechazado con %)', p_msg, SQLSTATE;
      RETURN;
    END IF;
    RAISE EXCEPTION 'PRUEBA FALLIDA: % (se esperaba %, llegó % %)', p_msg, p_sqlstate, SQLSTATE, SQLERRM;
  END;
  RAISE EXCEPTION 'PRUEBA FALLIDA: % (se esperaba error %, pero la sentencia pasó)', p_msg, p_sqlstate;
END;
$$;

\echo
\echo '== 1. Estructura: el diseño corregido y la normalización =='

DO $$
DECLARE
  t text;
BEGIN
  -- Tablas que NO deben existir (se eliminaron por normalización) y objetos que deben ser vistas.
  PERFORM pg_temp.ok(to_regclass('waylo.amistad') IS NULL, 'no existe la tabla amistad (es la vista v_amistad)');
  PERFORM pg_temp.ok(to_regclass('waylo.via') IS NULL, 'no existe la tabla via');
  PERFORM pg_temp.ok(to_regclass('waylo.zona_seguridad_mensual') IS NULL AND to_regclass('waylo.zona_riesgo_horario') IS NULL,
                     'no hay tablas zona_seguridad_mensual ni zona_riesgo_horario (son vistas)');
  PERFORM pg_temp.ok((SELECT relkind FROM pg_class WHERE oid = 'waylo.v_amistad'::regclass) = 'v', 'v_amistad es una vista');
  PERFORM pg_temp.ok((SELECT relkind FROM pg_class WHERE oid = 'waylo.v_zona_seguridad_mensual'::regclass) = 'v', 'v_zona_seguridad_mensual es una vista');

  -- Dominios cubiertos: una tabla por dominio al menos.
  FOREACH t IN ARRAY ARRAY['usuario','credencial','sesion','verificacion_correo','recuperacion_contrasena','usuario_vehiculo',
    'preferencia_ruta','preferencia_ruta_evitar','preferencia_ruta_preferir','preferencia_notificacion','preferencia_alerta_ruta',
    'preferencia_recordatorio_rodada','horario_silencioso','privacidad_usuario','usuario_bloqueado','municipio','colonia','lugar',
    'lugar_guardado','historial_busqueda','ruta_consulta','ruta_opcion','ruta_opcion_factor','ruta_opcion_maniobra','ruta_guardada',
    'rodada','rodada_pausa','ride_points','comparticion_ubicacion','comparticion_destinatario','reporte','reporte_historial_estado',
    'reporte_confirmacion','denuncia_contenido','solicitud_amistad','reaccion_rodada','comentario_rodada','notificacion',
    'rodada_grupal','rodada_grupal_vehiculo','rodada_grupal_regla','rodada_grupal_asistente','rodada_grupal_invitacion','club',
    'club_miembro','club_solicitud_ingreso','club_rodada','reto','reto_participacion','insignia','usuario_insignia',
    'contacto_emergencia','config_caidas','evento_emergencia','evento_emergencia_aviso','plan','suscripcion','pago','zona',
    'area_mapa','mapa_descargado','comentario_app','mensaje_soporte','schema_migrations']
  LOOP
    PERFORM pg_temp.ok(to_regclass('waylo.' || t) IS NOT NULL, 'existe la tabla ' || t);
  END LOOP;

  -- Contrato de ride_points (docs/arquitectura.md): sin user_id, llave primaria (ride_id, ts).
  PERFORM pg_temp.ok((SELECT string_agg(column_name, ',' ORDER BY column_name) FROM information_schema.columns
                      WHERE table_schema = 'waylo' AND table_name = 'ride_points') = 'accuracy,geog,heading,ride_id,speed,ts',
                     'ride_points tiene exactamente ride_id, ts, geog, speed, heading, accuracy (sin user_id)');
  PERFORM pg_temp.ok((SELECT pg_get_constraintdef(oid) FROM pg_constraint
                      WHERE conrelid = 'waylo.ride_points'::regclass AND contype = 'p') = 'PRIMARY KEY (ride_id, ts)',
                     'ride_points: llave primaria compuesta (ride_id, ts)');

  -- Estados deducibles que no deben existir como columna.
  PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'waylo'
                      AND ((table_name = 'rodada' AND column_name = 'estado')
                        OR (table_name = 'rodada_grupal' AND column_name = 'estado')
                        OR (table_name = 'suscripcion' AND column_name IN ('estado', 'activa'))
                        OR (table_name = 'comparticion_ubicacion' AND column_name = 'estado')
                        OR (table_name = 'ruta_opcion' AND column_name IN ('km', 'safety_score'))
                        OR (table_name = 'notificacion' AND column_name IN ('tipo', 'titulo', 'texto', 'href'))
                        OR (table_name = 'ride_points' AND column_name = 'user_id'))),
                     'no hay columnas de estado/km/score/tipo/texto deducibles');

  -- Sin arreglos ni JSON en ninguna tabla ni vista del esquema (1FN).
  PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'waylo' AND (data_type = 'ARRAY' OR data_type IN ('json', 'jsonb'))),
                     'ninguna columna es arreglo ni JSON (1FN)');

  -- Toda tabla tiene llave primaria.
  PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                      WHERE n.nspname = 'waylo' AND c.relkind = 'r'
                        AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conrelid = c.oid AND k.contype = 'p')),
                     'toda tabla tiene llave primaria');

  -- Todo FK declara su política de borrado (no se dejó el valor implícito por descuido):
  -- NO ACTION solo en los FK a lugar documentados en la migración 005/006.
  PERFORM pg_temp.ok((SELECT count(*) FROM pg_constraint k JOIN pg_namespace n ON n.oid = k.connamespace
                      WHERE n.nspname = 'waylo' AND k.contype = 'f' AND k.confdeltype = 'a'
                        AND k.conrelid::regclass::text NOT IN ('ruta_consulta', 'ruta_guardada', 'rodada_grupal')) = 0,
                     'los FK usan una política de borrado explícita (NO ACTION solo hacia lugar)');

  -- Columnas geográficas con el tipo PostGIS esperado e índice GiST.
  PERFORM pg_temp.ok((SELECT count(*) FROM pg_indexes WHERE schemaname = 'waylo' AND indexdef LIKE '%USING gist%') >= 5,
                     'hay índices GiST para las columnas geográficas');
  PERFORM pg_temp.ok((SELECT type FROM geography_columns WHERE f_table_schema = 'waylo' AND f_table_name = 'zona' AND f_geography_column = 'area') = 'Polygon',
                     'zona.area es geography(Polygon)');
  PERFORM pg_temp.ok((SELECT type FROM geography_columns WHERE f_table_schema = 'waylo' AND f_table_name = 'ride_points' AND f_geography_column = 'geog') = 'Point',
                     'ride_points.geog es geography(Point)');
  PERFORM pg_temp.ok((SELECT type FROM geography_columns WHERE f_table_schema = 'waylo' AND f_table_name = 'ruta_opcion' AND f_geography_column = 'trazo') = 'LineString',
                     'ruta_opcion.trazo es geography(LineString)');

  -- Catálogos esperados.
  PERFORM pg_temp.ok((SELECT count(*) FROM cat_categoria_reporte) = 7 AND (SELECT count(*) FROM cat_factor_seguridad) = 5, '7 categorías de reporte y 5 factores del Safety Score');
  PERFORM pg_temp.ok((SELECT round(sum(peso), 3) FROM cat_factor_seguridad) = 1.000, 'los pesos de los factores suman 1');
  PERFORM pg_temp.ok((SELECT count(*) FROM insignia) = 8 AND (SELECT count(*) FROM insignia WHERE metrica_clave IS NULL) = 0, 'las 8 insignias tienen métrica calculable');
  PERFORM pg_temp.ok((SELECT count(*) FROM municipio) = 18, '18 municipios del AMM');
END;
$$;

\echo
\echo '== 2. Permisos por rol =='

DO $$
BEGIN
  PERFORM pg_temp.ok(has_schema_privilege('waylo_app', 'waylo', 'USAGE'), 'waylo_app tiene USAGE en el esquema waylo');
  PERFORM pg_temp.ok(NOT has_schema_privilege('waylo_app', 'waylo', 'CREATE'), 'waylo_app NO puede crear objetos en waylo (sin DDL)');
  PERFORM pg_temp.ok(has_table_privilege('waylo_app', 'waylo.usuario', 'SELECT') AND has_table_privilege('waylo_app', 'waylo.usuario', 'INSERT')
                     AND has_table_privilege('waylo_app', 'waylo.usuario', 'UPDATE') AND has_table_privilege('waylo_app', 'waylo.usuario', 'DELETE'),
                     'waylo_app tiene SELECT/INSERT/UPDATE/DELETE en tablas');
  PERFORM pg_temp.ok(has_table_privilege('waylo_app', 'waylo.ride_points', 'INSERT'), 'waylo_app puede insertar en ride_points');
  PERFORM pg_temp.ok(NOT has_table_privilege('waylo_app', 'waylo.usuario', 'TRUNCATE') AND NOT has_table_privilege('waylo_app', 'waylo.usuario', 'REFERENCES')
                     AND NOT has_table_privilege('waylo_app', 'waylo.usuario', 'TRIGGER'), 'waylo_app no tiene TRUNCATE/REFERENCES/TRIGGER');
  PERFORM pg_temp.ok(NOT has_table_privilege('waylo_app', 'waylo.v_amistad', 'INSERT') AND NOT has_table_privilege('waylo_app', 'waylo.v_reporte', 'DELETE')
                     AND has_table_privilege('waylo_app', 'waylo.v_amistad', 'SELECT'), 'waylo_app solo lee las vistas');
  PERFORM pg_temp.ok(has_table_privilege('waylo_app', 'waylo.schema_migrations', 'SELECT') AND NOT has_table_privilege('waylo_app', 'waylo.schema_migrations', 'INSERT'),
                     'waylo_app no puede escribir schema_migrations');
  PERFORM pg_temp.ok(has_function_privilege('waylo_app', 'waylo.fn_reportes_cercanos(double precision, double precision, integer, integer, uuid)', 'EXECUTE'),
                     'waylo_app puede ejecutar fn_reportes_cercanos');
  PERFORM pg_temp.ok((SELECT pg_get_userbyid(nspowner) FROM pg_namespace WHERE nspname = 'waylo') <> 'waylo_app', 'waylo_app no es dueña del esquema');
END;
$$;

\echo
\echo '== 3. Restricciones: CHECK, UNIQUE, FK, NOT NULL =='

DO $$
BEGIN
  -- Cuenta
  PERFORM pg_temp.debe_fallar($q$INSERT INTO usuario (nombre, correo) VALUES ('Otra Daniela', 'daniela.garza@correo.com')$q$, '23505', 'correo duplicado');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO usuario (nombre, correo) VALUES ('Mayúsculas', 'Persona@Correo.com')$q$, '23514', 'correo debe estar en minúsculas');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO usuario (nombre, correo) VALUES (NULL, 'sin.nombre@correo.com')$q$, '23502', 'el nombre es obligatorio');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO usuario (nombre, correo, uso_principal_clave) VALUES ('X', 'x@correo.com', 'inexistente')$q$, '23503', 'uso principal inexistente');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO preferencia_alerta_ruta (usuario_id, distancia_aviso_m) VALUES (pg_temp.id('usuario:p_1'), 300)$q$, '23514', 'distancia de aviso solo 200, 500 o 1000');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO preferencia_ruta (usuario_id, inclinacion_segura) VALUES (pg_temp.id('usuario:p_1'), 101)$q$, '23514', 'preferencia de ruta de 0 a 100');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO privacidad_usuario (usuario_id, visibilidad_rodadas) VALUES (pg_temp.id('usuario:p_1'), 'otros')$q$, '23514', 'visibilidad de rodadas: todos, amigos o yo');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO usuario_bloqueado (usuario_id, bloqueado_id) VALUES (pg_temp.id('usuario:p_1'), pg_temp.id('usuario:p_1'))$q$, '23514', 'no se puede bloquear a uno mismo');

  -- Lugares
  PERFORM pg_temp.debe_fallar($q$INSERT INTO lugar_guardado (usuario_id, lugar_id, tipo_lugar_clave, etiqueta)
                                  VALUES (pg_temp.id('usuario:u_001'), pg_temp.id('lugar:u_001:plaza'), 'casa', 'Otra casa')$q$, '23505', 'una sola casa por usuario');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO lugar_guardado (usuario_id, lugar_id, tipo_lugar_clave, etiqueta)
                                  VALUES (pg_temp.id('usuario:u_001'), pg_temp.id('lugar:udem'), 'favorito', 'UDEM pública')$q$, '23503', 'un lugar guardado debe ser del propio usuario');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO lugar (nombre, geog) VALUES ('Fuera del AMM', ST_SetSRID(ST_MakePoint(-99.1, 19.4), 4326)::geography)$q$, '23514', 'lugar fuera de la zona metropolitana');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO ruta_opcion_factor (opcion_id, factor_clave, calificacion, explicacion)
                                  VALUES (pg_temp.id('ruta_opcion:segura'), 'trafico', 50, 'x')$q$, '23505', 'factor duplicado por opción (llave primaria)');
  PERFORM pg_temp.debe_fallar($q$UPDATE ruta_opcion_factor SET calificacion = 101 WHERE opcion_id = pg_temp.id('ruta_opcion:segura')$q$, '23514', 'calificación de 0 a 100');

  -- Rodadas y trazas
  PERFORM pg_temp.debe_fallar($q$INSERT INTO rodada (usuario_id, titulo, vehiculo_clave, iniciada_en, finalizada_en)
                                  VALUES (pg_temp.id('usuario:u_001'), 'Al revés', 'bicicleta', '2026-10-05T08:00:00Z', '2026-10-05T07:00:00Z')$q$, '23514', 'finalizada_en debe ser posterior a iniciada_en');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO ride_points (ride_id, ts, geog, speed, heading, accuracy)
                                  VALUES (pg_temp.id('rodada:ride_88'), now(), ST_SetSRID(ST_MakePoint(-100.41, 25.65), 4326)::geography, 90, 10, 5)$q$, '23514', 'ride_points: velocidad máxima 80 km/h');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO ride_points (ride_id, ts, geog, speed, heading, accuracy)
                                  VALUES (pg_temp.id('rodada:ride_88'), now(), ST_SetSRID(ST_MakePoint(-100.41, 25.65), 4326)::geography, 10, 360, 5)$q$, '23514', 'ride_points: rumbo de 0 a 359');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO ride_points (ride_id, ts, geog, speed, heading, accuracy)
                                  VALUES (pg_temp.id('rodada:ride_88'), now(), ST_SetSRID(ST_MakePoint(-100.41, 25.65), 4326)::geography, 10, 10, 31)$q$, '23514', 'ride_points: precisión de 30 m o mejor');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO ride_points (ride_id, ts, geog, speed, heading, accuracy)
                                  VALUES (pg_temp.id('rodada:ride_88'), now(), ST_SetSRID(ST_MakePoint(-99.0, 25.65), 4326)::geography, 10, 10, 5)$q$, '23514', 'ride_points: longitud dentro del AMM ampliada');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO ride_points (ride_id, ts, geog, speed, heading, accuracy)
                                  VALUES (pg_temp.id('rodada:no_existe'), now(), ST_SetSRID(ST_MakePoint(-100.41, 25.65), 4326)::geography, 10, 10, 5)$q$, '23503', 'ride_points: la rodada debe existir');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO rodada_pausa (rodada_id, pausada_en, reanudada_en)
                                  VALUES (pg_temp.id('rodada:ride_88'), '2026-10-05T07:25:00Z', '2026-10-05T07:20:00Z')$q$, '23514', 'la pausa no puede terminar antes de empezar');

  -- Reportes
  PERFORM pg_temp.debe_fallar($q$INSERT INTO reporte (usuario_id, categoria_clave, geog) VALUES (pg_temp.id('usuario:u_001'), 'bache', ST_SetSRID(ST_MakePoint(-100.41, 40.0), 4326)::geography)$q$, '23514', 'reporte con latitud fuera del AMM');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO reporte (usuario_id, categoria_clave, geog) VALUES (pg_temp.id('usuario:u_001'), 'ovni', ST_SetSRID(ST_MakePoint(-100.41, 25.65), 4326)::geography)$q$, '23503', 'categoría de reporte inexistente');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO reporte_historial_estado (reporte_id, estado_clave) VALUES (pg_temp.id('reporte:r_1042'), 'en_revision')$q$, '23505', 'cada estado se registra una vez por reporte');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO reporte_confirmacion (reporte_id, usuario_id, resultado) VALUES (pg_temp.id('reporte:r_1042'), pg_temp.id('usuario:p_1'), 'sigue')$q$, '23505', 'una confirmación por persona y reporte');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO reporte_confirmacion (reporte_id, usuario_id, resultado) VALUES (pg_temp.id('reporte:r_1042'), pg_temp.id('usuario:u_001'), 'quizás')$q$, '23514', 'resultado de confirmación: sigue o resuelto');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO denuncia_contenido (denunciante_id, motivo_clave, reporte_id, usuario_denunciado_id)
                                  VALUES (pg_temp.id('usuario:u_001'), 'spam', pg_temp.id('reporte:c_501'), pg_temp.id('usuario:p_7'))$q$, '23514', 'una denuncia apunta a exactamente un objeto');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO denuncia_contenido (denunciante_id, motivo_clave) VALUES (pg_temp.id('usuario:u_001'), 'spam')$q$, '23514', 'una denuncia sin objeto no es válida');

  -- Social
  PERFORM pg_temp.debe_fallar($q$INSERT INTO solicitud_amistad (emisor_id, receptor_id) VALUES (pg_temp.id('usuario:p_7'), pg_temp.id('usuario:p_7'))$q$, '23514', 'no se puede enviar solicitud a uno mismo');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO solicitud_amistad (emisor_id, receptor_id) VALUES (pg_temp.id('usuario:p_1'), pg_temp.id('usuario:u_001'))$q$, '23505', 'ya son amigos: el par no ordenado ya tiene un vínculo vigente');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO solicitud_amistad (emisor_id, receptor_id) VALUES (pg_temp.id('usuario:u_001'), pg_temp.id('usuario:p_5'))$q$, '23505', 'ya hay una solicitud pendiente entre ambos (en sentido contrario)');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO solicitud_amistad (emisor_id, receptor_id, resultado) VALUES (pg_temp.id('usuario:p_7'), pg_temp.id('usuario:p_8'), 'aceptada')$q$, '23514', 'resultado sin fecha de respuesta');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO notificacion (usuario_id) VALUES (pg_temp.id('usuario:u_001'))$q$, '23514', 'una notificación necesita un destino');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO notificacion (usuario_id, reporte_id, rodada_grupal_id)
                                  VALUES (pg_temp.id('usuario:u_001'), pg_temp.id('reporte:r_1038'), pg_temp.id('rodada_grupal:g_1'))$q$, '23514', 'una notificación tiene exactamente un destino');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO notificacion (usuario_id, reporte_id) VALUES (pg_temp.id('usuario:u_001'), pg_temp.id('reporte:r_1042'))$q$, '23505', 'no se repite la alerta del mismo reporte');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO comentario_rodada (rodada_id, usuario_id, texto) VALUES (pg_temp.id('rodada:a_1'), pg_temp.id('usuario:u_001'), '   ')$q$, '23514', 'comentario vacío');

  -- Rodadas grupales
  PERFORM pg_temp.debe_fallar($q$UPDATE rodada_grupal SET cupo = 0 WHERE id = pg_temp.id('rodada_grupal:g_1')$q$, '23514', 'el cupo debe ser positivo');
  PERFORM pg_temp.debe_fallar($q$UPDATE rodada_grupal SET privacidad = 'secreta' WHERE id = pg_temp.id('rodada_grupal:g_1')$q$, '23514', 'privacidad de rodada: publica o amigos');
  PERFORM pg_temp.debe_fallar($q$UPDATE rodada_grupal SET nivel_clave = 'experto' WHERE id = pg_temp.id('rodada_grupal:g_1')$q$, '23503', 'nivel inexistente');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO rodada_grupal_asistente (rodada_grupal_id, usuario_id) VALUES (pg_temp.id('rodada_grupal:g_4'), pg_temp.id('usuario:u_001'))$q$, '23505', 'un asistente no se repite');

  -- Clubes
  PERFORM pg_temp.debe_fallar($q$UPDATE club_miembro SET rol = 'propietario' WHERE club_id = pg_temp.id('club:c_1') AND usuario_id = pg_temp.id('usuario:p_6')$q$, '23505', 'un solo propietario por club');
  PERFORM pg_temp.debe_fallar($q$UPDATE club SET privacidad = 'oculto' WHERE id = pg_temp.id('club:c_1')$q$, '23514', 'privacidad de club: publico o privado');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO club (nombre, municipio_clave) VALUES ('udem en bici', 'san_pedro')$q$, '23505', 'nombre de club único sin distinguir mayúsculas');

  -- Retos e insignias
  PERFORM pg_temp.debe_fallar($q$INSERT INTO insignia (clave, nombre, descripcion, como_obtenerla, metrica_clave, meta) VALUES ('x', 'X', 'x', 'x', 'km_recorridos', NULL)$q$, '23514', 'insignia con métrica necesita meta');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO reto (titulo, descripcion, metrica_clave, meta, inicia_en, termina_en) VALUES ('t', 'd', 'km_recorridos', 10, '2026-11-02', '2026-11-01')$q$, '23514', 'el reto no puede terminar antes de empezar');

  -- Seguridad personal
  PERFORM pg_temp.debe_fallar($q$INSERT INTO contacto_emergencia (usuario_id, nombre, telefono, parentesco) VALUES (pg_temp.id('usuario:u_001'), 'Rosa otra vez', '81 1234 5678', 'Mamá')$q$, '23505', 'teléfono de emergencia duplicado');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO contacto_emergencia (usuario_id, nombre, telefono, parentesco) VALUES (pg_temp.id('usuario:u_001'), 'Malo', 'abc', 'Amigo')$q$, '23514', 'formato de teléfono');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO config_caidas (usuario_id, segundos_espera) VALUES (pg_temp.id('usuario:p_1'), 1)$q$, '23514', 'espera de caída entre 5 y 120 s');

  -- Premium
  PERFORM pg_temp.debe_fallar($q$INSERT INTO pago (suscripcion_id, folio, metodo_clave, monto_total) VALUES (pg_temp.id('suscripcion:jorge'), 'WLY-X', 'tarjeta', 79)$q$, '23514', 'pago con tarjeta requiere los últimos 4 dígitos');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO pago (suscripcion_id, folio, metodo_clave, tarjeta_ultimos4, monto_total) VALUES (pg_temp.id('suscripcion:jorge'), 'WLY-2026-0420', 'tarjeta', '1111', 79)$q$, '23505', 'folio de pago único');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO pago (suscripcion_id, folio, metodo_clave, tarjeta_ultimos4, monto_total) VALUES (pg_temp.id('suscripcion:jorge'), 'WLY-Y', 'tarjeta', '12', 79)$q$, '23514', 'últimos 4 dígitos: exactamente 4 números');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO suscripcion (usuario_id, plan_clave, inicia_en, vigente_hasta) VALUES (pg_temp.id('usuario:p_1'), 'premium_mensual', '2026-11-01', '2026-10-01')$q$, '23514', 'la suscripción no puede vencer antes de empezar');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO zona (nombre, municipio_clave, area) VALUES ('Punto', 'monterrey', ST_SetSRID(ST_MakePoint(-100.3, 25.6), 4326)::geography)$q$, '*', 'zona.area solo acepta polígonos');

  -- Ayuda
  PERFORM pg_temp.debe_fallar($q$INSERT INTO comentario_app (tipo_clave, calificacion, mensaje) VALUES ('idea', 6, 'Muy buena aplicación para rodar')$q$, '23514', 'calificación de 1 a 5');
  PERFORM pg_temp.debe_fallar($q$INSERT INTO comentario_app (tipo_clave, calificacion, mensaje) VALUES ('idea', 5, 'corto')$q$, '23514', 'comentario de al menos 10 caracteres');
END;
$$;

\echo
\echo '== 4. Reglas que dependen de datos (amistad, borrado de cuenta, anonimato) =='

-- Una solicitud rechazada o cancelada NO impide enviar otra; terminar una amistad la libera.
DO $$
BEGIN
  BEGIN
    INSERT INTO solicitud_amistad (emisor_id, receptor_id) VALUES (pg_temp.id('usuario:p_7'), pg_temp.id('usuario:p_8'));
    UPDATE solicitud_amistad SET respondida_en = now(), resultado = 'rechazada'
      WHERE emisor_id = pg_temp.id('usuario:p_7') AND receptor_id = pg_temp.id('usuario:p_8');
    INSERT INTO solicitud_amistad (emisor_id, receptor_id) VALUES (pg_temp.id('usuario:p_8'), pg_temp.id('usuario:p_7'));
    PERFORM pg_temp.ok(true, 'tras una solicitud rechazada se puede enviar una nueva (índice único parcial)');

    PERFORM pg_temp.ok((SELECT count(*) FROM v_amistad WHERE pg_temp.id('usuario:u_001') IN (usuario_a, usuario_b)) = 4, 'Daniela tiene 4 amistades antes de terminar una');
    UPDATE solicitud_amistad SET amistad_terminada_en = now()
      WHERE emisor_id = pg_temp.id('usuario:u_001') AND receptor_id = pg_temp.id('usuario:p_1');
    PERFORM pg_temp.ok((SELECT count(*) FROM v_amistad WHERE pg_temp.id('usuario:u_001') IN (usuario_a, usuario_b)) = 3, 'terminar la amistad la quita de v_amistad sin perder el historial');
    PERFORM pg_temp.ok((SELECT count(*) FROM solicitud_amistad WHERE emisor_id = pg_temp.id('usuario:u_001') AND receptor_id = pg_temp.id('usuario:p_1')) = 1, 'la solicitud original sigue guardada (historial)');
    INSERT INTO solicitud_amistad (emisor_id, receptor_id) VALUES (pg_temp.id('usuario:p_1'), pg_temp.id('usuario:u_001'));
    PERFORM pg_temp.ok(true, 'tras terminar una amistad se puede enviar una solicitud nueva');
    RAISE EXCEPTION 'revertir' USING ERRCODE = 'P0099';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
END;
$$;

-- ride_points: inserción válida, duplicado (ride_id, ts) y distancia calculada desde la traza.
DO $$
DECLARE
  v_rodada uuid := gen_random_uuid();
BEGIN
  BEGIN
    INSERT INTO rodada (id, usuario_id, titulo, vehiculo_clave, iniciada_en)
      VALUES (v_rodada, pg_temp.id('usuario:u_001'), 'Prueba de traza', 'bicicleta', '2026-10-06T07:00:00Z');
    PERFORM pg_temp.ok((SELECT en_curso FROM v_rodada_resumen WHERE rodada_id = v_rodada), 'una rodada sin finalizada_en está en curso');
    INSERT INTO ride_points (ride_id, ts, geog, speed, heading, accuracy) VALUES
      (v_rodada, '2026-10-06T07:00:05Z', ST_SetSRID(ST_MakePoint(-100.4000, 25.6540), 4326)::geography, 12.5, 270, 8),
      (v_rodada, '2026-10-06T07:00:15Z', ST_SetSRID(ST_MakePoint(-100.4010, 25.6540), 4326)::geography, 13.0, 270, 7);
    PERFORM pg_temp.debe_fallar(format($q$INSERT INTO ride_points (ride_id, ts, geog, speed, heading, accuracy)
        VALUES (%L, '2026-10-06T07:00:05Z', ST_SetSRID(ST_MakePoint(-100.4000, 25.6540), 4326)::geography, 12, 270, 8)$q$, v_rodada),
      '23505', 'ride_points: no se repite el mismo (ride_id, ts)');
    PERFORM pg_temp.ok((SELECT fuente_km FROM v_rodada_resumen WHERE rodada_id = v_rodada) = 'traza'
                       AND (SELECT km FROM v_rodada_resumen WHERE rodada_id = v_rodada) BETWEEN 0.09 AND 0.11,
                       'v_rodada_resumen toma la distancia de la traza GPS (≈ 0.1 km)');
    UPDATE rodada SET finalizada_en = '2026-10-06T07:30:00Z' WHERE id = v_rodada;
    INSERT INTO rodada_pausa (rodada_id, pausada_en, reanudada_en) VALUES (v_rodada, '2026-10-06T07:10:00Z', '2026-10-06T07:15:00Z');
    PERFORM pg_temp.ok((SELECT minutos FROM v_rodada_resumen WHERE rodada_id = v_rodada) = 25, 'los minutos descuentan las pausas (30 - 5 = 25)');
    DELETE FROM rodada WHERE id = v_rodada;
    PERFORM pg_temp.ok((SELECT count(*) FROM ride_points WHERE ride_id = v_rodada) = 0, 'borrar la rodada borra su traza (ON DELETE CASCADE)');
    RAISE EXCEPTION 'revertir' USING ERRCODE = 'P0099';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
END;
$$;

-- Anonimato de reportes: la autoría se guarda pero la vista pública no la muestra.
DO $$
BEGIN
  BEGIN
    PERFORM pg_temp.ok(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'waylo' AND table_name = 'v_reporte_publico' AND column_name = 'usuario_id'),
                       'v_reporte_publico no expone usuario_id');
    PERFORM pg_temp.ok((SELECT autor_visible_id FROM v_reporte_publico WHERE reporte_id = pg_temp.id('reporte:r_1042')) = pg_temp.id('usuario:u_001'),
                       'sin reportes anónimos, la autoría es visible');
    UPDATE privacidad_usuario SET reportes_anonimos = true WHERE usuario_id = pg_temp.id('usuario:u_001');
    PERFORM pg_temp.ok((SELECT autor_visible_id FROM v_reporte_publico WHERE reporte_id = pg_temp.id('reporte:r_1042')) IS NULL,
                       'con reportes anónimos, v_reporte_publico oculta la autoría');
    PERFORM pg_temp.ok((SELECT usuario_id FROM reporte WHERE id = pg_temp.id('reporte:r_1042')) = pg_temp.id('usuario:u_001'),
                       'la autoría sigue guardada en reporte.usuario_id');
    PERFORM pg_temp.ok((SELECT autor_visible_id FROM fn_reportes_cercanos(25.6575, -100.4075, 1000, 36500) WHERE reporte_id = pg_temp.id('reporte:r_1042')) IS NULL,
                       'fn_reportes_cercanos también respeta el anonimato');
    UPDATE reporte SET cancelado_en = now() WHERE id = pg_temp.id('reporte:r_1042');
    PERFORM pg_temp.ok((SELECT count(*) FROM v_reporte_publico WHERE reporte_id = pg_temp.id('reporte:r_1042')) = 0, 'un reporte cancelado no aparece en la vista pública');
    RAISE EXCEPTION 'revertir' USING ERRCODE = 'P0099';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
END;
$$;

-- Borrado de cuenta: datos personales en cascada; reportes y pagos se anonimizan y se conservan.
DO $$
BEGIN
  BEGIN
    DELETE FROM usuario WHERE id = pg_temp.id('usuario:u_001');
    PERFORM pg_temp.ok((SELECT count(*) FROM reporte WHERE id IN (pg_temp.id('reporte:r_1042'), pg_temp.id('reporte:r_1038'), pg_temp.id('reporte:r_1021'),
                         pg_temp.id('reporte:r_1009'), pg_temp.id('reporte:r_0997')) AND usuario_id IS NULL) = 5,
                       'al borrar la cuenta, sus 5 reportes se conservan sin autor');
    PERFORM pg_temp.ok((SELECT count(*) FROM rodada WHERE id IN (pg_temp.id('rodada:ride_88'), pg_temp.id('rodada:ride_87'))) = 0, 'sus rodadas se borran');
    PERFORM pg_temp.ok((SELECT count(*) FROM lugar WHERE propietario_id = pg_temp.id('usuario:u_001')) = 0, 'sus lugares privados se borran');
    PERFORM pg_temp.ok((SELECT count(*) FROM solicitud_amistad WHERE pg_temp.id('usuario:u_001') IN (emisor_id, receptor_id)) = 0, 'sus solicitudes de amistad se borran');
    PERFORM pg_temp.ok((SELECT count(*) FROM rodada_grupal WHERE id = pg_temp.id('rodada_grupal:g_6')) = 0, 'las rodadas grupales que organizaba se borran');
    PERFORM pg_temp.ok((SELECT count(*) FROM reporte_confirmacion WHERE reporte_id = pg_temp.id('reporte:r_1042')) = 6, 'las confirmaciones de otras personas a sus reportes se conservan');
    RAISE EXCEPTION 'revertir' USING ERRCODE = 'P0099';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
  BEGIN
    DELETE FROM usuario WHERE id = pg_temp.id('usuario:p_8');
    PERFORM pg_temp.ok((SELECT count(*) FROM suscripcion WHERE id = pg_temp.id('suscripcion:jorge') AND usuario_id IS NULL) = 1, 'la suscripción se conserva sin usuario');
    PERFORM pg_temp.ok((SELECT count(*) FROM pago WHERE folio = 'WLY-2026-0420') = 1 AND (SELECT cliente FROM v_pago_recibo WHERE folio = 'WLY-2026-0420') IS NULL,
                       'el comprobante de pago se conserva anonimizado');
    RAISE EXCEPTION 'revertir' USING ERRCODE = 'P0099';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
END;
$$;

\echo
\echo '== 5. Vistas con los datos de ejemplo (derivados, no almacenados) =='

DO $$
BEGIN
  -- Lugares privados
  PERFORM pg_temp.ok((SELECT count(*) FROM v_lugar_publico WHERE nombre = 'Casa') = 0, 'la casa de Daniela no sale en v_lugar_publico');
  PERFORM pg_temp.ok((SELECT count(*) FROM lugar_guardado WHERE usuario_id = pg_temp.id('usuario:u_001')) = 3, 'Daniela tiene 3 lugares guardados');

  -- Amistad (v_amistad, v_relacion_usuarios, v_amigos_en_comun)
  PERFORM pg_temp.ok((SELECT count(*) FROM v_amistad) = 15, 'hay 15 amistades en total (una fila por amistad)');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_amistad WHERE usuario_a >= usuario_b) = 0, 'v_amistad guarda el par normalizado usuario_a < usuario_b');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_relacion_usuarios WHERE usuario_id = pg_temp.id('usuario:u_001') AND relacion = 'amigo') = 4, 'Daniela: 4 amigos');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_relacion_usuarios WHERE usuario_id = pg_temp.id('usuario:u_001') AND relacion = 'solicitud_recibida') = 2, 'Daniela: 2 solicitudes recibidas (Fernanda y Diego)');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_relacion_usuarios WHERE usuario_id = pg_temp.id('usuario:u_001') AND relacion = 'solicitud_enviada') = 1, 'Daniela: 1 solicitud enviada (Sofía)');
  PERFORM pg_temp.ok((SELECT en_comun FROM v_amigos_en_comun WHERE usuario_id = pg_temp.id('usuario:u_001') AND otro_id = pg_temp.id('usuario:p_1')) = 3,
                     'amigos en común Daniela–Mariana = 3 (Luis, Andrea, Carlos)');

  -- Rutas y Safety Score
  PERFORM pg_temp.ok((SELECT count(*) FROM v_ruta_opcion WHERE consulta_id = pg_temp.id('ruta_consulta:casa_udem')) = 3, 'la consulta Casa a UDEM tiene 3 opciones');
  PERFORM pg_temp.ok((SELECT minutos_extra FROM v_ruta_opcion WHERE opcion_id = pg_temp.id('ruta_opcion:rapida')) = 0
                     AND (SELECT minutos_extra FROM v_ruta_opcion WHERE opcion_id = pg_temp.id('ruta_opcion:equilibrada')) = 2
                     AND (SELECT minutos_extra FROM v_ruta_opcion WHERE opcion_id = pg_temp.id('ruta_opcion:segura')) = 4,
                     'minutos extra 0, 2 y 4 (contra la opción más rápida)');
  PERFORM pg_temp.ok((SELECT safety_score FROM v_ruta_opcion WHERE opcion_id = pg_temp.id('ruta_opcion:segura')) = 87
                     AND (SELECT safety_score FROM v_ruta_opcion WHERE opcion_id = pg_temp.id('ruta_opcion:rapida')) = 50,
                     'Safety Score ponderado: ruta segura 87, ruta rápida 50');
  PERFORM pg_temp.ok((SELECT km FROM v_ruta_opcion WHERE opcion_id = pg_temp.id('ruta_opcion:segura')) BETWEEN 2 AND 4, 'los km salen de ST_Length del trazo');
  PERFORM pg_temp.ok((SELECT count(*) FROM ruta_opcion_maniobra WHERE opcion_id = pg_temp.id('ruta_opcion:segura')) = 6, 'la ruta segura tiene 6 maniobras');

  -- Reportes
  PERFORM pg_temp.ok((SELECT count(*) FROM v_reporte) = 10, '10 reportes (5 de Daniela y 5 de la comunidad)');
  PERFORM pg_temp.ok((SELECT confirmaciones FROM v_reporte WHERE reporte_id = pg_temp.id('reporte:r_1042')) = 6
                     AND (SELECT confirmaciones FROM v_reporte WHERE reporte_id = pg_temp.id('reporte:r_1021')) = 11
                     AND (SELECT confirmaciones FROM v_reporte WHERE reporte_id = pg_temp.id('reporte:c_501')) = 8,
                     'confirmaciones calculadas: 6, 11 y 8');
  PERFORM pg_temp.ok((SELECT estado_clave FROM v_reporte WHERE reporte_id = pg_temp.id('reporte:r_1042')) = 'en_revision'
                     AND (SELECT estado_clave FROM v_reporte WHERE reporte_id = pg_temp.id('reporte:r_1021')) = 'atendido'
                     AND (SELECT estado_clave FROM v_reporte WHERE reporte_id = pg_temp.id('reporte:r_1038')) = 'enviado',
                     'estado actual = último renglón de la línea de tiempo');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_reporte WHERE usuario_id = pg_temp.id('usuario:u_001') AND pendiente_completar) = 1
                     AND (SELECT pendiente_completar FROM v_reporte WHERE reporte_id = pg_temp.id('reporte:r_1038')),
                     'un solo reporte pendiente por completar: r_1038');
  PERFORM pg_temp.ok((SELECT count(*) FROM reporte_historial_estado WHERE reporte_id = pg_temp.id('reporte:r_1021')) = 3, 'la línea de tiempo de r_1021 tiene 3 estados');
  PERFORM pg_temp.ok((SELECT count(*) FROM fn_reportes_cercanos(25.6575, -100.4075, 1000, 36500)) = 5, 'fn_reportes_cercanos: 5 reportes a menos de 1 km de Morones Prieto');
  PERFORM pg_temp.ok((SELECT distancia_m FROM fn_reportes_cercanos(25.6575, -100.4075, 1000, 36500) WHERE reporte_id = pg_temp.id('reporte:r_1042')) < 5,
                     'el reporte r_1042 está en el punto consultado');
  PERFORM pg_temp.ok((SELECT count(*) FROM fn_reportes_cercanos(25.6575, -100.4075, 1000, 36500, pg_temp.id('usuario:p_7'))) = 5, 'fn_reportes_cercanos con p_usuario sin bloqueos devuelve lo mismo');

  -- Rodadas individuales (Inicio) y estadísticas
  PERFORM pg_temp.ok((SELECT count(*) FROM v_rodada_resumen WHERE usuario_id = pg_temp.id('usuario:u_001') AND finalizada_en IS NOT NULL) = 4, 'Daniela tiene 4 rodadas finalizadas');
  PERFORM pg_temp.ok((SELECT minutos FROM v_rodada_resumen WHERE rodada_id = pg_temp.id('rodada:ride_88')) = 15
                     AND (SELECT minutos FROM v_rodada_resumen WHERE rodada_id = pg_temp.id('rodada:ride_85')) = 11
                     AND (SELECT fuente_km FROM v_rodada_resumen WHERE rodada_id = pg_temp.id('rodada:ride_88')) = 'ruta',
                     'minutos de las rodadas del prototipo (15 y 11); sin traza, km de la ruta guiada');
  PERFORM pg_temp.ok((SELECT safety_score FROM v_rodada_resumen WHERE rodada_id = pg_temp.id('rodada:ride_88')) = 87
                     AND (SELECT safety_score FROM v_rodada_resumen WHERE rodada_id = pg_temp.id('rodada:ride_85')) = 50,
                     'el Safety Score de la rodada es el de su ruta guiada (87 y 50)');
  PERFORM pg_temp.ok((SELECT rodadas FROM v_estadistica_usuario_mes WHERE usuario_id = pg_temp.id('usuario:u_001') AND mes = '2026-10-01') = 4, 'estadísticas de octubre: 4 rodadas');
  PERFORM pg_temp.ok((SELECT rodadas FROM v_persona_perfil WHERE usuario_id = pg_temp.id('usuario:p_1')) = 2
                     AND (SELECT km FROM v_persona_perfil WHERE usuario_id = pg_temp.id('usuario:p_1')) BETWEEN 8.0 AND 9.5,
                     'perfil de Mariana: 2 rodadas y ≈ 8.7 km calculados (no guardados)');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_actividad_amigos WHERE espectador_id = pg_temp.id('usuario:u_001')) = 6, 'actividad de amigos de Daniela: 6 rodadas (a_1 a a_6)');
  PERFORM pg_temp.ok((SELECT count(*) FROM fn_actividad_comunidad(pg_temp.id('usuario:u_001'))) = 6, 'actividad de la comunidad: 6 rodadas de personas con visibilidad "todos"');
  PERFORM pg_temp.ok((SELECT count(*) FROM comentario_rodada WHERE rodada_id = pg_temp.id('rodada:a_1')) = 2, 'la publicación a_1 tiene 2 comentarios');

  -- Rodadas grupales
  PERFORM pg_temp.ok((SELECT count(*) FROM v_rodada_grupal) = 8, '8 rodadas grupales');
  PERFORM pg_temp.ok((SELECT asistentes FROM v_rodada_grupal WHERE rodada_grupal_id = pg_temp.id('rodada_grupal:g_4')) = 6
                     AND (SELECT lugares_disponibles FROM v_rodada_grupal WHERE rodada_grupal_id = pg_temp.id('rodada_grupal:g_4')) = 74,
                     'g_4: 6 asistentes contados y 74 lugares disponibles');
  PERFORM pg_temp.ok((SELECT estado FROM v_rodada_grupal WHERE rodada_grupal_id = pg_temp.id('rodada_grupal:g_7')) = 'finalizada'
                     AND (SELECT estado FROM v_rodada_grupal WHERE rodada_grupal_id = pg_temp.id('rodada_grupal:g_8')) = 'finalizada',
                     'g_7 y g_8 son finalizadas por su fecha pasada');
  PERFORM pg_temp.ok(((SELECT estado FROM v_rodada_grupal WHERE rodada_grupal_id = pg_temp.id('rodada_grupal:g_1')) = 'programada') = (now() < '2026-10-24T20:00:00-06:00'::timestamptz),
                     'g_1 es programada mientras no llegue su fecha');
  PERFORM pg_temp.ok((SELECT count(*) FROM rodada_grupal_vehiculo WHERE rodada_grupal_id = pg_temp.id('rodada_grupal:g_3')) = 2, 'g_3 admite bicicleta y scooter ("ambos")');
  PERFORM pg_temp.ok((SELECT count(*) FROM rodada_grupal_regla WHERE rodada_grupal_id = pg_temp.id('rodada_grupal:g_2')) = 6, 'g_2 tiene 6 reglas del catálogo');
  PERFORM pg_temp.ok((SELECT es_organizador FROM v_rodada_grupal_asistente WHERE rodada_grupal_id = pg_temp.id('rodada_grupal:g_4') AND usuario_id = pg_temp.id('usuario:p_1')), 'Mariana es la organizadora de g_4');
  PERFORM pg_temp.ok((SELECT count(*) FROM club_miembro WHERE club_id = pg_temp.id('club:c_1')) = 6 AND (SELECT count(*) FROM club_miembro WHERE rol = 'propietario') = 5, 'clubes: 6 miembros en c_1 y un propietario por club');

  -- Notificaciones
  PERFORM pg_temp.ok((SELECT count(*) FROM v_notificacion WHERE usuario_id = pg_temp.id('usuario:u_001')) = 6, 'Daniela tiene 6 notificaciones');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_notificacion WHERE usuario_id = pg_temp.id('usuario:u_001') AND no_leida) = 3, '3 notificaciones sin leer');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_notificacion WHERE usuario_id = pg_temp.id('usuario:u_001') AND tipo = 'alerta') = 1
                     AND (SELECT count(*) FROM v_notificacion WHERE usuario_id = pg_temp.id('usuario:u_001') AND tipo = 'reporte') = 2
                     AND (SELECT count(*) FROM v_notificacion WHERE usuario_id = pg_temp.id('usuario:u_001') AND tipo = 'amistad') = 2
                     AND (SELECT count(*) FROM v_notificacion WHERE usuario_id = pg_temp.id('usuario:u_001') AND tipo = 'rodada') = 1,
                     'el tipo de notificación se deduce del destino: 1 alerta, 2 reporte, 2 amistad, 1 rodada');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_notificacion WHERE usuario_id = pg_temp.id('usuario:u_001') AND subtipo = 'solicitud_recibida') = 2,
                     'la receptora ve "te enviaron una solicitud"');

  -- Retos e insignias
  PERFORM pg_temp.ok((SELECT progreso FROM v_insignia_progreso WHERE usuario_id = pg_temp.id('usuario:u_001') AND insignia_clave = 'ojo_de_barrio') = 10
                     AND (SELECT obtenida FROM v_insignia_progreso WHERE usuario_id = pg_temp.id('usuario:u_001') AND insignia_clave = 'ojo_de_barrio'),
                     'insignia obtenida: progreso completo');
  PERFORM pg_temp.ok((SELECT progreso FROM v_insignia_progreso WHERE usuario_id = pg_temp.id('usuario:u_001') AND insignia_clave = 'calle_atendida') = 2
                     AND NOT (SELECT obtenida FROM v_insignia_progreso WHERE usuario_id = pg_temp.id('usuario:u_001') AND insignia_clave = 'calle_atendida'),
                     'Calle atendida: 2 de 3 (r_1021 y r_0997 en estado atendido)');
  PERFORM pg_temp.ok((SELECT progreso FROM v_insignia_progreso WHERE usuario_id = pg_temp.id('usuario:u_001') AND insignia_clave = 'vigia_nocturno') = 1, 'Vigía nocturno: 1 reporte de iluminación');
  PERFORM pg_temp.ok((SELECT progreso FROM v_insignia_progreso WHERE usuario_id = pg_temp.id('usuario:u_001') AND insignia_clave = 'ruta_segura') = 2, 'Ruta segura: 2 rodadas con score ≥ 80');
  PERFORM pg_temp.ok((SELECT progreso FROM v_insignia_progreso WHERE usuario_id = pg_temp.id('usuario:u_001') AND insignia_clave = 'rodada_compartida') = 1, 'Rodada compartida: 1 rodada grupal realizada (g_7)');
  PERFORM pg_temp.ok((SELECT progreso FROM v_insignia_progreso WHERE usuario_id = pg_temp.id('usuario:u_001') AND insignia_clave = 'anfitrion') = 1, 'Anfitrión: organizó g_6');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_insignia_progreso WHERE usuario_id = pg_temp.id('usuario:u_001')) = 8, 'ocho insignias en el catálogo de progreso');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_reto) = 4 AND (SELECT participantes FROM v_reto WHERE reto_id = pg_temp.id('reto:ch_1')) = 5, '4 retos; ch_1 tiene 5 participantes contados');
  PERFORM pg_temp.ok((SELECT progreso FROM v_reto_progreso WHERE usuario_id = pg_temp.id('usuario:u_001') AND reto_id = pg_temp.id('reto:ch_2')) = 2
                     AND (SELECT progreso FROM v_reto_progreso WHERE usuario_id = pg_temp.id('usuario:u_001') AND reto_id = pg_temp.id('reto:ch_1')) > 0,
                     'progreso de retos calculado dentro de la ventana de octubre');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_ranking_km_mes WHERE mes = '2026-10-01') >= 5 AND (SELECT min(posicion) FROM v_ranking_km_mes WHERE mes = '2026-10-01') = 1, 'ranking mensual de kilómetros');
  BEGIN
    PERFORM fn_valor_metrica(pg_temp.id('usuario:u_001'), 'metrica_inventada');
    RAISE EXCEPTION 'PRUEBA FALLIDA: fn_valor_metrica aceptó una métrica inexistente';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM LIKE 'PRUEBA FALLIDA%' THEN RAISE; END IF;
    RAISE NOTICE 'ok  fn_valor_metrica rechaza una métrica desconocida';
  END;

  -- Zonas
  PERFORM pg_temp.ok((SELECT count(*) FROM v_zona_seguridad_mensual) = 30 AND (SELECT min(score) FROM v_zona_seguridad_mensual) >= 0 AND (SELECT max(score) FROM v_zona_seguridad_mensual) <= 100,
                     'score mensual de 5 zonas × 6 meses, entre 0 y 100');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_zona_resumen) = 5, 'v_zona_resumen: 5 zonas');
  PERFORM pg_temp.ok(ST_Covers((SELECT area FROM zona WHERE id = pg_temp.id('zona:z_2')), (SELECT geog FROM reporte WHERE id = pg_temp.id('reporte:r_1042'))),
                     'el polígono de la zona z_2 contiene el reporte r_1042');
  IF now() < '2027-01-01'::timestamptz THEN
    PERFORM pg_temp.ok((SELECT score FROM v_zona_resumen WHERE zona_id = pg_temp.id('zona:z_2')) < 100
                       AND (SELECT score FROM v_zona_resumen WHERE zona_id = pg_temp.id('zona:z_2'))
                         < (SELECT score FROM v_zona_resumen WHERE zona_id = pg_temp.id('zona:z_3')),
                       'Morones Prieto (3 reportes, peso 4.5) puntúa más bajo que Valle Oriente (1 reporte)');
  END IF;
  PERFORM pg_temp.ok((SELECT count(*) FROM v_zona_riesgo_horario) = 30 AND (SELECT max(riesgo) FROM v_zona_riesgo_horario) <= 100, 'riesgo por franja horaria: 5 zonas × 6 franjas, máximo 100');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_zona_reporte_categoria WHERE zona_id = pg_temp.id('zona:z_2')) >= 0, 'v_zona_reporte_categoria se puede consultar');

  -- Premium
  PERFORM pg_temp.ok((SELECT subtotal FROM v_pago_recibo WHERE folio = 'WLY-2026-0420') = 68.10
                     AND (SELECT iva FROM v_pago_recibo WHERE folio = 'WLY-2026-0420') = 10.90
                     AND (SELECT total FROM v_pago_recibo WHERE folio = 'WLY-2026-0420') = 79.00,
                     'recibo WLY-2026-0420: subtotal 68.10 + IVA 10.90 = 79.00 (calculados)');
  PERFORM pg_temp.ok((SELECT count(*) FROM v_suscripcion_actual WHERE usuario_id = pg_temp.id('usuario:u_001')) = 0, 'Daniela no tiene suscripción (como en el prototipo)');
  PERFORM pg_temp.ok((SELECT plan FROM v_suscripcion_actual WHERE usuario_id = pg_temp.id('usuario:p_8')) = 'Waylo Premium, mensual', 'Jorge tiene la suscripción de ejemplo');
END;
$$;

-- Ubicación compartida: activa, detenida y vencida.
DO $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  BEGIN
    INSERT INTO comparticion_ubicacion (id, usuario_id, inicia_en, expira_en) VALUES (v_id, pg_temp.id('usuario:u_001'), now() - interval '1 minute', now() + interval '1 hour');
    INSERT INTO comparticion_destinatario (comparticion_id, destinatario_id) VALUES (v_id, pg_temp.id('usuario:p_1')), (v_id, pg_temp.id('usuario:p_2'));
    PERFORM pg_temp.ok((SELECT count(*) FROM v_comparticion_activa WHERE usuario_id = pg_temp.id('usuario:u_001')) = 2, 'una ubicación compartida vigente aparece con sus 2 destinatarios');
    UPDATE comparticion_ubicacion SET detenida_en = now() WHERE id = v_id;
    PERFORM pg_temp.ok((SELECT count(*) FROM v_comparticion_activa WHERE usuario_id = pg_temp.id('usuario:u_001')) = 0, 'al detenerla deja de estar activa');
    UPDATE comparticion_ubicacion SET detenida_en = NULL, inicia_en = now() - interval '2 hours', expira_en = now() - interval '1 hour' WHERE id = v_id;
    PERFORM pg_temp.ok((SELECT count(*) FROM v_comparticion_activa WHERE usuario_id = pg_temp.id('usuario:u_001')) = 0, 'una ubicación vencida no está activa');
    RAISE EXCEPTION 'revertir' USING ERRCODE = 'P0099';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
END;
$$;

-- Privacidad y bloqueos en la actividad; notificación "aceptaron tu solicitud"; cancelación de rodada grupal.
DO $$
BEGIN
  BEGIN
    INSERT INTO privacidad_usuario (usuario_id, visibilidad_rodadas) VALUES (pg_temp.id('usuario:p_1'), 'yo');
    PERFORM pg_temp.ok((SELECT count(*) FROM v_actividad_amigos WHERE espectador_id = pg_temp.id('usuario:u_001')) = 4, 'si Mariana oculta sus rodadas, la actividad baja de 6 a 4');
    RAISE EXCEPTION 'revertir' USING ERRCODE = 'P0099';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
  BEGIN
    INSERT INTO usuario_bloqueado (usuario_id, bloqueado_id) VALUES (pg_temp.id('usuario:u_001'), pg_temp.id('usuario:p_12'));
    PERFORM pg_temp.ok((SELECT count(*) FROM fn_actividad_comunidad(pg_temp.id('usuario:u_001'))) = 4, 'bloquear a Héctor quita sus 2 rodadas de la comunidad');
    RAISE EXCEPTION 'revertir' USING ERRCODE = 'P0099';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
  BEGIN
    INSERT INTO usuario_bloqueado (usuario_id, bloqueado_id) VALUES (pg_temp.id('usuario:p_1'), pg_temp.id('usuario:u_001'));
    PERFORM pg_temp.ok((SELECT count(*) FROM fn_reportes_cercanos(25.6575, -100.4075, 1000, 36500, pg_temp.id('usuario:p_1'))) = 0,
                       'si Mariana bloquea a Daniela, no ve sus reportes cercanos');
    RAISE EXCEPTION 'revertir' USING ERRCODE = 'P0099';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
  BEGIN
    INSERT INTO notificacion (usuario_id, solicitud_amistad_id)
      VALUES (pg_temp.id('usuario:u_001'), pg_temp.id('solicitud:u_001-p_1'));
    PERFORM pg_temp.ok((SELECT subtipo FROM v_notificacion WHERE usuario_id = pg_temp.id('usuario:u_001') AND otra_persona_id = pg_temp.id('usuario:p_1')) = 'solicitud_aceptada',
                       'la emisora ve "aceptaron tu solicitud" (subtipo por quién es el receptor)');
    RAISE EXCEPTION 'revertir' USING ERRCODE = 'P0099';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
  BEGIN
    UPDATE rodada_grupal SET cancelada_en = now() WHERE id = pg_temp.id('rodada_grupal:g_2');
    PERFORM pg_temp.ok((SELECT estado FROM v_rodada_grupal WHERE rodada_grupal_id = pg_temp.id('rodada_grupal:g_2')) = 'cancelada', 'cancelada_en vuelve "cancelada" a una rodada grupal');
    RAISE EXCEPTION 'revertir' USING ERRCODE = 'P0099';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
END;
$$;

\echo
\echo '== 6. Consultas de las pantallas principales (resultado a la vista) =='

\echo '-- Inicio: mis rodadas recientes (Daniela)'
SELECT titulo, to_char(iniciada_en AT TIME ZONE 'America/Monterrey', 'DD/MM HH24:MI') AS inicio, minutos, km, velocidad_media_kmh AS km_h, safety_score
FROM v_rodada_resumen WHERE usuario_id = pg_temp.id('usuario:u_001') ORDER BY iniciada_en DESC;

\echo '-- Inicio: estadísticas del mes'
SELECT mes, rodadas, km, minutos, safety_score_promedio FROM v_estadistica_usuario_mes WHERE usuario_id = pg_temp.id('usuario:u_001');

\echo '-- Inicio: actividad de amigos'
SELECT autor_nombre, titulo, km, minutos, safety_score FROM v_actividad_amigos WHERE espectador_id = pg_temp.id('usuario:u_001') ORDER BY iniciada_en DESC;

\echo '-- Inicio: notificaciones sin leer'
SELECT tipo, subtipo, to_char(creada_en AT TIME ZONE 'America/Monterrey', 'DD/MM HH24:MI') AS cuando FROM v_notificacion WHERE usuario_id = pg_temp.id('usuario:u_001') AND no_leida ORDER BY creada_en DESC;

\echo '-- Perfil de una persona: Mariana, vista por Daniela'
SELECT p.nombre, p.municipio, p.rodadas, p.km, p.safety_score_promedio AS score,
       COALESCE(r.relacion, 'ninguna') AS relacion, COALESCE(c.en_comun, 0) AS amigos_en_comun
FROM v_persona_perfil p
LEFT JOIN v_relacion_usuarios r ON r.usuario_id = pg_temp.id('usuario:u_001') AND r.otro_id = p.usuario_id
LEFT JOIN v_amigos_en_comun c ON c.usuario_id = pg_temp.id('usuario:u_001') AND c.otro_id = p.usuario_id
WHERE p.usuario_id = pg_temp.id('usuario:p_1');

\echo '-- Rodadas grupales (Comunidad)'
SELECT titulo, to_char(programada_en AT TIME ZONE 'America/Monterrey', 'DD/MM HH24:MI') AS cuando, lugar_salida, nivel, ritmo, distancia_km AS km, asistentes, lugares_disponibles AS libres, estado
FROM v_rodada_grupal ORDER BY programada_en;

\echo '-- Reportes cercanos a Av. Morones Prieto (radio 1 km)'
SELECT categoria, referencia, estado_clave AS estado, confirmaciones, round(distancia_m::numeric) AS metros
FROM fn_reportes_cercanos(25.6575, -100.4075, 1000, 36500);

\echo '-- Mis reportes (Daniela)'
SELECT categoria, estado_clave AS estado, confirmaciones, pendiente_completar AS pendiente FROM v_reporte
WHERE usuario_id = pg_temp.id('usuario:u_001') ORDER BY creado_en DESC;

\echo
\echo 'TODAS LAS PRUEBAS PASARON'
ROLLBACK;
