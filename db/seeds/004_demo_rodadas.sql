-- DATOS DE DEMOSTRACIÓN: rodadas individuales ya terminadas (src/mocks/rides.ts y people.ts: friendActivity)
-- y comunidad (communityRides). NO se siembra ride_points: no hay trazas simuladas.
-- Por eso la distancia de estas rodadas sale de su ruta guiada (v_rodada_resumen.fuente_km = 'ruta').
SET search_path = waylo, public;
CREATE FUNCTION pg_temp.id(text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT md5('waylo-demo:' || $1)::uuid $$;

-- Rodadas de Daniela, apoyadas en las rutas sembradas en 002.
INSERT INTO rodada (id, usuario_id, titulo, vehiculo_clave, ruta_opcion_id, iniciada_en, finalizada_en) VALUES
  (pg_temp.id('rodada:ride_88'), pg_temp.id('usuario:u_001'), 'Casa a UDEM', 'bicicleta', pg_temp.id('ruta_opcion:segura'),         '2026-10-05T07:20:00-06:00', '2026-10-05T07:35:00-06:00'),
  (pg_temp.id('rodada:ride_87'), pg_temp.id('usuario:u_001'), 'UDEM a casa', 'bicicleta', pg_temp.id('ruta_opcion:segura_inversa'), '2026-10-04T18:05:00-06:00', '2026-10-04T18:21:00-06:00'),
  (pg_temp.id('rodada:ride_85'), pg_temp.id('usuario:u_001'), 'Casa a UDEM', 'bicicleta', pg_temp.id('ruta_opcion:rapida'),         '2026-10-03T07:25:00-06:00', '2026-10-03T07:36:00-06:00'),
  (pg_temp.id('rodada:ride_83'), pg_temp.id('usuario:u_001'), 'Casa a UDEM por calles locales', 'bicicleta', pg_temp.id('ruta_opcion:equilibrada'), '2026-10-01T17:40:00-06:00', '2026-10-01T17:53:00-06:00')
ON CONFLICT DO NOTHING;

-- Actividad de amigos y de la comunidad. Cada rodada necesita una ruta de la que sacar km y Safety Score:
-- se crea una consulta de demostración UDEM -> Fundidora con una sola opción cuyo trazo es una línea recta
-- de la distancia del prototipo (ST_Project hacia el este) y cuyos 5 factores valen el score del prototipo.
-- Origen y destino son marcadores de posición: la ruta NO es la real de esa persona.
CREATE TEMP TABLE demo_actividad (clave text, persona text, titulo text, km numeric, minutos int, score int, inicio timestamptz, vehiculo text) ON COMMIT DROP;
INSERT INTO demo_actividad VALUES
  ('a_1','p_1','Casa a la UDEM',3.1,14,84,'2026-10-19T07:20:00-06:00','bicicleta'),
  ('a_2','p_3','Rodada a Fundidora',12.4,55,79,'2026-10-18T07:15:00-06:00','bicicleta'),
  ('a_3','p_2','Centro a Macroplaza',4.1,19,66,'2026-10-17T20:40:00-06:00','scooter'),
  ('a_4','p_4','Guadalupe a La Pastora',17.8,58,58,'2026-10-17T06:05:00-06:00','bicicleta'),
  ('a_5','p_1','La UDEM a Plaza Fiesta San Agustín',5.6,24,91,'2026-10-15T19:30:00-06:00','bicicleta'),
  ('a_6','p_3','Ciclovía Río Santa Catarina',20.1,71,92,'2026-10-13T19:00:00-06:00','bicicleta'),
  ('a_7','p_12','Valle Oriente al Centro',11.2,47,76,'2026-10-16T08:10:00-06:00','bicicleta'),
  ('a_8','p_13','Casa a la UDEM',2.9,13,85,'2026-10-16T07:25:00-06:00','bicicleta'),
  ('cr_1','p_11','Ciclovía Río Santa Catarina',18.3,66,90,'2026-10-05T17:30:00-06:00','bicicleta'),
  ('cr_2','p_12','Valle Oriente a Centro',10.7,44,72,'2026-10-05T08:20:00-06:00','bicicleta'),
  ('cr_3','p_13','Valle de San Ángel a UDEM',2.9,14,85,'2026-10-05T07:10:00-06:00','bicicleta'),
  ('cr_4','p_14','Av. Constitución a Fundidora',5.2,21,54,'2026-10-04T21:00:00-06:00','scooter');

INSERT INTO ruta_consulta (id, usuario_id, origen_lugar_id, destino_lugar_id, calculada_en)
SELECT pg_temp.id('ruta_consulta:' || clave), pg_temp.id('usuario:' || persona), pg_temp.id('lugar:udem'), pg_temp.id('lugar:fundidora'), inicio - interval '5 minutes'
FROM demo_actividad ON CONFLICT DO NOTHING;

INSERT INTO ruta_opcion (id, consulta_id, tipo_ruta_clave, minutos, via, resumen, trazo)
SELECT pg_temp.id('ruta_opcion:' || a.clave), pg_temp.id('ruta_consulta:' || a.clave), 'equilibrada', a.minutos,
       'Ruta de demostración', 'Trazo recto de demostración con la distancia del prototipo.',
       ST_MakeLine(l.geog::geometry, ST_Project(l.geog, a.km * 1000, radians(90))::geometry)::geography
FROM demo_actividad a
JOIN lugar l ON l.id = pg_temp.id('lugar:udem')
ON CONFLICT DO NOTHING;

INSERT INTO ruta_opcion_factor (opcion_id, factor_clave, calificacion, explicacion)
SELECT pg_temp.id('ruta_opcion:' || a.clave), f.clave, a.score, 'Dato de demostración.'
FROM demo_actividad a CROSS JOIN cat_factor_seguridad f
ON CONFLICT DO NOTHING;

INSERT INTO rodada (id, usuario_id, titulo, vehiculo_clave, ruta_opcion_id, iniciada_en, finalizada_en)
SELECT pg_temp.id('rodada:' || clave), pg_temp.id('usuario:' || persona), titulo, vehiculo,
       pg_temp.id('ruta_opcion:' || clave), inicio, inicio + minutos * interval '1 minute'
FROM demo_actividad
ON CONFLICT DO NOTHING;

-- Comentarios de la publicación de actividad (src/mocks/comments.ts).
INSERT INTO comentario_rodada (id, rodada_id, usuario_id, texto, creado_en) VALUES
  (pg_temp.id('comentario:cm_1'), pg_temp.id('rodada:a_1'),  pg_temp.id('usuario:p_3'),  'Qué buena ruta, la tomo mañana.', '2026-10-19T08:10:00-06:00'),
  (pg_temp.id('comentario:cm_2'), pg_temp.id('rodada:a_1'),  pg_temp.id('usuario:p_6'),  'Ese tramo ya tiene mejor alumbrado, gracias por reportarlo.', '2026-10-19T09:25:00-06:00'),
  (pg_temp.id('comentario:cm_3'), pg_temp.id('rodada:a_2'),  pg_temp.id('usuario:p_1'),  'Nos vemos en la próxima rodada nocturna.', '2026-10-18T10:00:00-06:00'),
  (pg_temp.id('comentario:cm_4'), pg_temp.id('rodada:cr_1'), pg_temp.id('usuario:p_12'), 'La ciclovía está lista de punta a punta.', '2026-10-05T18:40:00-06:00')
ON CONFLICT DO NOTHING;
