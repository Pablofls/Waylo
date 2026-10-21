-- DATOS DE DEMOSTRACIÓN: colonias, lugares, lugares guardados, búsquedas y rutas
-- (src/mocks/places.ts, saved-places.ts, routes.ts, navigation.ts, emergency.ts).
-- Los nombres de colonia son aproximados y solo sirven para ver las pantallas.
SET search_path = waylo, public;
CREATE FUNCTION pg_temp.id(text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT md5('waylo-demo:' || $1)::uuid $$;
CREATE FUNCTION pg_temp.pt(lng double precision, lat double precision) RETURNS geography LANGUAGE sql IMMUTABLE
  AS $$ SELECT ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography $$;

INSERT INTO colonia (id, municipio_clave, nombre) VALUES
  (pg_temp.id('colonia:zona_udem'),       'san_pedro',  'Zona UDEM'),
  (pg_temp.id('colonia:valle_oriente'),   'san_pedro',  'Valle Oriente'),
  (pg_temp.id('colonia:san_agustin'),     'san_pedro',  'San Agustín'),
  (pg_temp.id('colonia:del_valle'),       'san_pedro',  'Del Valle'),
  (pg_temp.id('colonia:centro'),          'monterrey',  'Centro'),
  (pg_temp.id('colonia:obrera'),          'monterrey',  'Obrera'),
  (pg_temp.id('colonia:guadalupe_centro'),'guadalupe',  'Guadalupe Centro'),
  (pg_temp.id('colonia:la_pastora'),      'guadalupe',  'La Pastora')
ON CONFLICT DO NOTHING;

-- Lugares públicos (propietario NULL): destinos de búsqueda y puntos de salida de rodadas grupales.
INSERT INTO lugar (id, nombre, detalle, geog, colonia_id) VALUES
  (pg_temp.id('lugar:udem'),        'UDEM', 'Av. Ignacio Morones Prieto 4500 Pte.', pg_temp.pt(-100.417, 25.6605),  pg_temp.id('colonia:zona_udem')),
  (pg_temp.id('lugar:fundidora'),   'Fundidora', 'Parque Fundidora', pg_temp.pt(-100.2855, 25.6795), pg_temp.id('colonia:obrera')),
  (pg_temp.id('lugar:valle_oriente'),'Valle Oriente', 'Av. Lázaro Cárdenas', pg_temp.pt(-100.3185, 25.6415), pg_temp.id('colonia:valle_oriente')),
  (pg_temp.id('lugar:macroplaza'),  'Macroplaza', 'Centro de Monterrey', pg_temp.pt(-100.3098, 25.67), pg_temp.id('colonia:centro')),
  (pg_temp.id('lugar:plaza_fiesta'),'Plaza Fiesta San Agustín', NULL, pg_temp.pt(-100.3555, 25.6575), pg_temp.id('colonia:san_agustin')),
  (pg_temp.id('lugar:museo_acero'), 'Paseo Santa Lucía, Museo del Acero', NULL, pg_temp.pt(-100.2845, 25.6786), pg_temp.id('colonia:obrera')),
  (pg_temp.id('lugar:la_pastora'),  'Parque La Pastora', NULL, pg_temp.pt(-100.2588, 25.6705), pg_temp.id('colonia:la_pastora')),
  (pg_temp.id('lugar:puente_unidad'),'Puente de la Unidad', NULL, pg_temp.pt(-100.3015, 25.6738), pg_temp.id('colonia:centro')),
  (pg_temp.id('lugar:explanada_udem'),'Explanada de la UDEM', NULL, pg_temp.pt(-100.417, 25.6605), pg_temp.id('colonia:zona_udem'))
ON CONFLICT DO NOTHING;

-- Lugares privados de Daniela (casa, escuela y favorito). Nunca salen por v_lugar_publico.
INSERT INTO lugar (id, nombre, detalle, geog, colonia_id, propietario_id) VALUES
  (pg_temp.id('lugar:u_001:casa'),     'Casa', 'Cerca de la UDEM', pg_temp.pt(-100.399, 25.654), pg_temp.id('colonia:zona_udem'), pg_temp.id('usuario:u_001')),
  (pg_temp.id('lugar:u_001:udem'),     'UDEM', 'Av. Ignacio Morones Prieto 4500 Pte.', pg_temp.pt(-100.417, 25.6605), pg_temp.id('colonia:zona_udem'), pg_temp.id('usuario:u_001')),
  (pg_temp.id('lugar:u_001:plaza'),    'Plaza Fiesta San Agustín', NULL, pg_temp.pt(-100.3555, 25.6575), pg_temp.id('colonia:san_agustin'), pg_temp.id('usuario:u_001'))
ON CONFLICT DO NOTHING;

INSERT INTO lugar_guardado (id, usuario_id, lugar_id, tipo_lugar_clave, etiqueta) VALUES
  (pg_temp.id('lugar_guardado:sp_1'), pg_temp.id('usuario:u_001'), pg_temp.id('lugar:u_001:casa'),  'casa',     'Casa'),
  (pg_temp.id('lugar_guardado:sp_2'), pg_temp.id('usuario:u_001'), pg_temp.id('lugar:u_001:udem'),  'escuela',  'UDEM'),
  (pg_temp.id('lugar_guardado:sp_3'), pg_temp.id('usuario:u_001'), pg_temp.id('lugar:u_001:plaza'), 'favorito', 'Plaza Fiesta San Agustín')
ON CONFLICT DO NOTHING;

-- Búsquedas recientes de Daniela (SEARCH_HISTORY).
INSERT INTO historial_busqueda (id, usuario_id, lugar_id, buscado_en) VALUES
  (pg_temp.id('busqueda:1'), pg_temp.id('usuario:u_001'), pg_temp.id('lugar:valle_oriente'), '2026-10-19T18:00:00-06:00'),
  (pg_temp.id('busqueda:2'), pg_temp.id('usuario:u_001'), pg_temp.id('lugar:macroplaza'),    '2026-10-18T18:00:00-06:00'),
  (pg_temp.id('busqueda:3'), pg_temp.id('usuario:u_001'), pg_temp.id('lugar:plaza_fiesta'),  '2026-10-17T18:00:00-06:00')
ON CONFLICT DO NOTHING;

-- Consulta de ruta Casa -> UDEM con las tres opciones del prototipo (src/mocks/routes.ts).
INSERT INTO ruta_consulta (id, usuario_id, origen_lugar_id, destino_lugar_id, calculada_en) VALUES
  (pg_temp.id('ruta_consulta:casa_udem'), pg_temp.id('usuario:u_001'), pg_temp.id('lugar:u_001:casa'), pg_temp.id('lugar:u_001:udem'), '2026-10-20T07:00:00-06:00'),
  (pg_temp.id('ruta_consulta:udem_casa'), pg_temp.id('usuario:u_001'), pg_temp.id('lugar:u_001:udem'), pg_temp.id('lugar:u_001:casa'), '2026-10-04T18:00:00-06:00')
ON CONFLICT DO NOTHING;

INSERT INTO ruta_opcion (id, consulta_id, tipo_ruta_clave, minutos, via, resumen, trazo) VALUES
  (pg_temp.id('ruta_opcion:rapida'), pg_temp.id('ruta_consulta:casa_udem'), 'rapida', 11, 'Av. Morones Prieto',
   'Recorre casi todo el trayecto por Av. Morones Prieto, con tráfico pesado y autos a más de 60 km/h en horas pico.',
   ST_GeogFromText('SRID=4326;LINESTRING(-100.399 25.654, -100.403 25.656, -100.4075 25.6575, -100.412 25.659, -100.415 25.6598, -100.417 25.6605)')),
  (pg_temp.id('ruta_opcion:equilibrada'), pg_temp.id('ruta_consulta:casa_udem'), 'equilibrada', 13, 'Calles locales del fraccionamiento',
   'Evita el tramo más peligroso de Av. Morones Prieto usando calles locales con menor velocidad y mejor iluminación.',
   ST_GeogFromText('SRID=4326;LINESTRING(-100.399 25.654, -100.4025 25.6575, -100.4075 25.6595, -100.4125 25.6612, -100.4155 25.6612, -100.417 25.6605)')),
  (pg_temp.id('ruta_opcion:segura'), pg_temp.id('ruta_consulta:casa_udem'), 'segura', 15, 'Calles tranquilas y ciclovía',
   'Prioriza ciclovías y calles con poca velocidad vehicular. Tarda 4 minutos más, dentro de tu tope de 10.',
   ST_GeogFromText('SRID=4326;LINESTRING(-100.399 25.654, -100.4 25.6505, -100.4045 25.6495, -100.41 25.652, -100.414 25.656, -100.416 25.659, -100.417 25.6605)')),
  -- UDEM -> Casa: el mismo trazo de la ruta segura, recorrido al revés (como la rodada ride_87 del prototipo).
  (pg_temp.id('ruta_opcion:segura_inversa'), pg_temp.id('ruta_consulta:udem_casa'), 'segura', 16, 'Calles tranquilas y ciclovía',
   'Regreso por la ciclovía y calles de baja velocidad.',
   ST_GeogFromText('SRID=4326;LINESTRING(-100.417 25.6605, -100.416 25.659, -100.414 25.656, -100.41 25.652, -100.4045 25.6495, -100.4 25.6505, -100.399 25.654)'))
ON CONFLICT DO NOTHING;

-- Factores del Safety Score (calificación 0-100, mayor es mejor).
INSERT INTO ruta_opcion_factor (opcion_id, factor_clave, calificacion, explicacion)
SELECT pg_temp.id('ruta_opcion:' || o), f, c, e FROM (VALUES
  ('rapida','trafico',38,'Avenida de varios carriles con límite de 60 km/h y 11 reportes de autos a alta velocidad este mes.'),
  ('rapida','robo',62,'Dos reportes de asalto en los últimos 30 días cerca de la entrada a la universidad.'),
  ('rapida','iluminacion',70,'Alumbrado público continuo, con un tramo oscuro de 300 m antes de llegar.'),
  ('rapida','pavimento',55,'Seis baches reportados, tres de ellos en el carril derecho.'),
  ('rapida','ciclovia',20,'Sin ciclovía; se comparte carril con autos y camiones.'),
  ('equilibrada','trafico',72,'Calles locales con límite de 40 km/h y poco tráfico pesado.'),
  ('equilibrada','robo',74,'Un reporte de asalto en 30 días, en la parte final del trayecto.'),
  ('equilibrada','iluminacion',80,'Buena iluminación en el 90 % del trayecto.'),
  ('equilibrada','pavimento',72,'Dos baches reportados, ambos señalados en el mapa.'),
  ('equilibrada','ciclovia',45,'Ciclovía en el 30 % del recorrido.'),
  ('segura','trafico',90,'Casi todo el trayecto va separado del tráfico o por calles de 30 km/h.'),
  ('segura','robo',82,'Sin reportes de asalto en los últimos 45 días.'),
  ('segura','iluminacion',86,'Ciclovía con luminarias LED en toda su extensión.'),
  ('segura','pavimento',85,'Pavimento en buen estado; un bache reportado ya está en revisión.'),
  ('segura','ciclovia',95,'Ciclovía confinada en el 80 % del recorrido.'),
  ('segura_inversa','trafico',90,'Casi todo el trayecto va separado del tráfico o por calles de 30 km/h.'),
  ('segura_inversa','robo',82,'Sin reportes de asalto en los últimos 45 días.'),
  ('segura_inversa','iluminacion',86,'Ciclovía con luminarias LED en toda su extensión.'),
  ('segura_inversa','pavimento',85,'Pavimento en buen estado; un bache reportado ya está en revisión.'),
  ('segura_inversa','ciclovia',95,'Ciclovía confinada en el 80 % del recorrido.')
) t(o, f, c, e)
ON CONFLICT DO NOTHING;

-- Maniobras de la navegación guiada (src/mocks/navigation.ts); el punto sale de la fracción del trazo.
INSERT INTO ruta_opcion_maniobra (opcion_id, orden, giro_clave, texto, punto)
SELECT o.id, t.orden, t.giro, t.texto, ST_LineInterpolatePoint(o.trazo::geometry, t.frac)::geography
FROM ruta_opcion o
JOIN (VALUES
  (1, 'recto',     0.00, 'Sal de casa y sigue por la calle principal'),
  (2, 'izquierda', 0.12, 'Gira a la izquierda hacia la ciclovía'),
  (3, 'recto',     0.35, 'Continúa por la ciclovía'),
  (4, 'derecha',   0.60, 'Gira a la derecha hacia la UDEM'),
  (5, 'derecha',   0.85, 'Entra por Av. Morones Prieto al campus'),
  (6, 'llegada',   1.00, 'Llegaste a la UDEM')
) t(orden, giro, frac, texto) ON true
WHERE o.id = pg_temp.id('ruta_opcion:segura')
ON CONFLICT DO NOTHING;

-- Rutas guardadas (src/mocks/emergency.ts: savedRoutes).
INSERT INTO ruta_guardada (id, usuario_id, nombre, origen_lugar_id, destino_lugar_id, tipo_ruta_clave) VALUES
  (pg_temp.id('ruta_guardada:sr_1'), pg_temp.id('usuario:u_001'), 'Casa a la UDEM', pg_temp.id('lugar:u_001:casa'), pg_temp.id('lugar:u_001:udem'), 'segura'),
  (pg_temp.id('ruta_guardada:sr_2'), pg_temp.id('usuario:u_001'), 'La UDEM a casa', pg_temp.id('lugar:u_001:udem'), pg_temp.id('lugar:u_001:casa'), 'segura')
ON CONFLICT DO NOTHING;
