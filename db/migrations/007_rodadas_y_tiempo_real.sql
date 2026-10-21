-- 007: rodadas individuales, trazas GPS (ride_points) y ubicación compartida en vivo.
-- Sin estado almacenado: una rodada está "en curso" si finalizada_en IS NULL y eliminada_en IS NULL.
-- Distancia, duración, velocidad promedio y Safety Score se calculan (v_rodada_resumen).
SET search_path = waylo, public;

CREATE TABLE rodada (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  titulo           text NOT NULL CHECK (btrim(titulo) <> ''),
  vehiculo_clave   text NOT NULL REFERENCES cat_tipo_vehiculo (clave) ON DELETE RESTRICT,
  ruta_opcion_id   uuid REFERENCES ruta_opcion (id) ON DELETE SET NULL,
  rodada_grupal_id uuid REFERENCES rodada_grupal (id) ON DELETE SET NULL,
  iniciada_en      timestamptz NOT NULL DEFAULT now(),
  finalizada_en    timestamptz,
  eliminada_en     timestamptz,
  actualizado_en   timestamptz NOT NULL DEFAULT now(),
  CHECK (finalizada_en IS NULL OR finalizada_en > iniciada_en)
);
CREATE TRIGGER rodada_actualizado_en BEFORE UPDATE ON rodada
  FOR EACH ROW EXECUTE FUNCTION fn_tocar_actualizado_en();
CREATE INDEX rodada_usuario_fecha_idx ON rodada (usuario_id, iniciada_en DESC) WHERE eliminada_en IS NULL;
CREATE INDEX rodada_grupal_ref_idx ON rodada (rodada_grupal_id) WHERE rodada_grupal_id IS NOT NULL;

CREATE TABLE rodada_pausa (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rodada_id     uuid NOT NULL REFERENCES rodada (id) ON DELETE CASCADE,
  pausada_en    timestamptz NOT NULL,
  reanudada_en  timestamptz,
  UNIQUE (rodada_id, pausada_en),
  CHECK (reanudada_en IS NULL OR reanudada_en > pausada_en)
);

-- Contrato (docs/arquitectura.md): ride_points(ride_id, geog, speed, heading, accuracy, ts), SIN user_id;
-- el dueño sale de rodada.usuario_id. Los nombres en inglés son del contrato con el servicio Flask.
-- La llave primaria compuesta (ride_id, ts) evita puntos duplicados y sirve para leer la traza en orden;
-- el servicio debe insertar con ON CONFLICT (ride_id, ts) DO NOTHING.
CREATE TABLE ride_points (
  ride_id   uuid NOT NULL REFERENCES rodada (id) ON DELETE CASCADE,
  ts        timestamptz NOT NULL,
  geog      geography(Point, 4326) NOT NULL,
  speed     real NOT NULL CHECK (speed BETWEEN 0 AND 80),
  heading   smallint NOT NULL CHECK (heading BETWEEN 0 AND 359),
  accuracy  real NOT NULL CHECK (accuracy >= 0 AND accuracy <= 30),
  PRIMARY KEY (ride_id, ts),
  CHECK (ST_Y(geog::geometry) BETWEEN 25.4 AND 26.0 AND ST_X(geog::geometry) BETWEEN -100.7 AND -100.0)
);
CREATE INDEX ride_points_geog_gix ON ride_points USING gist (geog);

-- Ubicación compartida en vivo. Estado derivado: activa si detenida_en IS NULL y
-- (expira_en IS NULL o expira_en > now()). expira_en NULL = hasta que la persona la detenga.
CREATE TABLE comparticion_ubicacion (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  inicia_en   timestamptz NOT NULL DEFAULT now(),
  expira_en   timestamptz,
  detenida_en timestamptz,
  CHECK (expira_en IS NULL OR expira_en > inicia_en),
  CHECK (detenida_en IS NULL OR detenida_en >= inicia_en)
);
CREATE INDEX comparticion_ubicacion_usuario_idx ON comparticion_ubicacion (usuario_id, inicia_en DESC);

CREATE TABLE comparticion_destinatario (
  comparticion_id uuid NOT NULL REFERENCES comparticion_ubicacion (id) ON DELETE CASCADE,
  destinatario_id uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  PRIMARY KEY (comparticion_id, destinatario_id)
);
CREATE INDEX comparticion_destinatario_idx ON comparticion_destinatario (destinatario_id);
