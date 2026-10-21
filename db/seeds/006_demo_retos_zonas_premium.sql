-- DATOS DE DEMOSTRACIÓN: retos de octubre, insignias obtenidas, zonas, y una suscripción de ejemplo
-- (src/mocks/clubs.ts: challenges, badges.ts, people.ts: badgeIds, zones.ts, pantallas de Premium).
SET search_path = waylo, public;
CREATE FUNCTION pg_temp.id(text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT md5('waylo-demo:' || $1)::uuid $$;

-- Retos mensuales. El progreso y los participantes se calculan (v_reto_progreso, v_reto).
INSERT INTO reto (id, titulo, descripcion, metrica_clave, meta, umbral_score, inicia_en, termina_en, insignia_premio) VALUES
  (pg_temp.id('reto:ch_1'), '50 km en octubre',  'Recorre 50 km con Waylo durante el mes.',                  'km_recorridos',               50, NULL, '2026-10-01', '2026-10-31', 'constante'),
  (pg_temp.id('reto:ch_2'), 'Rodadas seguras',   'Completa 5 rodadas con Safety Score de 80 o más.',         'rodadas_seguras',              5, 80,   '2026-10-01', '2026-10-31', 'ruta_segura'),
  (pg_temp.id('reto:ch_3'), 'Ojo de la comunidad','Envía 3 reportes confirmados por otras personas.',        'reportes_confirmados',         3, NULL, '2026-10-01', '2026-10-31', 'ojo_de_barrio'),
  (pg_temp.id('reto:ch_4'), 'Rueda en grupo',    'Asiste a 2 rodadas grupales este mes.',                    'rodadas_grupales_asistidas',   2, NULL, '2026-10-01', '2026-10-31', 'rodada_compartida')
ON CONFLICT DO NOTHING;

INSERT INTO reto_participacion (reto_id, usuario_id, se_unio_en)
SELECT pg_temp.id('reto:' || r), pg_temp.id('usuario:' || u), '2026-10-01T09:00:00-06:00' FROM (VALUES
  ('ch_1','u_001'),('ch_1','p_1'),('ch_1','p_3'),('ch_1','p_11'),('ch_1','p_12'),
  ('ch_2','u_001'),('ch_2','p_1'),('ch_2','p_3'),
  ('ch_3','p_2'),('ch_3','p_8'),
  ('ch_4','p_1'),('ch_4','p_6'),('ch_4','p_13')
) t(r, u) ON CONFLICT DO NOTHING;

-- Insignias obtenidas (Daniela: b_1, b_2 y b_7; las demás según badgeIds de cada persona).
INSERT INTO usuario_insignia (usuario_id, insignia_clave, obtenida_en)
SELECT pg_temp.id('usuario:' || u), i, u2.creado_en + interval '30 days'
FROM (VALUES
  ('u_001','primer_reporte'),('u_001','ojo_de_barrio'),('u_001','constante'),
  ('p_1','primer_reporte'),('p_1','ojo_de_barrio'),('p_1','vigia_nocturno'),
  ('p_2','primer_reporte'),('p_2','ojo_de_barrio'),
  ('p_3','primer_reporte'),('p_3','ojo_de_barrio'),('p_3','vigia_nocturno'),('p_3','calle_atendida'),
  ('p_4','primer_reporte'),('p_5','primer_reporte'),
  ('p_6','primer_reporte'),('p_6','vigia_nocturno'),
  ('p_7','primer_reporte'),
  ('p_8','primer_reporte'),('p_8','ojo_de_barrio'),
  ('p_9','primer_reporte'),
  ('p_10','primer_reporte'),('p_10','ojo_de_barrio'),
  ('p_11','primer_reporte'),('p_11','ojo_de_barrio'),('p_11','vigia_nocturno'),
  ('p_12','primer_reporte'),('p_12','ojo_de_barrio'),('p_12','vigia_nocturno'),('p_12','calle_atendida'),
  ('p_13','primer_reporte'),('p_14','primer_reporte')
) t(u, i)
JOIN usuario u2 ON u2.id = pg_temp.id('usuario:' || t.u)
ON CONFLICT DO NOTHING;

-- Zonas: polígono circular alrededor del punto del prototipo. Su Safety Score se calcula con los
-- reportes sembrados dentro del polígono (v_zona_seguridad_mensual), por lo que será más alto que el del
-- prototipo, cuyos conteos de 6 meses no se siembran.
INSERT INTO zona (id, nombre, detalle, municipio_clave, area, descripcion)
SELECT pg_temp.id('zona:' || k), n, d, m, ST_Buffer(ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, r)::geography, s
FROM (VALUES
  ('z_1','Entrada de la UDEM','Av. Ignacio Morones Prieto','san_pedro',-100.4145,25.6595,300,'El tráfico de entrada y salida del campus eleva el riesgo en horas pico. De noche se suma la poca iluminación.'),
  ('z_2','Av. Morones Prieto','Entre la UDEM y Calzada del Valle','san_pedro',-100.4075,25.6575,500,'Avenida rápida sin ciclovía. Los baches del carril derecho siguen sin atenderse.'),
  ('z_3','Valle Oriente','Av. Lázaro Cárdenas','san_pedro',-100.3185,25.6415,600,'Zona con ciclovía y buena iluminación. Mejoró por obras recientes de pavimento.'),
  ('z_4','Centro de Monterrey','Macroplaza y calles aledañas','monterrey',-100.3098,25.67,700,'El riesgo sube por la noche. Prefiere calles con más movimiento y evita las cerradas por obra.'),
  ('z_5','Parque Fundidora','Paseo Santa Lucía y alrededores','monterrey',-100.2855,25.6795,800,'Una de las zonas más seguras del área metropolitana, con ciclovía confinada y vigilancia.')
) t(k, n, d, m, lng, lat, r, s)
ON CONFLICT DO NOTHING;

-- Suscripción de ejemplo para Jorge Elizondo (Daniela queda sin Premium, como en el prototipo).
-- Reproduce el recibo WLY-2026-0420: $79.00 con IVA 16 % (subtotal $68.10, IVA $10.90).
INSERT INTO suscripcion (id, usuario_id, plan_clave, inicia_en, vigente_hasta) VALUES
  (pg_temp.id('suscripcion:jorge'), pg_temp.id('usuario:p_8'), 'premium_mensual', '2026-10-20T10:00:00-06:00', '2026-11-20T10:00:00-06:00')
ON CONFLICT DO NOTHING;
INSERT INTO pago (id, suscripcion_id, folio, pagado_en, metodo_clave, tarjeta_ultimos4, monto_total, tasa_iva) VALUES
  (pg_temp.id('pago:WLY-2026-0420'), pg_temp.id('suscripcion:jorge'), 'WLY-2026-0420', '2026-10-20T10:00:00-06:00', 'tarjeta', '4242', 79.00, 0.160)
ON CONFLICT DO NOTHING;
