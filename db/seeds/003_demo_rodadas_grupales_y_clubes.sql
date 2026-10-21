-- DATOS DE DEMOSTRACIÓN: rodadas grupales (src/mocks/group-rides.ts) y clubes (src/mocks/clubs.ts).
SET search_path = waylo, public;
CREATE FUNCTION pg_temp.id(text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT md5('waylo-demo:' || $1)::uuid $$;

-- No hay columna de estado: g_7 y g_8 son "finalizadas" solo por su fecha pasada.
INSERT INTO rodada_grupal (id, organizador_id, titulo, descripcion, programada_en, lugar_salida_id, nivel_clave, ritmo_clave, distancia_km, cupo, privacidad, creada_en) VALUES
  (pg_temp.id('rodada_grupal:g_1'), pg_temp.id('usuario:p_3'), 'Rodada nocturna Fundidora',
   'Salida tranquila por el Paseo Santa Lucía y el Parque Fundidora. Vamos juntos hasta el Museo del Acero, con paradas cortas para reagrupar. Ideal para quienes empiezan a rodar de noche.',
   '2026-10-24T20:00:00-06:00', pg_temp.id('lugar:museo_acero'), 'principiante', 'relajado', 18, 40, 'publica', '2026-10-10T10:00:00-06:00'),
  (pg_temp.id('rodada_grupal:g_2'), pg_temp.id('usuario:p_4'), 'Sierra Madre al amanecer',
   'Ascenso por la Sierra Madre saliendo de La Pastora. Ritmo exigente con subidas largas; se requiere condición. Regreso por la misma ruta.',
   '2026-10-25T06:00:00-06:00', pg_temp.id('lugar:la_pastora'), 'avanzado', 'rapido', 52, 25, 'publica', '2026-10-10T10:00:00-06:00'),
  (pg_temp.id('rodada_grupal:g_3'), pg_temp.id('usuario:p_12'), 'Ciclovía Río Santa Catarina',
   'Recorremos la ciclovía del río de punta a punta. Ritmo moderado con una parada a la mitad.',
   '2026-10-26T19:30:00-06:00', pg_temp.id('lugar:puente_unidad'), 'intermedio', 'moderado', 26, 60, 'publica', '2026-10-10T10:00:00-06:00'),
  (pg_temp.id('rodada_grupal:g_4'), pg_temp.id('usuario:p_1'), 'Rodada universitaria UDEM',
   'Rodada para estudiantes y personal de la UDEM. Salimos de la explanada y damos una vuelta por San Pedro; terminamos con café en el campus.',
   '2026-10-29T18:30:00-06:00', pg_temp.id('lugar:explanada_udem'), 'principiante', 'relajado', 14, 80, 'publica', '2026-10-10T10:00:00-06:00'),
  (pg_temp.id('rodada_grupal:g_5'), pg_temp.id('usuario:p_2'), 'San Pedro Express',
   'Vuelta rápida por San Pedro con salida y llegada en Plaza Fiesta San Agustín.',
   '2026-11-01T07:00:00-06:00', pg_temp.id('lugar:plaza_fiesta'), 'intermedio', 'moderado', 32, NULL, 'publica', '2026-10-10T10:00:00-06:00'),
  (pg_temp.id('rodada_grupal:g_6'), pg_temp.id('usuario:u_001'), 'Cafecito en Valle Oriente',
   'Salida corta solo para amigos. Rodamos tranquilo y desayunamos en Valle Oriente.',
   '2026-11-03T08:00:00-06:00', pg_temp.id('lugar:valle_oriente'), 'principiante', 'relajado', 12, 12, 'amigos', '2026-10-15T10:00:00-06:00'),
  (pg_temp.id('rodada_grupal:g_7'), pg_temp.id('usuario:p_7'), 'Domingo familiar en Fundidora',
   'Paseo familiar de ritmo muy tranquilo dentro del parque.',
   '2026-10-12T09:00:00-06:00', pg_temp.id('lugar:fundidora'), 'principiante', 'relajado', 8, NULL, 'publica', '2026-10-01T10:00:00-06:00'),
  (pg_temp.id('rodada_grupal:g_8'), pg_temp.id('usuario:p_14'), 'Ruta nocturna por el Centro',
   'Recorrido nocturno por las calles del Centro con scooters y bicis.',
   '2026-10-10T21:00:00-06:00', pg_temp.id('lugar:macroplaza'), 'intermedio', 'moderado', 15, NULL, 'publica', '2026-10-01T10:00:00-06:00')
ON CONFLICT DO NOTHING;

-- Vehículos permitidos ("ambos" = bicicleta y scooter).
INSERT INTO rodada_grupal_vehiculo (rodada_grupal_id, tipo_vehiculo_clave)
SELECT pg_temp.id('rodada_grupal:' || k), v FROM (VALUES
  ('g_1','bicicleta'), ('g_2','bicicleta'), ('g_3','bicicleta'), ('g_3','scooter'), ('g_4','bicicleta'), ('g_4','scooter'),
  ('g_5','bicicleta'), ('g_6','bicicleta'), ('g_7','bicicleta'), ('g_8','bicicleta'), ('g_8','scooter')
) t(k, v) ON CONFLICT DO NOTHING;

-- Reglas: las 4 básicas (casco, luces, semáforos, agua) más las particulares de cada rodada.
INSERT INTO rodada_grupal_regla (rodada_grupal_id, regla_clave)
SELECT pg_temp.id('rodada_grupal:' || k), r FROM (VALUES
  ('g_1','casco'),('g_1','luces'),('g_1','semaforos'),('g_1','agua'),('g_1','chaleco'),
  ('g_2','casco'),('g_2','luces'),('g_2','semaforos'),('g_2','agua'),('g_2','kit_reparacion'),('g_2','bici_revisada'),
  ('g_3','casco'),('g_3','luces'),('g_3','semaforos'),('g_3','agua'),
  ('g_4','casco'),('g_4','luces'),('g_4','semaforos'),('g_4','agua'),('g_4','credencial_udem'),
  ('g_5','casco'),('g_5','luces'),('g_5','semaforos'),('g_5','agua'),
  ('g_6','casco'),('g_6','luces'),
  ('g_7','casco'),('g_7','luces'),('g_7','semaforos'),('g_7','agua'),
  ('g_8','casco'),('g_8','luces'),('g_8','semaforos'),('g_8','agua')
) t(k, r) ON CONFLICT DO NOTHING;

-- Asistentes (el organizador también asiste).
INSERT INTO rodada_grupal_asistente (rodada_grupal_id, usuario_id, se_unio_en)
SELECT pg_temp.id('rodada_grupal:' || k), pg_temp.id('usuario:' || u), g.creada_en + interval '1 day'
FROM (VALUES
  ('g_1','p_3'),('g_1','p_1'),('g_1','p_7'),('g_1','p_11'),('g_1','p_13'),('g_1','p_5'),
  ('g_2','p_4'),('g_2','p_8'),('g_2','p_10'),('g_2','p_12'),
  ('g_3','p_12'),('g_3','p_3'),('g_3','p_2'),('g_3','p_9'),('g_3','p_11'),('g_3','p_14'),('g_3','p_6'),
  ('g_4','p_1'),('g_4','u_001'),('g_4','p_6'),('g_4','p_13'),('g_4','p_7'),('g_4','p_8'),
  ('g_5','p_2'),('g_5','p_8'),('g_5','p_10'),
  ('g_6','u_001'),('g_6','p_1'),('g_6','p_3'),
  ('g_7','p_7'),('g_7','u_001'),('g_7','p_1'),('g_7','p_5'),('g_7','p_13'),
  ('g_8','p_14'),('g_8','p_2'),('g_8','p_10')
) t(k, u)
JOIN rodada_grupal g ON g.id = pg_temp.id('rodada_grupal:' || k)
ON CONFLICT DO NOTHING;

-- Clubes. El dueño es el miembro con rol 'propietario'.
INSERT INTO club (id, nombre, descripcion, municipio_clave, privacidad, creado_en) VALUES
  (pg_temp.id('club:c_1'), 'UDEM en Bici', 'Comunidad de estudiantes, maestros y personal de la UDEM que van en bici o scooter al campus. Organizamos rodadas semanales y compartimos rutas seguras.', 'san_pedro', 'publico', '2026-02-01T10:00:00-06:00'),
  (pg_temp.id('club:c_2'), 'Rodada Nocturna MTY', 'Rodadas de noche por Fundidora, el Centro y el río. Todos los niveles, siempre con luces y chaleco.', 'monterrey', 'publico', '2026-02-01T10:00:00-06:00'),
  (pg_temp.id('club:c_3'), 'Pedaleando Sierra', 'Ruta de montaña y carretera hacia la Sierra Madre. Nivel intermedio y avanzado.', 'guadalupe', 'publico', '2026-02-01T10:00:00-06:00'),
  (pg_temp.id('club:c_4'), 'Bici Urbana Monterrey', 'Ciclismo urbano y movilidad: rodadas por la ciclovía del Río Santa Catarina y propuestas para el municipio.', 'monterrey', 'publico', '2026-02-01T10:00:00-06:00'),
  (pg_temp.id('club:c_5'), 'Scooters del Valle', 'Usuarios de scooter eléctrico en San Pedro y Santa Catarina. Tips de seguridad y recarga.', 'san_pedro', 'privado', '2026-02-01T10:00:00-06:00')
ON CONFLICT DO NOTHING;

INSERT INTO club_miembro (club_id, usuario_id, rol, se_unio_en)
SELECT pg_temp.id('club:' || k), pg_temp.id('usuario:' || u), CASE WHEN u = o THEN 'propietario' ELSE 'miembro' END, '2026-02-15T10:00:00-06:00'
FROM (VALUES
  ('c_1','p_1'),('c_1','u_001'),('c_1','p_6'),('c_1','p_13'),('c_1','p_7'),('c_1','p_8'),
  ('c_2','p_3'),('c_2','p_1'),('c_2','p_11'),('c_2','p_13'),('c_2','p_5'),('c_2','p_14'),
  ('c_3','p_4'),('c_3','p_8'),('c_3','p_10'),('c_3','p_12'),
  ('c_4','p_12'),('c_4','p_3'),('c_4','p_2'),('c_4','p_9'),('c_4','p_11'),
  ('c_5','p_9'),('c_5','p_2'),('c_5','p_14')
) t(k, u)
JOIN (VALUES ('c_1','p_1'),('c_2','p_3'),('c_3','p_4'),('c_4','p_12'),('c_5','p_9')) d(club, o) ON d.club = t.k
ON CONFLICT DO NOTHING;

INSERT INTO club_rodada (club_id, rodada_grupal_id)
SELECT pg_temp.id('club:' || c), pg_temp.id('rodada_grupal:' || g) FROM (VALUES
  ('c_1','g_4'), ('c_2','g_1'), ('c_2','g_8'), ('c_3','g_2'), ('c_4','g_3')
) t(c, g) ON CONFLICT DO NOTHING;
