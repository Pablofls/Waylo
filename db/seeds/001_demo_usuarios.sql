-- DATOS DE DEMOSTRACIÓN (derivados de src/mocks). Solo se aplican con `db/apply.sh --seed`.
-- No contienen posiciones ni trazas GPS: la app usa el GPS real de los teléfonos.
-- Los ids son deterministas: md5('waylo-demo:<tabla>:<id del mock>')::uuid, así el sembrado se puede repetir
-- (ON CONFLICT DO NOTHING). Las cuentas de demostración no tienen contraseña y no pueden iniciar sesión.
SET search_path = waylo, public;
CREATE FUNCTION pg_temp.id(text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT md5('waylo-demo:' || $1)::uuid $$;

-- Usuarios: u_001 = Daniela Garza (src/mocks/user.ts); p_1..p_14 = src/mocks/people.ts.
INSERT INTO usuario (id, nombre, correo, ocupacion, municipio_clave, uso_principal_clave, bio, creado_en) VALUES
  (pg_temp.id('usuario:u_001'), 'Daniela Garza', 'daniela.garza@correo.com', 'Estudiante de la UDEM', 'san_pedro', 'transporte',
   'Voy en bici a la UDEM todos los días. Me gusta rodar con luces y por calles tranquilas.', '2026-03-14T09:00:00-06:00'),
  (pg_temp.id('usuario:p_1'),  'Mariana Rodríguez', 'mariana.rodriguez@udem.edu', NULL, 'san_pedro', 'transporte', 'Estudio en la UDEM y ruedo todos los días al campus. Fan de las rodadas de domingo.', '2026-01-20T09:00:00-06:00'),
  (pg_temp.id('usuario:p_2'),  'Luis Treviño', 'luis.trevino@correo.com', NULL, 'monterrey', 'transporte', 'Scooter eléctrico para ir al trabajo en el Centro. Reporto cada bache que veo.', '2026-02-08T09:00:00-06:00'),
  (pg_temp.id('usuario:p_3'),  'Andrea Salinas', 'andrea.salinas@correo.com', NULL, 'san_pedro', 'recreativo', 'Rodadas nocturnas por Fundidora y la ciclovía del río. Organizo salidas de principiantes.', '2025-11-30T09:00:00-06:00'),
  (pg_temp.id('usuario:p_4'),  'Carlos Villarreal', 'carlos.villarreal@correo.com', NULL, 'guadalupe', 'recreativo', 'Bici de ruta. Salgo temprano a La Pastora y la Sierra Madre.', '2026-03-02T09:00:00-06:00'),
  (pg_temp.id('usuario:p_5'),  'Fernanda Cantú', 'fernanda.cantu@correo.com', NULL, 'apodaca', 'transporte', 'Empecé a rodar hace dos meses. Busco rutas seguras para llegar a la escuela.', '2026-08-14T09:00:00-06:00'),
  (pg_temp.id('usuario:p_6'),  'Diego Garza', 'diego.garza@udem.edu', NULL, 'san_pedro', 'transporte', 'Bici entre semana y scooter los fines. Compañero de la UDEM.', '2026-05-19T09:00:00-06:00'),
  (pg_temp.id('usuario:p_7'),  'Valeria Martínez', 'valeria.martinez@correo.com', NULL, 'monterrey', 'recreativo', 'Paseos familiares de domingo en Fundidora.', '2026-04-11T09:00:00-06:00'),
  (pg_temp.id('usuario:p_8'),  'Jorge Elizondo', 'jorge.elizondo@correo.com', NULL, 'san_pedro', 'recreativo', 'Ciclista recreativo. Me gustan las rodadas largas de fin de semana.', '2025-12-22T09:00:00-06:00'),
  (pg_temp.id('usuario:p_9'),  'Paola Leal', 'paola.leal@correo.com', NULL, 'santa_catarina', 'transporte', 'Scooter para moverme por Santa Catarina y San Pedro.', '2026-06-03T09:00:00-06:00'),
  (pg_temp.id('usuario:p_10'), 'Ricardo Guerra', 'ricardo.guerra@correo.com', NULL, 'guadalupe', 'transporte', 'Voy al trabajo en bici por Av. Benito Juárez.', '2026-02-27T09:00:00-06:00'),
  (pg_temp.id('usuario:p_11'), 'Sofía Montemayor', 'sofia.montemayor@correo.com', NULL, 'monterrey', 'recreativo', 'Rodadas por la ciclovía del Río Santa Catarina.', '2026-01-09T09:00:00-06:00'),
  (pg_temp.id('usuario:p_12'), 'Héctor Lozano', 'hector.lozano@correo.com', NULL, 'san_pedro', 'recreativo', 'Organizo rodadas del Río Santa Catarina los lunes por la noche.', '2025-10-05T09:00:00-06:00'),
  (pg_temp.id('usuario:p_13'), 'Paulina Rangel', 'paulina.rangel@udem.edu', NULL, 'san_pedro', 'transporte', 'Voy a la UDEM en bici. Siempre con luces.', '2026-07-21T09:00:00-06:00'),
  (pg_temp.id('usuario:p_14'), 'Emiliano González', 'emiliano.gonzalez@correo.com', NULL, 'monterrey', 'transporte', 'Scooter por el Centro. Conozco las calles más tranquilas.', '2026-03-30T09:00:00-06:00')
ON CONFLICT DO NOTHING;

-- Vehículos ("ambos" = dos renglones).
INSERT INTO usuario_vehiculo (usuario_id, tipo_vehiculo_clave)
SELECT pg_temp.id('usuario:' || k), v FROM (VALUES
  ('u_001','bicicleta'), ('p_1','bicicleta'), ('p_2','scooter'), ('p_3','bicicleta'), ('p_4','bicicleta'),
  ('p_5','bicicleta'), ('p_6','bicicleta'), ('p_6','scooter'), ('p_7','bicicleta'), ('p_8','bicicleta'),
  ('p_9','scooter'), ('p_10','bicicleta'), ('p_11','bicicleta'), ('p_12','bicicleta'), ('p_13','bicicleta'), ('p_14','scooter')
) t(k, v)
ON CONFLICT DO NOTHING;

-- Preferencias de Daniela (src/mocks/user.ts y pantallas de configuración).
INSERT INTO preferencia_ruta (usuario_id, inclinacion_segura, minutos_extra_max)
VALUES (pg_temp.id('usuario:u_001'), 70, 10) ON CONFLICT DO NOTHING;
INSERT INTO preferencia_ruta_evitar (usuario_id, evitar_clave) VALUES
  (pg_temp.id('usuario:u_001'), 'zonas_riesgo_alto'),
  (pg_temp.id('usuario:u_001'), 'calles_sin_iluminacion') ON CONFLICT DO NOTHING;
INSERT INTO preferencia_ruta_preferir (usuario_id, preferir_clave) VALUES
  (pg_temp.id('usuario:u_001'), 'ciclovias_confinadas') ON CONFLICT DO NOTHING;
INSERT INTO preferencia_notificacion (usuario_id, tipo_clave, activa) VALUES
  (pg_temp.id('usuario:u_001'), 'alerta_ruta', true),
  (pg_temp.id('usuario:u_001'), 'aviso_municipio', true),
  (pg_temp.id('usuario:u_001'), 'recordatorio_rodada', false) ON CONFLICT DO NOTHING;
INSERT INTO preferencia_alerta_ruta (usuario_id, distancia_aviso_m) VALUES (pg_temp.id('usuario:u_001'), 500) ON CONFLICT DO NOTHING;
INSERT INTO preferencia_recordatorio_rodada (usuario_id, anticipacion_min) VALUES (pg_temp.id('usuario:u_001'), 60) ON CONFLICT DO NOTHING;
INSERT INTO horario_silencioso (usuario_id, desde, hasta) VALUES (pg_temp.id('usuario:u_001'), '22:00', '06:30') ON CONFLICT DO NOTHING;
INSERT INTO config_caidas (usuario_id, activa, segundos_espera) VALUES (pg_temp.id('usuario:u_001'), true, 15) ON CONFLICT DO NOTHING;

-- Privacidad: Daniela con los valores de la pantalla; Sofía, Héctor, Paulina y Emiliano comparten
-- sus rodadas con todos (aparecen en la actividad de la comunidad).
INSERT INTO privacidad_usuario (usuario_id, visibilidad_rodadas, perfil_visible, reportes_anonimos)
SELECT pg_temp.id('usuario:' || k), v, true, false FROM (VALUES
  ('u_001','amigos'), ('p_11','todos'), ('p_12','todos'), ('p_13','todos'), ('p_14','todos')
) t(k, v)
ON CONFLICT DO NOTHING;

-- Contactos de emergencia (src/mocks/emergency.ts).
INSERT INTO contacto_emergencia (id, usuario_id, nombre, telefono, parentesco) VALUES
  (pg_temp.id('contacto:ec_1'), pg_temp.id('usuario:u_001'), 'Rosa Garza', '81 1234 5678', 'Mamá'),
  (pg_temp.id('contacto:ec_2'), pg_temp.id('usuario:u_001'), 'Mariana Rodríguez', '81 8765 4321', 'Amiga')
ON CONFLICT DO NOTHING;

-- Amistades vía solicitudes (src/mocks/people.ts, campo relation, desde la perspectiva de Daniela).
-- amigo: solicitud enviada por Daniela y aceptada. solicitud_recibida / solicitud_enviada: pendientes.
INSERT INTO solicitud_amistad (id, emisor_id, receptor_id, enviada_en, respondida_en, resultado) VALUES
  (pg_temp.id('solicitud:u_001-p_1'), pg_temp.id('usuario:u_001'), pg_temp.id('usuario:p_1'), '2026-03-15T10:00:00-06:00', '2026-03-15T12:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:u_001-p_2'), pg_temp.id('usuario:u_001'), pg_temp.id('usuario:p_2'), '2026-04-02T10:00:00-06:00', '2026-04-02T18:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:u_001-p_3'), pg_temp.id('usuario:u_001'), pg_temp.id('usuario:p_3'), '2026-04-20T10:00:00-06:00', '2026-04-21T09:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:u_001-p_4'), pg_temp.id('usuario:u_001'), pg_temp.id('usuario:p_4'), '2026-05-10T10:00:00-06:00', '2026-05-10T20:00:00-06:00', 'aceptada'),
  -- Amistades entre otras personas (para que existan "amigos en común").
  (pg_temp.id('solicitud:p_1-p_2'),  pg_temp.id('usuario:p_1'),  pg_temp.id('usuario:p_2'),  '2026-02-10T10:00:00-06:00', '2026-02-10T12:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:p_1-p_3'),  pg_temp.id('usuario:p_1'),  pg_temp.id('usuario:p_3'),  '2026-02-12T10:00:00-06:00', '2026-02-12T12:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:p_1-p_4'),  pg_temp.id('usuario:p_1'),  pg_temp.id('usuario:p_4'),  '2026-03-12T10:00:00-06:00', '2026-03-12T12:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:p_1-p_6'),  pg_temp.id('usuario:p_1'),  pg_temp.id('usuario:p_6'),  '2026-05-25T10:00:00-06:00', '2026-05-25T12:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:p_1-p_13'), pg_temp.id('usuario:p_1'),  pg_temp.id('usuario:p_13'), '2026-07-25T10:00:00-06:00', '2026-07-25T12:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:p_2-p_3'),  pg_temp.id('usuario:p_2'),  pg_temp.id('usuario:p_3'),  '2026-03-01T10:00:00-06:00', '2026-03-01T12:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:p_2-p_9'),  pg_temp.id('usuario:p_2'),  pg_temp.id('usuario:p_9'),  '2026-06-10T10:00:00-06:00', '2026-06-10T12:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:p_3-p_4'),  pg_temp.id('usuario:p_3'),  pg_temp.id('usuario:p_4'),  '2026-03-20T10:00:00-06:00', '2026-03-20T12:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:p_3-p_11'), pg_temp.id('usuario:p_3'),  pg_temp.id('usuario:p_11'), '2026-02-01T10:00:00-06:00', '2026-02-01T12:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:p_3-p_12'), pg_temp.id('usuario:p_3'),  pg_temp.id('usuario:p_12'), '2026-01-15T10:00:00-06:00', '2026-01-15T12:00:00-06:00', 'aceptada'),
  (pg_temp.id('solicitud:p_3-p_13'), pg_temp.id('usuario:p_3'),  pg_temp.id('usuario:p_13'), '2026-08-01T10:00:00-06:00', '2026-08-01T12:00:00-06:00', 'aceptada'),
  -- Pendientes con Daniela.
  (pg_temp.id('solicitud:p_5-u_001'), pg_temp.id('usuario:p_5'), pg_temp.id('usuario:u_001'), '2026-10-20T06:40:00-06:00', NULL, NULL),
  (pg_temp.id('solicitud:p_6-u_001'), pg_temp.id('usuario:p_6'), pg_temp.id('usuario:u_001'), '2026-10-15T13:20:00-06:00', NULL, NULL),
  (pg_temp.id('solicitud:u_001-p_11'), pg_temp.id('usuario:u_001'), pg_temp.id('usuario:p_11'), '2026-10-18T09:00:00-06:00', NULL, NULL)
ON CONFLICT DO NOTHING;
