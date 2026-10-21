-- 005: lugares, lugares guardados, historial de búsquedas, rutas calculadas y rutas guardadas.
SET search_path = waylo, public;

-- lugar: punto con nombre. propietario_id NULL = lugar público (UDEM, Fundidora, puntos de salida);
-- propietario_id NOT NULL = lugar privado de esa persona (su casa, su trabajo). Las consultas
-- hacia otras personas deben usar v_lugar_publico: un lugar privado nunca se expone.
-- La calle es texto libre dentro de "detalle"; el municipio se obtiene de colonia (sin repetirlo).
CREATE TABLE lugar (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL CHECK (btrim(nombre) <> ''),
  detalle       text,
  geog          geography(Point, 4326) NOT NULL,
  colonia_id    uuid REFERENCES colonia (id) ON DELETE SET NULL,
  propietario_id uuid REFERENCES usuario (id) ON DELETE CASCADE,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, propietario_id),
  CHECK (ST_Y(geog::geometry) BETWEEN 25.4 AND 26.0 AND ST_X(geog::geometry) BETWEEN -100.7 AND -100.0)
);
CREATE INDEX lugar_geog_gix ON lugar USING gist (geog);
CREATE INDEX lugar_propietario_idx ON lugar (propietario_id) WHERE propietario_id IS NOT NULL;

-- El lugar guardado debe ser del propio usuario (FK compuesta con la llave única de lugar).
CREATE TABLE lugar_guardado (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  lugar_id         uuid NOT NULL,
  tipo_lugar_clave text NOT NULL REFERENCES cat_tipo_lugar (clave) ON DELETE RESTRICT,
  etiqueta         text NOT NULL CHECK (btrim(etiqueta) <> ''),
  creado_en        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, lugar_id),
  FOREIGN KEY (lugar_id, usuario_id) REFERENCES lugar (id, propietario_id) ON DELETE CASCADE
);
-- Una sola "casa" por usuario.
CREATE UNIQUE INDEX lugar_guardado_una_casa_uq ON lugar_guardado (usuario_id) WHERE tipo_lugar_clave = 'casa';
CREATE INDEX lugar_guardado_usuario_idx ON lugar_guardado (usuario_id);

CREATE TABLE historial_busqueda (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  lugar_id    uuid NOT NULL REFERENCES lugar (id) ON DELETE CASCADE,
  buscado_en  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, lugar_id)
);
CREATE INDEX historial_busqueda_reciente_idx ON historial_busqueda (usuario_id, buscado_en DESC);

-- Una consulta de ruta (origen y destino) produce hasta tres opciones, una por tipo de ruta.
CREATE TABLE ruta_consulta (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  origen_lugar_id  uuid NOT NULL REFERENCES lugar (id),
  destino_lugar_id uuid NOT NULL REFERENCES lugar (id),
  calculada_en     timestamptz NOT NULL DEFAULT now(),
  CHECK (origen_lugar_id <> destino_lugar_id)
);
CREATE INDEX ruta_consulta_usuario_idx ON ruta_consulta (usuario_id, calculada_en DESC);

-- No se guardan km (ST_Length del trazo), minutos extra (contra la opción más rápida de la
-- misma consulta) ni Safety Score (promedio ponderado de sus factores): ver v_ruta_opcion.
CREATE TABLE ruta_opcion (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id      uuid NOT NULL REFERENCES ruta_consulta (id) ON DELETE CASCADE,
  tipo_ruta_clave  text NOT NULL REFERENCES cat_tipo_ruta (clave) ON DELETE RESTRICT,
  minutos          smallint NOT NULL CHECK (minutos > 0),
  via              text NOT NULL,
  resumen          text NOT NULL,
  trazo            geography(LineString, 4326) NOT NULL,
  UNIQUE (consulta_id, tipo_ruta_clave)
);
CREATE INDEX ruta_opcion_trazo_gix ON ruta_opcion USING gist (trazo);

-- Calificación 0-100 de cada factor del Safety Score (mayor es mejor) y su explicación.
CREATE TABLE ruta_opcion_factor (
  opcion_id     uuid NOT NULL REFERENCES ruta_opcion (id) ON DELETE CASCADE,
  factor_clave  text NOT NULL REFERENCES cat_factor_seguridad (clave) ON DELETE RESTRICT,
  calificacion  smallint NOT NULL CHECK (calificacion BETWEEN 0 AND 100),
  explicacion   text NOT NULL,
  PRIMARY KEY (opcion_id, factor_clave)
);

-- Maniobras de la navegación guiada.
CREATE TABLE ruta_opcion_maniobra (
  opcion_id  uuid NOT NULL REFERENCES ruta_opcion (id) ON DELETE CASCADE,
  orden      smallint NOT NULL CHECK (orden >= 1),
  giro_clave text NOT NULL REFERENCES cat_giro (clave) ON DELETE RESTRICT,
  texto      text NOT NULL,
  punto      geography(Point, 4326) NOT NULL,
  PRIMARY KEY (opcion_id, orden)
);

CREATE TABLE ruta_guardada (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  nombre           text NOT NULL CHECK (btrim(nombre) <> ''),
  origen_lugar_id  uuid NOT NULL REFERENCES lugar (id),
  destino_lugar_id uuid NOT NULL REFERENCES lugar (id),
  tipo_ruta_clave  text NOT NULL REFERENCES cat_tipo_ruta (clave) ON DELETE RESTRICT,
  creada_en        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, nombre),
  CHECK (origen_lugar_id <> destino_lugar_id)
);
