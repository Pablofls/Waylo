-- DATOS DE DEMOSTRACIÓN: reportes de Daniela y de la comunidad (src/mocks/reports.ts) y notificaciones
-- (src/mocks/notifications.ts). Las confirmaciones salen de renglones de reporte_confirmacion: el
-- número de confirmaciones del prototipo se reproduce con las personas sembradas.
SET search_path = waylo, public;
CREATE FUNCTION pg_temp.id(text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT md5('waylo-demo:' || $1)::uuid $$;

-- r_1038 queda sin gravedad: es el reporte "pendiente por completar" del prototipo.
-- La gravedad del resto es un dato de demostración (el prototipo no la guarda en el reporte).
INSERT INTO reporte (id, usuario_id, categoria_clave, geog, colonia_id, referencia, gravedad_clave, nota, creado_en) VALUES
  (pg_temp.id('reporte:r_1042'), pg_temp.id('usuario:u_001'), 'bache',              ST_SetSRID(ST_MakePoint(-100.4075, 25.6575), 4326)::geography, pg_temp.id('colonia:zona_udem'), 'Av. Morones Prieto', 'moderada', 'Bache profundo en el carril derecho.', '2026-10-05T07:42:00-06:00'),
  (pg_temp.id('reporte:r_1038'), pg_temp.id('usuario:u_001'), 'poca_iluminacion',   ST_SetSRID(ST_MakePoint(-100.4115, 25.6588), 4326)::geography, pg_temp.id('colonia:zona_udem'), 'Av. Morones Prieto, cerca de la UDEM', NULL, NULL, '2026-10-04T20:10:00-06:00'),
  (pg_temp.id('reporte:r_1021'), pg_temp.id('usuario:u_001'), 'alta_velocidad',     ST_SetSRID(ST_MakePoint(-100.4035, 25.6562), 4326)::geography, pg_temp.id('colonia:zona_udem'), 'Av. Morones Prieto', 'moderada', NULL, '2026-10-02T18:25:00-06:00'),
  (pg_temp.id('reporte:r_1009'), pg_temp.id('usuario:u_001'), 'robo',               ST_SetSRID(ST_MakePoint(-100.4142, 25.6598), 4326)::geography, pg_temp.id('colonia:zona_udem'), 'Entrada principal de la UDEM', 'grave', NULL, '2026-09-29T21:05:00-06:00'),
  (pg_temp.id('reporte:r_0997'), pg_temp.id('usuario:u_001'), 'calle_cerrada',      ST_SetSRID(ST_MakePoint(-100.4002, 25.6528), 4326)::geography, pg_temp.id('colonia:zona_udem'), 'Calle junto a la salida de casa', 'leve', NULL, '2026-09-27T08:15:00-06:00'),
  -- Comunidad (communityReports): autor de demostración asignado.
  (pg_temp.id('reporte:c_501'), pg_temp.id('usuario:p_7'),  'accidente',          ST_SetSRID(ST_MakePoint(-100.3105, 25.6702), 4326)::geography, pg_temp.id('colonia:centro'),          'Av. Constitución y Zaragoza', 'moderada', NULL, '2026-10-05T18:02:00-06:00'),
  (pg_temp.id('reporte:c_498'), pg_temp.id('usuario:p_8'),  'bache',              ST_SetSRID(ST_MakePoint(-100.3188, 25.6418), 4326)::geography, pg_temp.id('colonia:valle_oriente'),  'Av. Lázaro Cárdenas', 'moderada', NULL, '2026-10-05T16:40:00-06:00'),
  (pg_temp.id('reporte:c_493'), pg_temp.id('usuario:p_9'),  'conductor_agresivo', ST_SetSRID(ST_MakePoint(-100.2862, 25.6788), 4326)::geography, pg_temp.id('colonia:obrera'),         'Av. Fundidora', 'moderada', NULL, '2026-10-05T14:12:00-06:00'),
  (pg_temp.id('reporte:c_487'), pg_temp.id('usuario:p_10'), 'poca_iluminacion',   ST_SetSRID(ST_MakePoint(-100.2572, 25.6768), 4326)::geography, pg_temp.id('colonia:guadalupe_centro'), 'Av. Benito Juárez', 'moderada', NULL, '2026-10-04T21:30:00-06:00'),
  (pg_temp.id('reporte:c_480'), pg_temp.id('usuario:p_12'), 'robo',               ST_SetSRID(ST_MakePoint(-100.3552, 25.6579), 4326)::geography, pg_temp.id('colonia:del_valle'),      'Calzada del Valle', 'grave', NULL, '2026-10-04T19:48:00-06:00')
ON CONFLICT DO NOTHING;

-- Línea de tiempo (el estado actual es el último renglón). Para los reportes de la comunidad el
-- prototipo no trae línea de tiempo: se crea el renglón "enviado" y, si aplica, "en_revision".
INSERT INTO reporte_historial_estado (id, reporte_id, estado_clave, registrado_en, texto) VALUES
  (pg_temp.id('historial:r_1042:enviado'),     pg_temp.id('reporte:r_1042'), 'enviado',     '2026-10-05T07:42:00-06:00', 'Reporte enviado desde tu rodada.'),
  (pg_temp.id('historial:r_1042:en_revision'), pg_temp.id('reporte:r_1042'), 'en_revision', '2026-10-05T11:15:00-06:00', 'Obras Públicas de San Pedro lo recibió y lo está revisando.'),
  (pg_temp.id('historial:r_1038:enviado'),     pg_temp.id('reporte:r_1038'), 'enviado',     '2026-10-04T20:10:00-06:00', 'Reporte enviado. Falta completar los detalles.'),
  (pg_temp.id('historial:r_1021:enviado'),     pg_temp.id('reporte:r_1021'), 'enviado',     '2026-10-02T18:25:00-06:00', 'Reporte enviado.'),
  (pg_temp.id('historial:r_1021:en_revision'), pg_temp.id('reporte:r_1021'), 'en_revision', '2026-10-03T09:00:00-06:00', 'Tránsito municipal lo tiene en revisión.'),
  (pg_temp.id('historial:r_1021:atendido'),    pg_temp.id('reporte:r_1021'), 'atendido',    '2026-10-04T16:30:00-06:00', 'Se instaló un reductor de velocidad en el tramo.'),
  (pg_temp.id('historial:r_1009:enviado'),     pg_temp.id('reporte:r_1009'), 'enviado',     '2026-09-29T21:05:00-06:00', 'Reporte enviado.'),
  (pg_temp.id('historial:r_1009:en_revision'), pg_temp.id('reporte:r_1009'), 'en_revision', '2026-09-30T10:20:00-06:00', 'Turnado a Seguridad Pública Municipal.'),
  (pg_temp.id('historial:r_0997:enviado'),     pg_temp.id('reporte:r_0997'), 'enviado',     '2026-09-27T08:15:00-06:00', 'Reporte enviado.'),
  (pg_temp.id('historial:r_0997:atendido'),    pg_temp.id('reporte:r_0997'), 'atendido',    '2026-09-28T13:00:00-06:00', 'La obra concluyó y la calle se reabrió.'),
  (pg_temp.id('historial:c_501:enviado'),      pg_temp.id('reporte:c_501'),  'enviado',     '2026-10-05T18:02:00-06:00', NULL),
  (pg_temp.id('historial:c_498:enviado'),      pg_temp.id('reporte:c_498'),  'enviado',     '2026-10-05T16:40:00-06:00', NULL),
  (pg_temp.id('historial:c_498:en_revision'),  pg_temp.id('reporte:c_498'),  'en_revision', '2026-10-05T17:30:00-06:00', NULL),
  (pg_temp.id('historial:c_493:enviado'),      pg_temp.id('reporte:c_493'),  'enviado',     '2026-10-05T14:12:00-06:00', NULL),
  (pg_temp.id('historial:c_487:enviado'),      pg_temp.id('reporte:c_487'),  'enviado',     '2026-10-04T21:30:00-06:00', NULL),
  (pg_temp.id('historial:c_487:en_revision'),  pg_temp.id('reporte:c_487'),  'en_revision', '2026-10-05T09:00:00-06:00', NULL),
  (pg_temp.id('historial:c_480:enviado'),      pg_temp.id('reporte:c_480'),  'enviado',     '2026-10-04T19:48:00-06:00', NULL)
ON CONFLICT DO NOTHING;

-- Confirmaciones "Sigue ahí": n personas distintas del autor y de Daniela, en orden alfabético.
INSERT INTO reporte_confirmacion (reporte_id, usuario_id, resultado, confirmado_en)
SELECT r.id, s.id, 'sigue', r.creado_en + s.n * interval '20 minutes'
FROM (VALUES ('r_1042',6),('r_1038',3),('r_1021',11),('r_1009',4),('r_0997',2),
             ('c_501',8),('c_498',5),('c_493',3),('c_487',9),('c_480',7)) v(k, n)
JOIN reporte r ON r.id = pg_temp.id('reporte:' || v.k)
CROSS JOIN LATERAL (
  SELECT x.id, x.rn AS n FROM (
    SELECT u.id, row_number() OVER (ORDER BY u.nombre) AS rn
    FROM usuario u
    WHERE u.id <> r.usuario_id AND u.id <> pg_temp.id('usuario:u_001')
  ) x WHERE x.rn <= v.n
) s
ON CONFLICT DO NOTHING;

-- Notificaciones de Daniela. n_1 apunta a un reporte cercano a su ruta; n_7 del prototipo
-- ("Mariana va a la rodada") no se siembra: esa información se obtiene de los asistentes de la rodada.
INSERT INTO notificacion (id, usuario_id, reporte_id, historial_estado_id, solicitud_amistad_id, rodada_grupal_id, creada_en, leida_en) VALUES
  (pg_temp.id('notificacion:n_1'), pg_temp.id('usuario:u_001'), pg_temp.id('reporte:r_1042'), NULL, NULL, NULL, '2026-10-20T07:05:00-06:00', NULL),
  (pg_temp.id('notificacion:n_2'), pg_temp.id('usuario:u_001'), NULL, NULL, pg_temp.id('solicitud:p_5-u_001'), NULL, '2026-10-20T06:40:00-06:00', NULL),
  (pg_temp.id('notificacion:n_3'), pg_temp.id('usuario:u_001'), NULL, pg_temp.id('historial:r_1042:en_revision'), NULL, NULL, '2026-10-19T11:15:00-06:00', NULL),
  (pg_temp.id('notificacion:n_4'), pg_temp.id('usuario:u_001'), NULL, NULL, NULL, pg_temp.id('rodada_grupal:g_4'), '2026-10-19T09:00:00-06:00', '2026-10-19T09:30:00-06:00'),
  (pg_temp.id('notificacion:n_5'), pg_temp.id('usuario:u_001'), NULL, pg_temp.id('historial:r_1021:atendido'), NULL, NULL, '2026-10-16T16:30:00-06:00', '2026-10-16T17:00:00-06:00'),
  (pg_temp.id('notificacion:n_6'), pg_temp.id('usuario:u_001'), NULL, NULL, pg_temp.id('solicitud:p_6-u_001'), NULL, '2026-10-15T13:20:00-06:00', '2026-10-15T14:00:00-06:00')
ON CONFLICT DO NOTHING;
