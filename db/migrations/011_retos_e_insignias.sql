-- 011: retos mensuales e insignias. El progreso NO se guarda: se calcula con fn_valor_metrica
-- (v_insignia_progreso, v_reto_progreso). Lo único que se guarda es el hecho histórico de haber
-- obtenido una insignia (usuario_insignia.obtenida_en), porque una insignia ganada no se pierde
-- aunque después cambien los datos que la originaron.
SET search_path = waylo, public;

-- Regla de cálculo: métrica + meta + filtros opcionales. metrica_clave NULL = otorgada manualmente.
CREATE TABLE insignia (
  clave                  text PRIMARY KEY,
  nombre                 text NOT NULL UNIQUE,
  descripcion            text NOT NULL,
  como_obtenerla         text NOT NULL,
  metrica_clave          text REFERENCES cat_metrica (clave) ON DELETE RESTRICT,
  meta                   integer CHECK (meta > 0),
  categoria_reporte_clave text REFERENCES cat_categoria_reporte (clave) ON DELETE RESTRICT,
  estado_reporte_clave   text REFERENCES cat_estado_reporte (clave) ON DELETE RESTRICT,
  umbral_score           smallint CHECK (umbral_score BETWEEN 0 AND 100),
  CHECK ((metrica_clave IS NULL) = (meta IS NULL)),
  CHECK (metrica_clave IS NOT NULL OR (categoria_reporte_clave IS NULL AND estado_reporte_clave IS NULL AND umbral_score IS NULL))
);

-- Las 8 insignias del prototipo (src/mocks/badges.ts): todas se calculan, ninguna es manual.
INSERT INTO insignia (clave, nombre, descripcion, como_obtenerla, metrica_clave, meta, categoria_reporte_clave, estado_reporte_clave, umbral_score) VALUES
  ('primer_reporte',  'Primer reporte',   'Enviaste tu primer reporte.',
     'Envía un reporte de cualquier tipo desde una rodada o desde el mapa.', 'reportes_enviados', 1, NULL, NULL, NULL),
  ('ojo_de_barrio',   'Ojo de barrio',    '10 reportes confirmados por la comunidad.',
     'Consigue que otras personas confirmen 10 de tus reportes con "Sigue ahí".', 'reportes_confirmados', 10, NULL, NULL, NULL),
  ('vigia_nocturno',  'Vigía nocturno',   '5 reportes de iluminación.',
     'Envía 5 reportes de poca iluminación, de preferencia al caer la noche.', 'reportes_enviados', 5, 'poca_iluminacion', NULL, NULL),
  ('calle_atendida',  'Calle atendida',   '3 reportes atendidos por el municipio.',
     'Logra que el municipio marque como Atendidos 3 de tus reportes.', 'reportes_enviados', 3, NULL, 'atendido', NULL),
  ('rodada_compartida','Rodada compartida','Asiste a 3 rodadas grupales.',
     'Únete a una rodada grupal y rueda con la comunidad. Cuenta cuando termina.', 'rodadas_grupales_asistidas', 3, NULL, NULL, NULL),
  ('ruta_segura',     'Ruta segura',      '10 rodadas con Safety Score de 80 o más.',
     'Completa 10 rodadas cuyo Safety Score promedio sea de 80 o más.', 'rodadas_seguras', 10, NULL, NULL, 80),
  ('constante',       'Constante',        'Rueda 4 semanas seguidas.',
     'Registra al menos una rodada cada semana durante 4 semanas.', 'semanas_consecutivas', 4, NULL, NULL, NULL),
  ('anfitrion',       'Anfitrión',        'Organiza una rodada grupal.',
     'Crea una rodada desde Comunidad y publícala.', 'rodadas_grupales_organizadas', 1, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

CREATE TABLE usuario_insignia (
  usuario_id     uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  insignia_clave text NOT NULL REFERENCES insignia (clave) ON DELETE RESTRICT,
  obtenida_en    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, insignia_clave)
);
CREATE INDEX usuario_insignia_insignia_idx ON usuario_insignia (insignia_clave);

-- Un reto es una regla (métrica + meta + filtros) dentro de una ventana de fechas.
CREATE TABLE reto (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo            text NOT NULL,
  descripcion       text NOT NULL,
  metrica_clave     text NOT NULL REFERENCES cat_metrica (clave) ON DELETE RESTRICT,
  meta              integer NOT NULL CHECK (meta > 0),
  umbral_score      smallint CHECK (umbral_score BETWEEN 0 AND 100),
  inicia_en         date NOT NULL,
  termina_en        date NOT NULL,
  insignia_premio   text REFERENCES insignia (clave) ON DELETE SET NULL,
  CHECK (termina_en >= inicia_en)
);
CREATE INDEX reto_vigencia_idx ON reto (inicia_en, termina_en);

CREATE TABLE reto_participacion (
  reto_id    uuid NOT NULL REFERENCES reto (id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  se_unio_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reto_id, usuario_id)
);
CREATE INDEX reto_participacion_usuario_idx ON reto_participacion (usuario_id);
